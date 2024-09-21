import { BN } from '@drift-labs/sdk';

const USDC_PRECISION = new BN(10).pow(new BN(6));

export function parseAmount(amountString: string): BN {
  if (isNaN(+amountString)) {
    throw new Error('Invalid amount');
  }

  return new BN(+amountString).mul(USDC_PRECISION);
}

export { BN };
