use anchor_lang::prelude::*;

#[account]
pub struct MiningGroup {
    /// Unique seed used to generate MiningGroup address
    pub unique_seed: u64,
    /// PDA Bump
    pub bump: u8,
    /// Version of this MiningGroup struct (starts from 1)
    pub version: u8,
    /// User authorized to mine with Proof to receive share of mining rewards.
    pub authority: Pubkey,
    /// Proof account owned by MiningGroup.
    pub proof: Pubkey,
    /// Share of rewards that miner will receive.
    pub commission_bps: u16,
    // New commission to take place from next epoch, if non-zero.
    pub new_commission_bps: u16,
    // Stores Ore that is pending to be staked.
    pub pending_stake_account: Pubkey,
    /// Stores Ore that is unstaked but not claimed by users yet.
    pub unstaked_ore_account: Pubkey,
    /// Current epoch (first epoch starts from 1)
    pub current_epoch: u64,
    /// Tracks amount of deOre across all delegators.
    pub de_ore_supply: u64,
    /// Tracks amount of deOre to unstake at end of epoch.
    pub pending_unstake_in_de_ore: u64,
    /// Tracks remaining deOre that is staked but not claimed by users yet.
    /// Used to prevent users from claiming more deOre than supply created.
    pub unclaimed_staked_de_ore: u64,
    pub name: [u8; 20],
}

impl MiningGroup {
    pub const SIZE: usize = 500;

    pub fn add_de_ore_supply(&mut self, amount: u64) {
        self.de_ore_supply = self.de_ore_supply.checked_add(amount).unwrap();
    }
    pub fn remove_de_ore_supply(&mut self, amount: u64) {
        self.de_ore_supply = self.de_ore_supply.checked_sub(amount).unwrap();
    }
    pub fn add_unclaimed_staked_de_ore(&mut self, amount: u64) {
        self.unclaimed_staked_de_ore = self.unclaimed_staked_de_ore.checked_add(amount).unwrap();
    }
    pub fn remove_unclaimed_staked_de_ore(&mut self, amount: u64) {
        self.unclaimed_staked_de_ore = self.unclaimed_staked_de_ore.checked_sub(amount).unwrap();
    }
    pub fn set_name(&mut self, name: String) {
        let name_u8 = name.as_bytes();
        if name_u8.len() > 20 {
            panic!("Name exceeds max len of 20")
        } else if !name.is_ascii() {
            panic!("Name is not in ascii")
        }
        let mut name_array = [0u8; 20];
        name_array[..name_u8.len()].copy_from_slice(name_u8);
        self.name = name_array;
    }

    pub fn set_new_commission(&mut self, commission_bps: u16) {
        if commission_bps > 10000 {
            panic!("Commission cannot exceed 100%")
        }
        self.new_commission_bps = commission_bps;
    }

    pub fn set_commission(&mut self, commission_bps: u16) {
        if commission_bps > 10000 {
            panic!("Commission cannot exceed 100%")
        }
        self.commission_bps = commission_bps;
    }
}
