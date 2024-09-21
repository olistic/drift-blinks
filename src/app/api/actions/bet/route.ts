import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from '@solana/actions';
import { PublicKey, Transaction } from '@solana/web3.js';

import { parseAmount, BN } from '../../../../utils/amounts';
import {
  createDriftClient,
  getLandoMarketOrderParams,
  initializeDriftSDK,
} from '../../../../utils/drift';
import { getHeliusPriorityFees } from '../../../../utils/helius';
import { clamp } from '../../../../utils/math';
import { getTokenAddress } from '../../../../utils/tokens';

// Initialize the Drift SDK.
const sdkConfig = initializeDriftSDK();

// Create the standard headers for this route (including CORS).
const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const baseHref = new URL('/api/actions/bet', requestUrl.origin).toString();

    const payload: ActionGetResponse = {
      title: 'Place your F1 bet',
      icon: new URL('/icon-bet.png', requestUrl.origin).toString(),
      description: 'Will Lando Norris win the 2024 Singapore GP?',
      label: '', // Ignored since `links.actions` exists.
      links: {
        actions: [
          {
            label: 'Bet YES',
            href: `${baseHref}?outcome=yes&amount={amount}`,
            parameters: [
              {
                name: 'amount',
                label: 'Enter a USDC amount',
                required: true,
              },
            ],
          },
          {
            label: 'Bet NO',
            href: `${baseHref}?outcome=no&amount={amount}`,
            parameters: [
              {
                name: 'amount',
                label: 'Enter a USDC amount',
                required: true,
              },
            ],
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
    const requestUrl = new URL(req.url);

    const body: ActionPostRequest = await req.json();

    // Validate the client provided input.

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch {
      return createErrorResponse('Invalid "account" provided');
    }

    const outcomeParam = requestUrl.searchParams.get('outcome');
    if (outcomeParam !== 'yes' && outcomeParam !== 'no') {
      return createErrorResponse('Invalid "outcome" provided');
    }
    const outcome: 'yes' | 'no' = outcomeParam;

    let amount: BN;
    try {
      const amountParam = requestUrl.searchParams.get('amount')!;
      amount = parseAmount(amountParam);
    } catch {
      return createErrorResponse('Invalid "amount" provided');
    }

    // Get the priority fee.
    const priorityFeePromise = getHeliusPriorityFees();

    // Set up the Drift client.
    const driftClient = await createDriftClient(account);

    await driftClient.subscribe();

    // Get the USDC token account.
    const tokenAccount = await getTokenAddress(
      sdkConfig.USDC_MINT_ADDRESS,
      account.toString(),
    );

    // Check if user account exists for the current wallet.
    const userAccounts = await driftClient.getUserAccountsForAuthority(account);
    const userAccountExists = userAccounts.length > 0;

    // Build the transaction.

    // Get transaction parameters.
    const priorityFee = await priorityFeePromise;
    const computeUnitsPrice = clamp(Math.round(priorityFee), 50_000, 1_000_000);

    let transaction: Transaction;

    if (userAccountExists) {
      const firstUserAccount = userAccounts[0];

      await driftClient.switchActiveUser(firstUserAccount.subAccountId);

      transaction = (await driftClient.createDepositTxn(
        amount,
        0, // marketIndex
        tokenAccount,
        0, // subAccountId
        false, // reduceOnly
        {
          computeUnits: 100_000,
          computeUnitsPrice: computeUnitsPrice,
        },
      )) as Transaction;
    } else {
      // Create accounts and deposit collateral atomically.
      [transaction] =
        (await driftClient.createInitializeUserAccountAndDepositCollateral(
          amount,
          tokenAccount,
          0, // marketIndex
          0, // subAccountId
          undefined, // name
          undefined, // fromSubAccountId
          undefined, // referrerInfo
          undefined, // donateAmount
          {
            computeUnits: 200_000,
            computeUnitsPrice: computeUnitsPrice,
          },
        )) as [Transaction, PublicKey];
    }

    // Add place perp order IXs.
    const perpOrderIx = await driftClient.getPlacePerpOrderIx(
      getLandoMarketOrderParams(amount, outcome),
    );
    transaction.add(perpOrderIx);

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
    let message = 'Oops! Something went wrong, please try again';
    if (typeof err == 'string') message = err;
    return createErrorResponse(message);
  }
};

function createErrorResponse(message: string) {
  return new Response(message, {
    status: 400,
    headers,
  });
}
