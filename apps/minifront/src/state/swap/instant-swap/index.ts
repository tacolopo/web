import {
  Metadata,
  ValueView,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb.js';
import { SwapExecution_Trace } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb.js';
import { AddressIndex } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/keys/v1/keys_pb.js';
import { StateCommitment } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/crypto/tct/v1/tct_pb.js';
import { TransactionPlannerRequest } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/view/v1/view_pb.js';
import { getAddressIndex } from '@penumbra-zone/getters/address-view';
import { getAssetId } from '@penumbra-zone/getters/metadata';
import { getSwapCommitmentFromTx } from '@penumbra-zone/getters/transaction';
import {
  getAssetIdFromValueView,
  getDisplayDenomExponentFromValueView,
  getMetadata,
} from '@penumbra-zone/getters/value-view';
import { toBaseUnit } from '@penumbra-zone/types/lo-hi';
import { errorToast } from '@repo/ui/lib/toast/presets';
import { BigNumber } from 'bignumber.js';
import { SwapSlice } from '..';
import { AllSlices, SliceCreator } from '../..';
import { getAddressByIndex } from '../../../fetchers/address';
import { isValidAmount, planBuildBroadcast } from '../../helpers';
import { calculatePriceImpact, getTracesMetadata, sendSimulateTradeRequest } from './simulation';

export interface SimulateSwapResult {
  output: ValueView;
  input: ValueView;
  unfilled: ValueView;
  priceImpact: number | undefined;
  traces?: SwapExecution_Trace[];
  metadataByAssetId: Map<string, Metadata>;
}

interface Actions {
  initiateSwapTx: () => Promise<void>;
  simulateSwap: () => Promise<void>;
  reset: VoidFunction;
}

interface State {
  txInProgress: boolean;
  simulateSwapResult?: SimulateSwapResult;
  simulateSwapLoading: boolean;
}

export type InstantSwapSlice = Actions & State;

const INITIAL_STATE: State = {
  txInProgress: false,
  simulateSwapLoading: false,
  simulateSwapResult: undefined,
};

export const createInstantSwapSlice = (): SliceCreator<InstantSwapSlice> => (set, get) => {
  return {
    ...INITIAL_STATE,
    simulateSwap: async () => {
      try {
        set(({ swap }) => {
          swap.instantSwap.simulateSwapLoading = true;
        });

        const { inputValue, execution, unfilledValue } = await sendSimulateTradeRequest(get().swap);

        const inputMetadata = getMetadata(get().swap.assetIn?.balanceView);

        const input = new ValueView({
          valueView: {
            case: 'knownAssetId',
            value: {
              amount: inputValue.amount,
              metadata: inputMetadata,
            },
          },
        });

        const output = new ValueView({
          valueView: {
            case: 'knownAssetId',
            value: {
              amount: execution?.output?.amount,
              metadata: get().swap.assetOut,
            },
          },
        });

        const unfilled = new ValueView({
          valueView: {
            case: 'knownAssetId',
            value: {
              amount: unfilledValue?.amount,
              metadata: inputMetadata,
            },
          },
        });

        const metadataByAssetId = await getTracesMetadata(execution?.traces);

        set(({ swap }) => {
          swap.instantSwap.simulateSwapResult = {
            input,
            output,
            unfilled,
            priceImpact: calculatePriceImpact(execution),
            traces: execution?.traces,
            metadataByAssetId,
          };
        });
      } catch (e) {
        errorToast(e, 'Error estimating swap').render();
      } finally {
        set(({ swap }) => {
          swap.instantSwap.simulateSwapLoading = false;
        });
      }
    },
    initiateSwapTx: async () => {
      set(state => {
        state.swap.instantSwap.txInProgress = true;
      });

      try {
        const swapReq = await assembleSwapRequest(get().swap);
        const swapTx = await planBuildBroadcast('swap', swapReq);
        const swapCommitment = getSwapCommitmentFromTx(swapTx);
        await issueSwapClaim(swapCommitment, swapReq.source);

        set(state => {
          state.swap.amount = '';
        });
      } finally {
        set(state => {
          state.swap.instantSwap.txInProgress = false;
        });
      }
    },
    reset: () => {
      set(state => {
        state.swap.instantSwap = {
          ...state.swap.instantSwap,
          ...INITIAL_STATE,
        };
      });
    },
  };
};

const assembleSwapRequest = async ({
  assetIn,
  amount,
  assetOut,
}: Pick<SwapSlice, 'assetIn' | 'assetOut' | 'amount'>) => {
  if (!assetIn) {
    throw new Error('`assetIn` is undefined');
  }
  if (!assetOut) {
    throw new Error('`assetOut` is undefined');
  }
  if (!isValidAmount(amount, assetIn)) {
    throw new Error('Invalid amount');
  }

  const addressIndex = getAddressIndex(assetIn.accountAddress);

  return new TransactionPlannerRequest({
    swaps: [
      {
        targetAsset: getAssetId(assetOut),
        value: {
          amount: toBaseUnit(
            BigNumber(amount),
            getDisplayDenomExponentFromValueView(assetIn.balanceView),
          ),
          assetId: getAssetIdFromValueView(assetIn.balanceView),
        },
        claimAddress: await getAddressByIndex(addressIndex.account),
      },
    ],
    source: getAddressIndex(assetIn.accountAddress),
  });
};

// Swap claims don't need authenticationData, so `witnessAndBuild` is used.
// This way it won't trigger a second, unnecessary approval popup.
// @see https://protocol.penumbra.zone/main/zswap/swap.html#claiming-swap-outputs
export const issueSwapClaim = async (
  swapCommitment: StateCommitment,
  source: AddressIndex | undefined,
) => {
  const req = new TransactionPlannerRequest({ swapClaims: [{ swapCommitment }], source });
  await planBuildBroadcast('swapClaim', req, { skipAuth: true });
};

export const instantSwapSubmitButtonDisabledSelector = (state: AllSlices) =>
  state.swap.duration === 'instant' && state.swap.instantSwap.txInProgress;
