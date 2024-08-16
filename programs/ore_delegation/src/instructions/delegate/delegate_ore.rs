use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{state::MiningGroup, transfer_token, DelegateRecord};

#[derive(Accounts)]
pub struct DelegateOre<'info> {
    pub authority: Signer<'info>,
    #[account(has_one = pending_stake_account)]
    pub mining_group: Box<Account<'info, MiningGroup>>,
    #[account(
        mut,
        seeds = [
            mining_group.key().as_ref(),
            authority.key().as_ref(),
            b"DelegateRecord".as_ref()
        ],
        bump = delegate_record.bump,
        has_one = authority,
    )]
    pub delegate_record: Box<Account<'info, DelegateRecord>>,
    #[account(
        mut,
        token::mint = ore_api::consts::MINT_ADDRESS,
        token::authority = authority
    )]
    pub source_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pending_stake_account: Box<Account<'info, TokenAccount>>,
    #[account(token::mint = ore_api::consts::MINT_ADDRESS)]
    pub referrer: Option<Box<Account<'info, TokenAccount>>>,
    pub token_program: Program<'info, Token>,
}

/// Instruction for user to delegate ore to be staked with a MiningGroup at the end of its epoch.
pub fn handler(ctx: Context<DelegateOre>, amount: u64) -> Result<()> {
    let delegate_record = &mut ctx.accounts.delegate_record;
    let mining_group = &ctx.accounts.mining_group;

    if amount == 0 || amount > ctx.accounts.source_token_account.amount {
        panic!("Invalid delegation amount")
    }

    if delegate_record.requires_process_delegation(mining_group.current_epoch) {
        panic!("Previous stake has not been processed")
    }

    delegate_record.pending_stake_in_ore = delegate_record
        .pending_stake_in_ore
        .checked_add(amount)
        .unwrap();
    delegate_record.pending_stake_epoch = mining_group.current_epoch;

    if let Some(referrer) = &ctx.accounts.referrer {
        // TODO: Prevent self-referral?
        delegate_record.referrer = referrer.key();
    }

    transfer_token!(
        ctx.accounts,
        ctx.accounts.source_token_account,  // From
        ctx.accounts.pending_stake_account, // To
        ctx.accounts.authority,             // Authority
        amount
    )?;
    Ok(())
}
