# Solana Address Finder

A tool for deriving Solana Associated Token Accounts (ATAs) and Program Derived Addresses (PDAs).

## Overview

Solana Address Finder is a client-side web application that helps derive two types of special addresses on Solana:

1. **Associated Token Accounts (ATAs)**: Deterministic addresses that hold token balances for a specific wallet and token mint combination.
2. **Program Derived Addresses (PDAs)**: Off-curve addresses that can only be signed for by Solana programs.

## Features

### ATA Finder

The ATA Finder derives Associated Token Account addresses by taking:

- Wallet address (owner)
- Token mint address

It follows the [Solana ATA specification](https://spl.solana.com/associated-token-account) to deterministically derive the address using:

```javascript
const [ataAddress] = await PublicKey.findProgramAddress(
  [
    walletAddress.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mintAddress.toBuffer(),
  ],
  ASSOCIATED_TOKEN_PROGRAM_ID
);
```

### PDA Finder

The PDA Finder derives Program Derived Addresses by taking:

- Program ID
- One or more seeds

The tool supports different seed types:

- **Text strings**: Automatically encoded as UTF-8 bytes
- **Public keys**: Detected and properly converted to byte arrays
- **Numbers**: Converted to little-endian bytes (for crafting IDs and other numeric seeds)

## Implementation Details

### ATA Calculation

ATAs are derived following these steps:

1. Convert wallet address to bytes
2. Convert SPL Token Program ID to bytes
3. Convert token mint address to bytes
4. Use these three values as seeds for `findProgramAddress` with the SPL Associated Token Program ID
5. Return the first result (discarding the bump seed)

### PDA Calculation

PDAs are derived following these steps:

1. Convert each seed to the appropriate byte format:
   - Numbers → little-endian 8-byte arrays
   - Public keys → 32-byte arrays
   - Strings → UTF-8 encoded bytes
2. Call `findProgramAddress` with the seeds and program ID
3. Return both the address and the canonical bump seed

## Libraries Used

- `@solana/web3.js` - The main Solana JavaScript SDK
- `@solana/spl-token` - SPL Token Program client library

## Usage Example

### Finding an ATA

To find the Associated Token Account for a wallet and token mint:

1. Enter the wallet address
2. Enter the token mint address
3. Click "Calculate ATA"

### Finding a PDA

To find a Program Derived Address:

1. Enter the program ID
2. Add seeds in the correct order
3. Click "Calculate PDA"

## Development

The application is entirely client-side and contains a single HTML file with embedded CSS and JavaScript.

To make changes:

- Modify the HTML, CSS, or JavaScript in the `index.html` file
- Use locally by opening the file in a browser

## Further Reading

- [Solana ATA Documentation](https://spl.solana.com/associated-token-account)
- [Solana PDA Documentation](https://solana.com/docs/core/pda)
- [Solana Web3.js](https://solana.com/docs/clients/javascript)

## License

This project is licensed under the MIT License. See the LICENSE file for details.
