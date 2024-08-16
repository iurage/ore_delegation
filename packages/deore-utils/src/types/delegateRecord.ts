import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface DelegateRecord {
  authority: PublicKey;
  miningGroup: PublicKey;
  bump: number;
  deOreBalance: BN;
  pendingStakeInOre: BN;
  pendingUnstakeInDeOre: BN;
  pendingStakeEpoch: BN;
  pendingUnstakeEpoch: BN;
  referrer: PublicKey;
}
