import { BN, Program, Provider } from "@coral-xyz/anchor";
import { EpochRecord, OreDelegation, Proof } from "../types";
import * as IDL from "./IDL.json";
import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionSignature,
  Commitment,
} from "@solana/web3.js";
import base58 from "bs58";
import {
  ClientDelegateRecord,
  ClientEpochRecord,
  ClientMiningGroup,
} from "./clientTypes";
import {
  buildClientDelegateRecord,
  buildClientEpochRecord,
  buildClientMiningGroup,
  oreBNToFloat,
  parseProofFromBuffer,
} from "./dataLoaders";
import { instructions, ORE_TOKEN_ADDR, pdas } from "../";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import { fetchPriorityFee, simulateAndAddComputeBudgetUnits } from "./utils";

export enum Network {
  mainnet,
  devnet,
}

export interface DeOreClientConfig {
  provider: Provider;
  hasActualWallet: boolean;
  // Multiplier to use on dynamic priority fee. Default is 2.
  priorityFeeMultiplier?: number;
  // Multiplier to apply to simulated compute budget. Default is 1.1.
  computeBudgetMultiplier?: number;
  // Default is 1 lamport.
  maxPriorityFeeMicroLamports?: number;
  // Network
  network: Network;
}

export class DeOreClient {
  program: Program<OreDelegation>;
  hasActualWallet: boolean;
  private _network: Network;
  private _computeBudgetMultiplier: number;
  private _priorityFeeMultiplier: number;
  private _maxPriorityFeeMicroLamports: number;

  constructor(config: DeOreClientConfig) {
    if (!config.provider) throw new Error("Provider required");

    this.hasActualWallet = config.hasActualWallet;
    this.program = new Program(IDL as OreDelegation, config.provider);
    this._computeBudgetMultiplier = config.computeBudgetMultiplier || 1.1;
    this._priorityFeeMultiplier = config.priorityFeeMultiplier || 2;
    this._maxPriorityFeeMicroLamports =
      config.maxPriorityFeeMicroLamports || 10 ** 6;
    this._network = config.network;
  }

  connection() {
    return this.program.provider.connection;
  }

  payer() {
    return this.program.provider.publicKey;
  }

