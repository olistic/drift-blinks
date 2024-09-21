import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export function getTokenAddress(
  mintAddress: string,
  userPublicKey: string,
): Promise<PublicKey> {
  return Token.getAssociatedTokenAddress(
    new PublicKey(`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`),
    TOKEN_PROGRAM_ID,
    new PublicKey(mintAddress),
    new PublicKey(userPublicKey),
  );
}
