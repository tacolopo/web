import { describe, expect, test } from 'vitest';
import { bech32Address, bech32ToAddress } from './address';
import { bech32m } from 'bech32';
import { PENUMBRA_BECH32_ADDRESS_LENGTH, PENUMBRA_BECH32_ADDRESS_PREFIX } from './penumbra-bech32';
import { corruptBech32 } from './corrupt-bech32';

describe('address conversion', () => {
  const okInner = new Uint8Array([
    175, 182, 158, 255, 239, 16, 245, 221, 208, 117, 160, 44, 235, 175, 198, 0, 6, 216, 6, 143, 192,
    155, 159, 103, 97, 103, 136, 5, 78, 209, 17, 200, 68, 220, 182, 45, 20, 246, 181, 16, 117, 182,
    46, 141, 74, 101, 196, 86, 185, 124, 206, 253, 195, 57, 224, 34, 210, 22, 123, 246, 136, 10,
    208, 159, 24, 235, 148, 153, 211, 7, 137, 198, 158, 226, 221, 22, 208, 152, 246, 247,
  ]);
  const okBech32 =
    'penumbra147mfall0zr6am5r45qkwht7xqqrdsp50czde7empv7yq2nk3z8yyfh9k9520ddgswkmzar22vhz9dwtuem7uxw0qytfpv7lk3q9dp8ccaw2fn5c838rfackazmgf3ahh09cxmz';

  const longInner = new Uint8Array([...okInner, 13]);
  const longBech32 = bech32m.encode(
    PENUMBRA_BECH32_ADDRESS_PREFIX,
    bech32m.toWords(longInner),
    // long would exceed normal limit
    666,
  );

  const shortInner = okInner.slice(12);
  const shortBech32 = bech32m.encode(
    PENUMBRA_BECH32_ADDRESS_PREFIX,
    bech32m.toWords(shortInner),
    // short won't exceed normal limit :)
    PENUMBRA_BECH32_ADDRESS_LENGTH,
  );

  describe('bech32Address()', () => {
    test('Converts address to bech32', () => {
      const address = bech32Address({ inner: okInner });
      expect(address).toBe(okBech32);
    });

    test('Throws if address too long', () => {
      expect(() => bech32Address({ inner: longInner })).toThrow();
    });

    test('Throws if address too short', () => {
      expect(() => bech32Address({ inner: shortInner })).toThrow();
    });
  });

  describe('bech32ToAddress()', () => {
    test('Converts bech32 to address', () => {
      const address = bech32ToAddress(okBech32);
      expect(address).toEqual(new Uint8Array(okInner));
    });

    test('Throws if bech32 address prefix is wrong', () => {
      expect(() =>
        bech32ToAddress(
          'lanumbro147mfall0zr6am5r45qkwht7xqqrdsp50czde7empv7yq2nk3z8yyfh9k9520ddgswkmzar22vhz9dwtuem7uxw0qytfpv7lk3q9dp8ccaw2fn5c838rfackazmgf3ahhvhypxd',
        ),
      ).toThrow();
    });

    test('Throws if bech32 address too long', () => {
      expect(() => bech32ToAddress(longBech32)).toThrow();
    });

    test('Throws if bech32 address too short', () => {
      expect(() => bech32ToAddress(shortBech32)).toThrow();
    });

    test('Throws if bech32 address is corrupted', () => {
      const corruptedBech32 = corruptBech32(okBech32);
      expect(() => bech32ToAddress(corruptedBech32)).toThrow();
    });
  });
});
