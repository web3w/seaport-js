
// @ts-ignore
import * as secrets from '../../../secrets.json'
import {BuyOrderParams, OrderSide} from "web3-accounts";
import {SeaportSDK} from "../../src/index";
import {apiConfig} from "../data/orders";

const buyer = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'


const chainId = 4
;(async () => {
        const sdk = new SeaportSDK({
            chainId,
            address: buyer,
            privateKeys: secrets.privateKeys
        }, apiConfig[chainId])
        try {
            // const openseaAsset = (await sdk.getOwnerAssets({limit: 1}))[0]
            // const asset = openseaAssetToAsset(openseaAsset)
            const asset = {
                tokenId: '1',
                tokenAddress: '0x13e4ccba895870d99e4e196ac1d4b678aea196be',
                schemaName: 'ERC721'
            }

            const buyParams = {
                asset,
                "startAmount": 0.002
            } as BuyOrderParams

            // const apporve = await sdk.getOrderApprove(buyParams, OrderSide.Buy)
            const order = await sdk.createBuyOrder(buyParams)
            // console.log(order)
            const res = await sdk.postOrder(JSON.stringify(order))
            console.log(res)

            // const tx = await sdk.fulfillOrder(JSON.stringify(order))
            // await tx.wait()
            // console.log(tx.hash)

        } catch (e) {
            console.log(e)
        }
    }
)()
