import {
  AssetId,
  Metadata,
  Value,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb.js';
import {
  SwapExecution,
  SwapExecution_Trace,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { getAssetId } from '@penumbra-zone/getters/metadata';
import { getAmountFromValue, getAssetIdFromValue } from '@penumbra-zone/getters/value';
import {
  getAssetIdFromValueView,
  getDisplayDenomExponentFromValueView,
} from '@penumbra-zone/getters/value-view';
import { divideAmounts } from '@penumbra-zone/types/amount';
import { toBaseUnit } from '@penumbra-zone/types/lo-hi';
import BigNumber from 'bignumber.js';
import { SwapSlice } from '..';
import { simulationClient, viewClient } from '../../../clients';
import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';

/**
 * Price impact is the change in price as a consequence of the trade's size. In
 * SwapExecution, the first trace in the array is the best execution for the
 * swap. To calculate price impact, take the price of the trade and see the %
 * diff off the best execution trace.
 */
export const calculatePriceImpact = (swapExec?: SwapExecution): number | undefined => {
  if (!swapExec?.traces.length || !swapExec.output || !swapExec.input) {
    return undefined;
  }

  // Get the price of the estimate for the swap total
  const inputAmount = getAmountFromValue(swapExec.input);
  const outputAmount = getAmountFromValue(swapExec.output);
  const swapEstimatePrice = divideAmounts(outputAmount, inputAmount);

  // Get the price in the best execution trace
  const inputAssetId = getAssetIdFromValue(swapExec.input);
  const outputAssetId = getAssetIdFromValue(swapExec.output);
  const bestTrace = swapExec.traces[0]!;
  const bestInputAmount = getMatchingAmount(bestTrace.value, inputAssetId);
  const bestOutputAmount = getMatchingAmount(bestTrace.value, outputAssetId);
  const bestTraceEstimatedPrice = divideAmounts(bestOutputAmount, bestInputAmount);

  // Difference = (priceB - priceA) / priceA
  const percentDifference = swapEstimatePrice
    .minus(bestTraceEstimatedPrice)
    .div(bestTraceEstimatedPrice);

  return percentDifference.toNumber();
};

export const getTracesMetadata = async (
  traces: SwapExecution_Trace[] = [],
): Promise<Map<string, Metadata>> => {
  const metadataByAssetId = new Map<string, Metadata>();

  const assetIds = new Map(
    traces.flatMap(trace =>
      trace.value
        .map(({ assetId }) => assetId && ([bech32mAssetId(assetId), assetId] as const))
        .filter(i => i != null),
    ),
  );

  await Promise.all(
    Array.from(assetIds.entries()).map(async ([bech32mAssetId, assetId]) => {
      const { denomMetadata } = await viewClient.assetMetadataById({ assetId });
      if (denomMetadata) {
        metadataByAssetId.set(bech32mAssetId, denomMetadata);
      }
    }),
  );

  return metadataByAssetId;
};

export const sendSimulateTradeRequest = async ({
  assetIn,
  assetOut,
  amount,
}: SwapSlice): Promise<{
  inputValue: Value;
  execution?: SwapExecution;
  unfilledValue?: Value;
}> => {
  if (!assetIn || !assetOut) {
    throw new Error('Both asset in and out need to be set');
  }

  const inputValue = new Value({
    assetId: getAssetIdFromValueView(assetIn.balanceView),
    amount: toBaseUnit(
      BigNumber(amount || 0),
      getDisplayDenomExponentFromValueView(assetIn.balanceView),
    ),
  });

  const { output: execution, unfilled: unfilledValue } = await simulationClient.simulateTrade({
    input: inputValue,
    output: getAssetId(assetOut),
  });

  return {
    inputValue,
    execution,
    unfilledValue,
  };
};

const getMatchingAmount = (values: Value[], toMatch: AssetId): Amount => {
  const match = values.find(v => toMatch.equals(v.assetId));
  if (!match?.amount) {
    throw new Error('No match in values array found');
  }

  return match.amount;
};
