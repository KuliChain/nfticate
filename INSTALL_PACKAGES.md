# Package Installation Required

## QR Code Generation Package

For certificate QR code generation to work properly, please install the qrcode package:

```bash
npm install qrcode
```

## Package Information

- **qrcode**: Used for generating QR codes for certificate verification
- **@types/qrcode**: TypeScript types (optional if using TypeScript)

## After Installation

Once installed, the QR code generation will work automatically in:
- Certificate issuance (`/dashboard/issue`)
- QR code utilities (`/lib/qrcode.js`)

## Usage

The QR code will contain verification URLs that link to:
```
{YOUR_DOMAIN}/verify/{CERTIFICATE_ID}
```

## Blockchain Integration Note

The current implementation includes placeholder functions for blockchain integration. The actual smart contract integration should be implemented by the blockchain developer in:

- `src/app/dashboard/issue/page.js` - `submitToBlockchain()` function
- `src/lib/database.js` - `updateCertificateBlockchainInfo()` function

## Firebase Storage

Make sure Firebase Storage is properly configured for file uploads in the Firebase Console.