import { usePraxManifest } from '../../../prax';

export const ProviderIcon = ({ size = 16 }: { size?: string | number }) => {
  const manifest = usePraxManifest();

  return (
    manifest && (
      <img
        src={URL.createObjectURL(manifest.icons['32'] ?? manifest.icons['128'])}
        alt={manifest.name}
        width={size}
        height={size}
      />
    )
  );
};
