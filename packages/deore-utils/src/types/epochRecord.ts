import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface OreExchangeRate {
  rate: BN;
}

export interface EpochRecord {
  epoch: BN;
  bump: number;
  miningGroup: PublicKey;
  proofBalanceAtStart: BN;
  endingDeOreExchangeRate: OreExchangeRate;
  startAt: BN;
}
