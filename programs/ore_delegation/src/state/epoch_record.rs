use anchor_lang::prelude::*;

#[account]
pub struct EpochRecord {
    /// Epoch record is for, starts from 1.
    pub epoch: u64,
    /// PDA bump
    pub bump: u8,
    /// Associated mining group for this epoch.
    pub mining_group: Pubkey,
    /// Amount of Ore in Proof.balance when epoch started.
    pub proof_balance_at_start: u64,
    /// Exchange rate epoch ended at. Value is set to 0 if epoch has not ended.
    pub ending_de_ore_exchange_rate: OreExchangeRate,
    /// Unix Timestamp at which epoch began.
    pub start_at: i64,
}

impl EpochRecord {
    pub const SIZE: usize = 150;

    #[cfg(any(feature = "localnet", feature = "devnet"))]
    pub const EPOCH_DURATION: i64 = 300; // 5 mins

    /// For mainnet deployment.
    #[cfg(not(any(feature = "localnet", feature = "devnet")))]
    pub const EPOCH_DURATION: i64 = 86400; // 1 day

    /// Returns true if this epoch has ended.
    pub fn has_ended(&self, current_timestamp: i64) -> bool {
        current_timestamp >= self.start_at.checked_add(Self::EPOCH_DURATION).unwrap()
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]

pub struct OreExchangeRate {
    /// Exchange rate in amount of ore (with precision of 10) per de_ore.
    /// E.g. a rate of 1.05 Ore per DeOre will be stored as:
    /// 10_500_000_000
    /// Rate starts with 1.0 and is an increasing function except in the case
    /// where de_ore_supply is reduced to 0 in an epoch, and rate is reset back to 1.0
    /// in the following epoch.
    rate: u128,
}

impl OreExchangeRate {
    pub fn new(ore_amount: u64, de_ore_supply: u64) -> Self {
        // Default to rate of 1.0 if supply is 0.
        if de_ore_supply == 0 {
            return Self {
                rate: 10_u128.pow(10),
            };
        }

        let ore_amount_u128 = u128::from(ore_amount);
        let de_ore_supply_u128 = u128::from(de_ore_supply);

        let numerator = ore_amount_u128.checked_mul(10_u128.pow(10)).unwrap();
        Self {
            rate: numerator.checked_div(de_ore_supply_u128).unwrap(),
        }
    }

    pub fn amount_in_ore(&self, de_ore: u64) -> u64 {
        let numerator = u128::from(de_ore).checked_mul(self.rate).unwrap();
        // Note that value is floored here.
        u64::try_from(numerator.checked_div(10_u128.pow(10)).unwrap()).unwrap()
    }

    pub fn amount_in_de_ore(&self, ore: u64) -> u64 {
        let numerator = u128::from(ore).checked_mul(10_u128.pow(10)).unwrap();
        // Note that value is floored here.
        u64::try_from(numerator.checked_div(self.rate).unwrap()).unwrap()
    }
}
