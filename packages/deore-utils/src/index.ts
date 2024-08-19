import { PublicKey } from "@solana/web3.js";
import * as pdas from "./pdas";
import * as types from "./types";
import * as client from "./client";
import * as instructions from "./instructions";

export { instructions, pdas, types, client };

export const ORE_TOKEN_ADDR = {
  devnet: new PublicKey("E44TYPxh1Z1LUrvaaDd4dUEkn8DX81ELSi2c2p8d42f6"),
  mainnet: new PublicKey("oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp"),
};

export const ORE_PROGRAM = {
  devnet: new PublicKey("5TMAA2EqCwbAsM759Lx7bQRV9AfYKE3NwMR7kpSjKGPM"),
  mainnet: new PublicKey("oreV2ZymfyeXgNgBdqMkumTqqAprVqgBWQfoYkrtKWQ"),
};

export const DE_ORE_PROGRAM = new PublicKey(
  "DeoREdoVi3iqMHQq6sFHD2gBQUYQUMoBEEf3WqpQwLu"
);
