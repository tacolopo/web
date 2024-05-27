import type { Impl } from '.';
import { servicesCtx } from '../ctx/prax';
import { backOff } from 'exponential-backoff';

export const statusStream: Impl['statusStream'] = async function* (_, ctx) {
  const services = await ctx.values.get(servicesCtx)();
  const { indexedDb } = await services.getWalletServices();

  let latestRemoteBlockHeight: bigint | undefined = undefined;
  void backOff(
    async () => {
      latestRemoteBlockHeight ??= await services.querier.tendermint.latestBlockHeight();
    },
    {
      retry: e => {
        if (process.env['NODE_ENV'] === 'development') console.debug(e);
        return true;
      },
    },
  );

  // As syncing does not end, nor does this stream.
  // It waits for events triggered externally when block sync has progressed.
  const subscription = indexedDb.subscribe('FULL_SYNC_HEIGHT');

  for await (const update of subscription) {
    const syncHeight = update.value;
    yield {
      latestKnownBlockHeight:
        syncHeight <= (latestRemoteBlockHeight ?? 0n) ? latestRemoteBlockHeight : syncHeight,
      partialSyncHeight: syncHeight,
      fullSyncHeight: syncHeight,
    };
  }
};
