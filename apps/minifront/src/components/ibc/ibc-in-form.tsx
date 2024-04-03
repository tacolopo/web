import { Card } from '@penumbra-zone/ui/components/ui/card';
import { SelectAccount } from '@penumbra-zone/ui/components/ui/select-account';
import { Button } from '@penumbra-zone/ui/components/ui/button';
import { getAddrByIndex } from '../../fetchers/address';
import type { BroadcastMode, ChainContext } from '@cosmos-kit/core';
import { ChainSelector } from './chain-selector';
import { useStore } from '../../state';
import { ibcSelector } from '../../state/ibc';

export const IbcInForm = ({ chainContext }: { chainContext: ChainContext }) => {
  const { chain } = useStore(ibcSelector);
  console.log('chain', chain, chainContext);
  return (
    <Card gradient className='md:p-5'>
      <h1 className='font-headline text-xl'>Enter Penumbra</h1>
      <ChainSelector />
      <div className='pb-3 md:pb-5'>
        <SelectAccount getAddrByIndex={getAddrByIndex} forceEphemeral={true} />
      </div>
      {chainContext.isWalletConnected ? (
        <Button
          className='p-4'
          onClick={() => void chainContext.sendTx(new Uint8Array(), 'block' as BroadcastMode)}
        >
          Enter
        </Button>
      ) : null}
    </Card>
  );
};
