use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use ore_api::{
    instruction::{claim, stake},
    state::Proof,
};
use ore_utils::AccountDeserialize;

use crate::{
    calculate_percentage_amount, mining_group_seeds, state::MiningGroup,
    transfer_token_with_signer, DelegateRecord, EpochRecord, OreExchangeRate, Treasury, BPS_DENOM_U16,
};

use ore_api::consts::{TREASURY_ADDRESS, TREASURY_TOKENS_ADDRESS};

#[derive(Accounts)]
pub struct StartEpoch<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        has_one = pending_stake_account,
        has_one = unstaked_ore_account,
        has_one = proof
    )]
    pub mining_group: Box<Account<'info, MiningGroup>>,
    #[account(
        mut,
        seeds = [
            &mining_group.current_epoch.to_le_bytes(),
            mining_group.key().as_ref(),
            b"EpochRecord".as_ref()
        ],
        bump = end_epoch_record.bump
    )]
    pub end_epoch_record: Option<Box<Account<'info, EpochRecord>>>,
    #[account(
        init,
        seeds = [
            &(mining_group.current_epoch + 1).to_le_bytes(),
            mining_group.key().as_ref(),
            b"EpochRecord".as_ref()
        ],
        bump,
        payer = payer,
        space = EpochRecord::SIZE
    )]
    pub start_epoch_record: Box<Account<'info, EpochRecord>>,
    #[account(
        mut,
        seeds = [
            mining_group.key().as_ref(),
            mining_group.authority.key().as_ref(),
            b"DelegateRecord".as_ref()
        ],
        bump = miner_delegate_record.bump,
    )]
    pub miner_delegate_record: Box<Account<'info, DelegateRecord>>,
    #[account(
        seeds = [b"Treasury".as_ref()],
        bump = treasury.bump,
        has_one = treasury_token_account,
    )]
    pub treasury: Box<Account<'info, Treasury>>,
    #[account(mut)]
    pub pending_stake_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub unstaked_ore_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    /// CHECK: Verified with MiningGroup
    pub proof: UncheckedAccount<'info>,
    /// CHECK: Ore Program Treasury Verified
    #[account(constraint = ore_treasury.key() == TREASURY_ADDRESS)]
    pub ore_treasury: UncheckedAccount<'info>,
    /// CHECK: Ore Program Treasury Tokens Address Verified
    #[account(mut, constraint = ore_treasury_tokens.key() == TREASURY_TOKENS_ADDRESS)]
    pub ore_treasury_tokens: UncheckedAccount<'info>,
    /// CHECK: Ore Program Key Verified
    #[account(constraint = ore_program.key() == ore_api::ID)]
    pub ore_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<StartEpoch>) -> Result<()> {
    let mining_group = &mut ctx.accounts.mining_group;
    let treasury = &ctx.accounts.treasury;
    let proof_data = ctx.accounts.proof.try_borrow_data()?;
    let mut proof_balance = Proof::try_from_bytes(&proof_data)?.balance;

    // Drop proof borrow after copying the balance to allow borrowing in CPI.
    drop(proof_data);

    msg!("Proof_balance {}", proof_balance);
    let current_timestamp = Clock::get()?.unix_timestamp;

    // Initialize default Ore Exchange Rate, used if epoch is still at 0.
    // Will be updated below if epoch has started.
    let mut ore_exchange_rate = OreExchangeRate::new(0, 0);

    // End epoch record must be present unless first epoch hasn't started yet.
    if ctx.accounts.end_epoch_record.is_none() && mining_group.current_epoch != 0 {
        panic!("No end epoch record provided")
    }

    if let Some(ref mut end_epoch_record) = ctx.accounts.end_epoch_record {
        if !end_epoch_record.has_ended(current_timestamp) {
            panic!("Too early to end epoch")
        }

        // Calculate amount of rewards earned in epoch.
        let proof_balance_at_start = end_epoch_record.proof_balance_at_start;
        let total_rewards: u64 = proof_balance.checked_sub(proof_balance_at_start).unwrap();

        // Miner receives commission as configured unless there's no ore staked at start of epoch,
        // in which case, they will receive 100% of mining rewards.
        let miner_commission = if proof_balance_at_start > 0 {
            mining_group.commission_bps
        } else {
            BPS_DENOM_U16
        };

        // Calculate share of rewards earned by miner, protocol and staker.
        let miner_rewards = calculate_percentage_amount(total_rewards, miner_commission, true)?;
        let remaining_rewards = total_rewards.checked_sub(miner_rewards).unwrap();
        let protocol_fee = calculate_percentage_amount(remaining_rewards, treasury.fee_bps, true)?;
        let staker_rewards = remaining_rewards.checked_sub(protocol_fee).unwrap();
        msg!(
            "Miner Rewards: {}, Protocol Fee: {}, Staker Rewards: {}",
            miner_rewards,
            protocol_fee,
            staker_rewards
        );

        // Use staker rewards and initial proof balance to calculate Ore/deOre Exchange Rate at end of epoch.
        ore_exchange_rate = OreExchangeRate::new(
            proof_balance_at_start.checked_add(staker_rewards).unwrap(),
            mining_group.de_ore_supply,
        );

        // Calculate amount of ore to unstake for users using ending exchange rate.
        let pending_unstake_in_de_ore = mining_group.pending_unstake_in_de_ore;
        let ore_to_unstake_for_users = ore_exchange_rate.amount_in_ore(pending_unstake_in_de_ore);

        // Claim (ore_to_unstake + protocol_fee) from Proof to unstaked_ore_account
        let total_to_unstake = protocol_fee.checked_add(ore_to_unstake_for_users).unwrap();
        let claim_ix = claim(
            mining_group.key(),
            ctx.accounts.unstaked_ore_account.key(),
            total_to_unstake,
        );
        let mining_group_acc_info = mining_group.to_account_info();
        let claim_accounts: Vec<AccountInfo<'_>> = vec![
            mining_group_acc_info,                               // Signer
            ctx.accounts.unstaked_ore_account.to_account_info(), // Beneficiary
            ctx.accounts.proof.to_account_info(),                // Proof
            ctx.accounts.ore_treasury.to_account_info(),         // Treasury Address
            ctx.accounts.ore_treasury_tokens.to_account_info(),  // Treasury Tokens
            ctx.accounts.token_program.to_account_info(),        // Token Program
        ];
        let seeds = mining_group_seeds!(mining_group);
        invoke_signed(&claim_ix, &claim_accounts, &[&seeds[..]])?;

        proof_balance = proof_balance.checked_sub(total_to_unstake).unwrap();

        // Reduce deOre supply by amount unstaked and reset pending unstake value.
        mining_group.remove_de_ore_supply(pending_unstake_in_de_ore);
        mining_group.pending_unstake_in_de_ore = 0;

        // Transfer protocol fee from unstaked_ore_account to treasury.
        let seeds = mining_group_seeds!(mining_group);
        transfer_token_with_signer!(
            ctx.accounts,
            ctx.accounts.unstaked_ore_account,   // From
            ctx.accounts.treasury_token_account, // To
            mining_group.clone(),                // Authority
            &[&seeds[..]],
            protocol_fee
        )?;

        // Miner rewards are auto-staked, so both deOre supply and miner's balance will increase.
        let miner_rewards_in_de_ore = ore_exchange_rate.amount_in_de_ore(miner_rewards);
        let miner_delegate_record = &mut ctx.accounts.miner_delegate_record;
        miner_delegate_record.add_de_ore_balance(miner_rewards_in_de_ore);
        mining_group.add_de_ore_supply(miner_rewards_in_de_ore);

        end_epoch_record.ending_de_ore_exchange_rate = ore_exchange_rate;
    }

    // Processing pending stake before starting epoch.
    let pending_stake_account = &ctx.accounts.pending_stake_account;
    let pending_stake_amount = pending_stake_account.amount;
    if pending_stake_amount > 0 {
        proof_balance = proof_balance.checked_add(pending_stake_amount).unwrap();

        // Call Stake CPI to stake pending_stake_amount.
        let stake_ix = stake(
            mining_group.key(),
            ctx.accounts.pending_stake_account.key(),
            pending_stake_amount,
        );
        let stake_accounts: Vec<AccountInfo<'_>> = vec![
            mining_group.to_account_info(),                       // Signer
            ctx.accounts.proof.to_account_info(),                 // Proof
            ctx.accounts.pending_stake_account.to_account_info(), // Sender
            ctx.accounts.ore_treasury_tokens.to_account_info(),   // Treasury Tokens
            ctx.accounts.token_program.to_account_info(),         // Token Program
        ];
        let seeds = mining_group_seeds!(mining_group);

        invoke_signed(&stake_ix, &stake_accounts, &[&seeds[..]])?;

        let pending_stake_in_de_ore: u64 = ore_exchange_rate.amount_in_de_ore(pending_stake_amount);
        mining_group.add_de_ore_supply(pending_stake_in_de_ore);
        mining_group.add_unclaimed_staked_de_ore(pending_stake_in_de_ore);
    }

    // Initialize new epoch record.
    let start_epoch_record = &mut ctx.accounts.start_epoch_record;
    start_epoch_record.epoch = mining_group.current_epoch.checked_add(1).unwrap();
    start_epoch_record.bump = ctx.bumps.start_epoch_record;
    start_epoch_record.mining_group = ctx.accounts.mining_group.key();
    start_epoch_record.proof_balance_at_start = proof_balance;
    start_epoch_record.start_at = current_timestamp;

    // Set new mining commission if applicable.
    let mining_group = &mut ctx.accounts.mining_group;
    if mining_group.new_commission_bps != 0 {
        mining_group.commission_bps = mining_group.new_commission_bps;
        mining_group.new_commission_bps = 0;
    }

    // Update mining group for new epoch.
    mining_group.current_epoch = start_epoch_record.epoch;
    Ok(())
}
