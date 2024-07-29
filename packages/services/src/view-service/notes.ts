import type { Impl } from './index.js';
import { servicesCtx } from '../ctx/prax.js';

import { Amount } from '@penumbra-zone/protobuf/types';
import { addAmounts, joinLoHiAmount } from '@penumbra-zone/types/amount';

export const notes: Impl['notes'] = async function* (req, ctx) {
  const services = await ctx.values.get(servicesCtx)();
  const { indexedDb } = await services.getWalletServices();

  const { assetId, addressIndex, includeSpent, amountToSpend } = req;

  let spent = new Amount();

  for await (const n of indexedDb.iterateSpendableNotes()) {
    if (assetId && !n.note?.value?.assetId?.equals(assetId)) {
      continue;
    }
    if (addressIndex && !n.addressIndex?.equals(addressIndex)) {
      continue;
    }
    if (!includeSpent && n.heightSpent !== 0n) {
      continue;
    }

    yield { noteRecord: n };

    // If set, stop returning notes once the total exceeds this amount.
    // Ignored if `assetId` is unset or if `includeSpent` is set.
    if (amountToSpend && assetId && !includeSpent) {
      const noteAmount = n.note?.value?.amount ?? new Amount();
      spent = addAmounts(spent, noteAmount);
      if (joinLoHiAmount(spent) >= joinLoHiAmount(amountToSpend)) {
        break;
      }
    }
  }
};
