import { assetPatterns, RegexMatcher } from '@penumbra-zone/types/assets';
import type { Impl } from '.';
import { idbCtx } from '../ctx/prax';

export const assets: Impl['assets'] = async function* (req, ctx) {
  const idb = await ctx.values.get(idbCtx)();

  const {
    filtered,
    includeLpNfts,
    includeProposalNfts,
    includeDelegationTokens,
    includeUnbondingTokens,
    includeVotingReceiptTokens,
    includeSpecificDenominations,
  } = req;

  const patterns: {
    includeReq: boolean;
    pattern: RegexMatcher<unknown>;
  }[] = [
    {
      includeReq: includeLpNfts,
      pattern: assetPatterns.lpNft,
    },
    {
      includeReq: includeDelegationTokens,
      pattern: assetPatterns.delegationToken,
    },
    {
      includeReq: includeProposalNfts,
      pattern: assetPatterns.proposalNft,
    },
    {
      includeReq: includeUnbondingTokens,
      pattern: assetPatterns.unbondingToken,
    },
    {
      includeReq: includeVotingReceiptTokens,
      pattern: assetPatterns.votingReceipt,
    },
    ...includeSpecificDenominations.map(d => ({
      includeReq: true,
      pattern: new RegexMatcher(new RegExp(`^${d.denom}$`)),
    })),
  ].filter(i => i.includeReq);

  for await (const metadata of idb.iterateAssetsMetadata()) {
    if (filtered && !patterns.find(p => p.pattern.matches(metadata.display))) continue;
    yield { denomMetadata: metadata };
  }
};
