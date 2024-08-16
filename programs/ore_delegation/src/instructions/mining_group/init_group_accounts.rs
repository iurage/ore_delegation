use anchor_lang::prelude::*;

use crate::state::MiningGroup;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct InitGroupAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub mining_group: Box<Account<'info, MiningGroup>>,
    #[account(
        init,
        seeds = [mining_group.key().as_ref(), b"PendingStakeAccount".as_ref()],
        bump,
        payer = payer,
        token::mint = mint,
        token::authority = mining_group
    )]
    pub pending_stake_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        seeds = [mining_group.key().as_ref(), b"UnstakedOreAccount".as_ref()],
        bump,
        payer = payer,
        token::mint = mint,
        token::authority = mining_group
    )]
    pub unstaked_ore_account: Box<Account<'info, TokenAccount>>,
    #[account(constraint = mint.key() == ore_api::consts::MINT_ADDRESS)]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Instruction to initialize MiningGroup's token accounts. To be called only after init_mining_group,
/// before mining or delegation.
pub fn handler(ctx: Context<InitGroupAccounts>) -> Result<()> {
    let mining_group = &mut ctx.accounts.mining_group;
    mining_group.pending_stake_account = ctx.accounts.pending_stake_account.key();
    mining_group.unstaked_ore_account = ctx.accounts.unstaked_ore_account.key();

    Ok(())
}
