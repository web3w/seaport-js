import {apiConfig, erc8001, gemOrder, order721} from "../data/orders";
import {SeaportAPI} from "../../src/api/seaport";
// @ts-ignore
import * as secrets from '../../../secrets.json'
import {OrderSide, SellOrderParams} from "web3-accounts";
import {SeaportSDK} from "../../src/index";

const address = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const chainId = 1
;(async () => {
        const sdk = new SeaportSDK(
            {chainId, address, privateKeys: secrets.privateKeys},
            apiConfig[chainId])
        try {

            const sellParams = {
                "asset": {
                    "tokenId": "8001",
                    "tokenAddress": "0x5FecBbBAf9f3126043A48A35eb2eb8667D469D53",
                    "schemaName": "ERC721",
                    "collection": {
                        "royaltyFeePoints": 0,
                        "royaltyFeeAddress": ""
                    }
                },
                "startAmount": 0.02
            } as SellOrderParams


            // const order = await sdk.sea.createSellOrder(sellParams)
            // console.log(order)
            const res = await sdk.postOrder(JSON.stringify(order721))


        } catch (e) {
            console.log(e)
        }
    }
)()


