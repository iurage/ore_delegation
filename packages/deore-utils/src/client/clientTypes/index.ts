import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface ClientMiningGroup {
  key: PublicKey;
  uniqueSeed: number;
  bump: number;
  version: number;
  authority: PublicKey;
  commissionBps: number;
  newCommissionBps: number;
  pendingStakeAccount: PublicKey;
  unstakedOreAccount: PublicKey;
  currentEpoch: number;
  deOreSupply: number;
  pendingUnstakeInDeOre: number;
  unclaimedStakedDeOre: number;
  name: string;
  proof: ClientProof;
  currentEpochRecord: ClientEpochRecord;

  // Real-Time Ore/deOre Exchange Rate
  oreExchangeRate: number;
  // Staker Yield earned to date this epoch extrapolated over 24 hours.
  currentEpochYield: number;
  // Ore mined per min. this epoch.
  miningRate: number;
}

export interface ClientProof {
  key: PublicKey;
  authority: PublicKey;
  balance: number;
  challenge: string;
  lastHash: string;
  lastHashAt: number;
  lastStakeAt: number;
  miner: PublicKey;
  totalHashes: number;
  totalRewards: number;
}

export interface ClientDelegateRecord {
  key: PublicKey;
  authority: PublicKey;
  miningGroup: PublicKey;
  bump: number;
  deOreBalance: number;
  pendingStakeInOre: number;
  pendingUnstakeInDeOre: number;
  pendingStakeEpoch: number;
  pendingUnstakeEpoch: number;
  referrer: PublicKey;
}

export interface ClientEpochRecord {
  key: PublicKey;
  epoch: number;
  bump: number;
  miningGroup: PublicKey;
  proofBalanceAtStart: number;
  endingDeOreExchangeRate: number;
  startAt: number;
}
