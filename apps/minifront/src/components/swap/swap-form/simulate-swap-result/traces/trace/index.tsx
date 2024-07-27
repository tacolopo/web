import {
  Metadata,
  Value,
  ValueView,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb.js';
import { SwapExecution_Trace } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb.js';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { ValueViewComponent } from '@repo/ui/components/ui/value';
import { Price } from './price';

const getValueView = (metadataByAssetId: Map<string, Metadata>, { amount, assetId }: Value) =>
  new ValueView({
    valueView: {
      case: 'knownAssetId',
      value: {
        amount,
        metadata: assetId ? metadataByAssetId.get(bech32mAssetId(assetId)) : undefined,
      },
    },
  });

export const Trace = ({
  trace,
  metadataByAssetId,
}: {
  trace: SwapExecution_Trace;
  metadataByAssetId: Map<string, Metadata>;
}) => {
  return (
    <div className='flex w-full items-center justify-between gap-8'>
      {trace.value.map((value, index) => (
        <div key={index} className='flex shrink-0 flex-col gap-1'>
          <ValueViewComponent view={getValueView(metadataByAssetId, value)} size='sm' />

          {index === 0 && <Price trace={trace} metadataByAssetId={metadataByAssetId} />}

          {/* Placeholder to ensure all values are aligned, even if the price
          isn't underneath them. */}
          {index > 0 && <span className='text-xs'>&nbsp;</span>}
        </div>
      ))}
    </div>
  );
};
