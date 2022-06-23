
import {SeaportSDK} from "../../src/index";
// @ts-ignore
import * as secrets from '../../../secrets.json'
import {getEIP712StructHash} from "web3-wallets";
import {EIP_712_ORDER_TYPE, EIP_712_PRIMARY_TYPE} from "../../src/constants";
import {OrderComponents} from "../../src/types";
import {ethers} from "ethers";


/**
 * Calculates the order hash of order components so we can forgo executing a request to the contract
 * This saves us RPC calls and latency.
 */
export function getOrderHash (orderComponents: OrderComponents): string {
    const offerItemTypeString =
        "OfferItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)";
    const considerationItemTypeString =
        "ConsiderationItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)";
    const orderComponentsPartialTypeString =
        "OrderComponents(address offerer,address zone,OfferItem[] offer,ConsiderationItem[] consideration,uint8 orderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 conduitKey,uint256 counter)";
    const orderTypeString = `${orderComponentsPartialTypeString}${considerationItemTypeString}${offerItemTypeString}`;

    const offerItemTypeHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(offerItemTypeString)
    );
    const considerationItemTypeHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(considerationItemTypeString)
    );
    const orderTypeHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(orderTypeString)
    );

    const offerHash = ethers.utils.keccak256(
        "0x" +
        orderComponents.offer
            .map((offerItem) => {
                return ethers.utils
                    .keccak256(
                        "0x" +
                        [
                            offerItemTypeHash.slice(2),
                            offerItem.itemType.toString().padStart(64, "0"),
                            offerItem.token.slice(2).padStart(64, "0"),
                            ethers.BigNumber.from(offerItem.identifierOrCriteria)
                                .toHexString()
                                .slice(2)
                                .padStart(64, "0"),
                            ethers.BigNumber.from(offerItem.startAmount)
                                .toHexString()
                                .slice(2)
                                .padStart(64, "0"),
                            ethers.BigNumber.from(offerItem.endAmount)
                                .toHexString()
                                .slice(2)
                                .padStart(64, "0"),
                        ].join("")
                    )
                    .slice(2);
            })
            .join("")
    );

    const considerationHash = ethers.utils.keccak256(
        "0x" +
        orderComponents.consideration
            .map((considerationItem) => {
                return ethers.utils
                    .keccak256(
                        "0x" +
                        [
                            considerationItemTypeHash.slice(2),
                            considerationItem.itemType.toString().padStart(64, "0"),
                            considerationItem.token.slice(2).padStart(64, "0"),
                            ethers.BigNumber.from(
                                considerationItem.identifierOrCriteria
                            )
                                .toHexString()
                                .slice(2)
                                .padStart(64, "0"),
                            ethers.BigNumber.from(considerationItem.startAmount)
                                .toHexString()
                                .slice(2)
                                .padStart(64, "0"),
                            ethers.BigNumber.from(considerationItem.endAmount)
                                .toHexString()
                                .slice(2)
                                .padStart(64, "0"),
                            considerationItem.recipient.slice(2).padStart(64, "0"),
                        ].join("")
                    )
                    .slice(2);
            })
            .join("")
    );

    const derivedOrderHash = ethers.utils.keccak256(
        "0x" +
        [
            orderTypeHash.slice(2),
            orderComponents.offerer.slice(2).padStart(64, "0"),
            orderComponents.zone.slice(2).padStart(64, "0"),
            offerHash.slice(2),
            considerationHash.slice(2),
            orderComponents.orderType.toString().padStart(64, "0"),
            ethers.BigNumber.from(orderComponents.startTime)
                .toHexString()
                .slice(2)
                .padStart(64, "0"),
            ethers.BigNumber.from(orderComponents.endTime)
                .toHexString()
                .slice(2)
                .padStart(64, "0"),
            orderComponents.zoneHash.slice(2),
            orderComponents.salt.slice(2).padStart(64, "0"),
            orderComponents.conduitKey.slice(2).padStart(64, "0"),
            ethers.BigNumber.from(orderComponents.counter)
                .toHexString()
                .slice(2)
                .padStart(64, "0"),
        ].join("")
    );

    return derivedOrderHash;
}


const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

const order = {
    "offerer": "0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401",
    "zone": "0x0000000000000000000000000000000000000000",
    "orderType": 2,
    "startTime": "1655517905",
    "endTime": "1655517905057",
    "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "salt": "0x181748e8725",
    "offer": [
        {
            "itemType": 3,
            "token": "0xb6316833725f866f2aad846de30a5f50f09e247b",
            "identifierOrCriteria": "1655202183834",
            "startAmount": "1",
            "endAmount": "1"
        }
    ],
    "consideration": [
        {
            "itemType": 0,
            "token": "0x0000000000000000000000000000000000000000",
            "identifierOrCriteria": "0",
            "startAmount": "20000000000000000",
            "endAmount": "20000000000000000",
            "recipient": "0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401"
        }
    ],
    "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
    "counter": 0
}
const hash = getOrderHash(order)
const structhash = getEIP712StructHash(EIP_712_PRIMARY_TYPE, EIP_712_ORDER_TYPE, order)
console.assert(hash == "0xa1dc54ca93f82077855645df0a030fd8c242a13cd4e0c29682ab88a927524a1d")
console.assert(hash == structhash)
;(async () => {
    const sdk = new SeaportSDK({
        chainId: 1,
        address: buyer,
        privateKeys: secrets.privateKeys
    })
    const orderHash = await sdk.contracts.seaport.getOrderHash(order)
    console.assert(hash == orderHash)
})()
