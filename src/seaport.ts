import EventEmitter from 'events'

import {SEAPORT_CONTRACTS_ADDRESSES, SeaportABI} from './contracts/index'

import {
    APIConfig,
    BuyOrderParams,
    CreateOrderParams,
    MatchParams,
    NullToken,
    OrderSide,
    SellOrderParams,
    Token, transactionToCallData,
    Web3Accounts,
} from 'web3-accounts'
import {
    EIP712Message,
    ethSend,
    getChainRpcUrl,
    getEIP712StructHash,
    getEstimateGas,
    LimitedCallSpec,
    NULL_ADDRESS,
    NULL_BLOCK_HASH,
    WalletInfo,
    Contract, ethers
} from "web3-wallets"

import {BigNumber} from "ethers";
import {
    AdvancedOrder,
    ConsiderationItem, FulfillOrdersMetadata, InsufficientApprovals,
    OfferItem,
    Order,
    OrderComponents,
    OrderParameters,
    OrderStatus,
    OrderType,
    OrderWithCounter,
    SeaportConfig
} from "./types";
import {
    EIP_712_ORDER_TYPE,
    EIP_712_PRIMARY_TYPE,
    ItemType,
    KNOWN_CONDUIT_KEYS_TO_CONDUIT,
    NO_CONDUIT,
    offerAndConsiderationFulfillmentMapping,
    ONE_HUNDRED_PERCENT_BP,
    SEAPORT_CONTRACT_NAME,
    SEAPORT_CONTRACT_VERSION
} from "./constants";
import {generateCriteriaResolvers} from "./utils/criteria";
import {
    getMaximumSizeForOrder,
    getSummedTokenAndIdentifierAmounts,
    isCriteriaItem,
    TimeBasedItemParams
} from "./utils/item";
import {
    mapOrderAmountsFromFilledStatus,
    mapOrderAmountsFromUnitsToFill,
    validateAndSanitizeFromOrderStatus
} from "./utils/order";
import {getTransactionMethods} from "./utils/usecase";

export function computeFees(recipients: { address: string, points: number }[],
                            tokenTotal: BigNumber,
                            tokenAddress: string) {
    let erc20TokenAmount = tokenTotal
    // recipients = recipients.filter(val => val.point > 0)
    const fees = recipients.map(val => {
        const amount = tokenTotal.mul(val.points).div(ONE_HUNDRED_PERCENT_BP)
        erc20TokenAmount = erc20TokenAmount.sub(amount)
        return {
            itemType: tokenAddress == NULL_ADDRESS ? ItemType.NATIVE : ItemType.ERC20,
            token: tokenAddress,
            identifierOrCriteria: "0",
            startAmount: amount.toString(),
            endAmount: amount.toString(),
            recipient: val.address
        } as ConsiderationItem
    })
    return {fees, erc20TokenAmount}
}

export const generateRandomSalt = () => {
    return ethers.BigNumber.from(ethers.utils.randomBytes(7)).toString();
};

export class Seaport extends EventEmitter {
    public walletInfo: WalletInfo
    public protocolFeePoints = 250

    // address
    public contractAddresses: any
    // public WETHAddr: string
    public protocolFeeAddress: string
    public zoneAddress: string
    public pausableZoneAddress: string
    // contracts
    public readonly seaport: Contract
    public conduit: Contract
    public conduitController: Contract
    public userAccount: Web3Accounts
    public GasWarpperToken: Token

    private config: Required<Omit<SeaportConfig, "overrides">>;

    private defaultConduitKey: string;

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        const contracts = config?.contractAddresses || SEAPORT_CONTRACTS_ADDRESSES[wallet.chainId]
        this.protocolFeeAddress = contracts.FeeRecipientAddress
        if (config?.protocolFeePoints) {
            this.protocolFeePoints = config.protocolFeePoints
            this.protocolFeeAddress = config.protocolFeeAddress || contracts.FeeRecipientAddress
        }
        this.walletInfo = wallet
        const chainId = wallet.chainId
        if (!contracts) {
            throw  chainId + 'Opensea sdk undefine contracts address'
        }
        const {Exchange, Conduit, ConduitController, Zone, PausableZone, GasToken} = contracts
        this.zoneAddress = Zone
        this.pausableZoneAddress = PausableZone
        this.contractAddresses = contracts

