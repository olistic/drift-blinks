import {
  createActionHeaders,
  createPostResponse,
  type ActionGetResponse,
  type ActionPostRequest,
  type ActionPostResponse,
  type CreateActionPostResponseArgs,
} from '@solana/actions';
import { PublicKey } from '@solana/web3.js';

export type ActionAugmentedGetResponse = ActionGetResponse & {
  /** List of tokens required by the action. */
  tokens?: string[];
};

export type ActionAugmentedPostResponse = ActionPostResponse & {
  cta?: CallToAction;
};

export interface CreateActionAugmentedPostResponseArgs
  extends CreateActionPostResponseArgs {
  fields: CreateActionPostResponseArgs['fields'] & {
    success?: {
      /** Message rendered to the user on success. */
      message?: string;
      /** Call to action button rendered to the user on success. */
      cta?: CallToAction;
    };
  };
}

export interface CallToAction {
  label: string;
  href: string;
}

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

export async function createAugmentedPostResponse(
  args: CreateActionAugmentedPostResponseArgs,
): Promise<ActionAugmentedPostResponse> {
  const payload: ActionPostResponse = await createPostResponse(args);
  return Object.assign(payload, {
    success: args.fields.success,
  });
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
