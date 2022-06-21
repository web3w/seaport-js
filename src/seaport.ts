import EventEmitter from 'events'

import {SEAPORT_CONTRACTS_ADDRESSES, SeaportABI,} from './contracts/index'

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
    WalletInfo
} from "web3-wallets"

import {BigNumber, Contract, ethers} from "ethers";
import {
    ConsiderationItem,
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
    NO_CONDUIT, ONE_HUNDRED_PERCENT_BP,
    SEAPORT_CONTRACT_NAME,
    SEAPORT_CONTRACT_VERSION
} from "./constants";
import {generateCriteriaResolvers} from "./utils/criteria";
import {offerAndConsiderationFulfillmentMapping, validateAndSanitizeFromOrderStatus} from "./utils/fulfill";
import {getSummedTokenAndIdentifierAmounts, isCriteriaItem, TimeBasedItemParams} from "./utils/item";

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
    public feeRecipientAddress: string
    public zoneAddress: string
    public pausableZoneAddress: string
    // contracts
    public seaport: Contract
    public conduit: Contract
    public conduitController: Contract
    public userAccount: Web3Accounts
    public GasWarpperToken: Token

    private config: Required<Omit<SeaportConfig, "overrides">>;

    private defaultConduitKey: string;

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        const contracts = config?.contractAddresses || SEAPORT_CONTRACTS_ADDRESSES[wallet.chainId]
        this.feeRecipientAddress = contracts.FeeRecipientAddress
        if (config?.protocolFeePoints) {
            this.protocolFeePoints = config.protocolFeePoints
            this.feeRecipientAddress = config.protocolFeeAddress || contracts.FeeRecipientAddress
        }
        this.walletInfo = wallet
        const chainId = wallet.chainId
        if (!contracts) {
            throw  chainId + 'Opensea sdk undefine contracts address'
        }
        const exchangeAddr = contracts.Exchange
        const conduitAddr = contracts.Conduit
        const conduitControllerAddr = contracts.ConduitController

        this.zoneAddress = contracts.Zone
        this.pausableZoneAddress = contracts.PausableZone

        //https://rinkeby.etherscan.io/address/0x1E0049783F008A0085193E00003D00cd54003c71#code
        //Approve asset Conduit

        this.contractAddresses = contracts

        this.GasWarpperToken = {
            name: 'GasToken',
            symbol: 'GasToken',
            address: contracts.GasToken,
            decimals: 18
        }
        this.userAccount = new Web3Accounts(wallet)
        const options = this.userAccount.signer
        if (exchangeAddr) {
            this.seaport = new ethers.Contract(exchangeAddr, SeaportABI.seaport.abi, options)
            this.conduit = new ethers.Contract(conduitAddr, SeaportABI.conduit.abi, options)
            this.conduitController = new ethers.Contract(conduitControllerAddr, SeaportABI.conduitController.abi, options)
        } else {
            throw `${this.walletInfo.chainId} abi undefined`
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

    async getOrderApprove({
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

    private async createOrder(offer: OfferItem[], consideration: ConsiderationItem[], expirationTime) {
        const offerer = this.walletInfo.address

        const orderType = OrderType.FULL_RESTRICTED
        const startTime = Math.round(Date.now() / 1000).toString()
        const endTime = expirationTime || Math.round(Date.now() / 1000 + 60 * 60 * 24 * 7).toString()
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
        const resolvedCounter = (await this.seaport.getCounter(this.walletInfo.address)).toNumber()

        const signature = await this.signOrder(orderParameters, resolvedCounter)

        return {
            parameters: {...orderParameters, counter: resolvedCounter},
            signature,
        };
    }

    async createBuyOrder({
                             asset,
                             quantity = 1,
                             paymentToken = this.GasWarpperToken,
                             expirationTime = 0,
                             startAmount,
                             protocolFeePoints,
                             protocolFeeAddress
                         }: BuyOrderParams): Promise<OrderWithCounter> {

        const {isApprove, calldata, balances} = await this.getOrderApprove({
            asset,
            quantity,
            paymentToken,
            expirationTime,
            startAmount,
        }, OrderSide.Buy)

        if (!isApprove && calldata) {
            const tx = await ethSend(this.walletInfo, calldata)
            await tx.wait();
            console.log("CreateBuyOrder Token setApproved", balances);
        }

        const amount = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals)
        console.log("createBuyOrder", amount.toString())
        const offer: OfferItem[] = [
            {
                itemType: ItemType.ERC20,
                token: paymentToken.address,
                identifierOrCriteria: "0",
                startAmount: amount.toString(),
                endAmount: amount.toString()
            }
        ]
        const assetQut = quantity.toString()
        const consideration: ConsiderationItem[] = [{
            itemType: asset.schemaName.toLowerCase() == "erc721" ? ItemType.ERC721 : ItemType.ERC1155,
            token: asset.tokenAddress,
            identifierOrCriteria: asset?.tokenId?.toString() || "1",
            startAmount: assetQut,
            endAmount: assetQut,
            recipient: this.walletInfo.address
        }]

        let recipients: { address: string, points: number }[] = []
        protocolFeePoints = protocolFeePoints || this.protocolFeePoints
        if (protocolFeePoints != 0) {
            recipients.push({
                address: protocolFeeAddress || this.feeRecipientAddress,
                points: protocolFeePoints
            })
        }

        const collection = asset.collection
        if (collection && collection.royaltyFeePoints) {
            if (!collection.royaltyFeeAddress) throw "Inroyalties greater than 0 The address cannot be empty!"
            recipients.push({
                address: collection.royaltyFeeAddress,
                points: collection.royaltyFeePoints
            })
        }
        const start = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals)
        const {fees} = computeFees(recipients, start, paymentToken.address)
        consideration.push(...fees)

        return this.createOrder(offer, consideration, expirationTime)

    }

    async createSellOrder({
                              asset,
                              quantity = 1,
                              paymentToken = NullToken,
                              listingTime = 0,
                              expirationTime = 0,
                              startAmount,
                              endAmount,
                              protocolFeePoints,
                              protocolFeeAddress
                          }: SellOrderParams): Promise<OrderWithCounter> {

        const {isApprove, calldata, balances} = await this.getOrderApprove({
            asset,
            quantity,
            paymentToken,
            expirationTime,
            startAmount,
        }, OrderSide.Sell)

        if (!isApprove && calldata) {
            const tx = await ethSend(this.walletInfo, calldata)
            await tx.wait();
            console.log("CreateSellOrder Token setApproved", balances);
        }

        const assetAmount = quantity.toString()
        const offer: OfferItem[] = [
            {
                itemType: asset.schemaName.toLowerCase() == "erc721" ? ItemType.ERC721 : ItemType.ERC1155,
                token: asset.tokenAddress,
                identifierOrCriteria: asset?.tokenId?.toString() || "1",
                startAmount: assetAmount,
                endAmount: assetAmount
            }
        ]

        let recipients: { address: string, points: number }[] = []
        protocolFeePoints = protocolFeePoints || this.protocolFeePoints
        if (protocolFeePoints != 0) {
            recipients.push({
                address: protocolFeeAddress || this.feeRecipientAddress,
                points: protocolFeePoints
            })
        }

        const collection = asset.collection
        if (collection && collection.royaltyFeePoints) {
            if (!collection.royaltyFeeAddress) throw "Inroyalties greater than 0 The address cannot be empty!"
            recipients.push({
                address: collection.royaltyFeeAddress,
                points: collection.royaltyFeePoints
            })
        }
        const payPoints = recipients.map(val => Number(val.points)).reduce((cur, next) => cur + next)

        recipients.unshift({
            address: this.walletInfo.address,
            points: ONE_HUNDRED_PERCENT_BP - payPoints
        })

        const start = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals)
        // const end = ethers.utils.parseUnits((endAmount || startAmount).toString(), paymentToken.decimals).toString()
        const {fees: consideration} = computeFees(recipients, start, paymentToken.address)
        return this.createOrder(offer, consideration, expirationTime)
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

    async getMatchCallData(params: MatchParams) {
        const {orderStr, takerAmount} = params
        if (takerAmount) {
            return this.fulfillAdvancedOrder({order: JSON.parse(orderStr)})
        } else {
            return this.fulfillBasicOrder({order: JSON.parse(orderStr)})
        }
    }

    public async fulfillOrder(orderStr: string) {
        // await this.checkMatchOrder(orderStr)
        const callData = await this.getMatchCallData({orderStr})
        // console.assert(sell.exchange.toLowerCase() == this.seaport.address.toLowerCase(), 'AcceptOrder error')
        return this.ethSend(transactionToCallData(callData))
    }

    public async checkOrderPost(orderStr: string, taker: string = NULL_ADDRESS) {
        const {parameters, signature} = JSON.parse(orderStr)
        const operator = this.conduit.address
        const {offer} = parameters
        const offerAsset = offer[0]
        if (offerAsset.itemType == ItemType.ERC20) {
            const {balances, allowance} = await this.userAccount.getTokenApprove(offerAsset.token, operator)
            console.log(balances, allowance)
        } else {
            const {isApprove, balances} = await this.userAccount.getAssetApprove({
                tokenAddress: offerAsset.token,
                tokenId: offerAsset.identifierOrCriteria,
                schemaName: offerAsset.itemType == ItemType.ERC721 ? "ERC721" : "ERC115"
            }, operator)
            console.log(isApprove, balances)
        }
    }

    async fulfillAdvancedOrder({
                                   order,
                                   tips = [],
                               }: {
        order: OrderWithCounter;
        tips?: ConsiderationItem[];
    }) {
        const conduitKey = await this.conduitController.getKey(this.conduit.address)
        const {parameters} = order;
        const {offer, consideration} = parameters
        const orderAccountingForTips = {
            ...order,
            parameters: {
                ...order.parameters,
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

        const offerCriteriaItems = offer.filter(({itemType}) =>
            isCriteriaItem(itemType)
        );

        const considerationCriteriaItems = considerationIncludingTips.filter(
            ({itemType}) => isCriteriaItem(itemType)
        );

        const hasCriteriaItems =
            offerCriteriaItems.length > 0 || considerationCriteriaItems.length > 0;

        //2.criteriaResolvers:CriteriaResolver[]
        const criteriaResolvers = hasCriteriaItems
            ? generateCriteriaResolvers({orders: [order]})
            : []


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
        const recipient = this.walletInfo.address


        return this.seaport.populateTransaction.fulfillAdvancedOrder(advancedOrder, criteriaResolvers, fulfillerConduitKey, recipient, payableOverrides)
    }

    async fulfillBasicOrder({
                                order,
                                tips = [],
                            }: {
        order: OrderWithCounter;
        tips?: ConsiderationItem[];
    }) {
        const conduitKey = await this.conduitController.getKey(this.conduit.address)
        const {parameters} = order;
        const {offer, consideration} = parameters;
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
            totalOriginalAdditionalRecipients:
                order.parameters.consideration.length - 1,
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
    getOrderHash(orderComponents: OrderComponents): string {
        return getEIP712StructHash(EIP_712_PRIMARY_TYPE, EIP_712_ORDER_TYPE, orderComponents as any)
        // return this.seaport.getOrderHash(order)
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

