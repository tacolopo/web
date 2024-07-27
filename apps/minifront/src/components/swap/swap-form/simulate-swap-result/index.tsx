import { ValueViewComponent } from '@repo/ui/components/ui/value';
import { PriceImpact } from './price-impact';
import { motion } from 'framer-motion';
import { joinLoHiAmount } from '@penumbra-zone/types/amount';
import { getAmount } from '@penumbra-zone/getters/value-view';
import { Traces } from './traces';
import { SimulateSwapResult } from '../../../../state/swap/instant-swap';

const HIDE = { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' };
const SHOW = { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' };

export const SimulateSwapComponent = ({
  result: { unfilled, input, output, priceImpact, traces, metadataByAssetId },
}: {
  result: SimulateSwapResult;
}) => {
  const hasUnfilled = joinLoHiAmount(getAmount(unfilled)) > 0n;

  return (
    <motion.div layout initial={HIDE} animate={SHOW} exit={HIDE} className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-1'>
        Filling <ValueViewComponent view={output} size='sm' /> causes a price impact of{' '}
        <PriceImpact amount={priceImpact} />.
        {hasUnfilled && (
          <>
            <ValueViewComponent view={unfilled} size='sm' /> will remain unfilled.
          </>
        )}
      </div>

      <Traces traces={traces} metadataByAssetId={metadataByAssetId} input={input} output={output} />
    </motion.div>
  );
};
