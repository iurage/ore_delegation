use anchor_lang::prelude::*;

#[account]
pub struct DelegateRecord {
    /// Address authorized to delegate and undelegate with this record.
    pub authority: Pubkey,
    /// Associated mining group for delegation.
    pub mining_group: Pubkey,
    /// PDA bump
    pub bump: u8,
    /// Amount of deOre owned by the record.
    pub de_ore_balance: u64,
    /// Amount of ore pending to be staked.
    pub pending_stake_in_ore: u64,
    /// Amount of deOre pending to be unstaked.
    pub pending_unstake_in_de_ore: u64,
    /// Epoch pending delegation was initialized at.
    pub pending_stake_epoch: u64,
    /// Epoch pending undelegation was initialized at.
    pub pending_unstake_epoch: u64,
    /// Referrer for pending stake (to be implemented)
    pub referrer: Pubkey,
}

impl DelegateRecord {
    pub const SIZE: usize = 500;

    pub fn add_de_ore_balance(&mut self, amount: u64) {
        self.de_ore_balance = self.de_ore_balance.checked_add(amount).unwrap();
    }
    pub fn remove_de_ore_balance(&mut self, amount: u64) {
        self.de_ore_balance = self.de_ore_balance.checked_sub(amount).unwrap();
    }

    // ProcessDelegation IX needs to be called if there is a pending stake from a earlier epoch.
    pub fn requires_process_delegation(&self, current_epoch: u64) -> bool {
        self.pending_stake_in_ore > 0 && self.pending_stake_epoch != current_epoch
    }

    // ProcessUndelegation IX needs to be called if there is a pending unstake from an earlier epoch.
    pub fn requires_process_undelegation(&self, current_epoch: u64) -> bool {
        self.pending_unstake_in_de_ore > 0 && self.pending_unstake_epoch != current_epoch
    }
}
