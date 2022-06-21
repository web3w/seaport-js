import * as secrets from '../../../secrets.json'
import {ETHToken, OrderSide, SellOrderParams, transactionToCallData} from "web3-accounts";
import {SeaportSDK} from "../../src/index";
import {generateRandomSalt} from "../../src/seaport";
import {SeaportAPI} from "../../src/api/seaport";

// const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyer = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'

// const apiBaseUrl: 'https://api.element.market/bridge/opensea'},
// 44: {apiBaseUrl: 'https://api-test.element.market/bridge/opensea'},
//  proxyUrl: 'http://127.0.0.1:7890'
const chainId = 1
const apiConfig = {
        1: {
            chainId: 1,
            apiBaseUrl: 'https://api.element.market/bridge/opensea',
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 200000,
            protocolFeePoints: 250
        },
        4: {
            chainId: 4,
            // apiBaseUrl: 'https://api-test.element.market/bridge/opensea',
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 200000,
            protocolFeePoints: 250
        }
    }
;(async () => {
        const solt = generateRandomSalt()
        console.log(solt)
        const sdk = new SeaportAPI(apiConfig[chainId])
        try {
            const tokens = {
                owner: buyer,
                limit: 1,
            }
            const asset = await sdk.getAssets(tokens)
            console.log(asset)

        } catch (e) {
            console.log(e)
        }
    }
)()


