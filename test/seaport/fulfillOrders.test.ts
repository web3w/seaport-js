import {apiConfig, erc8001, gemOrder, order721} from "../data/orders";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as secrets from '../../../secrets.json'
import {OrderSide, SellOrderParams} from "web3-accounts";
import {SeaportSDK} from "../../src/index";

const address = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const chainId = 4
;(async () => {
        const sdk = new SeaportSDK(
            {chainId, address, privateKeys: secrets.privateKeys},
            apiConfig[chainId])
        try {
            const sellParams = {
                "asset": {
                    "tokenId": "8001",
                    "tokenAddress": "0x5FecBbBAf9f3126043A48A35eb2eb8667D469D53",
                    "schemaName": "ERC721"
                },
                "startAmount": 0.02
            } as SellOrderParams
            const order = await sdk.createSellOrder(sellParams)

            const orderStr = JSON.stringify(order)
            // const res = await sdk.cancelOrders([orderStr])

            const res = await sdk.fulfillOrders({orderList: [{orderStr}]})
            await res.wait()
            console.log(res.hash)
            // const query = {
            //     asset_contract_address: '0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53', //
            //     token_ids: ['8001'],
            //     side: OrderSide.All
            // }
            // const {orders} = await sdk.api.getOrders(query)
            // console.log(orders)
            // const res = await sdk.fulfillOrders({orderList: [{orderStr: JSON.stringify(orders[0])}]})

        } catch (e) {
            console.log(e)
        }
    }
)()


