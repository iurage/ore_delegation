import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface MiningGroup {
  uniqueSeed: BN;
  bump: number;
  version: number;
  authority: PublicKey;
  proof: PublicKey;
  commissionBps: number;
  newCommissionBps: number;
  pendingStakeAccount: PublicKey;
  unstakedOreAccount: PublicKey;
  currentEpoch: BN;
  deOreSupply: BN;
  pendingUnstakeInDeOre: BN;
  unclaimedStakedDeOre: BN;
  name: String;
}
