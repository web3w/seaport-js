import {BaseFetch, sleep,} from "web3-accounts";
import QueryString from "querystring";
import {
    AssetCollection,
    OrdersQueryParams,
    AssetsQueryParams,
    APIConfig,
     OrderJSON, Order
} from "../seaportEx/types";

import {OPENSEA_API_TIMEOUT, OPENSEA_API_CONFIG, ORDERS_PATH, OPENSEA_API_KEY} from "./config";
import {assert, schemas} from "../assert/index";
import {BigNumber, NULL_ADDRESS,} from "web3-wallets";
import {OrderType} from "web3-accounts"


export const orderToJSON = (order: Order): OrderJSON => {
    const asJSON: OrderJSON = {
        exchange: order.exchange.toLowerCase(),
        maker: order.maker.toLowerCase(),
        taker: order.taker.toLowerCase(),
        makerRelayerFee: order.makerRelayerFee.toString(),
        takerRelayerFee: order.takerRelayerFee.toString(),
        makerProtocolFee: order.makerProtocolFee.toString(),
        takerProtocolFee: order.takerProtocolFee.toString(),
        makerReferrerFee: order.makerReferrerFee.toString(),
        feeMethod: order.feeMethod,
        feeRecipient: order.feeRecipient.toLowerCase(),
        side: order.side,
        saleKind: order.saleKind,
        target: order.target.toLowerCase(),
        howToCall: order.howToCall,
        calldata: order.calldata,
        replacementPattern: order.replacementPattern,
        staticTarget: order.staticTarget.toLowerCase(),
        staticExtradata: order.staticExtradata,
        paymentToken: order.paymentToken.toLowerCase(),
        quantity: order.quantity.toString(),
        basePrice: order.basePrice.toString(),
        englishAuctionReservePrice: order?.englishAuctionReservePrice?.toString(),
        extra: order.extra.toString(),
        listingTime: order.listingTime.toString(),
        expirationTime: order.expirationTime.toString(),
        salt: order.salt.toString(),

        metadata: order.metadata,

        v: order.v,
        r: order.r,
        s: order.s,

        hash: order.hash
    }
    if (order.nonce) {
        asJSON.nonce = order.nonce
    }
    return asJSON
}

export const openseaOrderFromJSON = (order: any): Order => {
    // console.log(order)
    if (!order) throw new Error("OpenseaOrderFromJSON error")
    const createdDate = new Date(`${order.created_date}Z`)

    const fromJSON: Order = {
        hash: order.order_hash || order.hash,
        cancelledOrFinalized: order.cancelled || order.finalized,
        markedInvalid: order.marked_invalid,
        metadata: order.metadata,
        quantity: new BigNumber(order.quantity || 1),
        exchange: order.exchange,
        makerAccount: order.maker,
        takerAccount: order.maker,
        // Use string address to conform to Wyvern Order schema
        maker: order.maker.address,
        taker: order.taker.address,
        makerRelayerFee: new BigNumber(order.maker_relayer_fee),
        takerRelayerFee: new BigNumber(order.taker_relayer_fee),
        makerProtocolFee: new BigNumber(order.maker_protocol_fee),
        takerProtocolFee: new BigNumber(order.taker_protocol_fee),
        makerReferrerFee: new BigNumber(order.maker_referrer_fee || 0),
        waitingForBestCounterOrder: order.fee_recipient.address == NULL_ADDRESS,
        feeMethod: order.fee_method,
        feeRecipientAccount: order.fee_recipient,
        feeRecipient: order.fee_recipient.address,
        side: order.side,
        saleKind: order.sale_kind,
        target: order.target,
        howToCall: order.how_to_call,
        calldata: order.calldata,//dataToCall
        replacementPattern: order.replacement_pattern,
        staticTarget: order.static_target,
        staticExtradata: order.static_extradata,
        paymentToken: order.payment_token,
        basePrice: new BigNumber(order.base_price),
        extra: new BigNumber(order.extra),
        currentBounty: new BigNumber(order.current_bounty || 0),
        currentPrice: new BigNumber(order.current_price || 0),

        createdTime: new BigNumber(Math.round(createdDate.getTime() / 1000)),
        listingTime: new BigNumber(order.listing_time),
        expirationTime: new BigNumber(order.expiration_time),

        salt: new BigNumber(order.salt),
        v: parseInt(order.v),
        r: order.r,
        s: order.s,

        paymentTokenContract: order.payment_token_contract,
        assetBundle: order.asset_bundle
    }

    // Use client-side price calc, to account for buyer fee (not added by server) and latency
    // fromJSON.currentPrice = estimateCurrentPrice(fromJSON)
    return fromJSON
}


export class OpenseaAPI extends BaseFetch {
    constructor(
        config?: APIConfig
    ) {
        const chainId = config?.chainId || 1
        const apiBaseUrl = config?.apiBaseUrl || OPENSEA_API_CONFIG[chainId].apiBaseUrl
        super({
            apiBaseUrl,
            apiKey: config?.apiKey || OPENSEA_API_KEY
        })
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
            //https://api-test.element.market/bridge/opensea/api/v1/assets?
            // const json = await this.getQueryString('/api/v1/assets', queryUrl)
            const json = await this.getQueryString('/api/v1/assets', queryUrl)

            // json.assets.collection.dev_seller_fee_basis_points
            // json.assets.asset_contract.dev_seller_fee_basis_points
            return json.assets.map(val => ({
                ...val.asset_contract,
                royaltyFeePoint: Number(val.collection?.dev_seller_fee_basis_points),
                protocolFeePoint: Number(val.collection?.opensea_seller_fee_basis_points),
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

    public async getOrders(queryParams: OrdersQueryParams, retries = 2): Promise<{ orders: OrderJSON[], count: number }> {
        const {token_ids, asset_contract_address} = queryParams
        try {
            const query = {
                token_ids,
                asset_contract_address,
                limit: queryParams.limit || 10,
                side: queryParams.side || OrderType.Buy,
                order_by: queryParams.order_by || 'created_date'
            }
            const json = await this.get(`${ORDERS_PATH}/orders`, query, {
                headers: {
                    "X-API-KEY": this.apiKey || OPENSEA_API_KEY
                }
            })
            if (!json.orders) {
                throw new Error('Not  found: no  matching  order  found')
            }
            const orders: any[] = []
            for (let i = 0; i < json.orders.length; i++) {
                const order = openseaOrderFromJSON(json.orders[i])
                orders.push(orderToJSON(order))
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
        const singSellOrder = JSON.parse(orderStr)
        assert.doesConformToSchema('PostOrder', singSellOrder, schemas.orderSchema)
        try {
            const opts = {
                headers: {
                    'X-API-KEY': this.apiKey || "))))"
                }
            }
            const result = await this.post(
                `${ORDERS_PATH}/orders/post`,
                singSellOrder,
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
