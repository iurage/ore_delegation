use anchor_lang::prelude::*;

use crate::state::MiningGroup;

#[derive(Accounts)]
pub struct UpdateMiningGroup<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub mining_group: Box<Account<'info, MiningGroup>>,
}

/// Instruction to modify commission and name of a mining_group.
pub fn handler(ctx: Context<UpdateMiningGroup>, commission_bps: u16, name: String) -> Result<()> {
    let mining_group: &mut Box<Account<MiningGroup>> = &mut ctx.accounts.mining_group;

    // Validate and update name and new_commission_bps in mining_group.
    mining_group.set_name(name);
    mining_group.set_new_commission(commission_bps);

    Ok(())
}
