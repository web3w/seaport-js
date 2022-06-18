import * as secrets from '../../../../secrets.json'
import {Seaport} from "../../src/Seaport";
import {SeaportSDK} from "../../src/index";


const seller = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

    ///**
    //  * @dev Basic orders can supply any number of additional recipients, with the
    //  *      implied assumption that they are supplied from the offered ETH (or other
    //  *      native token) or ERC20 token for the order.
    //  */
    // struct AdditionalRecipient {
    //     uint256 amount;
    //     address payable recipient;
    // }


// /**
//  * @dev The full set of order components, with the exception of the counter,
//  *      must be supplied when fulfilling more sophisticated orders or groups of
//  *      orders. The total number of original consideration items must also be
//  *      supplied, as the caller may specify additional consideration items.
//  */
// struct OrderParameters {
//     address offerer; // 0x00
//     address zone; // 0x20
//     OfferItem[] offer; // 0x40
//     ConsiderationItem[] consideration; // 0x60
//     OrderType orderType; // 0x80
//     uint256 startTime; // 0xa0
//     uint256 endTime; // 0xc0
//     bytes32 zoneHash; // 0xe0
//     uint256 salt; // 0x100
//     bytes32 conduitKey; // 0x120
//     uint256 totalOriginalConsiderationItems; // 0x140
//     // offer.length                          // 0x160
// }
    //
// struct BasicOrderParameters {
//     // calldata offset
//     address considerationToken; // 0x24
//     uint256 considerationIdentifier; // 0x44
//     uint256 considerationAmount; // 0x64
//     address payable offerer; // 0x84
//     address zone; // 0xa4
//     address offerToken; // 0xc4
//     uint256 offerIdentifier; // 0xe4
//     uint256 offerAmount; // 0x104
//     BasicOrderType basicOrderType; // 0x124
//     uint256 startTime; // 0x144
//     uint256 endTime; // 0x164
//     bytes32 zoneHash; // 0x184
//     uint256 salt; // 0x1a4
//     bytes32 offererConduitKey; // 0x1c4
//     bytes32 fulfillerConduitKey; // 0x1e4
//     uint256 totalOriginalAdditionalRecipients; // 0x204
//     AdditionalRecipient[] additionalRecipients; // 0x224
//     bytes signature; // 0x244
//     // Total length, excluding dynamic array data: 0x264 (580)
// }
    //
    //(address considerationToken,
    // uint256 considerationIdentifier,
    // uint256 considerationAmount,
    // address offerer,
    // address zone,
    // address offerToken,
    // uint256 offerIdentifier,
    // uint256 offerAmount,
    // uint8 basicOrderType,
    // uint256 startTime,
    // uint256 endTime,
    // bytes32 zoneHash,
    // uint256 salt,
    // bytes32 offererConduitKey,
    // bytes32 fulfillerConduitKey,
    // uint256 totalOriginalAdditionalRecipients,
    // tuple(uint256 amount, address recipient)[] additionalRecipients,
    // bytes signature)

