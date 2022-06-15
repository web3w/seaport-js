import EventEmitter from 'events'

import {SEAPORT_CONTRACTS_ADDRESSES, SeaportABI,} from '../contracts/index'

import {
    APIConfig, assetToMetadata,
    CreateOrderParams,
    ElementSchemaName,
    ETHToken,
    ExchangeMetadata,
    metadataToAsset,
    NullToken,
    OrderType as OrderSide,
    SellOrderParams,
    Token,
    Web3Accounts,
} from 'web3-accounts'
import {
    ETH_TOKEN_ADDRESS,
    ethSend,
    LimitedCallSpec,
    NULL_ADDRESS,
    NULL_BLOCK_HASH,
    WalletInfo,
} from "web3-wallets"

import {BigNumberish, BigNumber, Contract, ethers} from "ethers";
import {
    ConsiderationItem,
    InputCriteria,
    OfferItem, Order,
    OrderComponents,
    OrderParameters, OrderStatus,
    OrderType,
    OrderWithCounter, TipInputItem,
    BasicOrderRouteType, Item
} from "./types";
import {
    EIP_712_ORDER_TYPE,
    ItemType,
    MAX_INT,
    NO_CONDUIT,
    SEAPORT_CONTRACT_NAME,
    SEAPORT_CONTRACT_VERSION
} from "./constants";
import {EIP712Message} from "web3-wallets";

export type ApproveType = {
    isApprove: boolean;
    balances: string;
    calldata: LimitedCallSpec | undefined;
}

export function validateAndSanitizeFromOrderStatus(
    order: Order,
    orderStatus: OrderStatus
): Order {
    const {isValidated, isCancelled, totalFilled, totalSize} = orderStatus;

    if (totalSize.gt(0) && totalFilled.div(totalSize).eq(1)) {
        throw new Error("The order you are trying to fulfill is already filled");
    }

    if (isCancelled) {
        throw new Error("The order you are trying to fulfill is cancelled");
    }

    if (isValidated) {
        // If the order is already validated, manually wipe the signature off of the order to save gas
        return {parameters: {...order.parameters}, signature: "0x"};
    }

    return order;
}

const offerAndConsiderationFulfillmentMapping: {
    [_key in ItemType]?: { [_key in ItemType]?: BasicOrderRouteType };
} = {
    [ItemType.ERC20]: {
        [ItemType.ERC721]: BasicOrderRouteType.ERC721_TO_ERC20,
        [ItemType.ERC1155]: BasicOrderRouteType.ERC1155_TO_ERC20,
    },
    [ItemType.ERC721]: {
        [ItemType.NATIVE]: BasicOrderRouteType.ETH_TO_ERC721,
        [ItemType.ERC20]: BasicOrderRouteType.ERC20_TO_ERC721,
    },
    [ItemType.ERC1155]: {
        [ItemType.NATIVE]: BasicOrderRouteType.ETH_TO_ERC1155,
        [ItemType.ERC20]: BasicOrderRouteType.ERC20_TO_ERC1155,
    },
} as const;

export const isCriteriaItem = (itemType: Item["itemType"]) =>
    [ItemType.ERC721_WITH_CRITERIA, ItemType.ERC1155_WITH_CRITERIA].includes(
        itemType
    );


export const getItemToCriteriaMap = (
    items: Item[],
    criterias: InputCriteria[]
) => {
    const criteriasCopy = [...criterias];

    return items.reduce((map, item) => {
        if (isCriteriaItem(item.itemType)) {
            map.set(item, criteriasCopy.shift() as InputCriteria);
        }
        return map;
    }, new Map<Item, InputCriteria>());
};

export const getPresentItemAmount = ({
                                         startAmount,
                                         endAmount,
                                         timeBasedItemParams,
                                     }: Pick<Item, "startAmount" | "endAmount"> & {
    timeBasedItemParams?: TimeBasedItemParams;
}): BigNumber => {
    const startAmountBn = BigNumber.from(startAmount);
    const endAmountBn = BigNumber.from(endAmount);

    if (!timeBasedItemParams) {
        return startAmountBn.gt(endAmountBn) ? startAmountBn : endAmountBn;
    }

    const {
        isConsiderationItem,
        currentBlockTimestamp,
        ascendingAmountTimestampBuffer,
        startTime,
        endTime,
    } = timeBasedItemParams;

    const duration = BigNumber.from(endTime).sub(startTime);
    const isAscending = endAmountBn.gt(startAmount);
    const adjustedBlockTimestamp = BigNumber.from(
        isAscending
            ? currentBlockTimestamp + ascendingAmountTimestampBuffer
            : currentBlockTimestamp
    );

    if (adjustedBlockTimestamp.lt(startTime)) {
        return startAmountBn;
    }

    const elapsed = (
        adjustedBlockTimestamp.gt(endTime)
            ? BigNumber.from(endTime)
            : adjustedBlockTimestamp
    ).sub(startTime);

    const remaining = duration.sub(elapsed);

    // Adjust amounts based on current time
    // For offer items, we round down
    // For consideration items, we round up
    return startAmountBn
        .mul(remaining)
        .add(endAmountBn.mul(elapsed))
        .add(isConsiderationItem ? duration.sub(1) : 0)
        .div(duration);
};

