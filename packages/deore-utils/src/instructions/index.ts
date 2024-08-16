import * as anchor from "@coral-xyz/anchor";
import { Program, BN, utils } from "@coral-xyz/anchor";
import { PublicKey, SYSVAR_SLOT_HASHES_PUBKEY } from "@solana/web3.js";
import { ORE_PROGRAM, ORE_TOKEN_ADDR, pdas } from "../index";
import { OreDelegation } from "../types";

export const initMiningGroupIx = async (
  program: Program<OreDelegation>,
  uniqueSeed: number,
  commissionBps: number,
  name: string,
  payer?: PublicKey,
  authority?: PublicKey
) => {
  if (!payer) payer = program.provider.publicKey;
  if (!authority) authority = program.provider.publicKey;
  const miningGroup = pdas.deriveMiningGroup(new BN(uniqueSeed));
  return program.methods
    .initMiningGroup(new BN(uniqueSeed), commissionBps, name)
    .accounts({
      payer,
      authority,
      proof: pdas.deriveProofAddress(miningGroup),
      slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
      oreProgram: ORE_PROGRAM,
    })
    .instruction();
};

export const initTreasuryIx = async (
  program: Program<OreDelegation>,
  feeBps: number,
  payer?: PublicKey,
  authority?: PublicKey
) => {
  if (!payer) payer = program.provider.publicKey;
  if (!authority) authority = program.provider.publicKey;
  return program.methods
    .initTreasury(feeBps)
    .accounts({
      payer,
      authority,
      mint: ORE_TOKEN_ADDR,
    })
    .instruction();
};

export const initGroupAccountsIx = async (
  program: Program<OreDelegation>,
  miningGroup: PublicKey,
  payer?: PublicKey
) => {
  if (!payer) payer = program.provider.publicKey;
  return program.methods
    .initGroupAccounts()
    .accounts({
      payer,
      miningGroup,
      mint: ORE_TOKEN_ADDR,
    })
    .instruction();
};

export const initDelegateRecordIx = async (
  program: Program<OreDelegation>,
  miningGroup: PublicKey,
  payer?: PublicKey,
  authority?: PublicKey
) => {
  if (!payer) payer = program.provider.publicKey;
  if (!authority) authority = program.provider.publicKey;
  return program.methods
    .initDelegateRecord()
    .accounts({
      payer,
      authority,
      miningGroup,
    })
    .instruction();
};

export const delegateOreIx = async (
  program: Program<OreDelegation>,
  miningGroup: PublicKey,
  amount: BN,
  authority?: PublicKey,
  sourceTokenAccount?: PublicKey,
  referrer?: PublicKey
) => {
  if (!authority) authority = program.provider.publicKey;
  if (!sourceTokenAccount) {
    sourceTokenAccount = anchor.utils.token.associatedAddress({
      mint: ORE_TOKEN_ADDR,
      owner: authority,
    });
  }
  return program.methods
    .delegateOre(amount)
    .accountsPartial({
      authority,
      miningGroup,
      sourceTokenAccount,
      referrer: referrer ?? null,
    })
    .instruction();
};

export const undelegateOreIx = async (
  program: Program<OreDelegation>,
  miningGroup: PublicKey,
  deOreAmount: BN,
  authority?: PublicKey
) => {
  if (!authority) authority = program.provider.publicKey;
  return program.methods
    .undelegateOre(deOreAmount)
    .accountsPartial({
      authority,
      miningGroup,
    })
    .instruction();
};

export const processDelegationIx = async (
  program: Program<OreDelegation>,
  miningGroup: PublicKey,
  userWallet: PublicKey,
  epoch: number
) => {
  const delegateRecord = pdas.deriveDelegateRecord(miningGroup, userWallet);
  const epochRecord =
    epoch > 0 ? pdas.deriveEpochRecord(epoch, miningGroup) : null;
  return program.methods
    .processDelegation()
    .accountsPartial({
      delegateRecord,
      epochRecord,
    })
    .instruction();
};

export const processUndelegationIx = async (
  program: Program<OreDelegation>,
  miningGroup: PublicKey,
  userWallet: PublicKey
) => {
  const delegateRecord = pdas.deriveDelegateRecord(miningGroup, userWallet);
  return program.methods
    .processUndelegation()
    .accounts({
      delegateRecord,
    })
    .instruction();
};

export const startEpochIx = async (
  program: Program<OreDelegation>,
  miningGroup: PublicKey,
  currentEpoch: number,
  payer?: PublicKey,
  miner?: PublicKey
) => {
  if (!payer) payer = program.provider.publicKey;
  if (!miner) miner = program.provider.publicKey;

  const endEpochRecord =
    currentEpoch > 0 ? pdas.deriveEpochRecord(currentEpoch, miningGroup) : null;
  const minerDelegateRecord = pdas.deriveDelegateRecord(miningGroup, miner);
  const proof = pdas.deriveProofAddress(miningGroup);

  return program.methods
    .startEpoch()
    .accountsPartial({
      payer,
      miningGroup,
      endEpochRecord,
      startEpochRecord: pdas.deriveEpochRecord(currentEpoch + 1, miningGroup),
      pendingStakeAccount: pdas.derivePendingStakeAccount(miningGroup),
      unstakedOreAccount: pdas.deriveUnstakedOreAccount(miningGroup),
      treasuryTokenAccount: pdas.deriveTreasuryTokenAccount(),
      minerDelegateRecord,
      proof,
      oreTreasury: pdas.deriveOreTreasury(),
      oreTreasuryTokens: pdas.deriveOreTreasuryTokens(),
      oreProgram: ORE_PROGRAM,
    })
    .instruction();
};

export const updateMiningGroupIx = async (
  program: Program<OreDelegation>,
  commissionBps: number,
  name: string,
  miningGroup: PublicKey,
  authority?: PublicKey
) => {
  if (!authority) authority = program.provider.publicKey;
  return program.methods
    .updateMiningGroup(commissionBps, name)
    .accountsPartial({
      authority,
      miningGroup,
    })
    .instruction();
};
