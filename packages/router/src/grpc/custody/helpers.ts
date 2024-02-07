import { HandlerContext } from '@connectrpc/connect';
import { servicesCtx } from '../../ctx';
import { Jsonified, bech32AssetId } from '@penumbra-zone/types';

/**
 * @todo As more asset types get used, the amount of asset metadata we store
 * will grow. Loading all the asset metadata into memory for the purpose of
 * compiling a transaction view may not be sustainable in the long term.
 * Eventually, we may want to scan through the transaction plan, extract all the
 * asset IDs in it, and then query just those from IndexedDB instead of grabbing
 * all of them.
 */
export const getMetadataByAssetId = async (ctx: HandlerContext) => {
  const services = ctx.values.get(servicesCtx);
  const walletServices = await services.getWalletServices();
  const assetsMetadata = await walletServices.indexedDb.getAllAssetsMetadata();
  return assetsMetadata.reduce<Record<string, Jsonified<Metadata>>>((prev, curr) => {
    if (curr.penumbraAssetId) {
      prev[bech32AssetId(curr.penumbraAssetId)] = curr.toJson() as Jsonified<Metadata>;
    }
    return prev;
  }, {});
};
