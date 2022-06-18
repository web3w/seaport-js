import {
    BigNumber,
    BigNumberish,
    Contract,
    ContractTransaction,
    Overrides,
    PayableOverrides,
    PopulatedTransaction,
} from "ethers";
import {
    Asset,
    Token,
    OfferType,
    ExchangeMetadata,
    APIConfig
} from "web3-accounts"
import {ItemType, OrderType} from "./constants";

export {OrderType}
export {
    NULL_BLOCK_HASH,
    NULL_ADDRESS, getProvider, getEstimateGas,
    ethSend,
    BigNumber,
    ETH_TOKEN_ADDRESS,
    CHAIN_CONFIG,
    getChainRpcUrl,
    hexUtils,
    getEIP712DomainHash,
    createEIP712TypedData
} from 'web3-wallets'
export type {Signature, WalletInfo, LimitedCallSpec, EIP712TypedData, EIP712Domain} from 'web3-wallets'

export type {Asset, Token, APIConfig, ExchangeMetadata}

export type InputCriteria = {
    identifier: string;
    proof: string[];
};

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

export type OfferItem = {
    itemType: ItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
};

export type ConsiderationItem = {
    itemType: ItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
    recipient: string;
};

export type Item = OfferItem | ConsiderationItem;

export type OrderParameters = {
    offerer: string;
    zone: string;
    orderType: OrderType;
    startTime: BigNumberish;
    endTime: BigNumberish;
    zoneHash: string;
    salt: string;
    offer: OfferItem[];
    consideration: ConsiderationItem[];
    totalOriginalConsiderationItems: BigNumberish;
    conduitKey: string;
};

export type OrderComponents = OrderParameters & { counter: number };

export type Order = {
    parameters: OrderParameters;
    signature: string;
};

export type OrderStatus = {
    isValidated: boolean;
    isCancelled: boolean;
    totalFilled: BigNumber;
    totalSize: BigNumber;
};

export type OrderWithCounter = {
    parameters: OrderComponents;
    signature: string;
};

//----------- Item-------------
export type BasicErc721Item = {
    itemType: ItemType.ERC721;
    token: string;
    identifier: string;
};

export type Erc721ItemWithCriteria = {
    itemType: ItemType.ERC721;
    token: string;
    identifiers: string[];
    // Used for criteria based items i.e. offering to buy 5 NFTs for a collection
    amount?: string;
    endAmount?: string;
};

type Erc721Item = BasicErc721Item | Erc721ItemWithCriteria;

export type BasicErc1155Item = {
    itemType: ItemType.ERC1155;
    token: string;
    identifier: string;
    amount: string;
    endAmount?: string;
};

export type Erc1155ItemWithCriteria = {
    itemType: ItemType.ERC1155;
    token: string;
    identifiers: string[];
    amount: string;
    endAmount?: string;
};

type Erc1155Item = BasicErc1155Item | Erc1155ItemWithCriteria;

export type CurrencyItem = {
    token?: string;
    amount: string;
    endAmount?: string;
};
export type CreateInputItem = Erc721Item | Erc1155Item | CurrencyItem;
export type TipInputItem = CreateInputItem & { recipient: string };

//--------- old ---------------------

export interface OrdersQueryParams {
    token_ids: string[]
    asset_contract_address: string
    payment_token_address?: string
    include_bundled?: boolean
    maker?: string
    taker?: string
    side?: number
    owner?: string
    order_by?: string
    limit?: number
    offset?: number
}

export interface AssetsQueryParams {
    assets?: {
        asset_contract_addresses: string
        token_ids?: string
    }[],
    owner?: string
    limit?: number
    include_orders?: boolean
}

export interface FeesInfo {
    royaltyFeeAddress: string
    royaltyFeePoint: number
    protocolFeePoint?: number
    protocolFeeAddress?: string
}

export interface AssetCollection extends FeesInfo {
    name: string
    symbol: string
    address?: string
    token_id?: string
    schema_name?: string
    nft_version?: string
    created_date?: string
    sell_orders?: any
}


export type AdvancedOrder = Order & {
    numerator: BigNumber;
    denominator: BigNumber;
    extraData: string;
};

export type TransactionMethods<T = unknown> = {
    buildTransaction: (overrides?: Overrides) => Promise<PopulatedTransaction>;
    callStatic: (overrides?: Overrides) => Promise<T>;
    estimateGas: (overrides?: Overrides) => Promise<BigNumber>;
    transact: (overrides?: Overrides) => Promise<ContractTransaction>;
};

export type ExchangeAction<T = unknown> = {
    type: "exchange";
    transactionMethods: TransactionMethods<T>;
};



export type Fee = {
    recipient: string;
    basisPoints: number;
};
export type InsufficientApprovals = {
    token: string;
    identifierOrCriteria: string;
    approvedAmount: BigNumber;
    requiredApprovedAmount: BigNumber;
    operator: string;
    itemType: ItemType;
}[];

export type CreateOrderAction = {
    type: "create";
    getMessageToSign: () => Promise<string>;
    createOrder: () => Promise<OrderWithCounter>;
};

export type ApprovalAction = {
    type: "approval";
    token: string;
    identifierOrCriteria: string;
    itemType: ItemType;
    operator: string;
    transactionMethods: any
};

export type CreateOrderActions = readonly [
    ...ApprovalAction[],
    CreateOrderAction
];

export type OrderExchangeActions<T> = readonly [
    ...ApprovalAction[],
    ExchangeAction<T>
];

export type OrderUseCase<T extends CreateOrderAction | ExchangeAction> = {
    actions: T extends CreateOrderAction
        ? CreateOrderActions
        : OrderExchangeActions<T extends ExchangeAction<infer U> ? U : never>;
    executeAllActions: () => Promise<T extends CreateOrderAction ? OrderWithCounter : ContractTransaction>;
};
