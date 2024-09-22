import {
  createActionHeaders,
  createPostResponse,
  type ActionGetResponse,
  type ActionPostRequest,
  type ActionPostResponse,
} from '@solana/actions';
import { PublicKey } from '@solana/web3.js';

import { SUB_ACCOUNT_ID } from '@/constants';
import type { BetOutcome } from '@/types';
import { parseAmount, BN } from '@/utils/amount';
import {
  createDepositCollateralTransaction,
  createDriftClient,
  createPlacePerpMarketOrderInstruction,
} from '@/utils/drift';
import { getHeliusPriorityFees } from '@/utils/helius';
import { clamp } from '@/utils/math';

// Create the standard headers for this route (including CORS).
const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const iconHref = new URL('/icon-bet.jpg', requestUrl.origin).toString();
    const baseHref = new URL('/api/actions/bet', requestUrl.origin).toString();

    const payload: ActionGetResponse = {
      title: 'Place your F1 bet',
      icon: iconHref,
      description: 'Will Lando Norris win the 2024 Singapore GP?',
      label: '', // Ignored since `links.actions` exists.
      links: {
        actions: [
          {
            label: 'Bet YES',
            href: `${baseHref}?outcome=yes&amount=5`,
          },
          {
            label: 'Bet NO',
            href: `${baseHref}?outcome=no&amount=5`,
          },
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = 'An unknown error occurred';
    if (typeof err == 'string') message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

export const OPTIONS = async () => {
  return new Response(null, { headers });
};

export const POST = async (req: Request) => {
  try {
    // Validate the client provided input.
    const { account, outcome, amount } = await validateInput(req);

    // Get the priority fee.
    const priorityFeePromise = getHeliusPriorityFees();

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
      amount,
      outcome,
    );
    transaction.add(placeOrderInstruction);

    // Set the fee payer.
    transaction.feePayer = account;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
      },
    });

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = 'Oops! Something went wrong, please try again.';
    if (typeof err == 'string') message = err;
    return createErrorResponse(message);
  }
};

async function validateInput(req: Request) {
  const body: ActionPostRequest = await req.json();

  const requestUrl = new URL(req.url);

  let account: PublicKey;
  try {
    account = new PublicKey(body.account);
  } catch {
    throw 'Invalid "account" provided.';
  }

  const outcomeParam = requestUrl.searchParams.get('outcome');
  if (outcomeParam !== 'yes' && outcomeParam !== 'no') {
    throw 'Invalid "outcome" provided.';
  }
  const outcome: BetOutcome = outcomeParam;

  let amount: BN;
  try {
    const amountParam = requestUrl.searchParams.get('amount')!;
    amount = parseAmount(amountParam);
  } catch {
    throw 'Invalid "amount" provided.';
  }

  return { account, outcome, amount };
}

function createErrorResponse(message: string) {
  return new Response(message, {
    status: 400,
    headers,
  });
}
