import { createActionHeaders, type ActionPostRequest } from '@solana/actions';
import { PublicKey } from '@solana/web3.js';

// Create the standard headers for action routes (including CORS).
const headers = createActionHeaders();

export async function validatePayload(req: Request) {
  const body: ActionPostRequest = await req.json();

  let account: PublicKey;
  try {
    account = new PublicKey(body.account);
  } catch {
    throw 'Invalid "account" provided.';
  }

  return { account };
}

export function createSuccessResponse(payload: unknown) {
  return Response.json(payload, {
    headers,
  });
}

export function createErrorResponse(message: string) {
  return new Response(message, {
    status: 400,
    headers,
  });
}
