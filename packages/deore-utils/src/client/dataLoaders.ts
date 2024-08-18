import { PublicKey } from "@solana/web3.js";
import { DelegateRecord, EpochRecord, MiningGroup } from "../types";
import {
  ClientProof,
  ClientMiningGroup,
  ClientDelegateRecord,
  ClientEpochRecord,
} from "./clientTypes";
import { BN, BorshAccountsCoder } from "@coral-xyz/anchor";
import base58 from "bs58";
import * as IDL from "./IDL.json";

const ORE_DECIMALS = 11;
const textDecoder = new TextDecoder("utf-8");

const PROTOCOL_FEE_BPS = 1000;
const EPOCH_DURATION_SECONDS = 86400

export const oreBNToFloat = (ore: BN) => {
  return Number(ore) / 10 ** ORE_DECIMALS;
};

export const buildClientMiningGroup = (
  key: PublicKey,
  mg: MiningGroup,
  proof: ClientProof,
  currentEpochRecord?: ClientEpochRecord,
): ClientMiningGroup => {
  const nameBytes = new Uint8Array(mg.name);
  const nullIndex = nameBytes.indexOf(0);
  const validBytes =
    nullIndex === -1 ? nameBytes : nameBytes.slice(0, nullIndex);
  const name = textDecoder.decode(validBytes);

  const deOreSupply = oreBNToFloat(mg.deOreSupply);

  let oreExchangeRate = 1;
  let currentEpochYield = 0;
  let miningRate = 0;

  if (currentEpochRecord) {
    const { proofBalanceAtStart, startAt } = currentEpochRecord;
    let totalRewards = proof.balance - proofBalanceAtStart;
    let stakerRewards = totalRewards *
    (1 - mg.commissionBps / 10000) *
    (1 - PROTOCOL_FEE_BPS / 10000);
    oreExchangeRate = deOreSupply > 0 ?
    (proofBalanceAtStart + stakerRewards) / deOreSupply : 1;

    let elapsedDuration = Date.now() / 1000 - startAt;
    currentEpochYield = proofBalanceAtStart > 0 ? (stakerRewards / elapsedDuration * EPOCH_DURATION_SECONDS) / proofBalanceAtStart * 100 : 0;
    miningRate = elapsedDuration > 0 ? totalRewards / (elapsedDuration / 60) : 0;
  }

  return {
    key,
    name,
    uniqueSeed: mg.uniqueSeed.toNumber(),
    bump: mg.bump,
    version: mg.version,
    authority: mg.authority,
    commissionBps: mg.commissionBps,
    newCommissionBps: mg.newCommissionBps,
    pendingStakeAccount: mg.pendingStakeAccount,
    unstakedOreAccount: mg.unstakedOreAccount,
    currentEpoch: mg.currentEpoch.toNumber(),
    deOreSupply,
    pendingUnstakeInDeOre: oreBNToFloat(mg.pendingUnstakeInDeOre),
    unclaimedStakedDeOre: oreBNToFloat(mg.unclaimedStakedDeOre),
    proof,
    currentEpochRecord,
    oreExchangeRate,
    currentEpochYield,
    miningRate
  };
};

export const parseProofFromBuffer = (
  buff: Buffer,
  key: PublicKey
): ClientProof => {
  const authority = new PublicKey(buff.slice(8, 40));
  const balance = new BN(buff.slice(40, 48), undefined, "le");
  const challenge = base58.encode(buff.slice(48, 80));
  const lastHash = base58.encode(buff.slice(80, 112));
  const lastHashAt = new BN(buff.slice(112, 120), undefined, "le");
  const lastStakeAt = new BN(buff.slice(120, 128), undefined, "le");
  const miner = new PublicKey(buff.slice(128, 160));
  const totalHashes = new BN(buff.slice(160, 168), undefined, "le");
  const totalRewards = new BN(buff.slice(168, 176), undefined, "le");
  return {
    key,
    authority,
    miner,
    totalHashes: totalHashes.toNumber(),
    balance: oreBNToFloat(balance),
    totalRewards: oreBNToFloat(totalRewards),
    lastHashAt: lastHashAt.toNumber(),
    lastStakeAt: lastStakeAt.toNumber(),
    challenge,
    lastHash,
  };
};

export const buildClientDelegateRecord = (
  acc: DelegateRecord,
  key: PublicKey
): ClientDelegateRecord => {
  return {
    key,
    authority: acc.authority,
    miningGroup: acc.miningGroup,
    bump: acc.bump,
    deOreBalance: oreBNToFloat(acc.deOreBalance),
    pendingStakeInOre: oreBNToFloat(acc.pendingStakeInOre),
    pendingUnstakeInDeOre: oreBNToFloat(acc.pendingUnstakeInDeOre),
    pendingStakeEpoch: acc.pendingStakeEpoch.toNumber(),
    pendingUnstakeEpoch: acc.pendingUnstakeEpoch.toNumber(),
    referrer: acc.referrer,
  };
};

export const buildClientEpochRecord = (
  acc: EpochRecord,
  key: PublicKey
): ClientEpochRecord => {
  return {
    key,
    epoch: acc.epoch.toNumber(),
    bump: acc.bump,
    miningGroup: acc.miningGroup,
    proofBalanceAtStart: oreBNToFloat(acc.proofBalanceAtStart),
    endingDeOreExchangeRate:
      acc.endingDeOreExchangeRate.rate.toNumber() / 10 ** 10,
    startAt: acc.startAt.toNumber(),
  };
};
