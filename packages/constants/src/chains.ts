import {
  chains,
  //ibc
} from '@penumbra-zone/chain-registry';
export type { Chain } from '@chain-registry/types';

type SupportedChain = 'osmo-test-5' | 'grand-1';

const channelsById: Record<SupportedChain, `channel-${number}`> = {
  'osmo-test-5': 'channel-0',
  'grand-1': 'channel-3',
};

export const testnetIbcChains = chains
  .filter(chain => chain.chain_id in channelsById)
  .map(chain => ({
    ...chain,
    displayName: chain.pretty_name,
    chainId: chain.chain_id,
    chainName: chain.chain_name,
    ibcChannel: (channelsById as Record<string, string>)[chain.chain_id],
    iconUrl: chain.images?.[0]?.png,
    addressPrefix: chain.bech32_prefix,
  }));
