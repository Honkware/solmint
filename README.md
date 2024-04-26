# Solana Token Creation Script

A simple script to create and mint your own custom token on the Solana blockchain, with easy configuration and metadata upload to IPFS using Pinata.

## Getting Started

1. Install dependencies:

  ```bash
  npm install
  ```

Create a `.env` file in the root directory with your private key and Pinata API keys:
```
PRIVATE_KEY=your_wallet_private_key
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
```

Update `token_config.yaml` with your desired token settings:
```yaml
rpcUrl: https://api.devnet.solana.com
name: MyToken
symbol: MT
description: My custom token description
image: https://example.com/token_image.png
extensions:
  website: "https://mytoken.com"
  twitter: "https://twitter.com/MyToken"
decimals: 9
totalSupply: 1000000
```

Run the script to create and mint your token:
```bash
node create.js
```
The script will create your token, mint the specified amount, and upload the metadata to IPFS using Pinata.

## Configuration
`token_config.yaml` options:

- rpcUrl: Solana RPC URL (default: https://api.devnet.solana.com)
- name: Token name
- symbol: Token symbol
- description: Token description
- image: Token image URL
- extensions: Additional metadata fields (website, twitter, etc.)
- decimals: Decimal places for the token (default: 9)
- totalSupply: Total token supply
