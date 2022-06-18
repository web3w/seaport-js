import EventEmitter from 'events'

import {SEAPORT_CONTRACTS_ADDRESSES, SeaportABI,} from './contracts/index'

import {APIConfig, NullToken, SellOrderParams, Token, Web3Accounts,} from 'web3-accounts'
import {
    EIP712Message,
    ethSend,
    LimitedCallSpec,
    NULL_BLOCK_HASH,
    WalletInfo,
    NULL_ADDRESS,
    getChainRpcUrl,
    getEstimateGas, getEIP712StructHash
} from "web3-wallets"

import {BigNumber, Contract, ethers} from "ethers";
import {
    BasicOrderRouteType,
    ConsiderationItem,
    InputCriteria,
    Item,
    OfferItem,
    Order,
    OrderComponents,
    OrderParameters,
    OrderStatus,
    OrderType,
    OrderWithCounter, SeaportConfig
} from "./types";
import {
    EIP_712_ORDER_TYPE,
    EIP_712_PRIMARY_TYPE,
    ItemType, KNOWN_CONDUIT_KEYS_TO_CONDUIT, NO_CONDUIT,
    SEAPORT_CONTRACT_NAME,
    SEAPORT_CONTRACT_VERSION
} from "./constants";
import {generateCriteriaResolvers} from "./utils/criteria";
import {
    offerAndConsiderationFulfillmentMapping,
    validateAndSanitizeFromOrderStatus
} from "./utils/fulfill";
import {getSummedTokenAndIdentifierAmounts, isCriteriaItem, TimeBasedItemParams} from "./utils/item";

export class Seaport extends EventEmitter {
    public walletInfo: WalletInfo
    public protocolFeePoint = 250
    // address
    public contractAddresses: any
    // public WETHAddr: string
    public feeRecipientAddress: string
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

    async createSellOrder({
                              asset,
                              quantity = 1,
                              paymentToken = NullToken,
                              listingTime = 0,
                              expirationTime = 0,
                              startAmount,
                              endAmount
                          }: SellOrderParams): Promise<OrderWithCounter> {
        const operator = this.conduit.address
        const assetApprove = await this.userAccount.getAssetApprove(asset, operator)
        if (assetApprove.balances == '0') {
            throw 'Seller asset balance 0'
        }
        if (!assetApprove.isApprove && assetApprove.calldata) {
            const tx = await ethSend(this.walletInfo, assetApprove.calldata)
            await tx.wait()
            console.log("Approve Asset", tx.hash)
        }
        const offerer = this.walletInfo.address
        const zone = ethers.constants.AddressZero
        const orderType = OrderType.FULL_RESTRICTED
        const startTime = listingTime || Math.round(Date.now() / 1000).toString()
        const endTime = expirationTime || Math.round(Date.now()).toString()
        const conduitKey = await this.conduitController.getKey(this.conduit.address)
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
        const start = ethers.utils.parseUnits(startAmount.toString(), paymentToken.decimals).toString()
        const end = ethers.utils.parseUnits((endAmount || startAmount).toString(), paymentToken.decimals).toString()
        // fee..
        const consideration: ConsiderationItem[] = [
            {
                itemType: paymentToken.address == NULL_ADDRESS ? ItemType.NATIVE : ItemType.ERC20,
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
            salt: ethers.utils.hexValue(Date.now()),
            offer,
            consideration,
            totalOriginalConsiderationItems: consideration.length.toString(),
            conduitKey
        }
        const resolvedCounter = (await this.seaport.getCounter(this.walletInfo.address)).toNumber()
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

    //fulfillStandardOrder
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
                consideration: [...order.parameters.consideration, ...tips],
                totalOriginalConsiderationItems: consideration.length,
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

