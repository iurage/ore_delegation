use anchor_lang::prelude::*;

pub mod instructions;
pub mod macros;
pub mod state;
pub mod utils;

use instructions::*;
use state::*;
use utils::*;

declare_id!("DeoREdoVi3iqMHQq6sFHD2gBQUYQUMoBEEf3WqpQwLu");

#[program]
pub mod ore_delegation {
    use super::*;

    pub fn init_mining_group(
        ctx: Context<InitMiningGroup>,
        unique_seed: u64,
        commission_bps: u16,
        name: String,
    ) -> Result<()> {
        init_mining_group::handler(ctx, unique_seed, commission_bps, name)
    }

    pub fn update_mining_group(
        ctx: Context<UpdateMiningGroup>,
        commission_bps: u16,
        name: String,
    ) -> Result<()> {
        update_mining_group::handler(ctx, commission_bps, name)
    }

    pub fn init_group_accounts(ctx: Context<InitGroupAccounts>) -> Result<()> {
        init_group_accounts::handler(ctx)
    }

    pub fn init_delegate_record(ctx: Context<InitDelegateRecord>) -> Result<()> {
        init_delegate_record::handler(ctx)
    }

    pub fn init_treasury(ctx: Context<InitTreasury>, fee_bps: u16) -> Result<()> {
        init_treasury::handler(ctx, fee_bps)
    }

    pub fn delegate_ore(ctx: Context<DelegateOre>, amount: u64) -> Result<()> {
        delegate_ore::handler(ctx, amount)
    }

    pub fn undelegate_ore(ctx: Context<UndelegateOre>, amount: u64) -> Result<()> {
        undelegate_ore::handler(ctx, amount)
    }

    pub fn start_epoch(ctx: Context<StartEpoch>) -> Result<()> {
        start_epoch::handler(ctx)
    }

    pub fn process_delegation(ctx: Context<ProcessDelegation>) -> Result<()> {
        process_delegation::handler(ctx)
    }

    pub fn process_undelegation(ctx: Context<ProcessUndelegation>) -> Result<()> {
        process_undelegation::handler(ctx)
    }
}
