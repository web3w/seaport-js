import {sleep} from "web3-wallets";
import QueryString from "querystring";
import {
    AssetCollection,
    OrdersQueryParams,
    AssetsQueryParams,
    APIConfig,
    Order, OrderParameters, OfferItem, ConsiderationItem, NULL_ADDRESS
} from "../types";

import {OPENSEA_API_TIMEOUT, OPENSEA_API_CONFIG, OPENSEA_API_KEY, CHAIN_PATH} from "./config";
import {assert, schemas} from "../assert/index";
import {OrderSide, BaseFetch} from "web3-accounts"

export interface OfferItemModel {
    item_type: number
    token: string
    identifier_or_criteria: string
    startAmount: number
    endAmount: number
}

export interface OfferModel {
    offer_item: OfferItemModel
}

export interface ConsiderationItemModel extends OfferItemModel {
    recipient: string
}

export interface ConsiderationModel {
    consideration_item: ConsiderationItemModel
}


export type OrderParametersModel = {
    offerer: string
    zone: string
    zone_hash: string
    start_time: number
    end_time: number
    order_type: number
    salt: string
    conduitKey: string
    nonce: string,
    offer: OfferItemModel[],
    consideration: ConsiderationItemModel[]
}

export function converToPost(order: OrderParameters): OrderParametersModel {

    // const {parameters: order_parameters, signature} = order721
    const {offerer, zone, zoneHash, startTime, endTime, orderType, salt, conduitKey, offer, consideration} = order
    const offerItem: OfferItemModel[] = offer.map((val: OfferItem) => ({
        item_type: val.itemType,
        token: val.token,
        identifier_or_criteria: val.identifierOrCriteria,
        startAmount: Number(val.startAmount),
        endAmount: Number(val.endAmount)
    }))
    const considerationItme: ConsiderationItemModel[] = consideration.map((val: ConsiderationItem) => ({
        item_type: val.itemType,
        token: val.token,
        identifier_or_criteria: val.identifierOrCriteria,
        startAmount: Number(val.startAmount),
        endAmount: Number(val.endAmount),
        recipient: val.recipient
    }))
    return {
        offerer,
        zone,
        zone_hash: zoneHash,
        start_time: Number(startTime),
        end_time: Number(endTime),
        order_type: orderType,
        salt,
        conduitKey,
        nonce: "0",
        offer: offerItem,
        consideration: considerationItme
    }
}


export class SeaportAPI extends BaseFetch {
    public chainPath: string

    constructor(
        config?: APIConfig
    ) {
        const chainId = config?.chainId || 1
        const apiBaseUrl = config?.apiBaseUrl || OPENSEA_API_CONFIG[chainId].apiBaseUrl
        super({
            apiBaseUrl,
            apiKey: config?.apiKey || OPENSEA_API_KEY
        })
        this.chainPath = CHAIN_PATH[chainId]
        if (OPENSEA_API_CONFIG[chainId]) {
            this.proxyUrl = config?.proxyUrl
            this.apiTimeout = config?.apiTimeout || OPENSEA_API_TIMEOUT
        } else {
            throw 'OpenseaAPI unsport chainId:' + config?.chainId
        }
    }

    //https://docs.opensea.io/reference/getting-assets
    public async getAssets(queryParams: AssetsQueryParams, retries = 2): Promise<AssetCollection[]> {
        const {owner, include_orders, limit, assets} = queryParams
        const list = assets ? assets.map((val: any) => {
            return QueryString.stringify(val)
        }) : []
        const assetList = list.join('&')
        const query = {
            include_orders: include_orders || false,
            limit: limit || 10
        }
        if (owner) {
            query['owner'] = owner
        }
        const queryUrl = list.length > 0
            ? `${QueryString.stringify(query)}&${assetList}`
            : QueryString.stringify(query)

        try {
            //https://testnets-api.opensea.io/api/v1/assets?include_orders=false&limit=1&owner=0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401
            console.log("getAssets", `${this.apiBaseUrl}/api/v1/assets?${queryUrl}`)
            const json = await this.getQueryString('/api/v1/assets', queryUrl)

            // json.assets.collection.dev_seller_fee_basis_points
            // json.assets.asset_contract.dev_seller_fee_basis_points
            return json.assets.map(val => ({
                ...val.asset_contract,
                royaltyFeePoints: Number(val.collection?.dev_seller_fee_basis_points),
                protocolFeePoints: Number(val.collection?.opensea_seller_fee_basis_points),
                royaltyFeeAddress: val.collection?.payout_address,
                sell_orders: val.sell_orders,
                token_id: val.token_id
            }))
        } catch (error: any) {
            this.throwOrContinue(error, retries)
            await sleep(3000)
            return this.getAssets(queryParams, retries - 1)
        }
    }

