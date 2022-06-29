import EventEmitter from 'events'
import {Seaport} from "./seaport";
import {SeaportAPI} from "./api/seaport";
import {SwapEx} from "./swapEx/swapEx";

import {
    Asset, FeesInfo,
    APIConfig, Web3Accounts, ExchangetAgent, OrderSide,
    CreateOrderParams, MatchParams, SellOrderParams, BuyOrderParams, MatchOrderOption, transactionToCallData
} from "web3-accounts"

import {
    AssetsQueryParams,
    AssetCollection, OrdersQueryParams, OrderV2
} from "./api/types"
import {WalletInfo} from "web3-wallets";
import {OrderComponents, OrderWithCounter, MatchOrdersParams, Order} from "./types";
import {seaportAssert} from "./utils/assert";

const {validateOrder, validateOrderWithCounter} = seaportAssert

export class SeaportSDK extends EventEmitter implements ExchangetAgent {
    public walletInfo: WalletInfo
    public contracts: Seaport
    public swap: SwapEx
    public api: SeaportAPI
    public user: Web3Accounts

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        const {chainId, address} = wallet
        let conf: APIConfig = {chainId}
        if (config) {
            conf = {...conf, ...config}
        }
        this.contracts = new Seaport(wallet, conf)
        this.api = new SeaportAPI(conf)
        this.swap = new SwapEx(wallet)
        this.user = new Web3Accounts(wallet)
        this.walletInfo = wallet
    }

    async getOrderApprove(params: CreateOrderParams, side: OrderSide) {
        return this.contracts.getOrderApprove(params, side)
    }

    async getMatchCallData(params: MatchParams): Promise<any> {
        const {orderStr, takerAmount} = params
        if (!validateOrderWithCounter(orderStr)) throw validateOrderWithCounter.errors
        return this.contracts.getMatchCallData({order: JSON.parse(orderStr) as OrderWithCounter})
    }

    async createSellOrder(params: SellOrderParams): Promise<OrderWithCounter> {
        return this.contracts.createSellOrder(params)
    }

    async createBuyOrder(params: BuyOrderParams): Promise<OrderWithCounter> {
        return this.contracts.createBuyOrder(params)
    }

    async fulfillOrder(orderStr: string, options?: MatchOrderOption) {
        let order = JSON.parse(orderStr)
        if (order.protocolData) {
            order = order.protocolData
        }
        if (!validateOrder(order)) throw validateOrder.errors

        const {takerAmount, taker} = options || {}
        let data
        if (takerAmount) {
            data = await this.contracts.fulfillAdvancedOrder({order, takerAmount, recipient: taker})
        } else {
            data = await this.contracts.fulfillBasicOrder({order})
        }
        return this.contracts.ethSend(transactionToCallData(data))
    }

    async fulfillOrders(orders: MatchOrdersParams) {
        const {orderList} = orders
        if (orderList.length == 0) {
            throw 'Seaport fulfill orders eq 0'
        }
        if (orderList.length == 1) {
            const {orderStr, metadata, takerAmount, taker} = orderList[0]
            const oneOption: MatchOrderOption = {
                metadata,
                takerAmount,
                taker
            }
            return this.fulfillOrder(orderStr, oneOption)
        } else {
            const availableOrders: Order[] = []
            for (const {orderStr} of orderList) {
                let order = JSON.parse(orderStr)
                if (order.protocolData) {
                    order = order.protocolData
                }
                if (!validateOrder(order)) throw validateOrder.errors
                availableOrders.push(order)
            }
            const data = await this.contracts.fulfillAvailableAdvancedOrders({orders: availableOrders})

            return this.contracts.ethSend(transactionToCallData(data))
        }

    }

    async cancelOrders(orders: string[]) {
        if (orders.length == 0) {
            return this.contracts.bulkCancelOrders()
        } else {
            const orderComp = orders.map((val) => {
                const order = JSON.parse(val) as OrderWithCounter
                if (!validateOrderWithCounter(order)) throw validateOrderWithCounter.errors
                const {parameters} = order;
                return parameters as OrderComponents
            })
            return this.contracts.cancelOrders(orderComp)
        }
    }

    async getAssetBalances(asset: Asset, account?: string): Promise<string> {
        return this.user.getAssetBalances(asset, account)
    }

    async getTokenBalances(params: {
        tokenAddress: string;
        accountAddress?: string;
        rpcUrl?: string;
    }): Promise<any> {
        return this.user.getTokenBalances({
            tokenAddr: params.tokenAddress,
            account: params.accountAddress,
            rpcUrl: params.rpcUrl
        })
    }

    async transfer(asset: Asset, to: string, quantity: number) {
        return this.user.transfer(asset, to, quantity)
    }

    async getOwnerAssets(tokens?: AssetsQueryParams): Promise<AssetCollection[]> {
        if (tokens) {
            tokens.owner = tokens.owner || this.walletInfo.address
        } else {
            tokens = {
                owner: this.walletInfo.address,
                limit: 1,
            }
        }
        return this.api.getAssets(tokens)
    }

    async getOwnerOrders(tokens?: OrdersQueryParams): Promise<{ orders: OrderV2[], count: number }> {
        if (tokens) {
            tokens.owner = tokens.owner || this.walletInfo.address
        } else {
            tokens = {
                owner: this.walletInfo.address,
                limit: 10,
                side: OrderSide.All
            }
        }
        return this.api.getOrders(tokens)
    }

    async postOrder(orderStr: string) {
        return this.api.postOrder(orderStr)
    }

    async getAssetsFees(assetAddresses: string[]): Promise<FeesInfo[]> {
        const assets = assetAddresses.map(val => ({asset_contract_addresses: val}))
        const tokens: AssetsQueryParams = {assets}
        const collections: AssetCollection[] = await this.api.getAssets(tokens)
        return collections.map(val => (<FeesInfo>{
            royaltyFeeAddress: val.royaltyFeeAddress,
            royaltyFeePoints: val.royaltyFeePoints,
            protocolFeePoints: val.protocolFeePoints,
            protocolFeeAddress: this.contracts.protocolFeeAddress
        }))
    }

}

