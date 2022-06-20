import exSwap from './abi/aggtrade/ExSwap.json'
import seaport from './abi/seaport/Seaport.json'
import conduit from './abi/seaport/Conduit.json'
import conduitController from './abi/seaport/ConduitController.json'

export interface AbiInfo {
    contractName: string
    sourceName?: string
    abi: any
}

export const SeaportABI = {
    seaport: seaport as AbiInfo,
    conduit: conduit as AbiInfo,
    conduitController: conduitController as AbiInfo
}

export const ContractABI = {
    swapEx: exSwap as AbiInfo
}
// https://etherscan.com/address/0x00000000006c3852cbef3e08e8df289169ede581#code
// https://etherscan.com/address/0x1e0049783f008a0085193e00003d00cd54003c71#code
export const SEAPORT_CONTRACTS_ADDRESSES = {
    1: {
        Exchange: "0x00000000006c3852cbef3e08e8df289169ede581",
        ConduitController: "0x00000000F9490004C11Cef243f5400493c00Ad63",
        Conduit: "0x1e0049783f008a0085193e00003d00cd54003c71",
        Zone: "0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e",
        PausableZone: "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
        FeeRecipientAddress: '0x5b3256965e7c3cf26e11fcaf296dfc8807c01073',
        GasToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    },
    4: {
        Exchange: "0x00000000006c3852cbef3e08e8df289169ede581",
        ConduitController: "0x00000000F9490004C11Cef243f5400493c00Ad63",
        Conduit: "0x1e0049783f008a0085193e00003d00cd54003c71",
        Zone: "0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e",
        PausableZone: "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
        FeeRecipientAddress: '0x8De9C5A032463C561423387a9648c5C7BCC5BC90',
        GasToken: '0xc778417e063141139fce010982780140aa0cd5ab',
    }
}

export const EXSWAP_CONTRACTS_ADDRESSES = {
    1: {
        ExSwap: "0x69Cf8871F61FB03f540bC519dd1f1D4682Ea0bF6",
        0: '0x7f268357A8c2552623316e2562D90e642bB538E5', // opensea
        1: '0x00000000006c3852cbef3e08e8df289169ede581', //seaport
        2: '0x20F780A973856B93f63670377900C1d2a50a77c4' // //elementV3
    },
    4: {
        ExSwap: "0x1A365EC4d192F7ddE7c5c638DD4871653D93Ee06",
        0: '0xdD54D660178B28f6033a953b0E55073cFA7e3744', // opensea
        1: '0x00000000006c3852cbef3e08e8df289169ede581',//seaport
        2: '0x8D6022B8A421B08E9E4cEf45E46f1c83C85d402F',//elementV3
    }
}

