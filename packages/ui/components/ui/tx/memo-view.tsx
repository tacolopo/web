import { MemoView } from '@penumbra-zone/protobuf/types';
import { AddressViewComponent } from '../address-view';
import { ViewBox } from './viewbox';
import { ActionDetails } from './actions-views/action-details';

export const MemoViewComponent = ({ memo: { memoView } }: { memo: MemoView }) => {
  switch (memoView.case) {
    case 'visible':
      return (
        <ViewBox
          label='Memo'
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
      return <ViewBox label='Memo' isOpaque={true} />;
    default:
      return <span>Invalid MemoView: &quot;{memoView.case}&quot;</span>;
  }
};
