use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke_signed, sysvar},
};
use ore_api::instruction::open;

use crate::{mining_group_seeds, MiningGroup};

#[derive(Accounts)]
#[instruction(unique_seed: u64)]
pub struct InitMiningGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    #[account(
        init,
        seeds = [
            &unique_seed.to_le_bytes(),
            b"MiningGroup".as_ref()
        ],
        bump,
        payer = payer,
        space = MiningGroup::SIZE
    )]
    pub mining_group: Box<Account<'info, MiningGroup>>,
    /// CHECK: To be initialized in `open` CPI.
    #[account(
        mut,
        constraint = proof.data_is_empty(),
        constraint = proof.owner.key() == System::id()
    )]
    pub proof: UncheckedAccount<'info>,
    /// CHECK: SlotHash Key Verified
    #[account(constraint = slot_hashes.key() == sysvar::slot_hashes::ID)]
    pub slot_hashes: UncheckedAccount<'info>,
    /// CHECK: Ore Program Key Verified
    #[account(constraint = ore_program.key() == ore_api::ID)]
    pub ore_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction to initialize a MiningGroup.
pub fn handler(
    ctx: Context<InitMiningGroup>,
    unique_seed: u64,
    commission_bps: u16,
    name: String,
) -> Result<()> {
    let mining_group: &mut Box<Account<MiningGroup>> = &mut ctx.accounts.mining_group;

    // Init mining_group fields. Note that Token accounts are initialized separately in init_group_accounts
    // due to stack mem limits.
    mining_group.unique_seed = unique_seed;
    mining_group.bump = ctx.bumps.mining_group;
    mining_group.version = 1;
    mining_group.authority = ctx.accounts.authority.key();
    mining_group.proof = ctx.accounts.proof.key();

    // Validate and set name and commission_bps in mining_group.
    mining_group.set_name(name);
    mining_group.set_commission(commission_bps);

    // CPI to initialize Proof account.
    let open_ix = open(
        mining_group.key(),
        mining_group.authority,
        ctx.accounts.payer.key(),
    );
    let mining_group_acc_info = mining_group.to_account_info();
    let open_proof_accounts: Vec<AccountInfo<'_>> = vec![
        mining_group_acc_info,                         // Signer
        ctx.accounts.authority.to_account_info(),      // Miner
        ctx.accounts.payer.to_account_info(),          // Payer
        ctx.accounts.proof.to_account_info(),          // Proof PDA
        ctx.accounts.system_program.to_account_info(), // System Program
        ctx.accounts.slot_hashes.to_account_info(),    // Slot Hashes SysVar
    ];
    let seeds = mining_group_seeds!(mining_group);
    invoke_signed(&open_ix, &open_proof_accounts, &[&seeds[..]])?;

    Ok(())
}
