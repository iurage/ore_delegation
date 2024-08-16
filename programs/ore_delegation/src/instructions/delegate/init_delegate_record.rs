use anchor_lang::prelude::*;

use crate::{state::MiningGroup, DelegateRecord};

#[derive(Accounts)]
pub struct InitDelegateRecord<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub mining_group: Box<Account<'info, MiningGroup>>,
    #[account(
        init,
        seeds = [
            mining_group.key().as_ref(),
            authority.key().as_ref(),
            b"DelegateRecord".as_ref()
        ],
        bump,
        payer = payer,
        space = DelegateRecord::SIZE
    )]
    pub delegate_record: Box<Account<'info, DelegateRecord>>,
    pub system_program: Program<'info, System>,
}

/// Instruction to initialize a DelegateRecord. Required for a user before delegatating to a
/// MiningPool or for miner before starting the initial mining epoch.
pub fn handler(ctx: Context<InitDelegateRecord>) -> Result<()> {
    let delegate_record = &mut ctx.accounts.delegate_record;

    delegate_record.authority = ctx.accounts.authority.key();
    delegate_record.mining_group = ctx.accounts.mining_group.key();
    delegate_record.bump = ctx.bumps.delegate_record;

    Ok(())
}
