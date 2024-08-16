use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::Treasury;

#[derive(Accounts)]
pub struct InitTreasury<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    #[account(
        init,
        seeds = [b"Treasury".as_ref()],
        bump,
        payer = payer,
        space = Treasury::SIZE
    )]
    pub treasury: Box<Account<'info, Treasury>>,
    #[account(
        init,
        seeds = [b"TreasuryTokenAccount".as_ref()],
        bump,
        payer = payer,
        token::mint = mint,
        token::authority = treasury
    )]
    pub treasury_token_account: Box<Account<'info, TokenAccount>>,
    #[account(constraint = mint.key() == ore_api::consts::MINT_ADDRESS)]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Instruction to setup a Treasury singleton. To be called after initial program deployment.
pub fn handler(ctx: Context<InitTreasury>, fee_bps: u16) -> Result<()> {
    if fee_bps > 10000 {
        panic!("Fee cannot exceed 100%")
    }

    let treasury = &mut ctx.accounts.treasury;
    treasury.authority = ctx.accounts.authority.key();
    treasury.treasury_token_account = ctx.accounts.treasury_token_account.key();
    treasury.fee_bps = fee_bps;
    treasury.bump = ctx.bumps.treasury;

    Ok(())
}
