import { BigNumber } from "ethers";

export const SEAPORT_CONTRACT_NAME = "Seaport";
export const SEAPORT_CONTRACT_VERSION = "1.1";
export const EIP_712_PRIMARY_TYPE="OrderComponents"
export const EIP_712_ORDER_TYPE = {
    OrderComponents: [
        { name: "offerer", type: "address" },
        { name: "zone", type: "address" },
        { name: "offer", type: "OfferItem[]" },
        { name: "consideration", type: "ConsiderationItem[]" },
        { name: "orderType", type: "uint8" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "zoneHash", type: "bytes32" },
        { name: "salt", type: "uint256" },
        { name: "conduitKey", type: "bytes32" },
        { name: "counter", type: "uint256" },
    ],
    OfferItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
    ],
    ConsiderationItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
        { name: "recipient", type: "address" },
    ],
};

export enum OrderType {
    FULL_OPEN = 0, // No partial fills, anyone can execute
    PARTIAL_OPEN = 1, // Partial fills supported, anyone can execute
    FULL_RESTRICTED = 2, // No partial fills, only offerer or zone can execute
    PARTIAL_RESTRICTED = 3, // Partial fills supported, only offerer or zone can execute
}

export enum ItemType {
    NATIVE = 0,
    ERC20 = 1,
    ERC721 = 2,
    ERC1155 = 3,
    ERC721_WITH_CRITERIA = 4,
    ERC1155_WITH_CRITERIA = 5,
}

export enum Side {
    OFFER = 0,
    CONSIDERATION = 1,
}

export type NftItemType =
    | ItemType.ERC721
    | ItemType.ERC1155
    | ItemType.ERC721_WITH_CRITERIA
    | ItemType.ERC1155_WITH_CRITERIA;

export enum BasicOrderRouteType {
    ETH_TO_ERC721,
    ETH_TO_ERC1155,
    ERC20_TO_ERC721,
    ERC20_TO_ERC1155,
    ERC721_TO_ERC20,
    ERC1155_TO_ERC20,
}

export const MAX_INT = BigNumber.from(
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);
export const ONE_HUNDRED_PERCENT_BP = 10000;
export const NO_CONDUIT =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

// Supply here any known conduit keys as well as their conduits
export const KNOWN_CONDUIT_KEYS_TO_CONDUIT = {};


// export const MERKLE_VALIDATOR_MAINNET =
//     "0xbaf2127b49fc93cbca6269fade0f7f31df4c88a7";
// export const MERKLE_VALIDATOR_RINKEBY =
//     "0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1";
//
// export const CROSS_CHAIN_DEFAULT_CONDUIT_KEY =
//     "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000";
// const CROSS_CHAIN_DEFAULT_CONDUIT =
//     "0x1e0049783f008a0085193e00003d00cd54003c71";
//
// export const CONDUIT_KEYS_TO_CONDUIT = {
//     [CROSS_CHAIN_DEFAULT_CONDUIT_KEY]: CROSS_CHAIN_DEFAULT_CONDUIT,
// };
//
// export const WETH_ADDRESS_BY_NETWORK = {
//     [Network.Main]: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//     [Network.Rinkeby]: "0xc778417e063141139fce010982780140aa0cd5ab",
// } as const;
//
// export const DEFAULT_ZONE_BY_NETWORK = {
//     [Network.Main]: "0x004c00500000ad104d7dbd00e3ae0a5c00560c00",
//     [Network.Rinkeby]: "0x9b814233894cd227f561b78cc65891aa55c62ad2",
// } as const;
