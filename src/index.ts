import EventEmitter from 'events'
import {Seaport} from "./seaport";
import {SeaportAPI} from "./api/seaport";
import {SwapEx} from "./swapEx/swapEx";

import {
    Asset, FeesInfo,
    APIConfig, Web3Accounts, ExchangetAgent, OrderSide,
    CreateOrderParams, MatchParams, SellOrderParams, BuyOrderParams
} from "web3-accounts"

import {
    AssetsQueryParams,
    AssetCollection
} from "./api/types"
import {WalletInfo} from "web3-wallets";

export class SeaportSDK extends EventEmitter implements ExchangetAgent {
    public walletInfo: WalletInfo
    public contracts: Seaport
    public swap: SwapEx
    public api: SeaportAPI
    public user: Web3Accounts

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        const {chainId, address} = wallet
        let conf: APIConfig = {chainId, account: address}
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
        return this.contracts.getMatchCallData(params)
    }

    async createSellOrder(params: SellOrderParams): Promise<any> {
        return this.contracts.createSellOrder(params)
    }

    async createBuyOrder(params: BuyOrderParams): Promise<any> {
        return this.contracts.createBuyOrder(params)
    }

    async matchOrder(orderStr: string) {
        return this.contracts.fulfillOrder(orderStr)
    }

    async fulfillOrder(orderStr: string) {
        return this.contracts.fulfillOrder(orderStr)
    }

    async cancelOrders(orders: string[]) {

        return this.contracts.cancelOrders(orders.map(val => JSON.parse(val)))
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

    async getAssetsFees(tokens: AssetsQueryParams): Promise<FeesInfo[]> {
        const assets: AssetCollection[] = await this.api.getAssets(tokens)
        return assets.map(val => (<FeesInfo>{
            royaltyFeeAddress: val.royaltyFeeAddress,
            royaltyFeePoints: val.royaltyFeePoints,
            protocolFeePoints: val.protocolFeePoints,
            protocolFeeAddress: this.contracts.feeRecipientAddress
        }))
    }

}

