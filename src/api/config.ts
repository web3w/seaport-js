export const OPENSEA_API_KEY = "2f6f419a083c46de9d83ce3dbe7db601" //2.5%
//Api Timeout
export const OPENSEA_API_TIMEOUT = 50000

export const ORDERS_PATH = `/wyvern/v1`

//has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
export const OPENSEA_API_CONFIG = {
    1: {
        apiBaseUrl: 'https://api.opensea.io',
    },
    4: {
        apiBaseUrl: 'https://testnets-api.opensea.io',
    }
}

export const SEAPORT_API_CONFIG = {
    1: {
        apiBaseUrl: 'https://api.opensea.io/v2/orders/ethereum/seaport/offers',
    },
    4: {
        apiBaseUrl: 'https://testnets-api.opensea.io/v2/orders/rinkeby/seaport/offers?limit=1',
    }
}
