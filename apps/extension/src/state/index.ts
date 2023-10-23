import { create, StateCreator } from 'zustand';
import { createWalletsSlice, WalletsSlice } from './wallets';
import { immer } from 'zustand/middleware/immer';
import { customPersist } from './persist';
import { createPasswordSlice, PasswordSlice } from './password';
import { createSeedPhraseSlice, SeedPhraseSlice } from './seed-phrase';
import { createNetworkSlice, NetworkSlice } from './network';
import { AccountsSlice, createAccountsSlice } from './accounts';
import {
  ExtensionStorage,
  localExtStorage,
  LocalStorageState,
  sessionExtStorage,
  SessionStorageState,
} from '@penumbra-zone/storage';
import { createMessagesSlice, MessagesSlice } from './messages';
import { ConnectedSitesSlice, createConnectedSitesSlice } from './connected-sites';

export interface AllSlices {
  wallets: WalletsSlice;
  accounts: AccountsSlice;
  password: PasswordSlice;
  seedPhrase: SeedPhraseSlice;
  network: NetworkSlice;
  messages: MessagesSlice;
  connectedSites: ConnectedSitesSlice;
}

export type SliceCreator<SliceInterface> = StateCreator<
  AllSlices,
  [['zustand/immer', never]],
  [],
  SliceInterface
>;

export const initializeStore = (
  session: ExtensionStorage<SessionStorageState>,
  local: ExtensionStorage<LocalStorageState>,
) => {
  return immer((setState, getState: () => AllSlices, store) => ({
    wallets: createWalletsSlice(local)(setState, getState, store),
    accounts: createAccountsSlice(setState, getState, store),
    password: createPasswordSlice(session, local)(setState, getState, store),
    seedPhrase: createSeedPhraseSlice(setState, getState, store),
    network: createNetworkSlice(local)(setState, getState, store),
    messages: createMessagesSlice(local)(setState, getState, store),
    connectedSites: createConnectedSitesSlice(local)(setState, getState, store),
  }));
};

// Wrap in logger() middleware if wanting to see store changes in console
export const useStore = create<AllSlices>()(
  customPersist(initializeStore(sessionExtStorage, localExtStorage)),
);
