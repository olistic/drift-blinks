/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  BASE_PRECISION,
  DRIFT_PROGRAM_ID,
  BulkAccountLoader,
  DriftClient,
  PositionDirection,
  PublicKey,
  getMarketOrderParams,
  getMarketsAndOraclesForSubscription,
  initialize,
  type BN,
  type IWallet,
} from '@drift-labs/sdk';
import { Connection, Keypair } from '@solana/web3.js';

import { DRIFT_ENV, SOLANA_RPC } from '../config';

const LANDO_F1_SGP_WIN_BET_MARKET_INDEX = 43;

export function initializeDriftSDK() {
  return initialize({ env: DRIFT_ENV });
}

export function createThrowawayWallet(publicKey?: PublicKey): IWallet {
  const newKeypair = publicKey
    ? new Keypair({
        publicKey: publicKey.toBytes(),
        secretKey: new Keypair().publicKey.toBytes(),
      })
    : new Keypair();

  const newWallet: IWallet = {
    publicKey: newKeypair.publicKey,
    // @ts-ignore
    signTransaction: () => {
      return Promise.resolve();
    },
    // @ts-ignore
    signAllTransactions: () => {
      return Promise.resolve();
    },
  };

  return newWallet;
}

export async function createDriftClient(account: PublicKey) {
  const connection = new Connection(SOLANA_RPC, {
    commitment: 'confirmed',
  });

  const throwawayWallet = createThrowawayWallet(account);

  const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
    getMarketsAndOraclesForSubscription(DRIFT_ENV);

  const bulkAccountLoader = new BulkAccountLoader(connection, 'confirmed', 0);

  const driftClient = new DriftClient({
    connection: connection,
    wallet: throwawayWallet,
    programID: new PublicKey(DRIFT_PROGRAM_ID),
    env: DRIFT_ENV,
    txVersion: 'legacy',
    userStats: false,
    perpMarketIndexes: perpMarketIndexes,
    spotMarketIndexes: spotMarketIndexes,
    oracleInfos: oracleInfos,
    accountSubscription: {
      type: 'polling',
      accountLoader: bulkAccountLoader,
    },
  });

  return driftClient;
}

export function getLandoMarketOrderParams(amount: BN, outcome: 'yes' | 'no') {
  return getMarketOrderParams({
    baseAssetAmount: BASE_PRECISION,
    direction:
      outcome === 'yes' ? PositionDirection.LONG : PositionDirection.SHORT,
    marketIndex: LANDO_F1_SGP_WIN_BET_MARKET_INDEX,
  });
}
