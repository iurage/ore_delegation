use anchor_lang::prelude::*;

use crate::{state::MiningGroup, DelegateRecord, EpochRecord, OreExchangeRate};

#[derive(Accounts)]
pub struct ProcessDelegation<'info> {
    #[account(mut)]
    pub mining_group: Box<Account<'info, MiningGroup>>,
    #[account(mut, has_one = mining_group)]
    pub delegate_record: Box<Account<'info, DelegateRecord>>,
    #[account(
        seeds = [
            &delegate_record.pending_stake_epoch.to_le_bytes(),
            mining_group.key().as_ref(),
            b"EpochRecord".as_ref()
        ],
        bump = epoch_record.bump
    )]
    pub epoch_record: Option<Box<Account<'info, EpochRecord>>>,
}

/// Instruction to process a pending delegation that was initialized in an earlier epoch,
/// and recognize the amount of Ore being staked in the DelegateRecord.
pub fn handler(ctx: Context<ProcessDelegation>) -> Result<()> {
    let delegate_record = &mut ctx.accounts.delegate_record;
    let mining_group = &mut ctx.accounts.mining_group;

    if !delegate_record.requires_process_delegation(mining_group.current_epoch) {
        panic!("No pending stake found")
    }

    if ctx.accounts.epoch_record.is_none() && delegate_record.pending_stake_epoch > 0 {
        panic!("EpochRecord needs to be provided if stake epoch != 0")
    }

    let exchange_rate = if let Some(epoch_record) = &ctx.accounts.epoch_record {
        epoch_record.ending_de_ore_exchange_rate
    } else {
        // Defaults to exchange rate of 1 Ore/deOre for stake epoch 0 as EpochRecord doesn't exist.
        OreExchangeRate::new(1, 1)
    };

    let de_ore_receivable = exchange_rate
        .amount_in_de_ore(delegate_record.pending_stake_in_ore)
        .min(mining_group.unclaimed_staked_de_ore);

    // Update deOre balance on delegate record and pending stake fields.
    delegate_record.add_de_ore_balance(de_ore_receivable);
    delegate_record.pending_stake_in_ore = 0;
    delegate_record.pending_stake_epoch = 0;

    // Update unclaimed deOre to recognize processing of this pending stake.
    mining_group.remove_unclaimed_staked_de_ore(de_ore_receivable);

    // TODO: Emit event to record referrer + amount staked.
    delegate_record.referrer = Pubkey::default();

    Ok(())
}
