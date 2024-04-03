import { IbcInForm } from './ibc-in-form';
import { IbcOutForm } from './ibc-out-form';
import { useChain } from '@cosmos-kit/react';
import '@interchain-ui/react/styles';
import { useStore } from '../../state';
import { ibcSelector } from '../../state/ibc';
import { ThemeProvider, useTheme } from '@interchain-ui/react';

export const IbcLayout = () => {
  const { chain } = useStore(ibcSelector);
  console.log(chain?.chainName);
  const chainContext = useChain(chain?.chainName);
  const { theme, themeClass, setTheme } = useTheme();
  console.log('interchain theme', { theme, themeClass, setTheme });
  return (
    <ThemeProvider>
      <div className={themeClass}>
        <div className='grid gap-8 md:grid-cols-2  lg:gap-[30%]'>
          <IbcInForm chainContext={chainContext} />
          <IbcOutForm chainContext={chainContext} />
        </div>
      </div>
    </ThemeProvider>
  );
};
