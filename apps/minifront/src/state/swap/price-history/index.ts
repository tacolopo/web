import {
  CandlestickData,
  CandlestickDataResponse,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb.js';
import { PRICE_RELEVANCE_THRESHOLDS } from '@penumbra-zone/types/assets';
import { createZQuery, ZQueryState } from '@penumbra-zone/zquery';
import { AllSlices, SliceCreator, useStore } from '../..';
import {
  sendCandlestickDataRequest,
  sendComplementaryCandlestickDataRequests,
} from './candlesticks';
import { AbridgedZQueryState } from '@penumbra-zone/zquery/src/types';
import { getMetadataFromBalancesResponse } from '@penumbra-zone/getters/balances-response';

interface Actions {
  /**
   * History limit becomes the maximum width of the chart domain (block height).
   */
  setHistoryLimit: (limit: bigint) => void;
  /**
   * Setting history start will cause the chart domain to begin at the specified
   * block height and extend towards the present. Setting history start to
   * `undefined` or `0n` will cause the chart domain to end at the present block
   * height and extend towards the past.
   */
  setHistoryStart: (blockHeight?: bigint) => void;
}

export const { candles, useCandles, useRevalidateCandles } = createZQuery({
  name: 'candles',
  fetch: sendComplementaryCandlestickDataRequests,
  getUseStore: () => useStore,
  get: state => state.swap.priceHistory.candles,
  set: setter => {
    const newState = setter(useStore.getState().swap.priceHistory.candles);
    useStore.setState(state => {
      state.swap.priceHistory.candles = newState;
    });
  },
});

interface State {
  candles: ZQueryState<
    { direct: CandlestickDataResponse; inverse: CandlestickDataResponse },
    Parameters<typeof sendCandlestickDataRequest>
  >;
  historyLimit: bigint;
  historyStart?: bigint;
}

export type PriceHistorySlice = Actions & State;

const INITIAL_STATE: Omit<State, 'pair'> = {
  candles,
  historyLimit: PRICE_RELEVANCE_THRESHOLDS.default,
};

export const createPriceHistorySlice = (): SliceCreator<PriceHistorySlice> => set => ({
  ...INITIAL_STATE,
  setHistoryLimit: blocks => {
    set(state => {
      state.swap.priceHistory.historyLimit = blocks;
    });
  },
  setHistoryStart: blockHeight => {
    set(state => {
      state.swap.priceHistory.historyStart = blockHeight;
    });
  },
});

export const combinedCandlestickDataSelector = (
  zQueryState: AbridgedZQueryState<{
    direct: CandlestickDataResponse;
    inverse: CandlestickDataResponse;
  }>,
) => {
  if (!zQueryState.data) {
    return { ...zQueryState, data: undefined };
  } else {
    const direct = zQueryState.data.direct.data;
    const corrected = zQueryState.data.inverse.data.map(
      // flip inverse data to match orientation of direct data
      inverseCandle => {
        const correctedCandle = inverseCandle.clone();
        // comparative values are reciprocal
        correctedCandle.open = 1 / inverseCandle.open;
        correctedCandle.close = 1 / inverseCandle.close;
        // high and low swap places
        correctedCandle.high = 1 / inverseCandle.low;
        correctedCandle.low = 1 / inverseCandle.high;
        return correctedCandle;
      },
    );

    // combine data at each height into a single candle
    const combinedCandles = Array.from(
      // collect candles at each height
      Map.groupBy([...direct, ...corrected], ({ height }) => height),
    ).map(([height, candlesAtHeight]) => {
      // TODO: open/close don't diverge much, and when they do it seems to be due
      // to inadequate number precision. it might be better to just pick one, but
      // it's not clear which one is 'correct'
      const combinedCandleAtHeight = candlesAtHeight.reduce(
        (acc, cur) => {
          // sum volumes
          acc.directVolume += cur.directVolume;
          acc.swapVolume += cur.swapVolume;

          // highest high, lowest low
          acc.high = Math.max(acc.high, cur.high);
          acc.low = Math.min(acc.low, cur.low);

          // these accumulate to be averaged
          acc.open += cur.open;
          acc.close += cur.close;
          return acc;
        },
        new CandlestickData({ height, low: Infinity, high: -Infinity }),
      );

      // average accumulated open/close
      combinedCandleAtHeight.open /= candlesAtHeight.length;
      combinedCandleAtHeight.close /= candlesAtHeight.length;

      return combinedCandleAtHeight;
    });

    return {
      ...zQueryState,
      data: combinedCandles.sort((a, b) => Number(a.height - b.height)),
    };
  }
};

export const priceHistorySelector = (state: AllSlices) => ({
  startMetadata: getMetadataFromBalancesResponse.optional()(state.swap.assetIn),
  endMetadata: state.swap.assetOut,
  historyLimit: state.swap.priceHistory.historyLimit,
  historyStart: state.swap.priceHistory.historyStart,
});
