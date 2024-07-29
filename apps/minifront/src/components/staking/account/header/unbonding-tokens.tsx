import { Metadata, ValueView } from '@penumbra-zone/protobuf/types';
import { getDisplayDenomFromView } from '@penumbra-zone/getters/value-view';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@repo/ui/components/ui/tooltip';
import { ValueViewComponent } from '@repo/ui/components/ui/value';
import { ReactNode } from 'react';
import { zeroValueView } from '../../../../utils/zero-value-view';

export const UnbondingTokens = ({
  total,
  tokens,
  helpText,
  children,
  stakingTokenMetadata,
}: {
  total?: ValueView;
  tokens?: ValueView[];
  helpText: string;
  children?: ReactNode;
  stakingTokenMetadata?: Metadata;
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <ValueViewComponent view={total ?? zeroValueView(stakingTokenMetadata)} />
        </TooltipTrigger>
        <TooltipContent>
          <div className='flex flex-col gap-4'>
            <div className='max-w-[250px]'>{helpText}</div>

            {!!tokens?.length &&
              tokens.map(token => (
                <ValueViewComponent key={getDisplayDenomFromView(token)} view={token} />
              ))}

            {children}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
