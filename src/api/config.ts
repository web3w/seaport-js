export const OPENSEA_API_KEY = "2f6f419a083c46de9d83ce3dbe7db601" // common
//Api Timeout
export const OPENSEA_API_TIMEOUT = 10000

export const CHAIN_PATH: { [key: string]: string } = {
    1: 'ethereum',
    4: 'rinkeby'
}

//has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
export const OPENSEA_API_CONFIG = {
    1: {apiBaseUrl: 'https://api.opensea.io'},
    4: {apiBaseUrl: 'https://testnets-api.opensea.io'}
}


