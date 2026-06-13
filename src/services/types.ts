// TypeScript type definitions for the Tari Wallet Daemon JSON-RPC API

// ============ Auth ============
export type AuthMethod = "none" | "webauthn";

export interface AuthGetMethodResponse {
  method: AuthMethod;
}

export interface AuthLoginResponse {
  token: string;
  permissions: string[];
}

// ============ Wallet Info ============
export interface WalletGetInfoResponse {
  network: string;
  network_byte?: number;
  version: string;
}

// ============ Accounts ============
export interface AccountInfo {
  name: string;
  component_address: string;
  owner_public_key: string;
  is_default: boolean;
  address: string;
  is_confirmed_on_chain?: boolean;
}

export interface AccountsListResponse {
  accounts: Array<{ account: AccountInfo; address: string }>;
  total: number;
}

export interface AccountGetResponse {
  account: AccountInfo;
}

export interface AccountsCreateRequest {
  account_name?: string;
  is_default?: boolean;
  key_index?: number | null;
}

export interface AccountsCreateResponse {
  account: AccountInfo;
}

export interface AccountsRenameRequest {
  account: { ComponentAddress: string };
  new_name: string;
}

export interface AccountsSetDefaultRequest {
  account: { ComponentAddress: string };
}

export interface AccountGetBalancesRequest {
  account: { ComponentAddress: string };
  refresh?: boolean;
}

export interface BalanceEntry {
  resource_address: string;
  resource_type: string;
  balance: string;
  confidential_balance: string;
  divisibility: number;
  token_symbol?: string;
  vault_address?: string;
}

export interface AccountsGetBalancesResponse {
  address: string;
  balances: BalanceEntry[];
}

// ============ Transactions ============
export type TransactionStatus =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Invalid"
  | "OnlyFeeAccepted"
  | "DryRun";

export interface TransactionInfo {
  id: string;
  status: TransactionStatus;
  last_update_time: string;
  transaction: unknown;
  is_dry_run?: boolean;
  final_fee?: string | null;
  execution_time?: string | null;
}

export interface TransactionGetAllRequest {
  account?: string | null;
  status?: TransactionStatus | null;
  limit?: number;
  offset?: number;
}

export interface TransactionGetAllResponse {
  transactions: TransactionInfo[];
}

export interface TransactionGetRequest {
  transaction_id: string;
}

export interface TransactionGetResponse {
  status: TransactionStatus;
  last_update_time: string;
  final_fee: string | null;
  result: unknown;
  transaction: unknown;
  invalid_reason: string | null;
}

export interface TransactionGetResultRequest {
  transaction_id: string;
}

export interface TransactionGetResultResponse {
  result: TransactionResult | null;
}

export interface TransactionResult {
  transaction_id: string;
  status: TransactionStatus;
  result?: unknown;
}

export interface TransactionWaitResultRequest {
  transaction_id: string;
  timeout_secs?: number;
}

export interface TransactionWaitResultResponse {
  result: TransactionResult | null;
}

// ============ Transfers ============
export interface AccountsTransferRequest {
  account: { ComponentAddress: string };
  amount: number | string;
  resource_address: string;
  destination_public_key: string;
  max_fee: number | string;
  proof_from_badge_resource?: string | null;
  input_selection?: string;
  output_to_revealed?: boolean;
  dry_run?: boolean;
}

export interface AccountsTransferResponse {
  transaction_id: string;
}

export interface AccountsCreateFreeTestCoinsRequest {
  account: { ComponentAddress: string } | string;
  max_fee: number | string;
}

export interface AccountsCreateFreeTestCoinsResponse {
  transaction_id: string;
}

// ============ NFTs ============
export interface NftInfo {
  resource_address: string;
  nft_id: { Uint64?: number; String?: string } | number;
  data?: unknown;
  mutable_data?: unknown;
  is_burnt?: boolean;
  vault_id?: string;
}

export interface NftListRequest {
  account?: { ComponentAddress: string } | null;
  offset?: number;
  limit?: number;
}

export interface NftListResponse {
  nfts: NftInfo[];
}

// ============ Templates ============
export interface TemplateInfo {
  address: string;
  name: string;
  author_public_key: string;
  abi_version?: number;
  functions?: TemplateFunction[];
}

export interface TemplatesCatalogueResponse {
  templates: TemplateInfo[];
  total_templates: number;
}

export interface TemplateFunctionArg {
  name: string;
  arg_type: string | { Other: { name: string } };
}

export interface TemplateFunction {
  name: string;
  arguments: TemplateFunctionArg[];
  output: string | { Other: { name: string } };
  is_mut: boolean;
}

export interface TemplateGetRequest {
  template_address: string;
}

export interface TemplateDetail {
  name: string;
  address?: string;
  abi_version?: number;
  author_public_key?: string;
  functions?: TemplateFunction[];
  code_size: number;
  definition: unknown;
}

export interface TemplateGetResponse {
  template: TemplateDetail;
}

// ============ Keys ============
// keys.list returns tuples: [[key_id, public_key, is_active], ...]
export type KeyInfo = [
  { Derived?: { index: number; key_branch: string } },
  string,
  boolean,
];

export interface KeysListResponse {
  keys: KeyInfo[];
}

// ============ Settings ============
export interface SettingsGetResponse {
  network: {
    name: string;
    byte: number;
  };
  indexer_url: string;
  advanced_ui_features?: {
    enable_manifest?: boolean;
  };
  claimed_accounts?: string[];
  [key: string]: unknown;
}

export interface SettingsSetRequest {
  key: string;
  value: unknown;
}

// ============ Address Book ============
export interface AddressBookEntry {
  id: string;
  name: string;
  address: string;
}

export interface AddressBookListResponse {
  entries: AddressBookEntry[];
}

export interface AddressBookAddRequest {
  name: string;
  address: string;
}

// ============ Substate Types ============
export interface SubstateData {
  substate_id: string;
  version: number;
  substate: unknown;
}

export interface SubstatesGetRequest {
  substate_id: string;
  version?: number;
}

export interface SubstatesGetResponse {
  substate: SubstateData;
}

export interface SubstatesListRequest {
  substate_ids: string[];
}

export interface SubstatesListResponse {
  substates: Record<string, SubstateData>;
}
