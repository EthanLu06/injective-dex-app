# Injective DEX App with CosmWasm Counter Integration

This application demonstrates how to build a frontend for Injective Protocol DEX and integrate with a CosmWasm smart contract.

## Features

- Connect with Injective wallets
- Display wallet balances
- View and interact with spot markets
- Interact with a CosmWasm counter contract
  - View current count
  - Increment the counter
  - Reset the counter (owner only)

## Setup Instructions

### 1. Install dependencies

```bash
yarn install
```

### 2. Deploy the Counter Contract to Injective Testnet

You'll need to deploy the counter contract to the Injective testnet. Follow these steps:

1. Build the counter contract:

```bash
cd ../counter
cargo wasm
```

2. Deploy the contract using the Injective CLI:

```bash
# Install the injective CLI if you haven't already
# Initialize your wallet
injectived keys add <your-key-name> --recover

# Upload the contract WASM
injectived tx wasm store artifacts/counter.wasm --from <your-key-name> --chain-id=injective-888 --gas-prices=500000000inj --gas=2000000 --node=https://k8s.testnet.tm.injective.network:443 --yes

# Note down the code ID from the output
# Instantiate the contract
injectived tx wasm instantiate <code-id> '{"count": 0}' --from <your-key-name> --label "my-counter" --chain-id=injective-888 --gas-prices=500000000inj --node=https://k8s.testnet.tm.injective.network:443 --yes

# Get the contract address
injectived q wasm list-contract-by-code <code-id> --node=https://k8s.testnet.tm.injective.network:443
```

### 3. Update the Contract Address

Once you have deployed the contract, update the contract address in the frontend:

1. Open `src/services/CosmwasmClient.ts`
2. Replace the placeholder with your deployed contract address:

```typescript
const COUNTER_CONTRACT_ADDRESS = "inj1your_contract_address_here"; // Replace with actual contract address
```

### 4. Start the development server

```bash
yarn dev
```

### 5. Access the application

Open your browser and navigate to http://localhost:5173

## Usage

1. Connect your Injective wallet
2. View the current counter value
3. Click "Increment" to increase the count
4. Click "Reset to 0" to reset the count (only works if you're the contract owner)

## Development

The main components of this application are:

- `Dex.tsx` - The main DEX component for trading on Injective
- `Counter.tsx` - The component that interacts with the CosmWasm counter contract
- `CosmwasmClient.ts` - Service for interacting with CosmWasm contracts on Injective

## Additional Resources

- [Injective Protocol Documentation](https://docs.injective.network/)
- [CosmWasm Documentation](https://docs.cosmwasm.com/)
- [Counter Contract Source](../counter)
