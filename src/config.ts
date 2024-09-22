import { DRIFT_PROGRAM_ID, type DriftEnv } from '@drift-labs/sdk';

export const DRIFT_ENV: DriftEnv = 'mainnet-beta';

export const PRIORITY_FEE_SUBSCRIPTION_ADDRESSES = [
  DRIFT_PROGRAM_ID.toString(),
  '6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3', // USDC.
  // TODO: Add LANDO-F1-SGP-WIN-BET market account.
];

export const HELIUS_RPC =
  'https://mainnet.helius-rpc.com/?api-key=4fd2322f-ba0c-4d46-911f-368f6e646f87';

export const SOLANA_RPC = HELIUS_RPC;
