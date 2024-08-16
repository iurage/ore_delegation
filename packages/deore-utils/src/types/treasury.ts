import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface Treasury {
  authority: PublicKey;
  treasuryTokenAccount: PublicKey;
  feeBps: BN;
  bump: number;
}
