import { BN, DRIFT_PROGRAM_ID, type DriftEnv } from '@drift-labs/sdk';

export const DRIFT_ENV: DriftEnv = 'mainnet-beta';

export const PRIORITY_FEE_SUBSCRIPTION_ADDRESSES = [
  DRIFT_PROGRAM_ID.toString(),
  '6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3', // USDC.
  // TODO: Add LANDO-F1-SGP-WIN-BET market account.
];

export const SUB_ACCOUNT_ID = 0;

// Deposit.
export const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_PRECISION = new BN(10).pow(new BN(6));

// Markets.
export const USDC_MARKET_INDEX = 0;
export const LANDO_F1_SGP_WIN_BET_MARKET_INDEX = 43;
