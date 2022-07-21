import {sleep} from "web3-wallets";
import QueryString from "querystring";
import {
    APIConfig
} from "../types";

import {
    AssetCollection,
    OrdersQueryParams,
    AssetsQueryParams
} from "./types"

import {OPENSEA_API_TIMEOUT, OPENSEA_API_CONFIG, OPENSEA_API_KEY, CHAIN_PATH} from "./config";
import {OrderSide, BaseFetch} from "web3-accounts"
import {ItemType} from "../constants";
import {OrderV2} from "./types";
import {deserializeOrder} from "./utils";
import {seaportAssert} from "../utils/assert";

const {validateOrderV2, validateOrderWithCounter} = seaportAssert

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
            limit: limit || 1
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
                token_id: val.token_id,
                supports_wyvern: val.supports_wyvern
            }))
        } catch (error: any) {
            this.throwOrContinue(error, retries)
            await sleep(3000)
            return this.getAssets(queryParams, retries - 1)
        }
    }

    public async getOrders(queryParams: OrdersQueryParams, retries = 2): Promise<{ orders: OrderV2[], count: number }> {
        // const {token_ids, asset_contract_address} = queryParams
        try {
            queryParams.limit = queryParams.limit || 2
            queryParams.order_by = queryParams.order_by || 'created_date'

            // if (!queryParams.limit) throw new Error("GetOrders params error")


            const headers = {
                "X-API-KEY": this.apiKey || OPENSEA_API_KEY
            }

            const reqList: any[] = []

            const apiPath = `/v2/orders/${this.chainPath}/seaport/`
            if (queryParams.side == OrderSide.All) {
                delete queryParams.side
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const query = QueryString.stringify(queryParams)
                const apiPathOffer = apiPath + 'offers'
                console.log(`${this.apiBaseUrl}${apiPathOffer}?${query}`)
                reqList.push(await this.get(apiPathOffer, queryParams, {headers}))
                const apiPathListing = apiPath + 'listings'
                console.log(`${this.apiBaseUrl}${apiPathListing}?${query}`)
                reqList.push(await this.get(apiPathListing, queryParams, {headers}))

            } else {
                const orderSide = queryParams.side ? 'offers' : 'listings'
                delete queryParams.side
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const query = QueryString.stringify(queryParams)
                console.log(`${this.apiBaseUrl}${apiPath + orderSide}?${query}`)
                reqList.push(await this.get(apiPath + orderSide, queryParams, {headers}))

            }
            const orders: OrderV2[] = []

            for (let i = 0; i < reqList.length; i++) {
                const orderList = reqList[i].orders
                if (!orderList) {
                    throw new Error('Not  found: no  matching  order  found')
                }

                for (let j = 0; j < orderList.length; j++) {
                    const order = deserializeOrder(orderList[j])
                    if (validateOrderV2(order)) {
                        orders.push(order)
                    } else {
                        console.log(validateOrderV2.errors)
                    }
                }
            }
            return {
                orders,
                count: orders.length
            }
        } catch (error: any) {
            this.throwOrContinue(error, retries)
            await sleep(3000)
            return this.getOrders(queryParams, retries - 1)
        }
    }


    public async postOrder(orderStr: string, retries = 2): Promise<{ order: OrderV2 }> {
        const order = JSON.parse(orderStr)
        if (!validateOrderWithCounter(order)) throw  validateOrderWithCounter.errors
        const {parameters, signature} = order
        // const order_parameters = converToPost(parameters)
        try {
            const opts = {
                headers: {
                    'X-API-KEY': this.apiKey || OPENSEA_API_KEY
                }
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            parameters.totalOriginalConsiderationItems = parameters.consideration.length
            // itemType = 1 ERC20  "itemType" = 2, ERC721..
            const offer = parameters.offer[0]
            const sidePath = offer.itemType == ItemType.ERC20 && offer.identifierOrCriteria == "0" ? 'offers' : 'listings'

            // const orderSide = side == OrderSide.Buy ? 'offers' : 'listings'
            const apiPath = `/v2/orders/${this.chainPath}/seaport/${sidePath}`

            // console.log(`${this.apiBaseUrl}${apiPath}`)
            // console.log(order)
            // console.log(signature)
            const result = await this.post(
                apiPath,
                order,
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
