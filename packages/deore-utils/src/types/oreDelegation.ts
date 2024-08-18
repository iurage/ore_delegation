/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ore_delegation.json`.
 */
export type OreDelegation = {
  address: "DeoREdoVi3iqMHQq6sFHD2gBQUYQUMoBEEf3WqpQwLu";
  metadata: {
    name: "oreDelegation";
    version: "1.0.0";
    spec: "0.1.0";
    description: "Ore Mining Group Delegation Program";
  };
  instructions: [
    {
      name: "delegateOre";
      discriminator: [13, 215, 49, 147, 73, 71, 59, 134];
      accounts: [
        {
          name: "authority";
          signer: true;
          relations: ["delegateRecord"];
        },
        {
          name: "miningGroup";
        },
        {
          name: "delegateRecord";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "account";
                path: "authority";
              },
              {
                kind: "const";
                value: [
                  68,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101,
                  82,
                  101,
                  99,
                  111,
                  114,
                  100
                ];
              }
            ];
          };
        },
        {
          name: "sourceTokenAccount";
          writable: true;
        },
        {
          name: "pendingStakeAccount";
          writable: true;
          relations: ["miningGroup"];
        },
        {
          name: "referrer";
          optional: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "initDelegateRecord";
      discriminator: [188, 126, 87, 112, 96, 206, 80, 61];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "miningGroup";
        },
        {
          name: "delegateRecord";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "account";
                path: "authority";
              },
              {
                kind: "const";
                value: [
                  68,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101,
                  82,
                  101,
                  99,
                  111,
                  114,
                  100
                ];
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "initGroupAccounts";
      discriminator: [223, 166, 246, 77, 153, 221, 152, 180];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          signer: true;
          relations: ["miningGroup"];
        },
        {
          name: "miningGroup";
          writable: true;
        },
        {
          name: "pendingStakeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "const";
                value: [
                  80,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  83,
                  116,
                  97,
                  107,
                  101,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              }
            ];
          };
        },
        {
          name: "unstakedOreAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "const";
                value: [
                  85,
                  110,
                  115,
                  116,
                  97,
                  107,
                  101,
                  100,
                  79,
                  114,
                  101,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              }
            ];
          };
        },
        {
          name: "mint";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "initMiningGroup";
      discriminator: [195, 236, 105, 57, 67, 227, 94, 41];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "miningGroup";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "arg";
                path: "uniqueSeed";
              },
              {
                kind: "const";
                value: [77, 105, 110, 105, 110, 103, 71, 114, 111, 117, 112];
              }
            ];
          };
        },
        {
          name: "proof";
          writable: true;
        },
        {
          name: "slotHashes";
        },
        {
          name: "oreProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "uniqueSeed";
          type: "u64";
        },
        {
          name: "commissionBps";
          type: "u16";
        },
        {
          name: "name";
          type: "string";
        }
      ];
    },
    {
      name: "initTreasury";
      discriminator: [105, 152, 173, 51, 158, 151, 49, 14];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          signer: true;
        },
        {
          name: "treasury";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [84, 114, 101, 97, 115, 117, 114, 121];
              }
            ];
          };
        },
        {
          name: "treasuryTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  84,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  84,
                  111,
                  107,
                  101,
                  110,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              }
            ];
          };
        },
        {
          name: "mint";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "feeBps";
          type: "u16";
        }
      ];
    },
    {
      name: "processDelegation";
      discriminator: [2, 170, 37, 85, 56, 57, 45, 205];
      accounts: [
        {
          name: "miningGroup";
          writable: true;
          relations: ["delegateRecord"];
        },
        {
          name: "delegateRecord";
          writable: true;
        },
        {
          name: "epochRecord";
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "delegate_record.pending_stake_epoch";
                account: "delegateRecord";
              },
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "const";
                value: [69, 112, 111, 99, 104, 82, 101, 99, 111, 114, 100];
              }
            ];
          };
        }
      ];
      args: [];
    },
    {
      name: "processUndelegation";
      discriminator: [196, 28, 41, 206, 48, 37, 51, 167];
      accounts: [
        {
          name: "miningGroup";
          relations: ["delegateRecord"];
        },
        {
          name: "unstakedOreAccount";
          writable: true;
          relations: ["miningGroup"];
        },
        {
          name: "delegateRecord";
          writable: true;
        },
        {
          name: "delegateOreAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "delegate_record.authority";
                account: "delegateRecord";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "const";
                value: [
                  193,
                  240,
                  148,
                  253,
                  251,
                  253,
                  217,
                  46,
                  168,
                  133,
                  87,
                  31,
                  61,
                  192,
                  99,
                  231,
                  90,
                  145,
                  122,
                  10,
                  64,
                  201,
                  40,
                  209,
                  142,
                  129,
                  26,
                  24,
                  0,
                  128,
                  251,
                  29
                ];
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "epochRecord";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "delegate_record.pending_unstake_epoch";
                account: "delegateRecord";
              },
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "const";
                value: [69, 112, 111, 99, 104, 82, 101, 99, 111, 114, 100];
              }
            ];
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [];
    },
    {
      name: "startEpoch";
      discriminator: [204, 248, 232, 82, 251, 45, 164, 113];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "miningGroup";
          writable: true;
        },
        {
          name: "endEpochRecord";
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "mining_group.current_epoch";
                account: "miningGroup";
              },
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "const";
                value: [69, 112, 111, 99, 104, 82, 101, 99, 111, 114, 100];
              }
            ];
          };
        },
        {
          name: "startEpochRecord";
          writable: true;
        },
        {
          name: "minerDelegateRecord";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "account";
                path: "mining_group.authority";
                account: "miningGroup";
              },
              {
                kind: "const";
                value: [
                  68,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101,
                  82,
                  101,
                  99,
                  111,
                  114,
                  100
                ];
              }
            ];
          };
        },
        {
          name: "treasury";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [84, 114, 101, 97, 115, 117, 114, 121];
              }
            ];
          };
        },
        {
          name: "pendingStakeAccount";
          writable: true;
          relations: ["miningGroup"];
        },
        {
          name: "unstakedOreAccount";
          writable: true;
          relations: ["miningGroup"];
        },
        {
          name: "treasuryTokenAccount";
          writable: true;
          relations: ["treasury"];
        },
        {
          name: "proof";
          writable: true;
          relations: ["miningGroup"];
        },
        {
          name: "oreTreasury";
        },
        {
          name: "oreTreasuryTokens";
          writable: true;
        },
        {
          name: "oreProgram";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "undelegateOre";
      discriminator: [157, 167, 236, 161, 15, 231, 110, 142];
      accounts: [
        {
          name: "authority";
          signer: true;
          relations: ["delegateRecord"];
        },
        {
          name: "miningGroup";
          writable: true;
        },
        {
          name: "delegateRecord";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "miningGroup";
              },
              {
                kind: "account";
                path: "authority";
              },
              {
                kind: "const";
                value: [
                  68,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101,
                  82,
                  101,
                  99,
                  111,
                  114,
                  100
                ];
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "updateMiningGroup";
      discriminator: [160, 147, 166, 130, 100, 46, 238, 83];
      accounts: [
        {
          name: "authority";
          signer: true;
          relations: ["miningGroup"];
        },
        {
          name: "miningGroup";
          writable: true;
        }
      ];
      args: [
        {
          name: "commissionBps";
          type: "u16";
        },
        {
          name: "name";
          type: "string";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "delegateRecord";
      discriminator: [171, 12, 129, 47, 245, 194, 7, 166];
    },
    {
      name: "epochRecord";
      discriminator: [193, 72, 26, 28, 161, 98, 58, 132];
    },
    {
      name: "miningGroup";
      discriminator: [18, 1, 9, 74, 146, 23, 64, 76];
    },
    {
      name: "treasury";
      discriminator: [238, 239, 123, 238, 89, 1, 168, 253];
    }
  ];
  types: [
    {
      name: "delegateRecord";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            docs: [
              "Address authorized to delegate and undelegate with this record."
            ];
            type: "pubkey";
          },
          {
            name: "miningGroup";
            docs: ["Associated mining group for delegation."];
            type: "pubkey";
          },
          {
            name: "bump";
            docs: ["PDA bump"];
            type: "u8";
          },
          {
            name: "deOreBalance";
            docs: ["Amount of deOre owned by the record."];
            type: "u64";
          },
          {
            name: "pendingStakeInOre";
            docs: ["Amount of ore pending to be staked."];
            type: "u64";
          },
          {
            name: "pendingUnstakeInDeOre";
            docs: ["Amount of deOre pending to be unstaked."];
            type: "u64";
          },
          {
            name: "pendingStakeEpoch";
            docs: ["Epoch pending delegation was initialized at."];
            type: "u64";
          },
          {
            name: "pendingUnstakeEpoch";
            docs: ["Epoch pending undelegation was initialized at."];
            type: "u64";
          },
          {
            name: "referrer";
            docs: ["Referrer for pending stake (to be implemented)"];
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "epochRecord";
      type: {
        kind: "struct";
        fields: [
          {
            name: "epoch";
            docs: ["Epoch record is for, starts from 1."];
            type: "u64";
          },
          {
            name: "bump";
            docs: ["PDA bump"];
            type: "u8";
          },
          {
            name: "miningGroup";
            docs: ["Associated mining group for this epoch."];
            type: "pubkey";
          },
          {
            name: "proofBalanceAtStart";
            docs: ["Amount of Ore in Proof.balance when epoch started."];
            type: "u64";
          },
          {
            name: "endingDeOreExchangeRate";
            docs: [
              "Exchange rate epoch ended at. Value is set to 0 if epoch has not ended."
            ];
            type: {
              defined: {
                name: "oreExchangeRate";
              };
            };
          },
          {
            name: "startAt";
            docs: ["Unix Timestamp at which epoch began."];
            type: "i64";
          }
        ];
      };
    },
    {
      name: "miningGroup";
      type: {
        kind: "struct";
        fields: [
          {
            name: "uniqueSeed";
            docs: ["Unique seed used to generate MiningGroup address"];
            type: "u64";
          },
          {
            name: "bump";
            docs: ["PDA Bump"];
            type: "u8";
          },
          {
            name: "version";
            docs: ["Version of this MiningGroup struct (starts from 1)"];
            type: "u8";
          },
          {
            name: "authority";
            docs: [
              "User authorized to mine with Proof to receive share of mining rewards."
            ];
            type: "pubkey";
          },
          {
            name: "proof";
            docs: ["Proof account owned by MiningGroup."];
            type: "pubkey";
          },
          {
            name: "commissionBps";
            docs: ["Share of rewards that miner will receive."];
            type: "u16";
          },
          {
            name: "newCommissionBps";
            type: "u16";
          },
          {
            name: "pendingStakeAccount";
            type: "pubkey";
          },
          {
            name: "unstakedOreAccount";
            docs: ["Stores Ore that is unstaked but not claimed by users yet."];
            type: "pubkey";
          },
          {
            name: "currentEpoch";
            docs: ["Current epoch (first epoch starts from 1)"];
            type: "u64";
          },
          {
            name: "deOreSupply";
            docs: ["Tracks amount of deOre across all delegators."];
            type: "u64";
          },
          {
            name: "pendingUnstakeInDeOre";
            docs: ["Tracks amount of deOre to unstake at end of epoch."];
            type: "u64";
          },
          {
            name: "unclaimedStakedDeOre";
            docs: [
              "Tracks remaining deOre that is staked but not claimed by users yet.",
              "Used to prevent users from claiming more deOre than supply created."
            ];
            type: "u64";
          },
          {
            name: "name";
            type: {
              array: ["u8", 20];
            };
          }
        ];
      };
    },
    {
      name: "oreExchangeRate";
      type: {
        kind: "struct";
        fields: [
          {
            name: "rate";
            docs: [
              "Exchange rate in amount of ore (with precision of 10) per de_ore.",
              "E.g. a rate of 1.05 Ore per DeOre will be stored as:",
              "10_500_000_000",
              "Rate starts with 1.0 and is an increasing function except in the case",
              "where de_ore_supply is reduced to 0 in an epoch, and rate is reset back to 1.0",
              "in the following epoch."
            ];
            type: "u128";
          }
        ];
      };
    },
    {
      name: "treasury";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            docs: ["Signer authorized to withdraw or change treasury fees."];
            type: "pubkey";
          },
          {
            name: "treasuryTokenAccount";
            docs: ["Token account to store protocol fees."];
            type: "pubkey";
          },
          {
            name: "feeBps";
            docs: [
              "Portion of fee (bps) to take from mining rewards, after deducting miner's commission",
              "as protocol fee."
            ];
            type: "u16";
          },
          {
            name: "bump";
            docs: ["PDA Bump"];
            type: "u8";
          }
        ];
      };
    }
  ];
};