export type TimeBasedItemParams = {
    isConsiderationItem?: boolean;
    currentBlockTimestamp: number;
    ascendingAmountTimestampBuffer: number;
} & Pick<OrderParameters, "startTime" | "endTime">;

export const getSummedTokenAndIdentifierAmounts = ({
                                                       items,
                                                       criterias,
                                                       timeBasedItemParams,
                                                   }: {
    items: Item[];
    criterias: InputCriteria[];
    timeBasedItemParams?: TimeBasedItemParams;
}) => {
    const itemToCriteria = getItemToCriteriaMap(items, criterias);

    const tokenAndIdentifierToSummedAmount = items.reduce<Record<string, Record<string, BigNumber>>>((map, item) => {
        const identifierOrCriteria =
            itemToCriteria.get(item)?.identifier ?? item.identifierOrCriteria;

        return {
            ...map,
            [item.token]: {
                ...map[item.token],
                // Being explicit about the undefined type as it's possible for it to be undefined at first iteration
                [identifierOrCriteria]: (
                    (map[item.token]?.[identifierOrCriteria] as BigNumber | undefined) ??
                    BigNumber.from(0)
                ).add(
                    getPresentItemAmount({
                        startAmount: item.startAmount,
                        endAmount: item.endAmount,
                        timeBasedItemParams,
                    })
                ),
            },
        };
    }, {});

    return tokenAndIdentifierToSummedAmount;
};

export class SeaportEx extends EventEmitter {
    public walletInfo: WalletInfo
    public protocolFeePoint = 250
    // address
    public contractAddresses: any
    // public WETHAddr: string
    public feeRecipientAddress: string
    // contracts
    public exchange: Contract
    public conduit: Contract
    public conduitController: Contract
    public userAccount: Web3Accounts
    public GasWarpperToken: Token

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        const contracts = config?.contractAddresses || SEAPORT_CONTRACTS_ADDRESSES[wallet.chainId]
        if (config?.protocolFeePoint) {
            this.protocolFeePoint = config.protocolFeePoint
        }
        this.walletInfo = wallet
        const chainId = wallet.chainId
        if (!contracts) {
            throw  chainId + 'Opensea sdk undefine contracts address'
        }
        const exchangeAddr = contracts.Exchange
        const conduitAddr = contracts.Conduit
        const conduitControllerAddr = contracts.ConduitController
        const feeRecipientAddress = contracts.FeeRecipientAddress

        this.contractAddresses = contracts

        this.GasWarpperToken = {
            name: 'GasToken',
            symbol: 'GasToken',
            address: contracts.GasToken,
            decimals: 18
        }
        this.feeRecipientAddress = feeRecipientAddress

