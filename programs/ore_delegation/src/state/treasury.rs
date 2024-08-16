use anchor_lang::prelude::*;

#[account]
pub struct Treasury {
    /// Signer authorized to withdraw or change treasury fees.
    pub authority: Pubkey,
    /// Token account to store protocol fees.
    pub treasury_token_account: Pubkey,
    /// Portion of fee (bps) to take from mining rewards, after deducting miner's commission
    /// as protocol fee.
    pub fee_bps: u16,
    /// PDA Bump
    pub bump: u8,
}

impl Treasury {
    pub const SIZE: usize = 500;
}