    public async getOrders(queryParams: OrdersQueryParams, retries = 2): Promise<{ orders: any[], count: number }> {
        const {token_ids, asset_contract_address} = queryParams
        try {
            // side: queryParams.side || OrderSide.Buy
            const query = {
                token_ids,
                asset_contract_address,
                limit: queryParams.limit || 10
            }
            const orderSide = queryParams.side == OrderSide.Buy ? 'offers' : 'listings'
            const apiPath = `/v2/orders/${this.chainPath}/seaport/${orderSide}`
            console.log(`${this.apiBaseUrl}${apiPath}?${QueryString.stringify(query)}`)
            const json = await this.get(apiPath, query, {
                headers: {
                    "X-API-KEY": this.apiKey || OPENSEA_API_KEY
                }
            })
            if (!json.orders) {
                throw new Error('Not  found: no  matching  order  found')
            }
            const orders: any[] = []
            for (let i = 0; i < json.orders.length; i++) {
                orders.push(json.orders[i])
            }
            return {
                orders,
                count: json.count
            }
        } catch (error: any) {
            this.throwOrContinue(error, retries)
            await sleep(3000)
            return this.getOrders(queryParams, retries - 1)
        }
    }


    public async postOrder(orderStr: string, retries = 2): Promise<any> {
        const {parameters, signature} = JSON.parse(orderStr)
        const order_parameters =  converToPost(parameters)
        // assert.doesConformToSchema('PostOrder', singSellOrder, schemas.orderSchema)
        try {
            const opts = {
                headers: {
                    'X-API-KEY': this.apiKey || OPENSEA_API_KEY
                }
            }

            // itemType = 1 ERC20  "itemType" = 2, ERC721..
            const offer = parameters.offer[0]
            const orderSide = offer.itemType == 1 && offer.identifierOrCriteria == "0" ? 'offers' : 'listings'

            // const orderSide = side == OrderSide.Buy ? 'offers' : 'listings'
            const apiPath = `/v2/orders/${this.chainPath}/seaport/${orderSide}`

            console.log(`${this.apiBaseUrl}${apiPath}`)
            console.log(order_parameters)
            console.log(signature)
            const result = await this.post(
                apiPath,
                {order_parameters, signature},
                opts
            ).catch((e: any) => {
                console.log(e)
                throw e
            })
            return result
        } catch (error: any) {
            this.throwOrContinue(error, retries)
            await sleep(3000)
            return this.postOrder(orderStr, retries)
        }
    }

}

const order11 ={
    offerer: '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a',
        zone: '0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e',
    zone_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    start_time: 0,
    end_time: 1656358473,
    order_type: 2,
    salt: '1655753675193',
    conduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
    nonce: '0',
    offer: [
    {
        item_type: 2,
        token: '0x984ac9911c6839a6870a1040a5fb89dd66513bc5',
        identifier_or_criteria: '6136',
        startAmount: 1,
        endAmount: 1
    }
],
    consideration: [
    {
        item_type: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifier_or_criteria: '0',
        startAmount: 462500000000000000,
        endAmount: 462500000000000000,
        recipient: '0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'
    },
    {
        item_type: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifier_or_criteria: '0',
        startAmount: 12500000000000000,
        endAmount: 12500000000000000,
        recipient: '0x8De9C5A032463C561423387a9648c5C7BCC5BC90'
    },
    {
        item_type: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifier_or_criteria: '0',
        startAmount: 25000000000000000,
        endAmount: 25000000000000000,
        recipient: '0x545ed214984f3ec57fb6a614f2a6211f0481547f'
    }
]
}
