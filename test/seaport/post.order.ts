import {erc8001, order721} from "../data/orders";
import {SeaportAPI} from "../../src/api/seaport";
import * as secrets from '../../../secrets.json'
import {OrderSide, SellOrderParams} from "web3-accounts";
import {SeaportSDK} from "../../src/index";

const address = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const chainId = 4
const apiConfig = {
    1: {
        chainId,
        proxyUrl: 'http://127.0.0.1:7890',
        apiTimeout: 10200,
        protocolFeePoints: 250
    },
    4: {
        chainId,
        proxyUrl: 'http://127.0.0.1:7890',
        apiTimeout: 10200,
        protocolFeePoints: 250
    }
};


;(async () => {
        const sdk = new SeaportSDK(
            {chainId, address, privateKeys: secrets.privateKeys},
            apiConfig[chainId])
        try {
            const query = {
                asset_contract_address: '0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53', //
                token_ids: ['8001'],
                side:OrderSide.Sell

            }
            const {orders} = await sdk.api.getOrders(query)
            console.log(orders)

            // "token": "0x5FecBbBAf9f3126043A48A35eb2eb8667D469D53",
            //                     "identifierOrCriteria": "8001",
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
            const res = await sdk.api.postOrder(JSON.stringify(erc8001))

            // const res = await api.postOrder(JSON.stringify(order721))


        } catch (e) {
            console.log(e)
        }
    }
)()


