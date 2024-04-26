import { UserChoice } from '@penumbra-zone/types/user-choice';
import { WalletJson } from '@penumbra-zone/types/wallet';
import { KeyPrintJson } from '@penumbra-zone/crypto-web/encryption';
import { AppParameters } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/app/v1/app_pb';
import { Jsonified } from '@penumbra-zone/types/jsonified';

export enum LocalStorageVersion {
  V1 = 'V1',
  V2 = 'V2',
}

export interface OriginRecord {
  origin: string;
  choice: UserChoice;
  date: number;
}

export interface LocalStorageState {
  frontendUrl: string;
  fullSyncHeight: number | undefined;
  grpcEndpoint: string | undefined;
  knownSites: OriginRecord[];
  params: Jsonified<AppParameters> | undefined;
  passwordKeyPrint: KeyPrintJson | undefined;
  wallets: WalletJson[];
}
