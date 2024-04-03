import { LoaderFunction, Outlet, useLoaderData } from 'react-router-dom';
import { getChainId } from '../fetchers/chain-id';
import { HeadTag } from './metadata/head-tag';
import { Header } from './header/header';
import { Toaster } from '@penumbra-zone/ui/components/ui/toaster';
import '@penumbra-zone/ui/styles/globals.css';
import { ExtensionNotConnected } from './extension-not-connected';
import { ExtensionNotInstalled } from './extension-not-installed';
import { Footer } from './footer';
import { isPraxConnected, isPraxConnectedTimeout, isPraxAvailable } from '@penumbra-zone/client';

import { wallets as keplrWallet } from '@cosmos-kit/keplr';
import { wallets as cosmostationWallets } from '@cosmos-kit/cosmostation';
import { wallets as leapwallets } from '@cosmos-kit/leap';

import { chains, assets } from '@penumbra-zone/chain-registry';
import { ChainProvider } from '@cosmos-kit/react';
const osmoTest5Chain = chains.find(({ chain_id }) => chain_id === 'osmo-test-5')!;
const osmoTest5Assets = assets.find(({ chain_name }) => chain_name === osmoTest5Chain.chain_name)!;
const nobleTestChain = chains.find(({ chain_id }) => chain_id === 'grand-1')!;
const nobleTestAssets = assets.find(({ chain_name }) => chain_name === nobleTestChain.chain_name)!;

export type LayoutLoaderResult =
  | { isInstalled: boolean; isConnected: boolean }
  | {
      isInstalled: true;
      isConnected: true;
      chainId: string;
    };

export const LayoutLoader: LoaderFunction = async (): Promise<LayoutLoaderResult> => {
  const isInstalled = isPraxAvailable();
  if (!isInstalled) return { isInstalled, isConnected: false };
  const isConnected = isPraxConnected() || (await isPraxConnectedTimeout(1000));
  if (!isConnected) return { isInstalled, isConnected };
  const chainId = await getChainId();
  return { isInstalled, isConnected, chainId };
};

export const Layout = () => {
  const { isInstalled, isConnected } = useLoaderData() as LayoutLoaderResult;

  if (!isInstalled) return <ExtensionNotInstalled />;
  if (!isConnected) return <ExtensionNotConnected />;

  return (
    <ChainProvider
      chains={[osmoTest5Chain, nobleTestChain]}
      wallets={[keplrWallet, cosmostationWallets, leapwallets]}
    >
      <HeadTag />
      <div className='relative flex min-h-screen flex-col bg-background text-muted'>
        <Header />
        <main className='mx-auto w-full flex-1 px-6 pb-4 pt-5 [background-clip:border-box] [background-image:url(./penumbra-logo.svg)] [background-position:left_center] [background-size:200vh] md:px-[88px] md:pb-0 lg:[background-position:left_200%_center] xl:max-w-[1276px] xl:px-12'>
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </ChainProvider>
  );
};
