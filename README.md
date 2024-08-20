# Delegated Ore Staking Program

Program Id: `DeoREdoVi3iqMHQq6sFHD2gBQUYQUMoBEEf3WqpQwLu`

## Account Types:

- [`Treasury`](programs/ore_delegation/src/state/treasury.rs) - Global singleton for protocol fees and config.
- [`DelegateRecord`](programs/ore_delegation/src/state/delegate_record.rs) - Stores user-specific delegation state.
- [`MiningGroup`](programs/ore_delegation/src/state/mining_group.rs) - Stores state for delegating to a specific Proof account.
- [`EpochRecord`](programs/ore_delegation/src/state/epoch_record.rs) - Stores state of MiningGroup for a specific epoch.
