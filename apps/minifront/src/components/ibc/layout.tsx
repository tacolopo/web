import { IbcInForm } from './ibc-in-form';
import { IbcOutForm } from './ibc-out-form';

import '@interchain-ui/react/styles';

import { ChainProvider, useChain } from '@cosmos-kit/react';
import { chains, assets } from 'chain-registry';
import { wallets } from '@cosmos-kit/keplr';
import { useStore } from '../../state';
import { ibcSelector } from '../../state/ibc';
import { ErrorBoundary } from '../shared/error-boundary';

const osmoTest5Chain = chains.find(({ chain_id }) => chain_id === 'osmo-test-5')!;
const osmoTest5Assets = assets.find(({ chain_name }) => chain_name === osmoTest5Chain.chain_name)!;
const nobleTestChain = chains.find(({ chain_id }) => chain_id === 'grand-1')!;
const nobleTestAssets = assets.find(({ chain_name }) => chain_name === nobleTestChain.chain_name)!;

export const IbcLayout = () => {
  const { chain } = useStore(ibcSelector);
  const chainContext = useChain(chain?.chainName ?? '');
  return (
    <ChainProvider
      chains={[osmoTest5Chain, nobleTestChain]}
      assetLists={[osmoTest5Assets, nobleTestAssets]}
      wallets={wallets}
    >
      <div className='grid gap-8 md:grid-cols-2  lg:gap-[30%]'>
        <IbcInForm chainContext={chainContext} />
        <IbcOutForm chainContext={chainContext} />
      </div>
    </ChainProvider>
  );
};
