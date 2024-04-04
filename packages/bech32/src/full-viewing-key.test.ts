import { describe, expect, test } from 'vitest';
import { bech32FullViewingKey, bech32ToFullViewingKey } from './full-viewing-key';
import { bech32m } from 'bech32';
import { PENUMBRA_BECH32_FVK_LENGTH, PENUMBRA_BECH32_FVK_PREFIX } from './penumbra-bech32';
import { corruptBech32 } from './corrupt-bech32';

describe('fvk bech32m', () => {
  const okInner = new Uint8Array([
    96, 146, 69, 187, 236, 3, 245, 228, 42, 194, 121, 104, 201, 250, 8, 194, 87, 95, 93, 29, 171,
    250, 177, 162, 130, 226, 176, 56, 91, 122, 89, 9, 34, 67, 106, 56, 17, 73, 174, 234, 72, 54,
    212, 210, 111, 5, 34, 249, 15, 60, 220, 191, 1, 224, 210, 114, 210, 205, 9, 187, 72, 115, 75, 2,
  ]);

  const okBech32 =
    'penumbrafullviewingkey1vzfytwlvq067g2kz095vn7sgcft47hga40atrg5zu2crskm6tyyjysm28qg5nth2fqmdf5n0q530jreumjlsrcxjwtfv6zdmfpe5kqsa5lg09';

  const longInner = new Uint8Array([...okInner, 13]);
  const longBech32 = bech32m.encode(
    PENUMBRA_BECH32_FVK_PREFIX,
    bech32m.toWords(longInner),
    // long would exceed normal limit
    666,
  );

  const shortInner = okInner.slice(12);
  const shortBech32 = bech32m.encode(
    PENUMBRA_BECH32_FVK_PREFIX,
    bech32m.toWords(shortInner),
    // short won't exceed normal limit :)
    PENUMBRA_BECH32_FVK_LENGTH,
  );

  describe('bech32FullViewingKey()', () => {
    test('Converts fvk to bech32', () => {
      const fvk = bech32FullViewingKey({ inner: okInner });
      expect(fvk).toBe(okBech32);
    });

    test('Throws if fvk too long', () => {
      expect(() => bech32FullViewingKey({ inner: longInner })).toThrow();
    });

    test('Throws if fvk too short', () => {
      expect(() => bech32FullViewingKey({ inner: shortInner })).toThrow();
    });
  });

  describe('bech32ToFullViewingKey()', () => {
    test('Converts bech32 to fvk', () => {
      expect(bech32ToFullViewingKey(okBech32).equals({ inner: new Uint8Array(okInner) })).toBe(
        true,
      );
    });

    test('Throws if bech32 fvk too long', () => {
      expect(() => bech32ToFullViewingKey(longBech32)).toThrow();
    });

    test('Throws if bech32 fvk too short', () => {
      expect(() => bech32ToFullViewingKey(shortBech32)).toThrow();
    });

    test('Throws if bech32 fvk is corrupted', () => {
      const corruptedBech32 = corruptBech32(okBech32);
      expect(() => bech32ToFullViewingKey(corruptedBech32)).toThrow();
    });
  });
});
