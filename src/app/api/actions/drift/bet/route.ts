import { USDC_MINT_ADDRESS } from '@/constants';
import {
  createAugmentedPostResponse,
  createErrorResponse,
  createSuccessResponse,
  validatePayload,
  type ActionAugmentedGetResponse,
  type ActionAugmentedPostResponse,
} from '@/utils/actions';
import { getHeliusPriorityFees } from '@/utils/helius';
import { clamp } from '@/utils/math';
import {
  PRIORITY_FEE_SUBSCRIPTION_ADDRESSES,
  SOL_PERP_MARKET_INDEX,
  SUB_ACCOUNT_ID,
} from './constants';
import {
  BN,
  createDepositCollateralTransaction,
  createDriftClient,
  createPlacePerpMarketOrderInstruction,
  getMetadata,
  parseAmount,
  parseOutcome,
  type BetOutcome,
} from './utils';

const DEFAULT_MARKET_INDEX = SOL_PERP_MARKET_INDEX;
const DEFAULT_USDC_AMOUNT: BN = parseAmount('5');
const DEFAULT_OUTCOME: BetOutcome = 'yes';

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const { marketIndex } = await validateQueryParams(req);

    const baseHref = new URL(
      `/api/actions/drift/bet?marketIndex=${marketIndex}`,
      requestUrl.origin,
    ).toString();

    const iconHref = new URL(
      `/icon-drift-bet-${marketIndex}.jpeg`,
      requestUrl.origin,
    ).toString();

    const { title, description, resolvesOn } = getMetadata(marketIndex);

    const didResolve = new Date() > resolvesOn;

    const payload: ActionAugmentedGetResponse = {
      title,
      description,
      icon: iconHref,
      ...(didResolve
        ? {
            disabled: true,
            label: 'Bets Closed',
          }
        : {
            label: '', // Ignored since `links.actions` exists.
            links: {
              actions: [
                {
                  label: 'Bet YES',
                  href: `${baseHref}&outcome=yes`,
                },
                {
                  label: 'Bet NO',
                  href: `${baseHref}&outcome=no`,
                },
              ],
            },
            tokens: [USDC_MINT_ADDRESS],
          }),
    };

    return createSuccessResponse(payload);
  } catch (err) {
    console.log(err);
    let message = 'An unknown error occurred';
    if (typeof err == 'string') message = err;
    return createErrorResponse(message);
  }
};

export const OPTIONS = async () => {
  return createSuccessResponse(null);
};

export const POST = async (req: Request) => {
  try {
    // Validate the client provided input.
    const { account } = await validatePayload(req);
    const { marketIndex, amount, outcome } = await validateQueryParams(req);

    // Get the priority fee.
    const priorityFeePromise = getHeliusPriorityFees(
      PRIORITY_FEE_SUBSCRIPTION_ADDRESSES,
    );

    // Set up the Drift client.
    const driftClient = await createDriftClient(account);
    await driftClient.subscribe();

    // Check if user account exists.
    const userAccounts = await driftClient.getUserAccountsForAuthority(account);
    const userAccountExists = userAccounts.length > 0;

    if (userAccountExists) {
      await driftClient.switchActiveUser(SUB_ACCOUNT_ID);
    }

    // Get transaction parameters.
    const priorityFee = await priorityFeePromise;
    const computeUnitsPrice = clamp(Math.round(priorityFee), 50_000, 1_000_000);

    // Build the transaction.
    const transaction = await createDepositCollateralTransaction(
      driftClient,
      account,
      amount,
      {
        initializeUserAccount: !userAccountExists,
        computeUnitsPrice,
      },
    );
    const placeOrderInstruction = await createPlacePerpMarketOrderInstruction(
      driftClient,
      marketIndex,
      amount,
      outcome,
    );
    transaction.add(placeOrderInstruction);

    // Set the fee payer.
    transaction.feePayer = account;

    const { symbol } = getMetadata(marketIndex);
    const payload: ActionAugmentedPostResponse =
      await createAugmentedPostResponse({
        fields: {
          transaction,
          success: {
            message: 'Good luck.',
            cta: {
              label: 'View position on Drift',
              href: `https://app.drift.trade/bet/${symbol}?authority=${account.toBase58()}`,
            },
          },
        },
      });

    return createSuccessResponse(payload);
  } catch (err) {
    console.log(err);
    let message = 'Oops! Something went wrong, please try again.';
    if (typeof err == 'string') message = err;
    return createErrorResponse(message);
  }
};

async function validateQueryParams(req: Request) {
  const requestUrl = new URL(req.url);

  let marketIndex: number = DEFAULT_MARKET_INDEX;
  const marketIndexParam = requestUrl.searchParams.get('marketIndex');
  if (marketIndexParam) {
    try {
      marketIndex = parseInt(marketIndexParam);
    } catch {
      throw 'Invalid "marketIndex" provided.';
    }
  }

  let amount: BN = DEFAULT_USDC_AMOUNT;
  const amountParam = requestUrl.searchParams.get('amount')!;
  if (amountParam) {
    try {
      amount = parseAmount(amountParam);
      if (amount.isZero() || amount.isNeg()) throw new Error();
    } catch {
      throw 'Invalid "amount" provided.';
    }
  }

  let outcome: BetOutcome = DEFAULT_OUTCOME;
  const outcomeParam = requestUrl.searchParams.get('outcome');
  if (outcomeParam) {
    try {
      outcome = parseOutcome(outcomeParam);
    } catch {
      throw 'Invalid "outcome" provided.';
    }
  }

  return { marketIndex, amount, outcome };
}