        this.userAccount = new Web3Accounts(wallet)
        const options = this.userAccount.signer
        if (exchangeAddr) {
            this.exchange = new ethers.Contract(exchangeAddr, SeaportABI.seaport.abi, options)
            this.conduit = new ethers.Contract(conduitAddr, SeaportABI.conduit.abi, options)
            this.conduitController = new ethers.Contract(conduitControllerAddr, SeaportABI.conduitController.abi, options)
        } else {
            throw `${this.walletInfo.chainId} abi undefined`
        }
    }

    async createSellOrder({
                              asset,
                              quantity = 1,
                              paymentToken = NullToken,
                              listingTime = 0,
                              expirationTime = 0,
                              startAmount,
                              endAmount,
                              buyerAddress
                          }: SellOrderParams): Promise<any> {
        const operator = this.conduit.address
        const assetApprove = await this.userAccount.getAssetApprove(asset, operator)
        if (assetApprove.balances == '0') {
            throw 'Seller asset balance 0'
        }
        if (!assetApprove.isApprove && assetApprove.calldata) {
            const tx = await ethSend(this.walletInfo, assetApprove.calldata)
            await tx.wait()
            console.log(tx.hash)
        }
        const offerer = this.walletInfo.address
        const zone = ethers.constants.AddressZero
        const orderType = OrderType.FULL_OPEN
        const startTime = Math.round(Date.now() / 1000)
        const endTime = expirationTime ? parseInt(String(expirationTime)) : MAX_INT;
        const conduitKey = await this.conduitController.getKey(this.conduit.address)
        const assetAmount = quantity.toString()
        const offer: OfferItem[] = [
            {
                itemType: ItemType.ERC721,
                token: asset.tokenAddress,
                identifierOrCriteria: asset?.tokenId?.toString() || "1",
                startAmount: assetAmount,
                endAmount: assetAmount
            }
        ]
        const start = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals).toString()
        const end = ethers.utils.parseUnits((endAmount || startAmount).toString(), paymentToken.decimals).toString()
        // fee..
        const consideration: ConsiderationItem[] = [
            {
                itemType: ItemType.ERC20,
                token: paymentToken.address,
                identifierOrCriteria: "0",
                startAmount: start,
                endAmount: end,
                recipient: offerer
            }
        ]
        const orderParameters: OrderParameters = {
            offerer,
            zone,
            orderType,
            startTime,
            endTime,
            zoneHash: NULL_BLOCK_HASH,
            salt: Date.now().toString(16),
            offer,
            consideration,
            totalOriginalConsiderationItems: consideration.length,
            conduitKey
        }
        const resolvedCounter = (await this.exchange.getCounter(this.walletInfo.address)).toNumber()
        // console.log(counter.toNumber())
        const signature = await this.signOrder(orderParameters, resolvedCounter)

        return {
            parameters: {...orderParameters, counter: resolvedCounter},
            signature,
        };
    }

    /**
     * Submits a request to your provider to sign the order. Signed orders are used for off-chain order books.
     * @param orderParameters standard order parameter struct
     * @param counter counter of the offerer
     * @returns the order signature
     */
    async signOrder(
        orderParameters: OrderParameters,
        counter: number
    ): Promise<string> {
        const domainData = {
            name: SEAPORT_CONTRACT_NAME,
            version: SEAPORT_CONTRACT_VERSION,
            chainId: this.walletInfo.chainId,
            verifyingContract: this.exchange.address,
        };

        const orderComponents: OrderComponents = {
            ...orderParameters,
            counter,
        };

        const {signature} = await this.userAccount.signTypedData({
            types: EIP_712_ORDER_TYPE,
            domain: domainData,
            primaryType: "OrderComponents",
            message: orderComponents as EIP712Message
        });
        return signature
    }

    async fulfillBasicOrder({
                                order,
                                timeBasedItemParams,
                                tips = [],
                                conduitKey = NO_CONDUIT,
                            }: {
        order: Order;
        timeBasedItemParams: TimeBasedItemParams;
        tips?: ConsiderationItem[];
        conduitKey: string;
    }): Promise<any> {
        const {offer, consideration} = order.parameters;
        const considerationIncludingTips = [...consideration, ...tips];
        const offerItem = offer[0];
        const [forOfferer, ...forAdditionalRecipients] = considerationIncludingTips;

        const basicOrderRouteType =
            offerAndConsiderationFulfillmentMapping[offerItem.itemType]?.[
                forOfferer.itemType
                ];

        if (basicOrderRouteType === undefined) {
            throw new Error(
                "Order parameters did not result in a valid basic fulfillment"
            );
        }

        const additionalRecipients = forAdditionalRecipients.map(
            ({startAmount, recipient}) => ({
                amount: startAmount,
                recipient,
            })
        );

        const considerationWithoutOfferItemType = considerationIncludingTips.filter(
            (item) => item.itemType !== offer[0].itemType
        );

        const totalNativeAmount = getSummedTokenAndIdentifierAmounts({
            items: considerationWithoutOfferItemType,
            criterias: [],
            timeBasedItemParams: {
                ...timeBasedItemParams,
                isConsiderationItem: true,
            },
        })[ethers.constants.AddressZero]?.["0"];


        const basicOrderParameters = {
            offerer: order.parameters.offerer,
            offererConduitKey: order.parameters.conduitKey,
            zone: order.parameters.zone,
            //  Note the use of a "basicOrderType" enum;
            //  this represents both the usual order type as well as the "route"
            //  of the basic order (a simple derivation function for the basic order
            //  type is `basicOrderType = orderType + (4 * basicOrderRoute)`.)
            basicOrderType: order.parameters.orderType + 4 * basicOrderRouteType,
            offerToken: offerItem.token,
            offerIdentifier: offerItem.identifierOrCriteria,
            offerAmount: offerItem.endAmount,
            considerationToken: forOfferer.token,
            considerationIdentifier: forOfferer.identifierOrCriteria,
            considerationAmount: forOfferer.endAmount,
            startTime: order.parameters.startTime,
            endTime: order.parameters.endTime,
            salt: order.parameters.salt,
            totalOriginalAdditionalRecipients:
                order.parameters.consideration.length - 1,
            signature: order.signature,
            fulfillerConduitKey: conduitKey,
            additionalRecipients,
            zoneHash: order.parameters.zoneHash,
        };

        const payableOverrides = {value: totalNativeAmount};
        return this.exchange.fulfillBasicOrder(basicOrderParameters, payableOverrides)

        // const approvalActions = await getApprovalActions(
        //     insufficientApprovals,
        //     signer
        // );

        // const exchangeAction = {
        //     type: "exchange",
        //     transactionMethods: getTransactionMethods(
        //         seaportContract.connect(signer),
        //         "fulfillBasicOrder",
        //         [basicOrderParameters, payableOverrides]
        //     ),
        // } as const;

    }

    /**
     * Calculates the order hash of order components so we can forgo executing a request to the contract
     * This saves us RPC calls and latency.
     */
    public getOrderHash = (orderComponents: OrderComponents): string => {
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
    };
}

