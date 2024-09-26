import { BN, DRIFT_PROGRAM_ID, type DriftEnv } from '@drift-labs/sdk';

export const DRIFT_ENV: DriftEnv = 'mainnet-beta';

export const PRIORITY_FEE_SUBSCRIPTION_ADDRESSES = [
  DRIFT_PROGRAM_ID.toString(),
  '6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3', // USDC spot market.
  '8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W', // SOL-PERP perp market.
  'HWQwekaW2G62QNi1eeLiNtkdxGNjaeVHktpMzpZ49RSQ', // TRUMP-WIN-2024-BET perp market.
  'w6rsG6P6y56Tp5MuN2wuHK5jwmoRk9R2b3LyDoRbQBn', // KAMALA-POPULAR-VOTE-2024-BET perp market.
  'DjTmuKjkSYzzrLMcyrNUdV6dv4tozcMRdw2tH6ERHKJr', // LANDO-F1-SGP-WIN-BET perp market.
];

export const SUB_ACCOUNT_ID = 0;

// Deposit.
export const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_PRECISION = new BN(10).pow(new BN(6));

// Spot markets.
export const USDC_MARKET_INDEX = 0;
export const SPOT_MARKET_INDEXES = [USDC_MARKET_INDEX];

// Perp markets.
export const SOL_PERP_MARKET_INDEX = 0;
export const TRUMP_WIN_2024_BET_MARKET_INDEX = 36;
export const KAMALA_POPULAR_VOTE_2024_BET_MARKET_INDEX = 37;
export const LANDO_F1_SGP_WIN_BET_MARKET_INDEX = 43;
export const PERP_MARKET_INDEXES = [
  SOL_PERP_MARKET_INDEX,
  TRUMP_WIN_2024_BET_MARKET_INDEX,
  KAMALA_POPULAR_VOTE_2024_BET_MARKET_INDEX,
  LANDO_F1_SGP_WIN_BET_MARKET_INDEX,
];

// Actions metadata.
export const METADATA_BY_MARKET_INDEX = {
  [TRUMP_WIN_2024_BET_MARKET_INDEX]: {
    title: 'Place your 2024 presidential election bet',
    description: 'Will Donald Trump win the 2024 Presidential Election?',
    resolvesOn: new Date('2024-11-06T00:00Z'),
  },
  [KAMALA_POPULAR_VOTE_2024_BET_MARKET_INDEX]: {
    title: 'Place your 2024 popular vote bet',
    description: 'Will Kamala Harris win the popular vote in 2024?',
    resolvesOn: new Date('2024-11-06T00:00Z'),
  },
  [LANDO_F1_SGP_WIN_BET_MARKET_INDEX]: {
    title: 'Place your F1 bet',
    description: 'Will Lando Norris win the 2024 Singapore GP?',
    resolvesOn: new Date('2024-09-22T12:00Z'),
  },
};
