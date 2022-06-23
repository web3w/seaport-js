// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as secrets from '../../../secrets.json'
import {ETHToken, OrderSide, SellOrderParams, transactionToCallData} from "web3-accounts";
import {SeaportSDK} from "../../src/index";
import {apiConfig, asset721} from "../data/orders";
import {openseaAssetToAsset} from "../../src/utils/order";

// const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyer = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'

//  proxyUrl: 'http://127.0.0.1:7890'
const chainId = 1
;(async () => {
        const sdk = new SeaportSDK({
            chainId,
            address: buyer,
            privateKeys: secrets.privateKeys
        }, apiConfig[chainId])
        try {
            // const openseaAsset = (await sdk.getOwnerAssets({limit: 1}))[0]
            // console.log(openseaAsset)
            // const sellParams = {
            //     "asset": {
            //         "tokenId": asset.token_id,
            //         "tokenAddress": asset.address,
            //         "schemaName": asset.schema_name,
            //         "collection": {
            //             "royaltyFeePoints": asset.royaltyFeePoints,
            //             "royaltyFeeAddress": asset.royaltyFeeAddress
            //         }
            //     },
            //     "startAmount": 0.5
            // } as SellOrderParams
            // const query = {
            //     asset_contract_address: '0x984ac9911c6839a6870a1040a5fb89dd66513bc5', //
            //     token_ids: ['6136'],
            //     side:OrderSide.Sell
            //
            // }
            // const {orders} = await sdk.api.getOrders(query)
            // console.log(orders)

            // const asset = openseaAssetToAsset(openseaAsset)//asset721[chainId][0]
            const asset = asset721[chainId][0]
            const sellParams = {
                asset,
                "startAmount": 0.6
            } as SellOrderParams
            const approve = await sdk.getOrderApprove(sellParams, OrderSide.Sell)
            const order = await sdk.createSellOrder(sellParams)
            // await sdk.contracts.checkOrderPost(JSON.stringify(order))
            const res = await sdk.api.postOrder(JSON.stringify(order))
            console.log("postOrder success", res)

            // const tx = await sdk.fulfillOrder(JSON.stringify(order))
            // await tx.wait()
            // console.log(tx.hash)

        } catch (e) {
            console.log(e)
        }
    }
)()


