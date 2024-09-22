/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  BASE_PRECISION,
  DRIFT_PROGRAM_ID,
  BulkAccountLoader,
  DriftClient,
  MarketType,
  PositionDirection,
  PublicKey,
  getMarketOrderParams,
  getMarketsAndOraclesForSubscription,
  getOrderParams,
  getUserAccountPublicKey,
  type IWallet,
} from '@drift-labs/sdk';
import { Connection, Keypair, Transaction } from '@solana/web3.js';

import { DRIFT_ENV, SOLANA_RPC } from '@/config';
import {
  LANDO_F1_SGP_WIN_BET_MARKET_INDEX,
  SUB_ACCOUNT_ID,
  USDC_MARKET_INDEX,
  USDC_MINT_ADDRESS,
} from '@/constants';
import { BN } from '@/utils/amount';
import { getTokenAddress } from '@/utils/tokens';
import { type BetOutcome } from '@/types';

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
    signTransaction: () => Promise.resolve(),
    // @ts-ignore
    signAllTransactions: () => Promise.resolve(),
  };

  return newWallet;
}

export function createDriftClient(account: PublicKey) {
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

export async function createDepositCollateralTransaction(
  driftClient: DriftClient,
  account: PublicKey,
  amount: BN,
  {
    initializeUserAccount,
    computeUnitsPrice,
  }: { initializeUserAccount: boolean; computeUnitsPrice: number },
) {
  // Get the USDC token account.
  // NOTE: Only USDC deposits are supported for now.
  const tokenAccount = await getTokenAddress(USDC_MINT_ADDRESS, account);

  if (initializeUserAccount) {
    const [transaction] =
      await driftClient.createInitializeUserAccountAndDepositCollateral(
        amount,
        tokenAccount,
        USDC_MARKET_INDEX,
        SUB_ACCOUNT_ID,
        undefined,
        undefined,
        undefined,
        undefined,
        { computeUnits: 200_000, computeUnitsPrice },
      );
    return transaction as Transaction;
  }

  const transaction = await driftClient.createDepositTxn(
    amount,
    USDC_MARKET_INDEX,
    tokenAccount,
    SUB_ACCOUNT_ID,
    false,
    { computeUnits: 100_000, computeUnitsPrice },
  );
  return transaction as Transaction;
}

export async function createPlacePerpMarketOrderInstruction(
  driftClient: DriftClient,
  amount: BN,
  outcome: BetOutcome,
) {
  const orderParams = getOrderParams(
    getLandoMarketOrderParams(driftClient, amount, outcome),
    { marketType: MarketType.PERP },
  );

  const user = await getUserAccountPublicKey(
    driftClient.program.programId,
    driftClient.authority,
    SUB_ACCOUNT_ID,
  );

  const remainingAccounts = driftClient.getRemainingAccounts({
    userAccounts: [],
    useMarketLastSlotCache: false,
    readablePerpMarketIndex: orderParams.marketIndex,
    readableSpotMarketIndexes: [USDC_MARKET_INDEX],
  });

  return await driftClient.program.instruction.placePerpOrder(orderParams, {
    accounts: {
      state: await driftClient.getStatePublicKey(),
      user,
      userStats: driftClient.getUserStatsAccountPublicKey(),
      authority: driftClient.wallet.publicKey,
    },
    remainingAccounts,
  });
}

export function getLandoMarketOrderParams(
  driftClient: DriftClient,
  amount: BN,
  outcome: BetOutcome,
) {
  const direction =
    outcome === 'yes' ? PositionDirection.LONG : PositionDirection.SHORT;

  // FIXME: baseAssetAmount calculation.

  // const [bid, ask] = calculateBidAskPrice(
  //   driftClient.getPerpMarketAccount(LANDO_F1_SGP_WIN_BET_MARKET_INDEX)!.amm,
  //   driftClient.getOracleDataForPerpMarket(LANDO_F1_SGP_WIN_BET_MARKET_INDEX),
  // );
  // // If user is going long then they are hitting asks, and vice-versa.
  // const priceToUse = direction === PositionDirection.LONG ? ask : bid;

  // const amountWithBuffer = amount.sub(new BN(1).mul(USDC_PRECISION));

  // const baseAssetAmount = roundDown(
  //   amountWithBuffer
  //     .mul(BASE_PRECISION) // For base precision output.
  //     .mul(PRICE_PRECISION) // Account for the following division by price.
  //     .div(priceToUse) // Divide by price.
  //     .div(USDC_PRECISION), // Account for the deposit amount precision.
  //   BASE_PRECISION,
  // );

  return getMarketOrderParams({
    baseAssetAmount: new BN(1).mul(BASE_PRECISION),
    direction,
    marketIndex: LANDO_F1_SGP_WIN_BET_MARKET_INDEX,
  });
}
