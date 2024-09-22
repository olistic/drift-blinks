import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

const ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

export function getTokenAddress(
  mintAddress: string,
  userPublicKey: PublicKey,
): Promise<PublicKey> {
  return Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(mintAddress),
    userPublicKey,
  );
}
