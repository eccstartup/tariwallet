# TariWallet

A modern web wallet for the [Tari](https://www.tari.com/) network. Connects to a local Tari wallet daemon to manage accounts, send/receive tokens, browse templates, and interact with smart contracts.

## Prerequisites

- **Node.js** ≥ 18
- **Tari Wallet Daemon** running locally (e.g. on `http://localhost:5100`)

Start the daemon:
```bash
tari_ootle_walletd --network esme -b /path/to/data/dir
```

## Quick Start

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173`. It proxies `/json_rpc` to the daemon, so no CORS configuration is needed.

Copy `.env.example` to `.env` if you need to customize:
```bash
cp .env.example .env
```

## Features

### Wallet Dashboard
- View balances with full decimal precision
- Assets displayed with type icons (💰 fungible, 🖼 NFT) and divisibility info
- Faucet: claim free test coins (tTARI)
- Mint NFTs from the built-in faucet
- Quick actions: Send, Receive, Accounts, History

### Send & Receive
- Transfer fungible tokens (tTARI, custom tokens)
- Enter amount in display units — automatically converted to raw units
- Configurable max fee
- Receive page shows account address, public key, and QR code

### Accounts
- Create, rename, switch default account
- View account details (balances, address, public key)
- Per-account transaction filtering

### Transactions
- Browse transaction history filtered by account
- View transaction details: status, fee, execution results, events

### Templates (Smart Contracts)
- **Browse** published templates on the network
- **Publish** new templates by uploading `.wasm` files (fee defaults to 1,000,000 µTARI)
- **Interact** with any template function directly:
  - Each function shows its argument names and types
  - Fill in arguments and call — all calls are real on-chain transactions
  - Read functions (balance, total_supply, resource_address) default to 100,000 µTARI fee
  - Write functions (mint, take_free_coins, burn_coins) default to 1,000,000 µTARI fee
  - Functions with `&self` / `&mut self` use `CallMethod` — need a component address (obtained from a prior mint)
  - Functions without self use `CallFunction` — creates a new component
  - Results appear inline after confirmation, showing all return values

### Settings
- Toggle dark/light theme
- View wallet network info
- View account keys
- Configure daemon URL (editable)

## Architecture

```
src/
├── main.tsx              # React entry
├── App.tsx               # Router + auth setup
├── index.css             # Tailwind CSS + dark mode
├── services/
│   ├── jsonrpc.ts        # JSON-RPC 2.0 client with JWT auth + refresh
│   ├── api.ts            # Typed API functions for all wallet operations
│   └── types.ts          # TypeScript types for API requests/responses
├── hooks/
│   ├── useAccounts.ts    # Account queries (list, get, balances, etc.)
│   ├── useTransactions.ts # Transaction queries
│   └── useWalletInfo.ts  # Wallet/network info
├── stores/
│   └── walletStore.ts    # Zustand store (theme, daemon URL, UI prefs)
├── components/
│   ├── Layout.tsx        # App shell
│   ├── Sidebar.tsx       # Navigation + theme toggle
│   ├── BalanceCard.tsx   # Balance display
│   ├── TransactionRow.tsx # Transaction list item
│   ├── LoadingSpinner.tsx
│   ├── ErrorDisplay.tsx
│   └── EmptyState.tsx
└── pages/
    ├── Dashboard.tsx      # Wallet overview
    ├── Send.tsx           # Transfer tokens
    ├── Receive.tsx        # QR code + address
    ├── Accounts.tsx        # Account management
    ├── AccountDetail.tsx   # Single account detail
    ├── Transactions.tsx   # Transaction history
    ├── TransactionDetail.tsx # Transaction receipt
    ├── Templates.tsx      # Template browser, publish, and interaction
    └── Settings.tsx        # App settings
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| State | TanStack React Query v5 + Zustand v5 |
| API | Tari Wallet Daemon JSON-RPC 2.0 |

## Template Argument Types

When calling template functions, arguments are CBOR-encoded as hex strings. The app handles encoding automatically:

| ABI Type | Input Format | CBOR Encoding |
|----------|-------------|---------------|
| `Amount` | Plain number (e.g. `1000`) | Unsigned integer |
| `String` | Plain text (e.g. `MYTOKEN`) | Text string |
| `ResourceAddress` | Hex or full address (e.g. `0101...` or `resource_0101...`) | Byte string |
| `PublicKey` | Hex (e.g. `2049703a...`) | Byte string |
| `Hash` | Hex | Byte string |
| `Bucket` | Hex address | Byte string |
| `Metadata` | Hex | Byte string |
| `NonFungibleAddress` | Hex or full address | Byte string |

The app automatically strips common Tari prefixes (`resource_`, `component_`, `vault_`, `template_`, etc.) when encoding byte-like types.

## JSON-RPC API

The wallet daemon exposes a JSON-RPC 2.0 API at `/json_rpc`. Authentication is handled automatically:

1. `auth.request` — acquires JWT with `Admin` permissions
2. `auth.refresh` — refreshes expired tokens
3. All subsequent requests include `Authorization: Bearer <token>`

Key API methods used:

- `accounts.*` — list, get, create, rename, set_default, get_balances, transfer
- `accounts.create_free_test_coins` — faucet
- `transactions.*` — list, get, get_result, submit
- `transactions.publish_template` — publish WASM template
- `templates.*` — list_authored, get
- `nfts.*` — list, mint_faucet_nft
- `keys.list` — list account keys
- `settings.get` / `settings.set` — wallet settings
- `wallet.get_info` — network and version info

## Configuration

Environment variables (optional, in `.env`):

```env
VITE_DAEMON_URL=http://localhost:5100
```

The Vite dev server proxies `/json_rpc` to `${VITE_DAEMON_URL}/json_rpc`.

## License

MIT
