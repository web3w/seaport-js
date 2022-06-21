import * as secrets from '../../../secrets.json'
import {ETHToken, OrderSide, SellOrderParams, transactionToCallData} from "web3-accounts";
import {SeaportSDK} from "../../src/index";
import {generateRandomSalt} from "../../src/seaport";

// const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyer = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'

// const apiBaseUrl: 'https://api.element.market/bridge/opensea'},
// 44: {apiBaseUrl: 'https://api-test.element.market/bridge/opensea'},
//  proxyUrl: 'http://127.0.0.1:7890'
const chainId = 1
const apiConfig = {
    1: {
        // apiBaseUrl: 'https://api.element.market/bridge/opensea',
        proxyUrl: 'http://127.0.0.1:7890',
        apiTimeout: 200000,
        protocolFeePoints: 250
    },
    4: {
        // apiBaseUrl: 'https://api-test.element.market/bridge/opensea',
        proxyUrl: 'http://127.0.0.1:7890',
        apiTimeout: 200000,
        protocolFeePoints: 250
    }
}
//89054825639822128
//12788725329216267
//30307779017115151
;(async () => {
        const  solt =  generateRandomSalt()
        console.log(solt)
        const sdk = new SeaportSDK({
            chainId,
            address: buyer,
            privateKeys: secrets.privateKeys
        }, apiConfig[chainId])
        try {
            // const asset = (await sdk.getOwnerAssets({limit: 2}))[1]
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

            const sellParams = {
                "asset": {
                    "tokenId": "6136",
                    "tokenAddress": "0x984ac9911c6839a6870a1040a5fb89dd66513bc5",
                    "schemaName": "ERC721",
                    "collection": {
                        "royaltyFeePoints": 500,
                        "royaltyFeeAddress": "0x545ed214984f3ec57fb6a614f2a6211f0481547f"
                    }
                },
                "startAmount": 0.6
            } as SellOrderParams
            const order = await sdk.createSellOrder(sellParams)
            // await sdk.contracts.checkOrderPost(JSON.stringify(order))
            const res = await sdk.api.postOrder(JSON.stringify(order))


            console.log("postOrder success", res)

            // const callData = await sdk.contracts.fulfillBasicOrder({order})
            //  //fulfillAdvancedOrder (advancedOrder, criteriaResolvers, fulfillerConduitKey, recipient, payableOverrides)
            // const callData = await sdk.contracts.fulfillAdvancedOrder({order})
            // const gas = await sdk.contracts.estimateGas(transactionToCallData(callData))
            // console.log(gas)
            // const tx = await sdk.contracts.ethSend(transactionToCallData(callData))
            // await tx.wait()
            // console.log(tx.hash)

        } catch (e) {
            console.log(e)
        }
    }
)()


