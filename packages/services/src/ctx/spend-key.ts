import { Code, ConnectError, createContextKey } from '@connectrpc/connect';
import { SpendKey } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/keys/v1/keys_pb';

export const skCtx = createContextKey<() => Promise<SpendKey>>(() => {
  throw new ConnectError('Undefined context', Code.FailedPrecondition);
});
