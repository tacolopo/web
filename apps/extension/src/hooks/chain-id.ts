import { useQuery } from '@tanstack/react-query';
import { viewClient } from '../clients';
import { localExtStorage } from '@penumbra-zone/storage/chrome/local';
import { AppQuerier } from '@penumbra-zone/query/queriers/app';
import { AppParameters } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/app/v1/app_pb';

export const getChainIdWithFallback = async (): Promise<string> => {
  // Check storage first to see if available
  const params = await localExtStorage.get('params').then(j => j && AppParameters.fromJson(j));
  if (params?.chainId) return params.chainId;

  // Not in storage, ask grpcEndpoint
  const grpcEndpoint = await localExtStorage.get('grpcEndpoint');
  if (grpcEndpoint) {
    const queryClient = new AppQuerier({ grpcEndpoint });
    const { chainId } = await queryClient.appParams();
    return chainId;
  }

  // No endpoint? We probably haven't onboarded. Fallback to env variable
  return CHAIN_ID;
};

const getChainIdViaViewService = async (): Promise<string> => {
  const { parameters } = await viewClient.appParameters({});
  if (!parameters?.chainId) throw new Error('No chainId in response');

  return parameters.chainId;
};

export const useChainIdQuery = () => {
  const { data, refetch } = useQuery({
    queryKey: ['chain-id'],
    queryFn: getChainIdViaViewService,
    staleTime: Infinity,
  });

  return { chainId: data, refetchChainId: refetch };
};
