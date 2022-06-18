import * as secrets from '../../../secrets.json'
import {ETHToken, SellOrderParams, transactionToCallData} from "web3-accounts";
import {SeaportSDK} from "../../src/index";

const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

const chainId = 4
const apiConfig = {
        1: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 10200,
            protocolFeePoint: 250
        },
        4: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 10200,
            protocolFeePoint: 250
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
                        "royaltyFeePoint": asset.royaltyFeePoint,
                        "royaltyFeeAddress": asset.royaltyFeeAddress
                    }
                },
                "startAmount": 0.02
            } as SellOrderParams


            const order = await sdk.sea.createSellOrder(sellParams)

            // const callData = await sdk.sea.fulfillBasicOrder({order})
            //  //fulfillAdvancedOrder (advancedOrder, criteriaResolvers, fulfillerConduitKey, recipient, payableOverrides)
            const callData = await sdk.sea.fulfillAdvancedOrder({order})
            const tx = await sdk.sea.ethSend(transactionToCallData(callData))
            await tx.wait()
            console.log(tx.hash)

        } catch (e) {
            console.log(e)
        }
    }
)()
