// src/types.ts

export interface Transaction {
  emisor: string;
  receptor: string;
  cantidad: number;
}

export interface Block {
  index: number;
  timestamp: number;
  transacciones: Transaction[];
  hash: string;
  hash_anterior: string;
  nonce: number;
  minero: string;
}

export interface ChainResponse {
  chain: Block[];
  length: number;
}