// API functions for Tari Wallet Daemon JSON-RPC

import { rpcRequest } from "./jsonrpc";
import type {
  AccountsCreateFreeTestCoinsRequest,
  AccountsCreateFreeTestCoinsResponse,
  AccountsCreateRequest,
  AccountsCreateResponse,
  AccountsGetBalancesResponse,
  AccountGetBalancesRequest,
  AccountGetResponse,
  AccountsListResponse,
  AccountsRenameRequest,
  AccountsSetDefaultRequest,
  AccountsTransferRequest,
  AccountsTransferResponse,
  AddressBookAddRequest,
  AddressBookEntry,
  AddressBookListResponse,
  AuthGetMethodResponse,
  AuthLoginResponse,
  KeyInfo,
  KeysListResponse,
  NftListRequest,
  NftListResponse,
  SettingsGetResponse,
  SettingsSetRequest,
  SubstatesGetRequest,
  SubstatesGetResponse,
  TemplateGetRequest,
  TemplateGetResponse,
  TemplateFunction,
  TemplatesCatalogueResponse,
  TransactionGetAllRequest,
  TransactionGetAllResponse,
  TransactionGetRequest,
  TransactionGetResponse,
  TransactionGetResultResponse,
  TransactionResult,
  TransactionWaitResultRequest,
  WalletGetInfoResponse,
} from "./types";

// ============ Auth ============
export async function authGetMethod(): Promise<AuthGetMethodResponse> {
  return rpcRequest<AuthGetMethodResponse>("auth.method", {});
}

export async function authLogin(permissions: string[] = ["Admin"]): Promise<AuthLoginResponse> {
  return rpcRequest<AuthLoginResponse>("auth.request", {
    permissions,
    credentials: "None",
  });
}

// ============ Wallet Info ============
export async function walletGetInfo(): Promise<WalletGetInfoResponse> {
  return rpcRequest<WalletGetInfoResponse>("wallet.get_info", {});
}

// ============ Accounts ============
export async function accountsList(offset = 0, limit = 50): Promise<AccountsListResponse> {
  return rpcRequest<AccountsListResponse>("accounts.list", { offset, limit });
}

export async function accountsGet(address: string): Promise<AccountGetResponse> {
  return rpcRequest<AccountGetResponse>("accounts.get", {
    name_or_address: { ComponentAddress: address },
  });
}

export async function accountsGetDefault(): Promise<AccountGetResponse> {
  return rpcRequest<AccountGetResponse>("accounts.get_default", {});
}

export async function accountsGetBalances(
  account: string,
  refresh = false,
): Promise<AccountsGetBalancesResponse> {
  return rpcRequest<AccountsGetBalancesResponse>("accounts.get_balances", {
    account: { ComponentAddress: account },
    refresh,
  });
}

export async function accountsCreate(
  request: AccountsCreateRequest,
): Promise<AccountsCreateResponse> {
  return rpcRequest<AccountsCreateResponse>("accounts.create", request);
}

export async function accountsRename(
  account: string,
  newName: string,
): Promise<void> {
  return rpcRequest<void>("accounts.rename", {
    account: { ComponentAddress: account },
    new_name: newName,
  });
}

export async function accountsSetDefault(account: string): Promise<void> {
  return rpcRequest<void>("accounts.set_default", {
    account: { ComponentAddress: account },
  });
}

export async function accountsTransfer(
  request: AccountsTransferRequest,
): Promise<AccountsTransferResponse> {
  return rpcRequest<AccountsTransferResponse>("accounts.transfer", request);
}

export async function accountsCreateFreeTestCoins(
  request: AccountsCreateFreeTestCoinsRequest,
): Promise<AccountsCreateFreeTestCoinsResponse> {
  return rpcRequest<AccountsCreateFreeTestCoinsResponse>(
    "accounts.create_free_test_coins",
    request,
  );
}

// ============ Transactions ============
export async function transactionsList(
  request: TransactionGetAllRequest = {},
): Promise<TransactionGetAllResponse> {
  return rpcRequest<TransactionGetAllResponse>("transactions.list", request);
}

export async function transactionsGet(
  transactionId: string,
): Promise<TransactionGetResponse> {
  return rpcRequest<TransactionGetResponse>("transactions.get", {
    transaction_id: transactionId,
  });
}

export async function transactionsGetResult(
  transactionId: string,
): Promise<TransactionGetResultResponse> {
  return rpcRequest<TransactionGetResultResponse>("transactions.get_result", {
    transaction_id: transactionId,
  });
}

export async function transactionsWaitResult(
  request: TransactionWaitResultRequest,
): Promise<TransactionResult | null> {
  const result = await rpcRequest<{ result: TransactionResult | null }>(
    "transactions.wait_result",
    request,
  );
  return result.result;
}

// ============ NFTs ============
export async function nftsList(request: NftListRequest = {}): Promise<NftListResponse> {
  return rpcRequest<NftListResponse>("nfts.list", request);
}

// ============ Templates ============
export async function templatesCatalogue(
  page = 0,
  pageSize = 20,
): Promise<TemplatesCatalogueResponse> {
  return rpcRequest<TemplatesCatalogueResponse>("templates.list_authored", {
    page,
    page_size: pageSize,
  });
}

export async function templatesGet(
  address: string,
): Promise<TemplateGetResponse> {
  interface RawResponse {
    template_definition: {
      V1: {
        template_name: string;
        abi_version: number;
        functions: TemplateFunction[];
      };
    };
  }
  const raw = await rpcRequest<RawResponse>("templates.get", {
    template_address: address,
  });
  const def = raw.template_definition.V1;
  return {
    template: {
      name: def.template_name,
      address,
      abi_version: def.abi_version,
      functions: def.functions,
      code_size: 0,
      definition: def,
    },
  };
}

// ============ Keys ============
export async function keysList(): Promise<KeysListResponse> {
  return rpcRequest<KeysListResponse>("keys.list", { branch: "account", start: 0, num: 10 });
}

// ============ Settings ============
export async function settingsGet(): Promise<SettingsGetResponse> {
  return rpcRequest<SettingsGetResponse>("settings.get");
}

export async function settingsSet(
  request: SettingsSetRequest,
): Promise<void> {
  return rpcRequest<void>("settings.set", request);
}

// ============ Substates ============
export async function substatesGet(
  request: SubstatesGetRequest,
): Promise<SubstatesGetResponse> {
  return rpcRequest<SubstatesGetResponse>("substates.get", request);
}

// ============ Address Book ============
export async function addressBookList(): Promise<AddressBookListResponse> {
  return rpcRequest<AddressBookListResponse>("address_book.list", {});
}

export async function addressBookAdd(request: AddressBookAddRequest): Promise<void> {
  return rpcRequest<void>("address_book.add", request);
}

export async function addressBookDelete(id: string): Promise<void> {
  return rpcRequest<void>("address_book.delete", { id });
}
