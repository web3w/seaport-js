import EventEmitter from 'events'

import {
    BuyOrderParams,
    CreateOrderParams,
    APIConfig,
    ExchangetAgent,
    ExchangeMetadata,
    LowerPriceOrderParams,
    MatchParams,
    metadataToAsset,
    OrderType,
    SellOrderParams
} from "web3-accounts"

import {
    WalletInfo,
    LimitedCallSpec,
    BigNumber,
    NULL_ADDRESS,
    AssetsQueryParams,
    AssetCollection,
    FeesInfo
} from "./types"

import {SeaportEx} from "./seaportEx";
import {OpenseaAPI} from "../api/opensea";
import {Asset} from "web3-accounts/lib/src/types";

export class SeaportExAgent extends EventEmitter {
    public contracts: SeaportEx
    public walletInfo: WalletInfo
    public api: OpenseaAPI

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        const {chainId, address} = wallet
        let conf: APIConfig = {chainId, account: address}
        if (config) {
            conf = {...conf, ...config}
        }
        this.contracts = new SeaportEx(wallet, conf)
        this.api = new OpenseaAPI(conf)
        this.walletInfo = wallet
    }


    async getAssetBalances(asset: Asset, account?: string): Promise<string> {
        return this.contracts.userAccount.getAssetBalances(asset, account)
    }

    async getTokenBalances(params: {
        tokenAddress: string;
        accountAddress?: string;
        rpcUrl?: string;
    }): Promise<any> {
        return this.contracts.userAccount.getTokenBalances({
            tokenAddr: params.tokenAddress,
            account: params.accountAddress,
            rpcUrl: params.rpcUrl
        })
    }

    async transfer(asset: Asset, to: string, quantity: number) {
        return this.contracts.userAccount.transfer(asset, to, quantity)
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
            royaltyFeePoint: val.royaltyFeePoint,
            protocolFeePoint: val.protocolFeePoint,
            protocolFeeAddress: this.contracts.feeRecipientAddress
        }))
    }

    async createLowerPriceOrder(params: LowerPriceOrderParams): Promise<any> {
        return Promise.resolve()
    }
}

