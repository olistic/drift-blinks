/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  BASE_PRECISION,
  BN,
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

import { SOLANA_RPC } from '@/config';
import { USDC_MINT_ADDRESS } from '@/constants';
import { getTokenAddress } from '@/utils/tokens';
import {
  DRIFT_ENV,
  METADATA_BY_MARKET_INDEX,
  PERP_MARKET_INDEXES,
  SPOT_MARKET_INDEXES,
  SUB_ACCOUNT_ID,
  USDC_MARKET_INDEX,
} from './constants';

export type BetOutcome = 'yes' | 'no';

export function getMetadata(marketIndex: number) {
  return METADATA_BY_MARKET_INDEX[
    marketIndex as keyof typeof METADATA_BY_MARKET_INDEX
  ];
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
  marketIndex: number,
  amount: BN,
  outcome: BetOutcome,
) {
  const orderParams = getOrderParams(
    getPerpMarketOrderParams(driftClient, marketIndex, amount, outcome),
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
    readablePerpMarketIndex: PERP_MARKET_INDEXES,
    readableSpotMarketIndexes: SPOT_MARKET_INDEXES,
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

function createThrowawayWallet(publicKey?: PublicKey): IWallet {
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

const USDC_PRECISION = new BN(10).pow(new BN(6));

function getPerpMarketOrderParams(
  driftClient: DriftClient,
  marketIndex: number,
  amount: BN,
  outcome: BetOutcome,
) {
  const direction =
    outcome === 'yes' ? PositionDirection.LONG : PositionDirection.SHORT;

  // FIXME: baseAssetAmount calculation.

  // const [bid, ask] = calculateBidAskPrice(
  //   driftClient.getPerpMarketAccount(marketIndex)!.amm,
  //   driftClient.getOracleDataForPerpMarket(marketIndex),
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
    marketIndex,
  });
}

export function parseAmount(amountString: string): BN {
  if (isNaN(+amountString)) {
    throw new Error('Invalid amount');
  }

  return new BN(+amountString).mul(USDC_PRECISION);
}

export function parseOutcome(outcome: string): BetOutcome {
  if (outcome !== 'yes' && outcome !== 'no') {
    throw new Error('Invalid outcome');
  }

  return outcome;
}

export function roundDown(amount: BN, precision: BN): BN {
  return amount.div(precision).mul(precision);
}

export { BN };
