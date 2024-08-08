import { Address } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/keys/v1/keys_pb.js';
import { ViewService } from '@penumbra-zone/protobuf';
import { bech32mAddress } from '@penumbra-zone/bech32m/penumbra';
import { praxClient } from '../prax';

type Index = number;
type Bech32Address = string;

export type IndexAddrRecord = Record<Index, Bech32Address>;

export const getAddresses = async (accounts: (number | undefined)[]): Promise<IndexAddrRecord> => {
  const allReqs = accounts.map(getAddressByIndex);

  const responses = await Promise.all(allReqs);
  return responses
    .map((address, i) => {
      return {
        index: accounts[i] ?? 0,
        address: bech32mAddress(address),
      };
    })
    .reduce<IndexAddrRecord>((acc, curr) => {
      acc[curr.index] = curr.address;
      return acc;
    }, {});
};

export const getAddressByIndex = async (account = 0): Promise<Address> => {
  const { address } = await praxClient
    .service(ViewService)
    .addressByIndex({ addressIndex: { account } });
  if (!address) {
    throw new Error('Address not in getAddressByIndex response');
  }
  return address;
};

export const getEphemeralAddress = async (account = 0): Promise<Address> => {
  const { address } = await praxClient
    .service(ViewService)
    .ephemeralAddress({ addressIndex: { account } });
  if (!address) {
    throw new Error('Address not in getEphemeralAddress response');
  }
  return address;
};

export const getAddrByIndex = async (index: number, ephemeral: boolean) => {
  return ephemeral ? await getEphemeralAddress(index) : await getAddressByIndex(index);
};
