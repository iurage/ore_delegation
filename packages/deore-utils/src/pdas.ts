import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { DE_ORE_PROGRAM, ORE_PROGRAM, ORE_TOKEN_ADDR } from "./";

export const deriveMiningGroup = (uniqueSeed: BN) => {
  return PublicKey.findProgramAddressSync(
    [uniqueSeed.toArrayLike(Buffer, "le", 8), Buffer.from("MiningGroup")],
    DE_ORE_PROGRAM
  )[0];
};

export const deriveDelegateRecord = (
  miningGroup: PublicKey,
  authority: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      miningGroup.toBuffer(),
      authority.toBuffer(),
      Buffer.from("DelegateRecord"),
    ],
    DE_ORE_PROGRAM
  )[0];
};

export const deriveTreasury = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("Treasury")],
    DE_ORE_PROGRAM
  )[0];
};

export const deriveTreasuryTokenAccount = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("TreasuryTokenAccount")],
    DE_ORE_PROGRAM
  )[0];
};

export const derivePendingStakeAccount = (miningGroup: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [miningGroup.toBuffer(), Buffer.from("PendingStakeAccount")],
    DE_ORE_PROGRAM
  )[0];
};

export const deriveUnstakedOreAccount = (miningGroup: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [miningGroup.toBuffer(), Buffer.from("UnstakedOreAccount")],
    DE_ORE_PROGRAM
  )[0];
};

export const deriveEpochRecord = (epoch: number, miningGroup: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      new BN(epoch).toArrayLike(Buffer, "le", 8),
      miningGroup.toBuffer(),
      Buffer.from("EpochRecord"),
    ],
    DE_ORE_PROGRAM
  )[0];
};

export const deriveProofAddress = (user: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("proof"), user.toBuffer()],
    ORE_PROGRAM
  )[0];
};

export const deriveOreTreasury = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    ORE_PROGRAM
  )[0];
};

export const deriveOreTreasuryTokens = () => {
  const treasury = deriveOreTreasury();
  return getAssociatedTokenAddressSync(ORE_TOKEN_ADDR, treasury, true);
};