;(async () => {
        try {
            const wallet = {
                chainId: 4,
                address: seller,
                privateKeys: secrets.privateKeys
            }
            const seaport = new Seaport(wallet)

            const fragments = seaport.exchange.interface.fragments
            const callData = "0x87201b4100000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000006c000000000000000000000000000000000000000000000000000000000000006e00000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000000000000000000000000000000057c17fdc47720d3c56cfb0c3ded460267bcd642d00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000005200000000000000000000000000000000000000000000000000000000000000580000000000000000000000000b38544ccf295d78b7ae7b2bae5dbebdb1f09910d000000000000000000000000004c00500000ad104d7dbd00e3ae0a5c00560c000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000062aabcbd0000000000000000000000000000000000000000000000000000000062b3f73c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000470000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f00000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000004052425a34a35e53d916d94393cbc4eb1c572c3c0000000000000000000000000000000000000000000000000000000000001c3a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062967a5c8460000000000000000000000000000000000000000000000000000062967a5c846000000000000000000000000000b38544ccf295d78b7ae7b2bae5dbebdb1f09910d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002aa1efb94e0000000000000000000000000000000000000000000000000000002aa1efb94e0000000000000000000000000008de9c5a032463c561423387a9648c5c7bcc5bc900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005543df729c0000000000000000000000000000000000000000000000000000005543df729c000000000000000000000000000df8aaa3b5042b13fa2464ce7c6b29773e0e7ada10000000000000000000000000000000000000000000000000000000000000040f97da91b9288cd7b72e9e40d47d0e1d8f0e91123e48d51d9c154ff531ccde44a5fba5df37df570d134387a67fe158b10586a44dc3f32cefd3c0f3f21813a2e7600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002"
            for (const frag of fragments) {
                if (frag.type != "function") continue
                const sighash = seaport.exchange.interface.getSighash(frag.name)
                // console.log(frag.name, seaport.exchange.interface.getSighash(frag.name))
                if (callData.substring(0, 10) == sighash) {
                    console.log(frag.name, seaport.exchange.interface.getSighash(frag.name))
                    console.log(frag.format('full'), '\n')
                    const functionData = seaport.exchange.interface.decodeFunctionData(frag.name, callData)

                    //     AdvancedOrder[] calldata advancedOrders,
                    //     CriteriaResolver[] calldata criteriaResolvers,
                    //     FulfillmentComponent[][] calldata offerFulfillments,
                    //     FulfillmentComponent[][] calldata considerationFulfillments,
                    //     bytes32 fulfillerConduitKey,
                    //     address recipient,
                    //     uint256 maximumFulfilled

                    console.log("advancedOrders:AdvancedOrder[]")
                    for (const order of functionData.advancedOrders) {

                        for (const param of frag.inputs[0].components) {
                            if (param.name == "parameters") {
                                console.log("parameters:")
                                for (const val of param.components) {
                                    console.log(`    ${val.name}:'${order.parameters[val.name].toString()}',`)
                                }
                            } else {
                                console.log(`${param.name}:'${order[param.name].toString()}',`)
                            }
                        }
                    }
                    console.log("criteriaResolvers:CriteriaResolver[]")
                    for (const resolver of functionData.criteriaResolvers) {
                        for (const param of frag.inputs[1].components) {
                            console.log(`${param.name}:'${resolver[param.name].toString()}',`)
                        }
                    }
                    console.log("offerFulfillments:FulfillmentComponent[][]")
                    for (const offers of functionData.offerFulfillments) {
                        for (const offer of offers) {
                            console.log(`{orderIndex:'${offer.orderIndex.toString()}',itemIndex:'${offer.itemIndex.toString()}}`)
                        }
                    }

                    console.log("considerationFulfillments: FulfillmentComponent[][]")
                    for (const offers of functionData.considerationFulfillments) {
                        for (const offer of offers) {
                            for (const offer of offers) {
                                console.log(`{orderIndex:'${offer.orderIndex.toString()}',itemIndex:'${offer.itemIndex.toString()}}`)
                            }
                        }
                    }

                    console.log("fulfillerConduitKey:", functionData.fulfillerConduitKey)
                    console.log("recipient:", functionData.recipient)
                    console.log("maximumFulfilled:", functionData.maximumFulfilled.toString())

                    // console.log(JSON.stringify(functionData,null,2))
                }
            }


            // await buyEx.exAgent.acceptOrder(JSON.stringify(sellData))
        } catch (e) {
            console.log(e)
        }
    }
)()


// cancel 0xfd9f1e10
// fulfillAdvancedOrder 0xe7acab24
// fulfillAvailableAdvancedOrders 0x87201b41
// fulfillAvailableOrders 0xed98a574

// fulfillBasicOrder 0xfb0f3ee1

// fulfillOrder 0xb3a34c4c
// getCounter 0xf07ec373
// getOrderHash 0x79df72bd
// getOrderStatus 0x46423aa7
// incrementCounter 0x5b34b966
// information 0xf47b7740
// matchAdvancedOrders 0x55944a42
// matchOrders 0xa8174404
// name 0x06fdde03
// validate 0x88147732
