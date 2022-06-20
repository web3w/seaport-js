import EventEmitter from 'events'
import {Seaport} from "./seaport";
import {SeaportAPI} from "./api/seaport";
import {SwapEx} from "./swapEx/swapEx";

import {
    Asset,
    APIConfig, Web3Accounts
} from "web3-accounts"

import {
    WalletInfo,
    AssetsQueryParams,
    AssetCollection,
    FeesInfo
} from "./types"

export class SeaportSDK extends EventEmitter {
    public walletInfo: WalletInfo
    public sea: Seaport
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
        this.sea = new Seaport(wallet, conf)
        this.api = new SeaportAPI(conf)
        this.swap = new SwapEx(wallet)
        this.user = new Web3Accounts(wallet)
        this.walletInfo = wallet
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
            protocolFeeAddress: this.sea.feeRecipientAddress
        }))
    }

}

