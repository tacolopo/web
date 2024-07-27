import { Metadata } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb.js';
import { CandlestickDataResponse } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';
import { dexClient } from '../../../clients';

/**
 * Due to the way price data is recorded, symmetric comparisons do not return
 * symmetric data. to get the complete picture, a client must combine both
 * datasets.
 *  1. query the intended comparison direction (start token -> end token)
 *  2. query the inverse comparison direction (end token -> start token)
 *  3. flip the inverse data (reciprocal values, high becomes low)
 *  4. combine the data (use the highest high, lowest low, sum volumes)
 */
export const sendComplementaryCandlestickDataRequests = async (
  startMetadata?: Metadata,
  endMetadata?: Metadata,
  limit?: bigint,
  startHeight?: bigint,
) =>
  Promise.all([
    sendCandlestickDataRequest(startMetadata, endMetadata, limit, startHeight),
    sendCandlestickDataRequest(endMetadata, startMetadata, limit, startHeight),
  ]).then(([direct, inverse]) => ({ direct, inverse }));

export const sendCandlestickDataRequest = async (
  startMetadata?: Metadata,
  endMetadata?: Metadata,
  limit?: bigint,
  startHeight?: bigint,
): Promise<CandlestickDataResponse> => {
  const start = startMetadata?.penumbraAssetId;
  const end = endMetadata?.penumbraAssetId;

  if (!start || !end) {
    throw new Error('Asset pair incomplete');
  }
  if (start.equals(end)) {
    throw new Error('Asset pair equivalent');
  }

  return dexClient.candlestickData({ pair: { start, end }, limit, startHeight });
};
