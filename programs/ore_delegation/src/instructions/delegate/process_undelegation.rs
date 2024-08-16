use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    mining_group_seeds, state::MiningGroup, transfer_token_with_signer, DelegateRecord, EpochRecord,
};

#[derive(Accounts)]
pub struct ProcessUndelegation<'info> {
    #[account(has_one = unstaked_ore_account)]
    pub mining_group: Box<Account<'info, MiningGroup>>,
    #[account(mut)]
    pub unstaked_ore_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, has_one = mining_group)]
    pub delegate_record: Box<Account<'info, DelegateRecord>>,
    #[account(
        mut,
        associated_token::mint = ore_api::consts::MINT_ADDRESS,
        associated_token::authority = delegate_record.authority
    )]
    pub delegate_ore_account: Box<Account<'info, TokenAccount>>,
    #[account(
        seeds = [
            &delegate_record.pending_unstake_epoch.to_le_bytes(),
            mining_group.key().as_ref(),
            b"EpochRecord".as_ref()
        ],
        bump = epoch_record.bump
    )]
    pub epoch_record: Box<Account<'info, EpochRecord>>,
    pub token_program: Program<'info, Token>,
}

/// Instruction to process a pending undelegation that was initialized in an earlier epoch,
/// and claim the ore unstaked.
pub fn handler(ctx: Context<ProcessUndelegation>) -> Result<()> {
    let delegate_record = &mut ctx.accounts.delegate_record;
    let mining_group = &mut ctx.accounts.mining_group;
    let epoch_record = &ctx.accounts.epoch_record;
    let unstaked_ore_account = &ctx.accounts.unstaked_ore_account;

    if !delegate_record.requires_process_undelegation(mining_group.current_epoch) {
        panic!("No pending unstake found")
    }

    let exchange_rate = epoch_record.ending_de_ore_exchange_rate;
    let ore_receivable = exchange_rate
        .amount_in_ore(delegate_record.pending_unstake_in_de_ore)
        .min(unstaked_ore_account.amount);

    // Transfer ore receivable to user's account.
    let seeds = mining_group_seeds!(mining_group);
    transfer_token_with_signer!(
        ctx.accounts,
        ctx.accounts.unstaked_ore_account, // From
        ctx.accounts.delegate_ore_account, // To
        ctx.accounts.mining_group,         // Authority
        &[&seeds[..]],
        ore_receivable
    )?;

    // Reset unstake fields in delegate record.
    delegate_record.pending_unstake_in_de_ore = 0;
    delegate_record.pending_unstake_epoch = 0;

    Ok(())
}
