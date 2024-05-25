import { MemoView } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/transaction/v1/transaction_pb';
import { AddressViewComponent } from './address-view';
import { ViewBox } from './viewbox';
import { ActionDetails } from './action-details';
import { useCumulativeLayoutId } from '../../../contexts/cumulative-layout-id';

export const MemoViewComponent = ({ memo: { memoView } }: { memo: MemoView }) => {
  const layoutId = useCumulativeLayoutId('MemoViewComponent');

  switch (memoView.case) {
    case 'visible':
      return (
        <ViewBox
          label='Memo'
          layoutId={layoutId}
          visibleContent={
            <div className='flex flex-col gap-4'>
              <ActionDetails>
                <ActionDetails.Row label='Return Address'>
                  <AddressViewComponent view={memoView.value.plaintext!.returnAddress} />
                </ActionDetails.Row>
                <ActionDetails.Row label='Memo Text'>
                  <span className='italic' style={{ wordBreak: 'normal' }}>
                    {memoView.value.plaintext?.text}
                  </span>
                </ActionDetails.Row>
              </ActionDetails>
            </div>
          }
        />
      );
    case 'opaque':
      return <ViewBox label='Memo' layoutId={layoutId} isOpaque={true} />;
    default:
      return <span>Invalid MemoView: &quot;{memoView.case}&quot;</span>;
  }
};
