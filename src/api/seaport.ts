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
    // https://api.opensea.io/api/v1/assets?asset_contract_address=0xbd3531da5cf5857e7cfaa92426877b022e612cf8
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

// success
// {
//     "parameters": {
//         "offerer": "0x32f4b63a46c1d12ad82cabc778d75abf9889821a",
//         "zone": "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
//         "orderType": 2,
//         "startTime": "1658844163",
//         "endTime": "1658847761",
//         "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
//         "salt": "63671428114909039",
//         "offer": [
//         {
//             "itemType": 2,
//             "token": "0x52f687b1c6aacc92b47da5209cf25d987c876628",
//             "identifierOrCriteria": "1",
//             "startAmount": "1",
//             "endAmount": "1"
//         }
//     ],
//         "consideration": [
//         {
//             "itemType": 0,
//             "token": "0x0000000000000000000000000000000000000000",
//             "identifierOrCriteria": "0",
//             "startAmount": "925000000000000000",
//             "endAmount": "925000000000000000",
//             "recipient": "0x32f4b63a46c1d12ad82cabc778d75abf9889821a"
//         },
//         {
//             "itemType": 0,
//             "token": "0x0000000000000000000000000000000000000000",
//             "identifierOrCriteria": "0",
//             "startAmount": "25000000000000000",
//             "endAmount": "25000000000000000",
//             "recipient": "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
//         },
//         {
//             "itemType": 0,
//             "token": "0x0000000000000000000000000000000000000000",
//             "identifierOrCriteria": "0",
//             "startAmount": "50000000000000000",
//             "endAmount": "50000000000000000",
//             "recipient": "0x32f4b63a46c1d12ad82cabc778d75abf9889821a"
//         }
//     ],
//         "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
//         "counter": 0,
//         "totalOriginalConsiderationItems": 3
// },
//     "signature": "0x88d4b8510925d34b49513ee78d5be83cb2602a4cb812e322a0e073238dbc880928259da9c963bdd5081d5cf0909fb84289030a1933fa5fb0695a6861752b764a1c"
// }


// {
//     "parameters": {
//         "offerer": "0x32f4b63a46c1d12ad82cabc778d75abf9889821a",
//         "zone": "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
//         "orderType": 2,
//         "startTime": "1658843602",
//         "endTime": "1658847201",
//         "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
//         "salt": "23144606790842543",
//         "offer": [
//         {
//             "itemType": 2,
//             "token": "0xb840ec0db3b9ab7b920710d6fc21a9d206f994aa",
//             "identifierOrCriteria": "686",
//             "startAmount": "1",
//             "endAmount": "1"
//         }
//     ],
//         "consideration": [
//         {
//             "itemType": 0,
//             "token": "0x0000000000000000000000000000000000000000",
//             "identifierOrCriteria": "0",
//             "startAmount": "832500000000000000",
//             "endAmount": "832500000000000000",
//             "recipient": "0x32f4b63a46c1d12ad82cabc778d75abf9889821a"
//         },
//         {
//             "itemType": 0,
//             "token": "0x0000000000000000000000000000000000000000",
//             "identifierOrCriteria": "0",
//             "startAmount": "22500000000000000",
//             "endAmount": "22500000000000000",
//             "recipient": "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
//         },
//         {
//             "itemType": 0,
//             "token": "0x0000000000000000000000000000000000000000",
//             "identifierOrCriteria": "0",
//             "startAmount": "45000000000000000",
//             "endAmount": "45000000000000000",
//             "recipient": "0xb0e9fe550ca345daa529c603ed28ef869e2882cd"
//         }
//     ],
//         "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
//         "counter": 0,
//         "totalOriginalConsiderationItems": 3
// },
//     "signature": "0x388e1d5e78090cb2175524bcc179b9996acbf5951bebb5967fae4c398f0c0b0761904d83310c48897d542af310a65ea20c83e3b801e7462d2be125c4d7bf36a21c"
// }
