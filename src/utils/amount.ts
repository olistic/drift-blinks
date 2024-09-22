import { BN } from '@drift-labs/sdk';

import { USDC_PRECISION } from '../constants';

export function parseAmount(amountString: string): BN {
  if (isNaN(+amountString)) {
    throw new Error('Invalid amount');
  }

  return new BN(+amountString).mul(USDC_PRECISION);
}

export function roundDown(amount: BN, precision: BN): BN {
  return amount.div(precision).mul(precision);
}

export { BN };
