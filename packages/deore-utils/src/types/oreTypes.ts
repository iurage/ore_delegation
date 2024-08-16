import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface Proof {
  authority: PublicKey;
  balance: BN;
  challenge: string;
  lastHash: string;
  lastHashAt: BN;
  lastStakeAt: BN;
  miner: PublicKey;
  totalHashes: BN;
  totalRewards: BN;
}
