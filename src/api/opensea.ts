import {BaseFetch, sleep,} from "web3-accounts";
import QueryString from "querystring";
import {
    AssetCollection,
    OrdersQueryParams,
    AssetsQueryParams,
    APIConfig,
    Order
} from "../types";

import {OPENSEA_API_TIMEOUT, OPENSEA_API_CONFIG, ORDERS_PATH, OPENSEA_API_KEY} from "./config";
import {assert, schemas} from "../assert/index";
import {BigNumber, NULL_ADDRESS,} from "web3-wallets";
import {OrderType} from "web3-accounts"


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

    public async getOrders(queryParams: OrdersQueryParams, retries = 2): Promise<{ orders: any[], count: number }> {
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
