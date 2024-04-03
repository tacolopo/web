import { AllSlices, SliceCreator } from '.';
import { bech32IsValid } from '@penumbra-zone/bech32/src/validate';

import type { Chain } from '@chain-registry/types';

export interface IbcSendSlice {
  asset: string | undefined;
  amount: string | undefined;
  sourceChain: Chain | undefined;
  sourceAddress: string | undefined;
  destinationAddress: string | undefined;
  destinationChain: Chain | undefined;
  txInProgress: boolean;
  setSourceChain: (chain: Chain) => void;
  setDestinationChain: (chain: Chain) => void;
}

export const createIbcSendSlice = (): SliceCreator<IbcSendSlice> => (set, get) => {
  return {
    asset: undefined,
    amount: undefined,
    sourceChain: undefined,
    sourceAddress: undefined,
    destinationAddress: undefined,
    destinationChain: undefined,
    txInProgress: false,
    setSourceChain: chain => {
      set(state => {
        state.ibc.sourceChain = chain;
      });
    },
    setDestinationChain: chain => {
      set(state => {
        state.ibc.destinationChain = chain;
      });
    },
  };
};

export const ibcSelector = (state: AllSlices) => state.ibc;

export const ibcValidationErrors = (state: AllSlices) => {
  return {
    destinationErr:
      state.ibc.destinationChain && state.ibc.destinationAddress
        ? !validateAddress(state.ibc.destinationChain, state.ibc.destinationAddress)
        : false,
    sourceErr:
      state.ibc.sourceChain && state.ibc.sourceAddress
        ? !validateAddress(state.ibc.sourceChain, state.ibc.sourceAddress)
        : false,
  };
};

const validateAddress = (chain: Chain | undefined, address: string): boolean => {
  if (!chain || address === '') return false;
  return bech32IsValid(address, chain.bech32_prefix);
};
