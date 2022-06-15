import * as secrets from '../../../../secrets.json'
import {SeaportEx} from "../../src/seaportEx/seaportEx";
import {SeaportExAgent} from "../../src/seaportEx/seaportExAgent";


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
            const seaport = new SeaportEx(wallet)
            const fragments = seaport.exchange.interface.fragments
            const callData = "0xfb0f3ee1000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000015715e741f5a0000000000000000000000000008b2c6518e3e868f34fbc46c0ac486cbd46efa963000000000000000000000000004c00500000ad104d7dbd00e3ae0a5c00560c00000000000000000000000000e64a3314d1dc2fee6f446b70aae08cca1cb8e5e800000000000000000000000000000000000000000000000000000000000004a6000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000062a958f10000000000000000000000000000000000000000000000000000000062b293710000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014552dc55d5ddd50000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f00000000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f00000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000002e00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000945c7fadd20000000000000000000000000005b3256965e7c3cf26e11fcaf296dfc8807c0107300000000000000000000000000000000000000000000000000128b8ff5ba400000000000000000000000000097a6d8f593e5256ce8ed3458506833eab988522e0000000000000000000000000000000000000000000000000000000000000041fe7cec6442e07bb7474595456b99a66ac365e3a8ef60d05a163975024d89eb5e48ee3fe9a608f725d569eaa87fb9cf58054b15a4ebed9d2351938be039fc3c241b00000000000000000000000000000000000000000000000000000000000000"
            for (const frag of fragments) {
                if (frag.type != "function") continue
                const sighash = seaport.exchange.interface.getSighash(frag.name)
                // console.log(frag.name, seaport.exchange.interface.getSighash(frag.name))
                if (callData.substring(0, 10) == sighash) {
                    console.log(frag.name, seaport.exchange.interface.getSighash(frag.name))
                    console.log(frag.format('full'), '\n')
                    const functionData = seaport.exchange.interface.decodeFunctionData(frag.name, callData)
                    for (const param of frag.inputs[0].components) {
                        console.log(`${param.name}:'${functionData.parameters[param.name].toString()}',`)
                    }

                    // console.log(JSON.stringify(functionData,null,2))
                }
            }


            // await buyEx.exAgent.acceptOrder(JSON.stringify(sellData))
        } catch (e) {
            console.log(e)
        }
    }
)()

//  sell order
// https://etherscan.com/tx/0xe3366d4f4b2c1f39f96ece3856d51025f0b8e07c7f719b124198b86c9a3c6e89
// maker 0x8b2c6518e3e868f34fbc46c0ac486cbd46efa963
//
const order = {
    considerationToken: '0x0000000000000000000000000000000000000000',
    considerationIdentifier: '0',
    considerationAmount: '96570000000000000', // price
    offerer: '0x8B2C6518e3e868f34fBc46c0ac486cBd46EfA963',
    zone: '0x004C00500000aD104D7DBd00e3ae0A5C00560C00',
    offerToken: '0xe64a3314d1DC2fEE6F446b70aAE08cca1Cb8E5e8', // ERC721
    offerIdentifier: '1190',
    offerAmount: '1',
    basicOrderType: '0',
    startTime: '1655265521',
    endTime: '1655870321',
    zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    salt: '91570473717325269',
    offererConduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
    fulfillerConduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
    totalOriginalAdditionalRecipients: '2',
    additionalRecipients: '2610000000000000,0x5b3256965e7C3cF26E11FCAf296DfC8807C01073,5220000000000000,0x97a6d8F593e5256ce8Ed3458506833eAB988522E',
    signature: '0xfe7cec6442e07bb7474595456b99a66ac365e3a8ef60d05a163975024d89eb5e48ee3fe9a608f725d569eaa87fb9cf58054b15a4ebed9d2351938be039fc3c241b',
}

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
