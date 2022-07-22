// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as secrets from '../../../secrets.json'
import {ethers} from "web3-wallets";
import {SeaportSDK} from "../../src/index";
import {apiConfig, asset721} from "../data/orders";
import {openseaAssetToAsset} from "../../src/utils/order";
import {parseEther} from "@ethersproject/units/src.ts/index";

// const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyer = '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'

//  proxyUrl: 'http://127.0.0.1:7890'
const chainId = 1
;(async () => {
        const sdk = new SeaportSDK({
            chainId,
            address: buyer,
            privateKeys: secrets.privateKeys
        }, apiConfig[chainId])
        try {

            const openseaAsset = (await sdk.getOwnerAssets({limit: 1}))[0]
            console.log(openseaAsset)

            const oldOrder = {
                "parameters": {
                    "offerer": "0x32f4B63A46c1D12AD82cABC778D75aBF9889821a",
                    "zone": "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
                    "orderType": 2,
                    "startTime": "1658492751",
                    "endTime": "1659097551",
                    "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "salt": "38495518456876316",
                    "offer": [
                        {
                            "itemType": 2,
                            "token": "0x984ac9911c6839a6870a1040a5fb89dd66513bc5",
                            "identifierOrCriteria": "6136",
                            "startAmount": "1",
                            "endAmount": "1"
                        }
                    ],
                    "consideration": [
                        {
                            "itemType": 0,
                            "token": "0x0000000000000000000000000000000000000000",
                            "identifierOrCriteria": "0",
                            "startAmount": "555000000000000000",
                            "endAmount": "555000000000000000",
                            "recipient": "0x32f4B63A46c1D12AD82cABC778D75aBF9889821a"
                        },
                        {
                            "itemType": 0,
                            "token": "0x0000000000000000000000000000000000000000",
                            "identifierOrCriteria": "0",
                            "startAmount": "15000000000000000",
                            "endAmount": "15000000000000000",
                            "recipient": "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
                        },
                        {
                            "itemType": 0,
                            "token": "0x0000000000000000000000000000000000000000",
                            "identifierOrCriteria": "0",
                            "startAmount": "30000000000000000",
                            "endAmount": "30000000000000000",
                            "recipient": "0x545ed214984f3ec57fb6a614f2a6211f0481547f"
                        }
                    ],
                    "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
                    "counter": 0
                },
                "signature": "0x126747102bf87674b670413fc9b490130c04f1130116f780b272ffd6e66a7be15b6b8c7d30eb18cb2393c2e3feb1721484473bcae93b1b4342e115556e6e03851b"
            }

            // const approve = await sdk.getOrderApprove(sellParams, OrderSide.Sell)
            const order = await sdk.adjustOrder({
                orderStr: JSON.stringify(oldOrder),
                basePrice: ethers.utils.parseEther("0.91").toString(),
                "royaltyFeePoints": 500,
                "royaltyFeeAddress": "0x545ed214984f3ec57fb6a614f2a6211f0481547f"
            })
            // await sdk.contracts.checkOrderPost(JSON.stringify(order))
            const res = await sdk.postOrder(JSON.stringify(order))
            console.log("postOrder success", res)

            // const tx = await sdk.fulfillOrder(JSON.stringify(order))
            // await tx.wait()
            // console.log(tx.hash)

        } catch (e) {
            console.log(e)
        }
    }
)()


