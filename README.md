# seaport-js<!-- omit in toc -->

SDK for the Seaport protocol v1.1
https://web3w.github.io/seaport-js/

## Installation

In your project, run:

```bash
npm i seaport-js
```

## Getting Started

To get started, create a new Seaport client, using your chainId and address:

```JavaScript
import {SeaportSDK} from 'seaport-js'
import {Web3Wallets} from 'web3-wallets'

const {chainId, address} = new Web3Wallets({name:'metamask'})
const seaport = new SeaportSDK({chainId, address})
```

In the browser environment, only the chainId and address need to be configured，If you want to use the bash environment,
configure the private key and RPC

```ts
type WalletInfo = {
    chainId: number;
    address: string;
    privateKeys?: string[];
    rpcUrl?: RpcInfo; // User-defined RPC information of the provider
}

type APIConfig = {
    apiKey?: string; //opensea api key
}
const rpcUrl = {url: "https://..."}
const wallet = {chainId, address, privateKeys: ["0x..."]}
const config = {apiKey: "xx-xxx"}
const seaport = new SeaportSDK(wallet, config)
``` 
 

### Fetching Assets

Assets are items on OpenSea. They can be non-fungible (conforming to standards like ERC721), semi-fungible (like ERC1155
assets), and even fungible (ERC20).

Assets are represented by the `Asset` type, defined in TypeScript:

```TypeScript
/**
 * Simple, unannotated non-fungible asset spec
 */
export interface Asset {
    // The asset's token ID, or null if ERC-20
    tokenId: string | undefined;
    // The asset's contract address
    tokenAddress: string;
    // 'erc20' | 'erc721' | 'erc1155' | 'cryptokitties' | 'ensshortnameauction' | 'cryptopunks'
    schemaName: string;
    // Optional for fungible items
    name?: string;
    data?: string;
    decimals?: number;
    chainId?: number;
    collection?: {
        "royaltyFeePoints": 500,
        "royaltyFeeAddress": "0x9F7A946d935c8Efc7A8329C0d894A69bA241345A"
    };
}

```

The `Asset` type is the minimal type you need for most marketplace actions. `SchemaName` is optional. If omitted, most
actions will assume you're referring to a non-fungible, ERC721 asset. Other options include 'ERC20' and 'ERC1155'.

You can fetch an asset using the `OpenSeaAPI`, which will return an `OpenSeaAsset` for you (`OpenSeaAsset`
extends `Asset`):

Owner Asset

```TypeScript

const ownerAssets = (await seaport.getOwnerAssets({limit: 1}))

```

Query Asset

```ts

const assetsQuery = {
    assets: [{
        asset_contract_addresses,  // string
        token_ids //string | number | null
    }],
    include_orders: true,
} as AssetsQueryParams

const assetFee = await seaport.getAssetsFees([asset_contract_addresses])

const asset = await seaport.api.getAssets(assetsQuery) 
```

### Making Offers

Once you have your asset, you can do this to make an offer on it:

```JavaScript
// Token ID and smart contract address for a non-fungible token:
const {tokenId, tokenAddress} = YOUR_ASSET

const offer = await seaport.createBuyOrder({
    asset: {
        tokenId,
        tokenAddress,
        schemaName // WyvernSchemaName. If omitted, defaults to 'ERC721'. Other options include 'ERC20' and 'ERC1155'
    },
    // Value of the offer, in units of the payment token (or wrapped ETH if none is specified):
    startAmount: 1.2,
})
```

### Making Listings / Selling Items

