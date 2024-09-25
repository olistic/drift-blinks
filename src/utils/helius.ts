import { HELIUS_RPC } from '@/config';

export const getHeliusPriorityFees = async (
  addresses: string[],
): Promise<number> => {
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
            accountKeys: addresses,
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
