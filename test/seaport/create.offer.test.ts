import * as secrets from '../../../secrets.json'
import {BuyOrderParams, ETHToken, SellOrderParams, transactionToCallData} from "web3-accounts";
import {SeaportSDK} from "../../src/index";
import {validateOrderWithCounter} from "../../src/api/schemas";
import {erc8001, order721} from "../data/orders";

const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'


const chainId = 4
const apiConfig = {
        1: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 20000,
            protocolFeePoints: 250
        },
        4: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 20000,
            protocolFeePoints: 250
        }
    }

;(async () => {

      // if(!validateOrderWithCounter(erc8001)) console.log(validateOrderWithCounter.errors)
    //, apiConfig[chainId]
        const sdk = new SeaportSDK({
            chainId,
            address: buyer,
            privateKeys: secrets.privateKeys
        },apiConfig[chainId])
        try {
            const asset = (await sdk.getOwnerAssets({limit: 2}))[1]
            const buyParams = {
                "asset": {
                    "tokenId": asset.token_id,
                    "tokenAddress": asset.address,
                    "schemaName": asset.schema_name,
                    "collection": {
                        "royaltyFeePoints": asset.royaltyFeePoints,
                        "royaltyFeeAddress": asset.royaltyFeeAddress
                    }
                },
                "startAmount": 0.002
            } as BuyOrderParams

            const order = await sdk.createBuyOrder(buyParams)
            // console.log(order)
            const res = await sdk.api.postOrder(JSON.stringify(order))

            console.log(res)

            const tx = await sdk.fulfillOrder(JSON.stringify(order))
            await tx.wait()
            console.log(tx.hash)

        } catch (e) {
            console.log(e)
        }
    }
)()