To sell an asset, call `createSellOrder`. You can do a fixed-price listing, where `startAmount` is equal to `endAmount`,
or a declining [Dutch auction](https://en.wikipedia.org/wiki/Dutch_auction), where `endAmount` is lower and the price
declines until `expirationTime` is hit:

```JavaScript
// Expire this auction one day from now.
// Note that we convert from the JavaScript timestamp (milliseconds):
const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24)

const listing = await seaport.createSellOrder({
    asset: {
        tokenId,
        tokenAddress,
        schemaName,
        "collection": {
            royaltyFeeAddress,
            royaltyFeePoints
        }
    },
    startAmount: 3,
    // If `endAmount` is specified, the order will decline in value to that amount until `expirationTime`. Otherwise, it's a fixed-price order:
    endAmount: 0.1,
    expirationTime
})
```

### Posting Order

```ts
// const orderStr = JSON.stringify(offer)
const orderStr = JSON.stringify(listing)
const order = await seaport.postOrder(orderStr).catch((err: any) => {
    throw err
}) 
```

### Fetching Orders

To retrieve a list of offers and auction on an asset, you can use an instance of the `OpenSeaAPI` exposed on the client.
Parameters passed into API filter objects are underscored instead of camel-cased, similar to the
main [OpenSea API parameters](https://docs.opensea.io/v1.0/reference):

```JavaScript
import {OrderSide} from 'seaport-js'

// Get offers (bids), a.k.a. orders where `side == 0` 
const query = {
    asset_contract_address: tokenAddress, //
    token_ids: [tokenId]
}
const {orders, count} = await seaport.api.getOrders(query)

// Get page 2 of all auctions, a.k.a. orders where `side == 1`
const {orders, count} = await seaport.api.getOrders({
    asset_contract_address: tokenAddress,
    token_ids: [tokenId],
    side: OrderSide.Sell
}, 2)

// Get Owner Orders
const {orders, count} = await seaport.getOwnerOrders()
```

Note that the listing price of an asset is equal to the `currentPrice` of the **lowest valid sell order** on the asset.
Users can lower their listing price without invalidating previous sell orders, so all get shipped down until they're
cancelled or one is fulfilled.

To learn more about signatures, makers, takers, listingTime vs createdTime and other kinds of order terminology, please
read the [**Terminology Section**](https://docs.opensea.io/reference#terminology) of the API Docs.

The available API filters for the orders endpoint is documented in the `OrderJSON` interface below, but see the
main [API Docs](https://docs.opensea.io/reference#reference-getting-started) for a playground, along with more
up-to-date and detailed explanantions.

```TypeScript
/**
 * Attrs used by orderbook to make queries easier
 * More to come soon!
 */
maker ? : string, // Address of the order's creator
    taker ? : string, // The null address if anyone is allowed to take the order
    side ? : OrderSide, // 0 for offers, 1 for auctions
    owner ? : string, // Address of owner of the order's asset 
    asset_contract_address ? : string, // Contract address for order's asset 
    token_ids ? : Array < number | string >

    // For pagination
    limit ? : number,
    offset ? : number
```

### Buying Items

To buy an item , you need to **fulfill a sell order**. To do that, it's just one call:

```JavaScript
const orders = await seaport.api.getOrders({side: OrderSide.Sell, ...})
const tx = await seaport.fulfillOrder(JSON.stringify(orders[0]))
console.log(tx.hash)
await tx.wait()

const orderList = [{orderStr: JSON.stringify(order[0])}, {orderStr: JSON.stringify(order[0])}]
const res = await sdk.fulfillOrders({orderList})
console.log(res.hash)
await res.wait()
```

Note that the `fulfillOrder` promise resolves when the transaction has been confirmed and mined to the blockchain. To
get the transaction hash before this happens, add an event listener (see [Listening to Events](#listening-to-events))
for the `TransactionCreated` event.

If the order is a sell order (`order.side === OrderSide.Sell`), the taker is the *buyer* and this will prompt the buyer
to pay for the item(s).

### Accepting Offers

Similar to fulfilling sell orders above, you need to fulfill a buy order on an item you own to receive the tokens in the
offer.

```JavaScript
const orders = await seaport.api.getOrders({side: OrderSide.Buy, ...})
const tx = await seaport.fulfillOrder(JSON.stringify(orders[0]))
console.log(tx.hash)
await tx.wait()
```

If the order is a buy order (`order.side === OrderSide.Buy`), then the taker is the *owner* and this will prompt the
owner to exchange their item(s) for whatever is being offered in return. See [Listening to Events](#listening-to-events)
below to respond to the setup transactions that occur the first time a user accepts a bid.

### Transferring Items or Coins (Gifting)

A handy feature in OpenSea.js is the ability to transfer any supported asset (fungible or non-fungible tokens) in one
line of JavaScript.

To transfer an ERC-721 asset or an ERC-1155 asset, it's just one call:

```JavaScript

const transactionHash = await seaport.transfer({
    asset: {tokenId, tokenAddress},
    fromAddress, // Must own the asset
    toAddress
})
```

For fungible ERC-1155 assets, you can set `schemaName` to "ERC1155" and pass a `quantity` in to transfer multiple at
once:

```JavaScript

const transactionHash = await seaport.transfer({
    asset: {
        tokenId,
        tokenAddress,
        schemaName: "ERC1155"
    },
    toAddress,
    quantity: 2,
})
```

#### Checking Balances and Ownerships

The nice thing about the `Asset` type is that it unifies logic between fungibles, non-fungibles, and semi-fungibles.

Once you have an `Asset`, you can see how many any account owns, regardless of whether it's an ERC-20 token or a
non-fungible good:

```JavaScript

const asset = {
    tokenId: '9',
    tokenAddress: '0xb556f251eacbec4badbcddc4a146906f2c095bee',
    schemaName: 'ERC721'
}

const balance = await seaport.getAssetBalances(asset, accountAddress)

```

You can use this same method for fungible ERC-20 tokens like wrapped ETH (WETH). As a convenience, you can use this
fungible wrapper for checking fungible balances:

```JavaScript
const balanceOfWETH = await seaport.getTokenBalance({
    accountAddress, // string
    tokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
})
```
