# Guest Book contract in JavaScript

This is an equivalent JavaScript implementation of the guest book example.

## Build the contract

```
yarn
yarn build
```

## Test the contract with workspaces-js

```
yarn test
```

## Deploy and init the contract with NEAR CLI

```
export CONTRACT_ID=guest-book-js.testnet
near js deploy --base64File build/contract.base64 --deposit 0.1 --accountId $CONTRACT_ID
near js call $CONTRACT_ID init --deposit 0.1 --accountId $CONTRACT_ID
```