  async getSetPriorityFeeIx() {
    const priorityFees: number = await fetchPriorityFee({
      connection: this.connection(),
      multiplier: this._priorityFeeMultiplier,
      max: this._maxPriorityFeeMicroLamports,
    });
    if (priorityFees > 0) {
      return ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFees,
      });
    }
    return;
  }

  oreTokenAddress() {
    return this._network == Network.mainnet
      ? ORE_TOKEN_ADDR.mainnet
      : ORE_TOKEN_ADDR.devnet;
  }

  isMainnet() {
    return this._network == Network.mainnet;
  }

  async fetchTokenBalances(commitment: Commitment = "confirmed") {
    const ata = getAssociatedTokenAddressSync(
      this.oreTokenAddress(),
      this.payer()
    );
    const accs = await this.connection().getMultipleAccountsInfo(
      [ata, this.payer()],
      commitment
    );

    let ore = 0;
    let sol = 0;
    if (accs[0]) {
      const ataData = unpackAccount(ata, accs[0], TOKEN_PROGRAM_ID);
      ore = Number(ataData.amount) / 10 ** 11;
    }
    if (accs[1]) {
      sol = accs[1].lamports / LAMPORTS_PER_SOL;
    }
    return {
      ore,
      sol,
    };
  }

  async createMiningGroup(
    uniqueSeed: number,
    commissionBps: number,
    name: string,
    stakeAmount: BN,
    startEpoch: boolean
  ): Promise<TransactionSignature> {
    const tx = new Transaction();
    const setPriorityFeeIx = await this.getSetPriorityFeeIx();
    if (setPriorityFeeIx) tx.add(setPriorityFeeIx);
    const miningGroup = pdas.deriveMiningGroup(new BN(uniqueSeed));
    tx.add(
      await instructions.initMiningGroupIx(
        this.program,
        uniqueSeed,
        commissionBps,
        name,
        this.isMainnet()
      )
    );
    tx.add(
      await instructions.initGroupAccountsIx(
        this.program,
        miningGroup,
        this.isMainnet()
      )
    );
    // Create Miner's Delegate Record
    tx.add(await instructions.initDelegateRecordIx(this.program, miningGroup));
    // Create ATA for Ore if not present.
    const ata = getAssociatedTokenAddressSync(
      this.oreTokenAddress(),
      this.payer()
    );
    const ataAcc = await this.connection().getAccountInfo(ata);
    if (!ataAcc) {
      tx.add(
        await createAssociatedTokenAccountInstruction(
          this.payer(),
          ata,
          this.payer(),
          this.oreTokenAddress()
        )
      );
    }
    // Delegate Ore for miner if non-zero.
    if (!stakeAmount.isZero()) {
      tx.add(
        await instructions.delegateOreIx(
          this.program,
          miningGroup,
          stakeAmount,
          this.isMainnet()
        )
      );
    }
    // Start initial epoch 0 if indicated
    if (startEpoch) {
      tx.add(
        await instructions.startEpochIx(
          this.program,
          miningGroup,
          0,
          this.isMainnet()
        )
      );
    }
    // Process Delegation if epoch started with delegation
    if (!stakeAmount.isZero() && startEpoch) {
      tx.add(
        await instructions.processDelegationIx(
          this.program,
          miningGroup,
          this.payer(),
          0
        )
      );
    }
    tx.feePayer = this.payer();
    await simulateAndAddComputeBudgetUnits(
      this.connection().rpcEndpoint,
      tx,
      this._computeBudgetMultiplier
    );
    const txid = await this.program.provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
    return txid;
  }

  async delegateOre(
    miningGroup: PublicKey,
    amount: BN,
    initRecord: boolean
  ): Promise<TransactionSignature> {
    const tx = new Transaction();
    const setPriorityFeeIx = await this.getSetPriorityFeeIx();
    if (setPriorityFeeIx) tx.add(setPriorityFeeIx);
    if (initRecord) {
      tx.add(
        await instructions.initDelegateRecordIx(this.program, miningGroup)
      );
    }
    tx.add(
      await instructions.delegateOreIx(
        this.program,
        miningGroup,
        amount,
        this.isMainnet()
      )
    );
    tx.feePayer = this.payer();
    await simulateAndAddComputeBudgetUnits(
      this.connection().rpcEndpoint,
      tx,
      this._computeBudgetMultiplier
    );
    const txid = await this.program.provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
    return txid;
  }

  async undelegateOre(
    miningGroup: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const ata = getAssociatedTokenAddressSync(
      this.oreTokenAddress(),
      this.payer()
    );
    const ataAcc = await this.connection().getAccountInfo(ata);

    const tx = new Transaction();
    const setPriorityFeeIx = await this.getSetPriorityFeeIx();
    if (setPriorityFeeIx) tx.add(setPriorityFeeIx);
    if (!ataAcc) {
      tx.add(
        await createAssociatedTokenAccountInstruction(
          this.payer(),
          ata,
          this.payer(),
          this.oreTokenAddress()
        )
      );
    }
    tx.add(
      await instructions.undelegateOreIx(this.program, miningGroup, amount)
    );
    tx.feePayer = this.payer();
    await simulateAndAddComputeBudgetUnits(
      this.connection().rpcEndpoint,
      tx,
      this._computeBudgetMultiplier
    );
    const txid = await this.program.provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
    return txid;
  }

  async startEpoch(
    miningGroup: PublicKey,
    currentEpoch?: number
  ): Promise<TransactionSignature> {
    let miner = this.payer();
    if (currentEpoch == null) {
      const miningGroupData = await this.program.account.miningGroup.fetch(
        miningGroup
      );
      currentEpoch = miningGroupData.currentEpoch.toNumber();
      miner = miningGroupData.authority; // overwrite miner
    }
    const tx = new Transaction();
    const setPriorityFeeIx = await this.getSetPriorityFeeIx();
    if (setPriorityFeeIx) tx.add(setPriorityFeeIx);
    tx.add(
      await instructions.startEpochIx(
        this.program,
        miningGroup,
        currentEpoch,
        this.isMainnet(),
        this.payer(),
        miner
      )
    );
    tx.feePayer = this.payer();
    await simulateAndAddComputeBudgetUnits(
      this.connection().rpcEndpoint,
      tx,
      this._computeBudgetMultiplier
    );
    const txid = await this.program.provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
    return txid;
  }

  async processDelegation(
    delegateRecord: PublicKey
  ): Promise<TransactionSignature> {
    const dr = await this.program.account.delegateRecord.fetch(delegateRecord);
    const tx = new Transaction();
    const setPriorityFeeIx = await this.getSetPriorityFeeIx();
    if (setPriorityFeeIx) tx.add(setPriorityFeeIx);
    tx.add(
      await instructions.processDelegationIx(
        this.program,
        dr.miningGroup,
        this.payer(),
        dr.pendingStakeEpoch.toNumber()
      )
    );
    tx.feePayer = this.payer();
    await simulateAndAddComputeBudgetUnits(
      this.connection().rpcEndpoint,
      tx,
      this._computeBudgetMultiplier
    );
    return this.program.provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
  }

  async processUndelegation(
    miningGroup: PublicKey
  ): Promise<TransactionSignature> {
    const ata = getAssociatedTokenAddressSync(
      this.oreTokenAddress(),
      this.payer()
    );
    const ataAcc = await this.connection().getAccountInfo(ata);

    const tx = new Transaction();
    const setPriorityFeeIx = await this.getSetPriorityFeeIx();
    if (setPriorityFeeIx) tx.add(setPriorityFeeIx);
    if (!ataAcc) {
      tx.add(
        await createAssociatedTokenAccountInstruction(
          this.payer(),
          ata,
          this.payer(),
          this.oreTokenAddress()
        )
      );
    }
    tx.add(
      await instructions.processUndelegationIx(
        this.program,
        miningGroup,
        this.payer(),
        this.isMainnet()
      )
    );
    tx.feePayer = this.payer();
    await simulateAndAddComputeBudgetUnits(
      this.connection().rpcEndpoint,
      tx,
      this._computeBudgetMultiplier
    );
    return this.program.provider.sendAndConfirm(tx, [], {
      commitment: "confirmed",
    });
  }

  async loadClientMiningGroups(): Promise<ClientMiningGroup[]> {
    const accs = await this.program.account.miningGroup.all();
    const proofKeys = accs.map((acc) => acc.account.proof);
    // TODO: Use chunked loading to avoid 100 account limit
    const proofAccs = await this.connection().getMultipleAccountsInfo(
      proofKeys
    );
    const proofs = proofAccs.map((acc, idx) =>
      parseProofFromBuffer(acc.data, proofKeys[idx])
    );

    const currErKeys = accs.map((acc) => {
      const epochRecordKey = pdas.deriveEpochRecord(
        acc.account.currentEpoch.toNumber(),
        acc.publicKey
      );
      return epochRecordKey;
    });

    const prevErKeys = accs.map((acc) => {
      const epochRecordKey = pdas.deriveEpochRecord(
        acc.account.currentEpoch.toNumber() - 1,
        acc.publicKey
      );
      return epochRecordKey;
    });

    // TODO: Use chunked loading to avoid 100 account limit
    // What if ER does not exist (epoch 0)
    const currErAccs = await this.connection().getMultipleAccountsInfo(
      currErKeys
    );
    const currentErs = currErAccs.map((acc, idx) => {
      if (!acc?.data) return;
      const er = this.program.coder.accounts.decode<EpochRecord>(
        "epochRecord",
        acc.data
      );
      return buildClientEpochRecord(er, currErKeys[idx]);
    });

    return accs.map((acc, idx) =>
      buildClientMiningGroup(
        acc.publicKey,
        acc.account,
        proofs[idx],
        currentErs[idx]
      )
    );
  }

  async loadClientMiningGroup(
    address: PublicKey,
    log = false,
    commitment: Commitment = "confirmed"
  ): Promise<ClientMiningGroup> {
    const acc = await this.program.account.miningGroup.fetch(
      address,
      commitment
    );
    const proofAcc = await this.connection().getAccountInfo(
      acc.proof,
      commitment
    );
    const proof = parseProofFromBuffer(proofAcc.data, acc.proof);
    const erKey = pdas.deriveEpochRecord(acc.currentEpoch.toNumber(), address);
    const er = await this.program.account.epochRecord.fetch(erKey, commitment);
    const clientEr = buildClientEpochRecord(er, erKey);
    const clientMg = buildClientMiningGroup(address, acc, proof, clientEr);
    if (log) {
      console.log("MiningGroup", {
        ...clientMg,
        key: clientMg.key.toString(),
        authority: clientMg.authority.toString(),
        pendingStakeAccount: clientMg.pendingStakeAccount.toString(),
        unstakedOreAccount: clientMg.unstakedOreAccount.toString(),
        proof: {
          ...clientMg.proof,
          key: clientMg.proof.key.toString(),
          authority: clientMg.proof.authority.toString(),
          miner: clientMg.proof.miner.toString(),
          lastHashAt: new Date(
            clientMg.proof.lastHashAt * 1000
          ).toLocaleString(),
          lastStakeAt: new Date(
            clientMg.proof.lastStakeAt * 1000
          ).toLocaleString(),
        },
        currentEpochRecord: {
          ...clientMg.currentEpochRecord,
          key: clientMg.currentEpochRecord.key.toString(),
          miningGroup: clientMg.currentEpochRecord.miningGroup.toString(),
          startAt: new Date(
            clientMg.currentEpochRecord.startAt * 1000
          ).toLocaleString(),
        },
      });
    }
    return clientMg;
  }

  async loadClientEpochRecord(
    address: PublicKey,
    log = false,
    commitment: Commitment = "confirmed"
  ): Promise<ClientEpochRecord> {
    const acc = await this.program.account.epochRecord.fetch(
      address,
      commitment
    );
    const er = buildClientEpochRecord(acc, address);
    if (log) {
      console.log("EpochRecord", {
        key: er.key.toString(),
        epoch: er.epoch,
        miningGroup: er.miningGroup,
        proofBalanceAtStart: er.proofBalanceAtStart,
        endingDeOreExchangeRate: er.endingDeOreExchangeRate,
        startAt: new Date(er.startAt * 1000).toLocaleString(),
      });
    }
    return er;
  }

  async loadClientDelegateRecords(
    wallet?: PublicKey
  ): Promise<ClientDelegateRecord[]> {
    // Filter for DelegateRecords matching specified or defualt wallet.
    const accs = await this.program.account.delegateRecord.all([
      {
        memcmp: {
          bytes: (wallet || this.payer()).toBase58(),
          offset: 8,
        },
      },
    ]);
    return accs.map((acc) =>
      buildClientDelegateRecord(acc.account, acc.publicKey)
    );
  }

  // Returns map of mining group to delegate record for wallet.
  async loadClientDelegateRecordsMap(
    wallet?: PublicKey
  ): Promise<Map<string, ClientDelegateRecord>> {
    const cdrs = await this.loadClientDelegateRecords(wallet);
    const map = new Map();
    cdrs.forEach((cdr) => map.set(cdr.miningGroup.toString(), cdr));
    return map;
  }

  async loadClientDelegateRecord(
    address: PublicKey,
    log = false,
    commitment: Commitment = "confirmed"
  ): Promise<ClientDelegateRecord> {
    const acc = await this.program.account.delegateRecord.fetch(
      address,
      commitment
    );
    const cdr = buildClientDelegateRecord(acc, address);
    if (log) {
      console.log("DelegateRecord", {
        ...cdr,
        key: cdr.key.toString(),
        authority: cdr.authority.toString(),
        miningGroup: cdr.miningGroup.toString(),
        referrer: cdr.referrer.toString(),
      });
    }
    return cdr;
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
}
