import type { Impl } from '.';
import { custodyCtx, servicesCtx } from '../../ctx';
import { offscreenClient } from '../offscreen-client';
import { buildParallel, getWitness } from '@penumbra-zone/wasm-ts';
import { ConnectError, Code, HandlerContext } from '@connectrpc/connect';
import {
  AuthorizationData,
  TransactionPlan,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/transaction/v1alpha1/transaction_pb';
import { viewTransactionPlan } from '../custody/view-transaction-plan';
import { TransactionClassification, classifyTransaction } from '@penumbra-zone/types';
import { getMetadataByAssetId } from '../custody/helpers';

const NON_AUTHORIZED_TRANSACTION_CLASSIFICATIONS: TransactionClassification[] = ['swapClaim'];

const requiresAuthorization = async (
  transactionPlan: TransactionPlan,
  ctx: HandlerContext,
): Promise<boolean> => {
  const services = ctx.values.get(servicesCtx);
  const {
    viewServer: { fullViewingKey },
  } = await services.getWalletServices();

  const transactionView = viewTransactionPlan(
    transactionPlan,
    await getMetadataByAssetId(ctx),
    fullViewingKey,
  );
  const classification = classifyTransaction(transactionView);

  return !NON_AUTHORIZED_TRANSACTION_CLASSIFICATIONS.includes(classification);
};

export const authorizeAndBuild: Impl['authorizeAndBuild'] = async function* (req, ctx) {
  if (!req.transactionPlan) throw new ConnectError('No tx plan in request', Code.InvalidArgument);

  console.log('authorizeAndBuild about to requiresAuthorization');
  const authorizationPromise = (await requiresAuthorization(req.transactionPlan, ctx))
    ? console.log('authorizeAndBuild about to authorize()') || authorize(ctx, req.transactionPlan)
    : Promise.resolve(new AuthorizationData());
  console.log('authorizeAndBuild finished authorize');

  const batchActionsPromise = buildBatchActions(ctx, req.transactionPlan);

  // Get authorization while building in the background
  const [authorizationData, batchActions] = await Promise.all([
    authorizationPromise,
    batchActionsPromise,
  ]);

  try {
    console.log('authorizeAndBuild about to buildParallel');
    const transaction = buildParallel(
      batchActions.batchActions,
      req.transactionPlan,
      batchActions.witnessData,
      authorizationData,
    );
    console.log('authorizeAndBuild finished buildParallel');

    yield {
      status: {
        case: 'complete',
        value: { transaction },
      },
    };
  } catch (e) {
    // This is where it fails with `Error: missing effect_hash`
    console.log('authorizeAndBuild caught error', e);
    throw e;
  }
};

async function authorize(ctx: HandlerContext, transactionPlan: TransactionPlan) {
  const custodyClient = ctx.values.get(custodyCtx);
  if (!custodyClient)
    throw new ConnectError('Cannot access custody service', Code.FailedPrecondition);

  const response = await custodyClient.authorize({ plan: transactionPlan });
  if (response.data) {
    return response.data;
  } else {
    throw new ConnectError('No authorization data in response', Code.PermissionDenied);
  }
}

async function buildBatchActions(ctx: HandlerContext, transactionPlan: TransactionPlan) {
  const services = ctx.values.get(servicesCtx);
  const {
    indexedDb,
    viewServer: { fullViewingKey },
  } = await services.getWalletServices();
  const sct = await indexedDb.getStateCommitmentTree();
  const witnessData = getWitness(transactionPlan, sct);

  try {
    console.log('buildBatchActions about to offscreenClient.buildAction');
    const batchActions = await offscreenClient.buildAction(
      transactionPlan,
      witnessData,
      fullViewingKey,
    );
    console.log('buildBatchActions finished offscreenClient.buildAction');

    return {
      batchActions,
      witnessData,
    };
  } catch (e) {
    console.log('buildBatchActions caught', e);
    throw e;
  }
}
