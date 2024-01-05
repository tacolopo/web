import type { Impl } from '.';
import { servicesCtx, buildActionCtx } from '../../ctx';

import { buildParallel, witness } from '@penumbra-zone/wasm-ts';

import { ConnectError, Code } from '@connectrpc/connect';

export const witnessAndBuild: Impl['witnessAndBuild'] = async (req, ctx) => {
  const services = ctx.values.get(servicesCtx);
  const buildAction = ctx.values.get(buildActionCtx);
  if (!req.authorizationData)
    throw new ConnectError('No authorization data in request', Code.InvalidArgument);
  if (!req.transactionPlan) throw new ConnectError('No tx plan in request', Code.InvalidArgument);

  const {
    indexedDb,
    viewServer: { fullViewingKey },
  } = await services.getWalletServices();
  const sct = await indexedDb.getStateCommitmentTree();

  const witnessData = witness(req.transactionPlan, sct);

  const batchActions = await buildAction(req, witnessData, fullViewingKey);

  const transaction = buildParallel(
    batchActions,
    req.transactionPlan,
    witnessData,
    req.authorizationData,
  );

  return { transaction };
};