        this.GasWarpperToken = {
            name: 'GasToken',
            symbol: 'GasToken',
            address: GasToken,
            decimals: 18
        }
        this.userAccount = new Web3Accounts(wallet)
        const options = this.userAccount.signer
        if (ConduitController && Exchange && Conduit) {
            this.seaport = new ethers.Contract(Exchange, SeaportABI.seaport.abi, options)
            this.conduit = new ethers.Contract(Conduit, SeaportABI.conduit.abi, options)
            this.conduitController = new ethers.Contract(ConduitController, SeaportABI.conduitController.abi, options)
        } else {
            throw new Error(`${this.walletInfo.chainId} abi undefined`)
        }

        this.config = {
            ascendingAmountFulfillmentBuffer: 60 * 5, //5 minutes
            balanceAndApprovalChecksOnOrderCreation: true,
            conduitKeyToConduit: {
                ...KNOWN_CONDUIT_KEYS_TO_CONDUIT,
                [NO_CONDUIT]: this.seaport.address
            },
        };

        this.defaultConduitKey = NO_CONDUIT;
    }

    // public static SeaportInfo() {
    //     return {
    //         abi: SeaportABI,
    //         address: SEAPORT_CONTRACTS_ADDRESSES
    //     }
    // }

    public async getOrderApprove({
                                     asset,
                                     quantity = 1,
                                     paymentToken = NullToken,
                                     startAmount,
                                 }: CreateOrderParams, side: OrderSide) {
        const operator = this.conduit.address
        const decimals: number = paymentToken ? paymentToken.decimals : 18
        if (side == OrderSide.Sell) {
            const assetApprove = await this.userAccount.getAssetApprove(asset, operator)
            if (Number(assetApprove.balances) < Number(quantity)) {
                throw 'Seller asset is not enough'
            }
            return assetApprove
        } else {
            const {
                allowance,
                calldata,
                balances
            } = await this.userAccount.getTokenApprove(paymentToken.address, operator);
            const amount = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals)
            if (amount.gt(balances)) {
                throw 'CheckOrderMatch: buyer erc20Token  gt balances'
            }
            const spend = ethers.utils.parseUnits(startAmount.toString(), decimals)
            return {
                isApprove: spend.lt(allowance),
                balances,
                calldata: spend.lt(allowance) ? undefined : calldata
            }
        }
    }

    public async createOrder(offer: OfferItem[], consideration: ConsiderationItem[], expirationTime: number, listingTime?: number): Promise<OrderWithCounter> {
        const offerer = this.walletInfo.address
        const operator = this.conduit.address
        for (const offerAsset of offer) {
            let approve = false, data: LimitedCallSpec | undefined
            if (offerAsset.itemType == ItemType.ERC20) {
                const {
                    balances,
                    allowance,
                    calldata
                } = await this.userAccount.getTokenApprove(offerAsset.token, operator)
                if (ethers.BigNumber.from(offerAsset.endAmount).gt(balances)) {
                    throw new Error("Offer amount less than balances")
                }
                if (ethers.BigNumber.from(offerAsset.endAmount).gt(allowance)) {
                    approve = true
                    data = calldata
                }
            } else {
                const {isApprove, balances, calldata} = await this.userAccount.getAssetApprove({
                    tokenAddress: offerAsset.token,
                    tokenId: offerAsset.identifierOrCriteria,
                    schemaName: offerAsset.itemType == ItemType.ERC721 ? "ERC721" : "ERC115"
                }, operator)
                if (ethers.BigNumber.from(offerAsset.endAmount).gt(balances)) {
                    throw new Error("Offer amount less than balances")
                }
                if (isApprove) {
                    approve = true
                    data = calldata
                }
            }

            if (!approve && data) {
                const tx = await this.ethSend(data)
                await tx.wait();
                console.log("CreateBuyOrder Token setApproved");
            }
        }

        const orderType = OrderType.FULL_RESTRICTED
        const startTime = listingTime || Math.round(Date.now() / 1000)
        const endTime = expirationTime || Math.round(Date.now() / 1000 + 60 * 60 * 24 * 7)
        const conduitKey = await this.conduitController.getKey(this.conduit.address)

        let zone = this.pausableZoneAddress // ethers.constants.AddressZero
        if (offer[0].itemType == ItemType.ERC20) {
            zone = this.zoneAddress
        }

        const orderParameters: OrderParameters = {
            offerer,
            zone,
            orderType,
            startTime,
            endTime,
            zoneHash: NULL_BLOCK_HASH,
            salt: generateRandomSalt(),
            offer,
            consideration,
            conduitKey
        }
        const resolvedCounter = await this.getCounter(this.walletInfo.address)

        const signature = await this.signOrder(orderParameters, resolvedCounter)

        return {
            parameters: {...orderParameters, counter: resolvedCounter},
            signature,
        };
    }

    public async createBuyOrder({
                                    asset,
                                    quantity = 1,
                                    paymentToken = this.GasWarpperToken,
                                    expirationTime = 0,
                                    startAmount
                                }: BuyOrderParams): Promise<OrderWithCounter> {

        const tokenAmount = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals)

        const offer: OfferItem[] = [
            {
                itemType: ItemType.ERC20,
                token: paymentToken.address,
                identifierOrCriteria: "0",
                startAmount: tokenAmount.toString(),
                endAmount: tokenAmount.toString()
            }
        ]
        if (!asset?.tokenId) throw new Error("The token ID cannot be empty")
        const consideration: ConsiderationItem[] = [{
            itemType: asset.schemaName.toLowerCase() == "erc721" ? ItemType.ERC721 : ItemType.ERC1155,
            token: asset.tokenAddress,
            identifierOrCriteria: asset.tokenId,
            startAmount: quantity.toString(),
            endAmount: quantity.toString(),
            recipient: this.walletInfo.address
        }]

        const recipients: { address: string, points: number }[] = [{
            address: this.protocolFeeAddress,
            points: this.protocolFeePoints
        }]
        const collection = asset.collection
        if (collection && collection.royaltyFeePoints && collection.royaltyFeeAddress) {
            recipients.push({
                address: collection.royaltyFeeAddress,
                points: collection.royaltyFeePoints
            })
        }

        const {fees} = computeFees(recipients, tokenAmount, paymentToken.address)
        consideration.push(...fees)
        return this.createOrder(offer, consideration, expirationTime)
    }

    public async createSellOrder({
                                     asset,
                                     quantity = 1,
                                     paymentToken = NullToken,
                                     expirationTime = 0,
                                     startAmount,
                                     listingTime
                                 }: SellOrderParams): Promise<OrderWithCounter> {

        const assetAmount = quantity.toString()
        const offer: OfferItem[] = [{
            itemType: asset.schemaName.toLowerCase() == "erc721" ? ItemType.ERC721 : ItemType.ERC1155,
            token: asset.tokenAddress,
            identifierOrCriteria: asset?.tokenId?.toString() || "1",
            startAmount: assetAmount,
            endAmount: assetAmount
        }]

        const recipients: { address: string, points: number }[] = [{
            address: this.protocolFeeAddress,
            points: this.protocolFeePoints
        }]

        const {collection: {royaltyFeePoints, royaltyFeeAddress}} = asset
        if (asset.collection && royaltyFeePoints && royaltyFeeAddress) {
            recipients.push({
                address: royaltyFeeAddress,
                points: royaltyFeePoints
            })
        }
        const payPoints = recipients.map(val => Number(val.points)).reduce((cur, next) => cur + next)

        recipients.unshift({
            address: this.walletInfo.address,
            points: ONE_HUNDRED_PERCENT_BP - payPoints
        })
        const tokeneAmount = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals)
        const {fees: consideration} = computeFees(recipients, tokeneAmount, paymentToken.address)
        return this.createOrder(offer, consideration, expirationTime, listingTime)
    }

    /**
     * Submits a request to your provider to sign the order. Signed orders are used for off-chain order books.
     * @param orderParameters standard order parameter struct
     * @param counter counter of the offerer
     * @returns the order signature
     */
    public async signOrder(
        orderParameters: OrderParameters,
        counter: number
    ): Promise<string> {
        const domainData = {
            name: SEAPORT_CONTRACT_NAME,
            version: SEAPORT_CONTRACT_VERSION,
            chainId: this.walletInfo.chainId,
            verifyingContract: this.seaport.address,
        };

        const orderComponents: OrderComponents = {
            ...orderParameters,
            counter,
        };
        const {signature} = await this.userAccount.signTypedData({
            types: EIP_712_ORDER_TYPE,
            domain: domainData,
            primaryType: EIP_712_PRIMARY_TYPE,
            message: orderComponents as EIP712Message
        });
        return signature
    }


    private async checkOrderPost(order: string, taker: string = NULL_ADDRESS) {
        const {parameters, signature} = JSON.parse(order)
        const operator = this.conduit.address
        const {offer} = parameters
        const offerAsset = offer[0]
        if (offerAsset.itemType == ItemType.ERC20) {
            const {balances, allowance} = await this.userAccount.getTokenApprove(offerAsset.token, operator)
            console.log(balances, allowance)

        } else {
            const {isApprove, balances, calldata} = await this.userAccount.getAssetApprove({
                tokenAddress: offerAsset.token,
                tokenId: offerAsset.identifierOrCriteria,
                schemaName: offerAsset.itemType == ItemType.ERC721 ? "ERC721" : "ERC115"
            }, operator)
            console.log(balances, isApprove)
        }
    }


    public async getMatchCallData({
                                      order,
                                      takerAmount,
                                      tips = [],
                                  }: {
        order: Order;
        takerAmount?: string,
        tips?: ConsiderationItem[];
    }) {

        if (takerAmount) {
            return this.fulfillAdvancedOrder({order, takerAmount, tips})
        } else {
            return this.fulfillBasicOrder({order, tips})
        }
    }

    public async fulfillAvailableAdvancedOrders({
                                                    orders,
                                                    takerAmount,
                                                    recipient,
                                                    tips = [],
                                                }: {
        orders: Order[]
        takerAmount: string
        recipient?: string
        tips?: ConsiderationItem[]
    }) {
        // 1. advancedOrders:OrderWithCounter []
        // 2 "criteriaResolvers": [],
        // 3  "offerFulfillments":
        // 4  "considerationFulfillments":
        // 5  "fulfillerConduitKey": "0x0000000000000000000000000000000000000000000000000000000000000000",
        // 6  "recipient": "0x57c17FdC47720D3c56cfB0C3Ded460267BCD642D",
        // 7   "maximumFulfilled": "1"


        const advancedOrdersWithTips: AdvancedOrder[] = []

        const offers: OfferItem[] = [], considerations: ConsiderationItem[] = []

        let totalNativeAmount = BigNumber.from(0);
        const ordersMetadata: FulfillOrdersMetadata = []
        for (const order of orders) {

            const {parameters} = order
            const orderStatus = await this.getOrderStatus(this.getOrderHash(parameters));
            const {totalFilled, totalSize} = orderStatus
            // const totalSize = getMaximumSizeForOrder(order)
            // If we are supplying units to fill, we adjust the order by the minimum of the amount to fill and
            // the remaining order left to be fulfilled
            const orderWithAdjustedFills = takerAmount
                ? mapOrderAmountsFromUnitsToFill(order, {unitsToFill: takerAmount, totalFilled, totalSize})
                : mapOrderAmountsFromFilledStatus(order, {totalFilled, totalSize});
            const {parameters: {offer, consideration}} = orderWithAdjustedFills;
            offers.push(...offer)
            considerations.push(...consideration)

            const considerationIncludingTips = [
                ...order.parameters.consideration,
                ...tips,
            ];

            const currentBlockTimestamp = new Date().getTime();
            const timeBasedItemParams = {
                startTime: order.parameters.startTime,
                endTime: order.parameters.endTime,
                currentBlockTimestamp,
                ascendingAmountTimestampBuffer: this.config.ascendingAmountFulfillmentBuffer,
                isConsiderationItem: true,
            };

            totalNativeAmount = totalNativeAmount.add(
                getSummedTokenAndIdentifierAmounts({
                    items: considerationIncludingTips,
                    criterias: [],
                    timeBasedItemParams,
                })[ethers.constants.AddressZero]?.["0"] ?? BigNumber.from(0)
            );
        }

        const considerationIncludingTips = [...considerations, ...tips];

        const offerCriteriaItems = offers.filter(({itemType}) => isCriteriaItem(itemType));

        const considerationCriteriaItems = considerationIncludingTips.filter(({itemType}) => isCriteriaItem(itemType));

        const hasCriteriaItems = offerCriteriaItems.length > 0 || considerationCriteriaItems.length > 0;

        //2.criteriaResolvers:CriteriaResolver[]
        const criteriaResolvers = hasCriteriaItems ? generateCriteriaResolvers({orders}) : []

        //
        const payableOverrides = {value: totalNativeAmount};

        const fulfillerConduitKey = "0x0000000000000000000000000000000000000000000000000000000000000000"
        const offerFulfillments = []
        const considerationFulfillments = []
        return this.seaport.populateTransaction.fulfillAvailableAdvancedOrders(advancedOrdersWithTips, criteriaResolvers,
            offerFulfillments, considerationFulfillments,
            fulfillerConduitKey, recipient, advancedOrdersWithTips.length, payableOverrides)
    }

    public async fulfillAdvancedOrder({
                                          order,
                                          takerAmount,
                                          recipient,
                                          tips = [],
                                      }: {
        order: Order
        takerAmount: string
        recipient?: string
        tips?: ConsiderationItem[]
    }) {

        const {parameters} = order
        const orderStatus = await this.getOrderStatus(this.getOrderHash(parameters));
        const {totalFilled, totalSize} = orderStatus
        // const totalSize = getMaximumSizeForOrder(order)
        // If we are supplying units to fill, we adjust the order by the minimum of the amount to fill and
        // the remaining order left to be fulfilled
        const orderWithAdjustedFills = takerAmount
            ? mapOrderAmountsFromUnitsToFill(order, {unitsToFill: takerAmount, totalFilled, totalSize})
            : mapOrderAmountsFromFilledStatus(order, {totalFilled, totalSize});

        const {parameters: {offer, consideration}} = orderWithAdjustedFills;

        // const conduitKey = await this.conduitController.getKey(this.conduit.address)
        // const {parameters} = order;
        // const {offer, consideration} = parameters
        const orderAccountingForTips = {
            ...order,
            parameters: {
                parameters,
                consideration: [...order.parameters.consideration, ...tips]
            },
        };
        //1.advancedOrder:AdvancedOrder
        const advancedOrder = {
            ...orderAccountingForTips,
            numerator: 1,
            denominator: 1,
            extraData: "0x",
        }

        const considerationIncludingTips = [...consideration, ...tips];

        const offerCriteriaItems = offer.filter(({itemType}) => isCriteriaItem(itemType));

        const considerationCriteriaItems = considerationIncludingTips.filter(({itemType}) => isCriteriaItem(itemType));

        const hasCriteriaItems = offerCriteriaItems.length > 0 || considerationCriteriaItems.length > 0;

        //2.criteriaResolvers:CriteriaResolver[]
        const criteriaResolvers = hasCriteriaItems
            ? generateCriteriaResolvers({orders: [order]})
            : []

        const sanitizedOrder = validateAndSanitizeFromOrderStatus(
            order,
            orderStatus
        );
        // const currentBlockTimestamp = currentBlock.timestamp;
        const currentBlockTimestamp = new Date().getTime();
        const timeBasedItemParams: TimeBasedItemParams = {
            startTime: sanitizedOrder.parameters.startTime,
            endTime: sanitizedOrder.parameters.endTime,
            currentBlockTimestamp,
            ascendingAmountTimestampBuffer: this.config.ascendingAmountFulfillmentBuffer
        };
        const totalNativeAmount = getSummedTokenAndIdentifierAmounts({
            items: considerationIncludingTips,
            criterias: [],
            timeBasedItemParams: {
                ...timeBasedItemParams,
                isConsiderationItem: true,
            },
        })[ethers.constants.AddressZero]?.["0"];
        const payableOverrides = {value: totalNativeAmount};

        // 3.fulfillerConduitKey: 0x0000000000000000000000000000000000000000000000000000000000000000
        const fulfillerConduitKey = NULL_BLOCK_HASH
        // 4.recipient: 0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401
        recipient = recipient || this.walletInfo.address


        return this.seaport.populateTransaction.fulfillAdvancedOrder(advancedOrder, criteriaResolvers, fulfillerConduitKey, recipient, payableOverrides)
    }

    public async fulfillBasicOrder({
                                       order,
                                       tips = [],
                                   }: {
        order: Order;
        tips?: ConsiderationItem[];
    }) {
        const conduitKey = await this.conduitController.getKey(this.conduit.address)
        const {parameters} = order;
        const {offer, consideration} = parameters;
        const considerationIncludingTips = [...consideration, ...tips];
        const offerItem = offer[0];
        const [forOfferer, ...forAdditionalRecipients] = considerationIncludingTips;

        const basicOrderRouteType = offerAndConsiderationFulfillmentMapping[offerItem.itemType]?.[forOfferer.itemType];

        if (basicOrderRouteType === undefined) {
            throw new Error(
                "Order parameters did not result in a valid basic fulfillment"
            );
        }

        const orderStatus = await this.seaport.getOrderStatus(this.getOrderHash(parameters))
        const sanitizedOrder = validateAndSanitizeFromOrderStatus(
            order,
            orderStatus
        );

        // const currentBlockTimestamp = currentBlock.timestamp;
        const currentBlockTimestamp = new Date().getTime();
        const timeBasedItemParams: TimeBasedItemParams = {
            startTime: sanitizedOrder.parameters.startTime,
            endTime: sanitizedOrder.parameters.endTime,
            currentBlockTimestamp,
            ascendingAmountTimestampBuffer: this.config.ascendingAmountFulfillmentBuffer
        };


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
            totalOriginalAdditionalRecipients: order.parameters.consideration.length - 1,
            signature: order.signature,
            fulfillerConduitKey: conduitKey,
            additionalRecipients,
            zoneHash: order.parameters.zoneHash,
        };

        const payableOverrides = {value: totalNativeAmount};
        return this.seaport.populateTransaction.fulfillBasicOrder(basicOrderParameters, payableOverrides)

    }

    /**
     * Cancels a list of orders so that they are no longer fulfillable.
     *
     * @param orders list of order components
     * @returns the set of transaction methods that can be used
     */
    public cancelOrders(
        orders: OrderComponents[]
    ) {
        return this.seaport.cancel(orders);
    }

    /**
     * Bulk cancels all existing orders for a given account
     * @returns the set of transaction methods that can be used
     */
    public bulkCancelOrders() {
        return this.seaport.incrementCounter();
    }

    /**
     * Approves a list of orders on-chain. This allows accounts to fulfill the order without requiring
     * a signature. Can also check if an order is valid using `callStatic`
     * @param orders list of order structs
     * @returns the set of transaction methods that can be used
     */
    public validate(orders: Order[]) {
        return this.seaport.validate(orders);
    }

    /**
     * Returns the order status given an order hash
     * @param orderHash the hash of the order
     * @returns an order status struct
     */
    public getOrderStatus(orderHash: string): Promise<OrderStatus> {
        return this.seaport.getOrderStatus(orderHash);
    }

    /**
     * Gets the counter of a given offerer
     * @param offerer the offerer to get the counter of
     * @returns counter as a number
     */
    public getCounter(offerer: string): Promise<number> {
        return this.seaport
            .getCounter(offerer)
            .then((counter) => counter.toNumber());
    }

    /**
     * Calculates the order hash of order components so we can forgo executing a request to the contract
     * This saves us RPC calls and latency.
     */
    public getOrderHash(orderParameters: OrderParameters): string {
        return this.seaport.getOrderHash(orderParameters)
        // return getEIP712StructHash(EIP_712_PRIMARY_TYPE, EIP_712_ORDER_TYPE, orderComponents as any)

    }

    async ethSend(callData: LimitedCallSpec) {
        return ethSend(this.walletInfo, callData).catch(err => {
            throw err
        })
    }

    async estimateGas(callData: LimitedCallSpec) {
        const rpcUrl = this.walletInfo.rpcUrl?.url || await getChainRpcUrl(this.walletInfo.chainId);
        return getEstimateGas(rpcUrl, callData).catch(err => {
            throw err
        })
    }
}

