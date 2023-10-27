import { useQuery } from '@tanstack/react-query';
import { viewClient } from '../clients/grpc';
import { useStore } from '../state';
import { accountSelector } from '../state/account';

export const getChainId = async (): Promise<string> => {
  const res = await viewClient.appParameters({});
  if (!res.parameters?.chainParams) throw new Error('No chain params in response');

  return res.parameters.chainParams.chainId;
};

export const useChainId = () => {
  const { isConnected } = useStore(accountSelector);

  const { data } = useQuery({
    enabled: isConnected,
    queryKey: ['chain-id'],
    queryFn: getChainId,
    refetchInterval: false,
  });

  return data;
};
