import * as secrets from '../../../secrets.json'
import {ETHToken, OrderSide, SellOrderParams, transactionToCallData} from "web3-accounts";
import {SeaportSDK} from "../../src/index";
import {generateRandomSalt} from "../../src/seaport";
import {SeaportAPI} from "../../src/api/seaport";
import {apiConfig} from "../data/orders";

const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
// const buyer = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'

// const apiBaseUrl: 'https://api.element.market/bridge/opensea'},
// 44: {apiBaseUrl: 'https://api-test.element.market/bridge/opensea'},
//  proxyUrl: 'http://127.0.0.1:7890'
const chainId = 4
;(async () => {
        // const solt = generateRandomSalt()
        // console.log(solt)
        const sdk = new SeaportAPI({...apiConfig[chainId], chainId})
        try {
            const owner = {
                owner: buyer,
                limit: 1,
            }
            const ownerAsset = await sdk.getAssets(owner)
            console.log(ownerAsset.length)
            // const ownerOrders = await sdk.getOrders(owner)
            // console.log(ownerOrders.count)
            const query = {
                asset_contract_address: '0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53', //
                token_ids: ['8001'],
                side: OrderSide.All
            }

            const {orders} = await sdk.getOrders(query)
            console.log(orders)

        } catch (e) {
            console.log(e)
        }
    }
)()


