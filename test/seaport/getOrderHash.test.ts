
import {SeaportSDK} from "../../src/index";
// @ts-ignore
import * as secrets from '../../../secrets.json'
import {getEIP712StructHash} from "web3-wallets";
import {EIP_712_ORDER_TYPE, EIP_712_PRIMARY_TYPE} from "../../src/constants";

import {getOrderHash} from "../utisl";
import {orderV2} from "../data/orders";

const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

const hash = getOrderHash(orderV2)
const structhash = getEIP712StructHash(EIP_712_PRIMARY_TYPE, EIP_712_ORDER_TYPE, orderV2)
console.assert(hash == "0xa1dc54ca93f82077855645df0a030fd8c242a13cd4e0c29682ab88a927524a1d")
console.assert(hash == structhash)
;(async () => {
    const sdk = new SeaportSDK({
        chainId: 1,
        address: buyer,
        privateKeys: secrets.privateKeys
    })
    const orderHash = await sdk.contracts.seaport.getOrderHash(orderV2)
    console.assert(hash == orderHash)
    console.log(await sdk.getOwnerOrders({side:1}))
})()
