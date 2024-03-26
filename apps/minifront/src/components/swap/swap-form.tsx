import { Button } from '@penumbra-zone/ui/components/ui/button';
import InputToken from '../shared/input-token';
import { useLoaderData } from 'react-router-dom';
import { useStore } from '../../state';
import { swapSelector, swapValidationErrors } from '../../state/swap';
import { AssetOutBox } from './asset-out-box';
import { SwapLoaderResponse } from './swap-loader';

export const SwapForm = () => {
  const { assetBalances } = useLoaderData() as SwapLoaderResponse;
  const { assetIn, setAssetIn, amount, setAmount, initiateSwapTx, txInProgress } =
    useStore(swapSelector);
  const validationErrs = useStore(swapValidationErrors);

  return (
    <form
      className='flex flex-col gap-4 xl:gap-3'
      onSubmit={e => {
        e.preventDefault();
        void initiateSwapTx();
      }}
    >
      <InputToken
        label='Amount to swap'
        placeholder='Enter an amount'
        className='mb-1'
        selection={assetIn}
        setSelection={setAssetIn}
        value={amount}
        onChange={e => {
          if (Number(e.target.value) < 0) return;
          setAmount(e.target.value);
        }}
        validations={[
          {
            type: 'error',
            issue: 'insufficient funds',
            checkFn: () => validationErrs.amountErr,
          },
        ]}
        balances={assetBalances}
      />
      <AssetOutBox balances={assetBalances} />
      <Button
        type='submit'
        variant='gradient'
        className='mt-3'
        size='lg'
        disabled={txInProgress || Object.values(validationErrs).find(Boolean)}
      >
        Swap
      </Button>
    </form>
  );
};
