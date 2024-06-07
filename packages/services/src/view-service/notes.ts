import { Amount } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/num/v1/num_pb';
import { addAmounts, joinLoHiAmount } from '@penumbra-zone/types/amount';
import type { Impl } from '.';
import { idbCtx } from '../ctx/prax';

export const notes: Impl['notes'] = async function* (req, ctx) {
  const idb = await ctx.values.get(idbCtx)();

  const { assetId, addressIndex, includeSpent, amountToSpend } = req;

  let spent = new Amount();

  for await (const n of idb.iterateSpendableNotes()) {
    if (assetId && !n.note?.value?.assetId?.equals(assetId)) continue;
    if (addressIndex && !n.addressIndex?.equals(addressIndex)) continue;
    if (!includeSpent && n.heightSpent !== 0n) continue;

    yield { noteRecord: n };

    // If set, stop returning notes once the total exceeds this amount.
    // Ignored if `assetId` is unset or if `includeSpent` is set.
    if (amountToSpend && assetId && !includeSpent) {
      const noteAmount = n.note?.value?.amount ?? new Amount();
      spent = addAmounts(spent, noteAmount);
      if (joinLoHiAmount(spent) >= joinLoHiAmount(amountToSpend)) break;
    }
  }
};
