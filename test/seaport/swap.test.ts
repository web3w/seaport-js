import * as secrets from '../../../secrets.json'
import {ETHToken, SellOrderParams, transactionToCallData} from "web3-accounts";
import {SeaportSDK} from "../../src/index";

const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

const chainId = 4
const apiConfig = {
        1: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 10200,
            protocolFeePoints: 250
        },
        4: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 10200,
            protocolFeePoints: 250
        }
    }

;(async () => {
        const sdk = new SeaportSDK({
            chainId,
            address: buyer,
            privateKeys: secrets.privateKeys
        }, apiConfig[chainId])
        try {
            const asset = (await sdk.getOwnerAssets({limit: 2}))[1]
            const sellParams = {
                "asset": {
                    "tokenId": asset.token_id,
                    "tokenAddress": asset.address,
                    "schemaName": asset.schema_name,
                    "collection": {
                        "royaltyFeePoints": asset.royaltyFeePoints,
                        "royaltyFeeAddress": asset.royaltyFeeAddress
                    }
                },
                "startAmount": 0.02
            } as SellOrderParams
            const order = await sdk.contracts.createSellOrder(sellParams)

            // const callData = await sdk.fulfillBasicOrder({order})
            const callData = await sdk.contracts.fulfillAdvancedOrder({order,takerAmount:"1"})
            const tx = await sdk.swap.batchBuyWithETHSimulate([{
                value: callData?.value?.toString() || "",
                tradeData: callData?.data || "",
                marketId: "1"
            }])
           console.log("OK",tx)

        } catch (e) {
            console.log(e)
        }
    }
)()
