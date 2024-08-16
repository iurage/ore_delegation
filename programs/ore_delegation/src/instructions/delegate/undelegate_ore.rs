use anchor_lang::prelude::*;

use crate::{state::MiningGroup, DelegateRecord};

#[derive(Accounts)]
pub struct UndelegateOre<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub mining_group: Box<Account<'info, MiningGroup>>,
    #[account(
        mut,
        seeds = [
            mining_group.key().as_ref(),
            authority.key().as_ref(),
            b"DelegateRecord".as_ref()
        ],
        bump = delegate_record.bump,
        has_one = authority
    )]
    pub delegate_record: Box<Account<'info, DelegateRecord>>,
}

/// Instruction for user to undelegate ore from a MiningGroup at the end of its epoch.
pub fn handler(ctx: Context<UndelegateOre>, amount: u64) -> Result<()> {
    let delegate_record = &mut ctx.accounts.delegate_record;
    let mining_group = &mut ctx.accounts.mining_group;

    if amount == 0 || amount > delegate_record.de_ore_balance {
        panic!("Invalid undelegation amount")
    }

    if delegate_record.requires_process_undelegation(mining_group.current_epoch) {
        panic!("Previous unstake has not been processed")
    }

    mining_group.pending_unstake_in_de_ore = mining_group
        .pending_unstake_in_de_ore
        .checked_add(amount)
        .unwrap();

    // DeOre balance transferred to pending unstake.
    delegate_record.de_ore_balance = delegate_record.de_ore_balance.checked_sub(amount).unwrap();
    delegate_record.pending_unstake_in_de_ore = delegate_record
        .pending_unstake_in_de_ore
        .checked_add(amount)
        .unwrap();
    delegate_record.pending_unstake_epoch = ctx.accounts.mining_group.current_epoch;

    Ok(())
}
