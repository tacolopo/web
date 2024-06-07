import { AuthorizationData } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/transaction/v1/transaction_pb';
import { Code, ConnectError } from '@connectrpc/connect';
import { getWitness } from '@penumbra-zone/wasm/build';
import type { Impl } from '.';
import { fvkCtx } from '../ctx/full-viewing-key';
import { idbCtx } from '../ctx/prax';
import { optimisticBuild } from './util/build-tx';

export const witnessAndBuild: Impl['witnessAndBuild'] = async function* (
  { authorizationData, transactionPlan },
  ctx,
) {
  if (!transactionPlan) throw new ConnectError('No tx plan', Code.InvalidArgument);

  const idb = await ctx.values.get(idbCtx)();
  const fvk = ctx.values.get(fvkCtx);

  const sct = await idb.getStateCommitmentTree();

  const witnessData = getWitness(transactionPlan, sct);

  yield* optimisticBuild(
    transactionPlan,
    witnessData,
    Promise.resolve(authorizationData ?? new AuthorizationData()),
    await fvk(),
  );
};
