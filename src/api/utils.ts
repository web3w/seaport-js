import {ConsiderationItem, OfferItem, OpenSeaAccount, OpenSeaUser, OrderParameters} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const accountFromJSON = (account: any): OpenSeaAccount => {
  return {
    address: account.address,
    config: account.config,
    profileImgUrl: account.profile_img_url,
    user: account.user ? userFromJSON(account.user) : null,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const userFromJSON = (user: any): OpenSeaUser => {
  return {
    username: user.username,
  };
};

import {
  OrderProtocol,
  OrdersQueryOptions,
  OrderSide,
  OrderV2,
  SerializedOrderV2,
} from "./types";

const NETWORK_TO_CHAIN = {
  1: "ethereum",
  4: "rinkeby",
};

export const getOrdersAPIPath = (
  chainId: number,
  protocol: OrderProtocol,
  side: OrderSide
) => {
  const chain = NETWORK_TO_CHAIN[chainId];
  const sidePath = side === "ask" ? "listings" : "offers";
  return `/api/v2/orders/${chain}/${protocol}/${sidePath}`;
};

type OrdersQueryPathOptions = "protocol" | "side";
export const serializeOrdersQueryOptions = (
  options: Omit<OrdersQueryOptions, OrdersQueryPathOptions>
) => {
  return {
    limit: options.limit,
    cursor: options.cursor,

    payment_token_address: options.paymentTokenAddress,
    maker: options.maker,
    taker: options.taker,
    owner: options.owner,
    bundled: options.bundled,
    include_bundled: options.includeBundled,
    listed_after: options.listedAfter,
    listed_before: options.listedBefore,
    token_ids: options.tokenIds,
    asset_contract_address: options.assetContractAddress,
    order_by: options.orderBy,
    order_direction: options.orderDirection,
    only_english: options.onlyEnglish,
  };
};

export const deserializeOrder = (order: SerializedOrderV2): OrderV2 => {
  return {
    createdDate: order.created_date,
    closingDate: order.closing_date,
    listingTime: order.listing_time,
    expirationTime: order.expiration_time,
    orderHash: order.order_hash,
    maker: accountFromJSON(order.maker),
    taker: order.taker ? accountFromJSON(order.taker) : null,
    protocolData: order.protocol_data,
    protocolAddress: order.protocol_address,
    currentPrice: order.current_price,
    makerFees: order.maker_fees.map(({ account, basis_points }) => ({
      account: accountFromJSON(account),
      basisPoints: basis_points,
    })),
    takerFees: order.taker_fees.map(({ account, basis_points }) => ({
      account: accountFromJSON(account),
      basisPoints: basis_points,
    })),
    side: order.side,
    orderType: order.order_type,
    cancelled: order.cancelled,
    finalized: order.finalized,
    markedInvalid: order.marked_invalid,
    clientSignature: order.client_signature,
    makerAssetBundle:  order.maker_asset_bundle,
    takerAssetBundle:  order.taker_asset_bundle,
  };
};


//
//
// export interface OfferItemModel {
//   item_type: number
//   token: string
//   identifier_or_criteria: string
//   startAmount: number
//   endAmount: number
// }
//
// export interface OfferModel {
//   offer_item: OfferItemModel
// }
//
// export interface ConsiderationItemModel extends OfferItemModel {
//   recipient: string
// }
//
// export interface ConsiderationModel {
//   consideration_item: ConsiderationItemModel
// }
//
//
// export type OrderParametersModel = {
//   offerer: string
//   zone: string
//   zone_hash: string
//   start_time: number
//   end_time: number
//   order_type: number
//   salt: string
//   conduitKey: string
//   nonce: string,
//   offer: OfferItemModel[],
//   consideration: ConsiderationItemModel[]
// }
//
// export function converToPost(order: OrderParameters): OrderParametersModel {
//
//   // const {parameters: order_parameters, signature} = order721
//   const {offerer, zone, zoneHash, startTime, endTime, orderType, salt, conduitKey, offer, consideration} = order
//   const offerItem: OfferItemModel[] = offer.map((val: OfferItem) => ({
//     item_type: val.itemType,
//     token: val.token,
//     identifier_or_criteria: val.identifierOrCriteria,
//     startAmount: Number(val.startAmount),
//     endAmount: Number(val.endAmount)
//   }))
//   const considerationItme: ConsiderationItemModel[] = consideration.map((val: ConsiderationItem) => ({
//     item_type: val.itemType,
//     token: val.token,
//     identifier_or_criteria: val.identifierOrCriteria,
//     startAmount: Number(val.startAmount),
//     endAmount: Number(val.endAmount),
//     recipient: val.recipient
//   }))
//   return {
//     offerer,
//     zone,
//     zone_hash: zoneHash,
//     start_time: Number(startTime),
//     end_time: Number(endTime),
//     order_type: orderType,
//     salt,
//     conduitKey,
//     nonce: "0",
//     offer: offerItem,
//     consideration: considerationItme
//   }
// }

