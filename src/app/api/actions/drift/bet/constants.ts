import { BN, DRIFT_PROGRAM_ID, type DriftEnv } from '@drift-labs/sdk';

export const DRIFT_ENV: DriftEnv = 'mainnet-beta';

export const PRIORITY_FEE_SUBSCRIPTION_ADDRESSES = [
  DRIFT_PROGRAM_ID.toString(),
  '6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3', // USDC.
  // TODO: Add prediction markets accounts in use.
];

export const SUB_ACCOUNT_ID = 0;

// Deposit.
export const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_PRECISION = new BN(10).pow(new BN(6));

// Spot markets.
export const USDC_MARKET_INDEX = 0;

// Perp markets.
export const SOL_PERP_MARKET_INDEX = 0;
export const TRUMP_WIN_2024_BET_MARKET_INDEX = 36;
export const KAMALA_POPULAR_VOTE_2024_BET_MARKET_INDEX = 37;
export const LANDO_F1_SGP_WIN_BET_MARKET_INDEX = 43;

// Actions metadata.
export const METADATA_BY_MARKET_INDEX = {
  [TRUMP_WIN_2024_BET_MARKET_INDEX]: {
    title: 'Place your Trump bet',
    description: 'Will Donald Trump win the 2024 Presidential Election?',
    resolvesOn: new Date('2024-11-06T00:00Z'),
  },
  [KAMALA_POPULAR_VOTE_2024_BET_MARKET_INDEX]: {
    title: 'Place your Kamala bet',
    description: 'Will Kamala Harris win the popular vote in 2024?',
    resolvesOn: new Date('2024-11-06T00:00Z'),
  },
  [LANDO_F1_SGP_WIN_BET_MARKET_INDEX]: {
    title: 'Place your F1 bet',
    description: 'Will Lando Norris win the 2024 Singapore GP?',
    resolvesOn: new Date('2024-09-22T12:00Z'),
  },
};
