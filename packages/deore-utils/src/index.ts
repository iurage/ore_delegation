import { PublicKey } from "@solana/web3.js";
import * as pdas from "./pdas";
import * as types from "./types";
import * as client from "./client";
import * as instructions from "./instructions";

export { instructions, pdas, types, client };

export const ORE_TOKEN_ADDR = new PublicKey(
  "E44TYPxh1Z1LUrvaaDd4dUEkn8DX81ELSi2c2p8d42f6"
);
export const ORE_PROGRAM = new PublicKey(
  "5TMAA2EqCwbAsM759Lx7bQRV9AfYKE3NwMR7kpSjKGPM"
);
export const DE_ORE_PROGRAM = new PublicKey(
  "AceRyPKDMjP5MSZXaS4qeZxEa2QbfbhmJBq2t6gCzfVu"
);
