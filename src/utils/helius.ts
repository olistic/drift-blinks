import { HELIUS_RPC, PRIORITY_FEE_SUBSCRIPTION_ADDRESSES } from '../config';

export const getHeliusPriorityFees = async (): Promise<number> => {
  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getPriorityFeeEstimate',
        params: [
          {
            accountKeys: PRIORITY_FEE_SUBSCRIPTION_ADDRESSES,
            options: {
              includeAllPriorityFeeLevels: true,
            },
          },
        ],
      }),
    });

    const data = await response.json();

    return data.result.priorityFeeLevels.high;
  } catch (err) {
    console.log(err);
    return 0;
  }
};
