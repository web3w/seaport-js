import * as secrets from '../../../secrets.json'
import {ETHToken, SellOrderParams} from "web3-accounts";
import {SeaportEx} from "../../src/seaportEx/seaportEx";

const buyer = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const seller = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'


;(async () => {
        const buyEx = new SeaportEx({
            chainId: 4,
            address: buyer,
            privateKeys: secrets.privateKeys
        })
        try {
            const sellParams = {
                "asset": {
                    "tokenId": "9",
                    "tokenAddress": "0xb556f251eacbec4badbcddc4a146906f2c095bee",
                    "schemaName": "ERC721",
                    "collection": {
                        "transferFeeAddress": "0x0a56b3317ed60dc4e1027a63ffbe9df6fb102401",
                        "elementSellerFeeBasisPoints": 200
                    }
                },
                "startAmount": 0.02
            } as SellOrderParams
            const sellData = await buyEx.createSellOrder(sellParams)
            const orderStr = JSON.stringify(sellData)

        } catch (e) {
            console.log(e)
        }
    }
)()
