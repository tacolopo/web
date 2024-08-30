import { Link2Off } from 'lucide-react';
import { Popover } from '@penumbra-zone/ui/Popover';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { penumbra, usePraxManifest } from '../../../prax.ts';
import { ProviderIcon } from './provider-icon.tsx';

export const ProviderPopover = () => {
  const manifest = usePraxManifest();

  const disconnect = () => {
    void penumbra.disconnect().then(() => window.location.reload());
  };

  return (
    <Popover>
      <Popover.Trigger>
        <Button icon={ProviderIcon} iconOnly>
          {manifest?.name}
        </Button>
      </Popover.Trigger>
      <Popover.Content align='end' side='bottom'>
        {manifest ? (
          <div className='flex flex-col gap-2'>
            <Text body>
              {manifest.name} v{manifest.version}
            </Text>
            <Text small>{manifest.description}</Text>
          </div>
        ) : (
          <Text body>Loading provider manifest...</Text>
        )}
        <div className='mt-4'>
          <Button icon={Link2Off} onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      </Popover.Content>
    </Popover>
  );
};
