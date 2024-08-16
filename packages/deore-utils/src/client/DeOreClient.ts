import { BN, Program, Provider, Wallet } from "@coral-xyz/anchor";
import {
  DelegateRecord,
  EpochRecord,
  MiningGroup,
  OreDelegation,
  Proof,
} from "../types";
import * as IDL from "./IDL.json";
import { PublicKey } from "@solana/web3.js";
import base58 from "bs58";

export interface DeOreClientConfig {
  provider: Provider;
}

const ORE_DECIMALS = 11;
const textDecoder = new TextDecoder("utf-8");

export const oreBNToFloat = (ore: BN) => {
  return Number(ore) / 10 ** ORE_DECIMALS;
};

export class DeOreClient {
  program: Program<OreDelegation>;

  constructor(config: DeOreClientConfig) {
    this.program = new Program(IDL as OreDelegation, config.provider);
  }

  async loadMiningGroup(address: PublicKey, log = false): Promise<MiningGroup> {
    const acc = await this.program.account.miningGroup.fetch(address);
    const nameBytes = new Uint8Array(acc.name);
    const nullIndex = nameBytes.indexOf(0);
    const validBytes =
      nullIndex === -1 ? nameBytes : nameBytes.slice(0, nullIndex);
    const name = textDecoder.decode(validBytes);
    if (log) {
      console.log("MiningGroup", {
        key: address.toString(),
        name,
        uniqueSeed: acc.uniqueSeed.toNumber(),
        bump: acc.bump,
        version: acc.version,
        authority: acc.authority.toString(),
        proof: acc.proof.toString(),
        commissionBps: acc.commissionBps,
        newCommissionBps: acc.newCommissionBps,
        pendingStakeAccount: acc.pendingStakeAccount.toString(),
        unstakedOreAccount: acc.unstakedOreAccount.toString(),
        currentEpoch: acc.currentEpoch.toNumber(),
        deOreSupply: oreBNToFloat(acc.deOreSupply),
        pendingUnstakeInDeOre: oreBNToFloat(acc.pendingUnstakeInDeOre),
        unclaimedStakedDeOre: oreBNToFloat(acc.unclaimedStakedDeOre),
      });
    }
    return {
      ...acc,
      name,
    };
  }

  async loadProof(address: PublicKey, log = false): Promise<Proof> {
    const acc = await this.program.provider.connection.getAccountInfo(address);
    const buff = acc.data;
    const authority = new PublicKey(buff.slice(8, 40));
    const balance = new BN(buff.slice(40, 48), undefined, "le");
    const challenge = base58.encode(buff.slice(48, 80));
    const lastHash = base58.encode(buff.slice(80, 112));
    const lastHashAt = new BN(buff.slice(112, 120), undefined, "le");
    const lastStakeAt = new BN(buff.slice(120, 128), undefined, "le");
    const miner = new PublicKey(buff.slice(128, 160));
    const totalHashes = new BN(buff.slice(160, 168), undefined, "le");
    const totalRewards = new BN(buff.slice(168, 176), undefined, "le");
    if (log) {
      console.log("Proof", {
        key: address.toString(),
        authority: authority.toString(),
        miner: miner.toString(),
        totalHashes: totalHashes.toNumber(),
        balance: oreBNToFloat(balance),
        totalRewards: oreBNToFloat(totalRewards),
        lastHashAt: new Date(lastHashAt.toNumber() * 1000).toLocaleString(),
        lastStakeAt: new Date(lastStakeAt.toNumber() * 1000).toLocaleString(),
        challenge,
        lastHash,
      });
    }
    return {
      authority,
      miner,
      totalHashes,
      balance,
      totalRewards,
      lastHashAt,
      lastStakeAt,
      challenge,
      lastHash,
    };
  }

  async loadEpochRecord(address: PublicKey, log = false): Promise<EpochRecord> {
    const acc = await this.program.account.epochRecord.fetch(address);
    if (log) {
      console.log("EpochRecord", {
        key: address.toString(),
        epoch: acc.epoch.toNumber(),
        miningGroup: acc.miningGroup.toString(),
        proofBalanceAtStart: oreBNToFloat(acc.proofBalanceAtStart),
        endingDeOreExchangeRate:
          acc.endingDeOreExchangeRate.rate.toNumber() / 10 ** 10,
        startAt: new Date(acc.startAt.toNumber() * 1000).toLocaleString(),
      });
    }
    return acc;
  }

  async loadDelegateRecord(
    address: PublicKey,
    log = false
  ): Promise<DelegateRecord> {
    const acc = await this.program.account.delegateRecord.fetch(address);
    if (log) {
      console.log("DelegateRecord", {
        key: address.toString(),
        authority: acc.authority.toString(),
        miningGroup: acc.miningGroup.toString(),
        deOreBalance: oreBNToFloat(acc.deOreBalance),
        pendingStakeInOre: oreBNToFloat(acc.pendingStakeInOre),
        pendingUnstakeInDeOre: oreBNToFloat(acc.pendingUnstakeInDeOre),
        pendingStakeEpoch: acc.pendingStakeEpoch.toNumber(),
        pendingUnstakeEpoch: acc.pendingUnstakeEpoch.toNumber(),
        referrer: acc.referrer.toString(),
      });
    }
    return acc;
  }
}
