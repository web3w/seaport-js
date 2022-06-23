export const apiConfig = {
    1: {
        proxyUrl: 'http://127.0.0.1:7890',
        apiTimeout: 20000,
        protocolFeePoints: 250
    },
    4: {
        proxyUrl: 'http://127.0.0.1:7890',
        apiTimeout: 20000,
        protocolFeePoints: 250
    }
}

export const asset721 = {
    1: [
        {
            "tokenId": "6136",
            "tokenAddress": "0x984ac9911c6839a6870a1040a5fb89dd66513bc5",
            "schemaName": "ERC721",
            "collection": {
                "royaltyFeePoints": 500,
                "royaltyFeeAddress": "0x545ed214984f3ec57fb6a614f2a6211f0481547f"
            }
        }
    ],
    4: [{
        "tokenId": "73",
        "tokenAddress": "0x3b06635c6429d0ffcbe3798b860d065118269cb7",
        "schemaName": "ERC721"
    }]
}


export const gemOrder = {
    "parameters": {
        "offerer": "0x7db3E3f10faD9DB3a2DA202Ddfe62e6A05b86087",
        "offer": [
            {
                "itemType": 2,
                "token": "0x79fcdef22feed20eddacbb2587640e45491b757f",
                "identifierOrCriteria": "8073",
                "startAmount": 1,
                "endAmount": 1
            }
        ],
        "consideration": [
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": 0,
                "startAmount": "2775000000000000000",
                "endAmount": "2775000000000000000",
                "recipient": "0x7db3E3f10faD9DB3a2DA202Ddfe62e6A05b86087"
            },
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": 0,
                "startAmount": "75000000000000000",
                "endAmount": "75000000000000000",
                "recipient": "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
            },
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": 0,
                "startAmount": "150000000000000000",
                "endAmount": "150000000000000000",
                "recipient": "0x2c47540d6f4589a974e651f13a27dd9a62f30b89"
            }
        ],
        "startTime": "1655779246",
        "endTime": "1655865646",
        "orderType": 2,
        "zone": "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
        "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "salt": "13",
        "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
        "totalOriginalConsiderationItems": 3,
        "counter": 0
    },
    "signature": "0xd2c4b9617f0137a5d4c236a10577b4038d423b685c20e164c8a78789dd10b5f7c55db5577ab1196a73cf5f8cceacef176f649004dd8c8aa6a4cf231835e9ee0f"
}
export const order721 = {
    "parameters": {
        "offerer": "0x32f4B63A46c1D12AD82cABC778D75aBF9889821a",
        "zone": "0x004C00500000aD104D7DBd00e3ae0A5C00560C00",
        "orderType": 2,
        "startTime": "1655780163",
        "endTime": "1656384963",
        "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "salt": "39191748015173235",
        "offer": [
            {
                "itemType": 2,
                "token": "0x984ac9911c6839a6870a1040a5fb89dd66513bc5",
                "identifierOrCriteria": "6136",
                "startAmount": 1,
                "endAmount": 1
            }
        ],
        "consideration": [
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": 0,
                "startAmount": "462500000000000000",
                "endAmount": "462500000000000000",
                "recipient": "0x32f4B63A46c1D12AD82cABC778D75aBF9889821a"
            },
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": "0",
                "startAmount": "12500000000000000",
                "endAmount": "12500000000000000",
                "recipient": "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
            },
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": "0",
                "startAmount": "25000000000000000",
                "endAmount": "25000000000000000",
                "recipient": "0x545ed214984f3ec57fb6a614f2a6211f0481547f"
            }
        ],
        "totalOriginalConsiderationItems": 3,
        "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
        "counter": 0
    },
    "signature": "0x7db6fde67596ab16e4115544303e1a4c1c767cb7ac71b1d92967a9fb0e0abe7a15405137994daca3dffd3c7e2be01dbd2c3f8f78c43d8c4857c98477306f31d01b"
}


export const erc8001 = {
    "parameters": {
        "offerer": "0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401",
        "zone": "0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e",
        "orderType": 2,
        "startTime": "1655713242",
        "endTime": "1656318042",
        "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "salt": "1655713243767",
        "offer": [
            {
                "itemType": 2,
                "token": "0x5FecBbBAf9f3126043A48A35eb2eb8667D469D53",
                "identifierOrCriteria": "8001",
                "startAmount": "1",
                "endAmount": "1"
            }
        ],
        "consideration": [
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": "0",
                "startAmount": "19500000000000000",
                "endAmount": "19500000000000000",
                "recipient": "0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401"
            },
            {
                "itemType": 0,
                "token": "0x0000000000000000000000000000000000000000",
                "identifierOrCriteria": "0",
                "startAmount": "500000000000000",
                "endAmount": "500000000000000",
                "recipient": "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
            }
        ],
        "totalOriginalConsiderationItems": "2",
        "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
        "counter": 0
    },
    "signature": "0xa6f21e18e4a0a4cd0da1f643c03633ed576a5a22a183e7b6f1a7fe15062877327a18baf584b8e0ac054138a76e2c70dc1919f05fbc75e9e462ed8374c1cbd8b31b"
}

const protocolOrder = {
    "created_date": "2022-06-20T04:46:02.254980",
    "closing_date": "2022-07-20T04:43:27",
    "listing_time": 1655700207,
    "expiration_time": 1658292207,
    "order_hash": "0xe7890b12d61180b32898a67ddb5cae3150283cad8c075e98c226bbeb8acf3848",
    "protocol_data": {
        "parameters": {
            "offerer": "0x0a56b3317ed60dc4e1027a63ffbe9df6fb102401",
            "offer": [
                {
                    "itemType": 2,
                    "token": "0x5FecBbBAf9f3126043A48A35eb2eb8667D469D53",
                    "identifierOrCriteria": "8001",
                    "startAmount": "1",
                    "endAmount": "1"
                }
            ],
            "consideration": [
                {
                    "itemType": 0,
                    "token": "0x0000000000000000000000000000000000000000",
                    "identifierOrCriteria": "0",
                    "startAmount": "19500000000000000",
                    "endAmount": "19500000000000000",
                    "recipient": "0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401"
                },
                {
                    "itemType": 0,
                    "token": "0x0000000000000000000000000000000000000000",
                    "identifierOrCriteria": "0",
                    "startAmount": "500000000000000",
                    "endAmount": "500000000000000",
                    "recipient": "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
                }
            ],
            "startTime": "1655700207",
            "endTime": "1658292207",
            "orderType": 2,
            "zone": "0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e",
            "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "salt": "18960256194261707",
            "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
            "totalOriginalConsiderationItems": 2,
            "counter": 0
        },
        "signature": "0x7d1cdd7df81a09b53f6809fdbd47215c1a0a3cd805659c222cac2360373119b24caf30311e90036e6b0b7c90cf830a59f1cbfb9936fb541ef42f671031d9d14c1b"
    },
    "protocol_address": "0x00000000006c3852cbef3e08e8df289169ede581",
    "maker": {
        "user": 10647,
        "profile_img_url": "https://storage.googleapis.com/opensea-static/opensea-profile/26.png",
        "address": "0x0a56b3317ed60dc4e1027a63ffbe9df6fb102401",
        "config": ""
    },
    "taker": null,
    "current_price": "20000000000000000",
    "maker_fees": [
        {
            "account": {
                "user": null,
                "profile_img_url": "https://storage.googleapis.com/opensea-static/opensea-profile/31.png",
                "address": "0x8de9c5a032463c561423387a9648c5c7bcc5bc90",
                "config": ""
            },
            "basis_points": "250"
        }
    ],
    "taker_fees": [],
    "side": "ask",
    "order_type": "basic",
    "cancelled": false,
    "finalized": false,
    "marked_invalid": true,
    "client_signature": "0x7d1cdd7df81a09b53f6809fdbd47215c1a0a3cd805659c222cac2360373119b24caf30311e90036e6b0b7c90cf830a59f1cbfb9936fb541ef42f671031d9d14c1b",
    "relay_id": "T3JkZXJWMlR5cGU6NzQ3NDM5",
    "maker_asset_bundle": {
        "maker": null,
        "slug": null,
        "assets": [
            {
                "id": 6837583,
                "num_sales": 1,
                "background_color": null,
                "image_url": "https://openseauserdata.com/files/ecf9074fed73f44599fbfe729c26b393.svg",
                "image_preview_url": "https://openseauserdata.com/files/ecf9074fed73f44599fbfe729c26b393.svg",
                "image_thumbnail_url": "https://openseauserdata.com/files/ecf9074fed73f44599fbfe729c26b393.svg",
                "image_original_url": null,
                "animation_url": null,
                "animation_original_url": null,
                "name": "Bag #8001",
                "description": "More Loot is additional randomized adventurer gear generated and stored on chain. Maximum supply is dynamic, increasing at 1/10th of Ethereum's block rate. Stats, images, and other functionality are intentionally omitted for others to interpret. Feel free to use More Loot in any way you want.",
                "external_link": null,
                "asset_contract": {
                    "address": "0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53",
                    "asset_contract_type": "non-fungible",
                    "created_date": "2021-09-06T08:21:12.925272",
                    "name": "More Loot",
                    "nft_version": "3.0",
                    "opensea_version": null,
                    "owner": 1972454,
                    "schema_name": "ERC721",
                    "symbol": "MLOOT",
                    "total_supply": "0",
                    "description": null,
                    "external_link": null,
                    "image_url": null,
                    "default_to_fiat": false,
                    "dev_buyer_fee_basis_points": 0,
                    "dev_seller_fee_basis_points": 0,
                    "only_proxied_transfers": false,
                    "opensea_buyer_fee_basis_points": 0,
                    "opensea_seller_fee_basis_points": 250,
                    "buyer_fee_basis_points": 0,
                    "seller_fee_basis_points": 250,
                    "payout_address": null
                },
                "permalink": "https://testnets.opensea.io/assets/rinkeby/0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53/8001",
                "collection": {
                    "banner_image_url": null,
                    "chat_url": null,
                    "created_date": "2021-09-06T10:40:04.382059",
                    "default_to_fiat": false,
                    "description": null,
                    "dev_buyer_fee_basis_points": "0",
                    "dev_seller_fee_basis_points": "0",
                    "discord_url": null,
                    "display_data": {
                        "card_display_style": "contain",
                        "images": []
                    },
                    "external_url": null,
                    "featured": false,
                    "featured_image_url": null,
                    "hidden": false,
                    "safelist_request_status": "not_requested",
                    "image_url": null,
                    "is_subject_to_whitelist": false,
                    "large_image_url": null,
                    "medium_username": null,
                    "name": "More Loot - Ys4b8ZbcFc",
                    "only_proxied_transfers": false,
                    "opensea_buyer_fee_basis_points": "0",
                    "opensea_seller_fee_basis_points": "250",
                    "payout_address": null,
                    "require_email": false,
                    "short_description": null,
                    "slug": "more-loot-ys4b8zbcfc",
                    "telegram_url": null,
                    "twitter_username": null,
                    "instagram_username": null,
                    "wiki_url": null,
                    "is_nsfw": false
                },
                "decimals": 0,
                "token_metadata": "data:application/json;base64,eyJuYW1lIjogIkJhZyAjODAwMSIsICJkZXNjcmlwdGlvbiI6ICJNb3JlIExvb3QgaXMgYWRkaXRpb25hbCByYW5kb21pemVkIGFkdmVudHVyZXIgZ2VhciBnZW5lcmF0ZWQgYW5kIHN0b3JlZCBvbiBjaGFpbi4gTWF4aW11bSBzdXBwbHkgaXMgZHluYW1pYywgaW5jcmVhc2luZyBhdCAxLzEwdGggb2YgRXRoZXJldW0ncyBibG9jayByYXRlLiBTdGF0cywgaW1hZ2VzLCBhbmQgb3RoZXIgZnVuY3Rpb25hbGl0eSBhcmUgaW50ZW50aW9uYWxseSBvbWl0dGVkIGZvciBvdGhlcnMgdG8gaW50ZXJwcmV0LiBGZWVsIGZyZWUgdG8gdXNlIE1vcmUgTG9vdCBpbiBhbnkgd2F5IHlvdSB3YW50LiIsICJpbWFnZSI6ICJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSEJ5WlhObGNuWmxRWE53WldOMFVtRjBhVzg5SW5oTmFXNVpUV2x1SUcxbFpYUWlJSFpwWlhkQ2IzZzlJakFnTUNBek5UQWdNelV3SWo0OGMzUjViR1UrTG1KaGMyVWdleUJtYVd4c09pQjNhR2wwWlRzZ1ptOXVkQzFtWVcxcGJIazZJSE5sY21sbU95Qm1iMjUwTFhOcGVtVTZJREUwY0hnN0lIMDhMM04wZVd4bFBqeHlaV04wSUhkcFpIUm9QU0l4TURBbElpQm9aV2xuYUhROUlqRXdNQ1VpSUdacGJHdzlJbUpzWVdOcklpQXZQangwWlhoMElIZzlJakV3SWlCNVBTSXlNQ0lnWTJ4aGMzTTlJbUpoYzJVaVBsRjFZWEowWlhKemRHRm1aand2ZEdWNGRENDhkR1Y0ZENCNFBTSXhNQ0lnZVQwaU5EQWlJR05zWVhOelBTSmlZWE5sSWo1UWJHRjBaU0JOWVdsc1BDOTBaWGgwUGp4MFpYaDBJSGc5SWpFd0lpQjVQU0kyTUNJZ1kyeGhjM005SW1KaGMyVWlQa05oY0R3dmRHVjRkRDQ4ZEdWNGRDQjRQU0l4TUNJZ2VUMGlPREFpSUdOc1lYTnpQU0ppWVhObElqNVRZWE5vUEM5MFpYaDBQangwWlhoMElIZzlJakV3SWlCNVBTSXhNREFpSUdOc1lYTnpQU0ppWVhObElqNUliMng1SUVkeVpXRjJaWE04TDNSbGVIUStQSFJsZUhRZ2VEMGlNVEFpSUhrOUlqRXlNQ0lnWTJ4aGMzTTlJbUpoYzJVaVBreGxZWFJvWlhJZ1IyeHZkbVZ6UEM5MFpYaDBQangwWlhoMElIZzlJakV3SWlCNVBTSXhOREFpSUdOc1lYTnpQU0ppWVhObElqNUJiWFZzWlhROEwzUmxlSFErUEhSbGVIUWdlRDBpTVRBaUlIazlJakUyTUNJZ1kyeGhjM005SW1KaGMyVWlQbFJwZEdGdWFYVnRJRkpwYm1jOEwzUmxlSFErUEM5emRtYysifQ==",
                "is_nsfw": false,
                "owner": {
                    "user": {
                        "username": "ChrisChouHaHa"
                    },
                    "profile_img_url": "https://storage.googleapis.com/opensea-static/opensea-profile/26.png",
                    "address": "0x0a56b3317ed60dc4e1027a63ffbe9df6fb102401",
                    "config": ""
                },
                "token_id": "8001"
            }
        ],
        "name": null,
        "description": null,
        "external_link": null,
        "asset_contract": {
            "collection": {
                "banner_image_url": null,
                "chat_url": null,
                "created_date": "2021-09-06T10:40:04.382059",
                "default_to_fiat": false,
                "description": null,
                "dev_buyer_fee_basis_points": "0",
                "dev_seller_fee_basis_points": "0",
                "discord_url": null,
                "display_data": {
                    "card_display_style": "contain",
                    "images": []
                },
                "external_url": null,
                "featured": false,
                "featured_image_url": null,
                "hidden": false,
                "safelist_request_status": "not_requested",
                "image_url": null,
                "is_subject_to_whitelist": false,
                "large_image_url": null,
                "medium_username": null,
                "name": "More Loot - Ys4b8ZbcFc",
                "only_proxied_transfers": false,
                "opensea_buyer_fee_basis_points": "0",
                "opensea_seller_fee_basis_points": "250",
                "payout_address": null,
                "require_email": false,
                "short_description": null,
                "slug": "more-loot-ys4b8zbcfc",
                "telegram_url": null,
                "twitter_username": null,
                "instagram_username": null,
                "wiki_url": null,
                "is_nsfw": false
            },
            "address": "0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53",
            "asset_contract_type": "non-fungible",
            "created_date": "2021-09-06T08:21:12.925272",
            "name": "More Loot",
            "nft_version": "3.0",
            "opensea_version": null,
            "owner": 1972454,
            "schema_name": "ERC721",
            "symbol": "MLOOT",
            "total_supply": "0",
            "description": null,
            "external_link": null,
            "image_url": null,
            "default_to_fiat": false,
            "dev_buyer_fee_basis_points": 0,
            "dev_seller_fee_basis_points": 0,
            "only_proxied_transfers": false,
            "opensea_buyer_fee_basis_points": 0,
            "opensea_seller_fee_basis_points": 250,
            "buyer_fee_basis_points": 0,
            "seller_fee_basis_points": 250,
            "payout_address": null
        },
        "permalink": "https://testnets.opensea.io/bundles/None",
        "sell_orders": null,
        "seaport_sell_orders": null
    },
    "taker_asset_bundle": {
        "maker": null,
        "slug": null,
        "assets": [
            {
                "id": 382494,
                "num_sales": 0,
                "background_color": null,
                "image_url": "https://openseauserdata.com/files/6f8e2979d428180222796ff4a33ab929.svg",
                "image_preview_url": null,
                "image_thumbnail_url": null,
                "image_original_url": null,
                "animation_url": null,
                "animation_original_url": null,
                "name": null,
                "description": null,
                "external_link": null,
                "asset_contract": {
                    "address": "0x0000000000000000000000000000000000000000",
                    "asset_contract_type": "fungible",
                    "created_date": "2019-08-02T22:08:33.341923",
                    "name": "Ether",
                    "nft_version": null,
                    "opensea_version": null,
                    "owner": null,
                    "schema_name": "ERC20",
                    "symbol": "",
                    "total_supply": null,
                    "description": "",
                    "external_link": null,
                    "image_url": null,
                    "default_to_fiat": false,
                    "dev_buyer_fee_basis_points": 0,
                    "dev_seller_fee_basis_points": 0,
                    "only_proxied_transfers": false,
                    "opensea_buyer_fee_basis_points": 0,
                    "opensea_seller_fee_basis_points": 250,
                    "buyer_fee_basis_points": 0,
                    "seller_fee_basis_points": 250,
                    "payout_address": null
                },
                "permalink": "https://testnets.opensea.io/assets/rinkeby/0x0000000000000000000000000000000000000000/0",
                "collection": {
                    "banner_image_url": null,
                    "chat_url": null,
                    "created_date": "2019-08-02T22:08:33.340525",
                    "default_to_fiat": false,
                    "description": "",
                    "dev_buyer_fee_basis_points": "0",
                    "dev_seller_fee_basis_points": "0",
                    "discord_url": null,
                    "display_data": {},
                    "external_url": null,
                    "featured": false,
                    "featured_image_url": null,
                    "hidden": false,
                    "safelist_request_status": "approved",
                    "image_url": null,
                    "is_subject_to_whitelist": false,
                    "large_image_url": null,
                    "medium_username": null,
                    "name": "Ether",
                    "only_proxied_transfers": false,
                    "opensea_buyer_fee_basis_points": "0",
                    "opensea_seller_fee_basis_points": "250",
                    "payout_address": null,
                    "require_email": false,
                    "short_description": null,
                    "slug": "ether",
                    "telegram_url": null,
                    "twitter_username": null,
                    "instagram_username": null,
                    "wiki_url": null,
                    "is_nsfw": false
                },
                "decimals": 18,
                "token_metadata": null,
                "is_nsfw": false,
                "owner": {
                    "user": {
                        "username": "NullAddress"
                    },
                    "profile_img_url": "https://storage.googleapis.com/opensea-static/opensea-profile/1.png",
                    "address": "0x0000000000000000000000000000000000000000",
                    "config": ""
                },
                "token_id": "0"
            }
        ],
        "name": "ETH - None",
        "description": null,
        "external_link": null,
        "asset_contract": {
            "collection": {
                "banner_image_url": null,
                "chat_url": null,
                "created_date": "2019-08-02T22:08:33.340525",
                "default_to_fiat": false,
                "description": "",
                "dev_buyer_fee_basis_points": "0",
                "dev_seller_fee_basis_points": "0",
                "discord_url": null,
                "display_data": {},
                "external_url": null,
                "featured": false,
                "featured_image_url": null,
                "hidden": false,
                "safelist_request_status": "approved",
                "image_url": null,
                "is_subject_to_whitelist": false,
                "large_image_url": null,
                "medium_username": null,
                "name": "Ether",
                "only_proxied_transfers": false,
                "opensea_buyer_fee_basis_points": "0",
                "opensea_seller_fee_basis_points": "250",
                "payout_address": null,
                "require_email": false,
                "short_description": null,
                "slug": "ether",
                "telegram_url": null,
                "twitter_username": null,
                "instagram_username": null,
                "wiki_url": null,
                "is_nsfw": false
            },
            "address": "0x0000000000000000000000000000000000000000",
            "asset_contract_type": "fungible",
            "created_date": "2019-08-02T22:08:33.341923",
            "name": "Ether",
            "nft_version": null,
            "opensea_version": null,
            "owner": null,
            "schema_name": "ERC20",
            "symbol": "",
            "total_supply": null,
            "description": "",
            "external_link": null,
            "image_url": null,
            "default_to_fiat": false,
            "dev_buyer_fee_basis_points": 0,
            "dev_seller_fee_basis_points": 0,
            "only_proxied_transfers": false,
            "opensea_buyer_fee_basis_points": 0,
            "opensea_seller_fee_basis_points": 250,
            "buyer_fee_basis_points": 0,
            "seller_fee_basis_points": 250,
            "payout_address": null
        },
        "permalink": "https://testnets.opensea.io/bundles/None",
        "sell_orders": null,
        "seaport_sell_orders": null
    }
}

//approve weth  https://rinkeby.etherscan.io/token/0x1e0049783f008a0085193e00003d00cd54003c71
// weth 0xc778417E063141139Fce010982780140Aa0cD5Ab
// asset  0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b/933057
// sign order offer
const orderListing = {
    offerer: "0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401",
    offer: [ // token
        {
            itemType: 1,
            token: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
            identifierOrCriteria: 0,
            startAmount: 1000000000000000,
            endAmount: 1000000000000000
        }
    ],
    consideration: [ // asset
        {
            itemType: 2,
            token: "0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b",
            identifierOrCriteria: 933057,
            startAmount: 1,
            endAmount: 1,
            recipient: "0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401"
        },
        { // proto fee
            itemType: 1,
            token: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
            identifierOrCriteria: 0,
            startAmount: 25000000000000,
            endAmount: 25000000000000,
            recipient: "0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
        },
        {// royaly fee
            itemType: 1,
            token: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
            identifierOrCriteria: 0,
            startAmount: 1000000000000,
            endAmount: 1000000000000,
            recipient: 0x000000000000000000000000000000000000dEaD
        }
    ],
    startTime: 0,
    endTime: 1658197794,
    orderType: 2, // 受限订单
    zone: "0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e",
    zoneHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    salt: 95166348315951710,
    conduitKey: "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
    counter: 0
}
const postOrder = {
    "id": "useHandleBlockchainActionsCreateOrderMutation",
    "query": "mutation useHandleBlockchainActionsCreateOrderMutation(\n  $orderData: JSONString!\n  $clientSignature: String!\n  $serverSignature: String!\n) {\n  orders {\n    create(orderData: $orderData, clientSignature: $clientSignature, serverSignature: $serverSignature) {\n      counterOrder {\n        relayId\n        id\n      }\n      order {\n        relayId\n        makerAssetBundle {\n          name\n          slug\n          ...bundle_url\n          id\n        }\n        id\n      }\n      transaction {\n        blockExplorerLink\n        chain {\n          identifier\n        }\n        transactionHash\n        id\n      }\n    }\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n}\n",
    "variables": {
        "orderData": "{\"maker_address\":{\"value\":\"0x0a56b3317ed60dc4e1027a63ffbe9df6fb102401\",\"chain\":\"rinkeby\"},\"maker_assets\":[{\"asset\":{\"contract\":{\"address\":{\"value\":\"0xc778417e063141139fce010982780140aa0cd5ab\",\"chain\":\"rinkeby\"},\"standards\":[\"erc20\"]},\"asset_identifier\":\"0\"},\"quantity\":1000000000000000}],\"taker_assets\":[{\"asset\":{\"contract\":{\"address\":{\"value\":\"0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b\",\"chain\":\"rinkeby\"},\"standards\":[\"erc721\"]},\"asset_identifier\":\"933057\"},\"quantity\":1}],\"order_type\":\"basic\",\"chain\":\"rinkeby\",\"maker_fees\":[],\"taker_fees\":[{\"address\":{\"value\":\"0x8de9c5a032463c561423387a9648c5c7bcc5bc90\",\"chain\":\"rinkeby\"},\"basis_points\":250},{\"address\":{\"value\":\"0x000000000000000000000000000000000000dead\",\"chain\":\"rinkeby\"},\"basis_points\":10}],\"exchange_contract\":{\"address\":{\"value\":\"0x00000000006c3852cbef3e08e8df289169ede581\",\"chain\":\"rinkeby\"},\"standards\":[\"consideration\"]},\"relayer\":\"opensea\",\"side\":\"bid\",\"created_date\":null,\"exchange_data\":{\"parameters\":{\"offerer\":\"0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401\",\"offer\":[{\"itemType\":1,\"token\":\"0xc778417E063141139Fce010982780140Aa0cD5Ab\",\"identifierOrCriteria\":0,\"startAmount\":1000000000000000,\"endAmount\":1000000000000000}],\"consideration\":[{\"itemType\":2,\"token\":\"0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b\",\"identifierOrCriteria\":933057,\"startAmount\":1,\"endAmount\":1,\"recipient\":\"0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401\"},{\"itemType\":1,\"token\":\"0xc778417E063141139Fce010982780140Aa0cD5Ab\",\"identifierOrCriteria\":0,\"startAmount\":25000000000000,\"endAmount\":25000000000000,\"recipient\":\"0x8De9C5A032463C561423387a9648c5C7BCC5BC90\"},{\"itemType\":1,\"token\":\"0xc778417E063141139Fce010982780140Aa0cD5Ab\",\"identifierOrCriteria\":0,\"startAmount\":1000000000000,\"endAmount\":1000000000000,\"recipient\":\"0x000000000000000000000000000000000000dEaD\"}],\"startTime\":0,\"endTime\":1655864994,\"orderType\":2,\"zone\":\"0x00000000E88FE2628EbC5DA81d2b3CeaD633E89e\",\"zoneHash\":\"0x0000000000000000000000000000000000000000000000000000000000000000\",\"salt\":5979812530239222,\"conduitKey\":\"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000\",\"totalOriginalConsiderationItems\":3,\"counter\":0},\"signature\":\"0x\"},\"expiration\":1655864994,\"taker_address\":null,\"opened_at\":null,\"closed_at\":1655864994,\"price_fn_ended_at\":null,\"dutch_auction_final_price\":null,\"english_auction_reserve_price\":null,\"order_identifier\":null,\"signature\":null,\"bundle_metadata\":{\"bundle_slug\":null,\"create_bundle_name\":null,\"create_bundle_description\":null},\"order_criteria\":null,\"is_counter_order\":false}",
        "clientSignature": "0x45bf1249fcc5c80fad8a5e8ce78229005d24c1ea90166011a9f6f51fd1d34957632705a113aaaa8f2433c9a61add1978e0b7ce04d8ce3815d13d9aad5d6bfcc71b",
        "serverSignature": "002b80f2b40b913fdca06f1a1b792efd2ee7d40bda0a609ae4da5dd5d4487273"
    }
}
const result = {
    "data": {
        "orders": {
            "create": {
                "counterOrder": null,
                "order": {
                    "relayId": "T3JkZXJWMlR5cGU6NzQ2MjY3",
                    "makerAssetBundle": {
                        "name": null,
                        "slug": null,
                        "id": "QXNzZXRCdW5kbGVUeXBlOi0xODA0NzY6MTAwMDAwMDAwMDAwMDAwMA=="
                    },
                    "id": "T3JkZXJWMlR5cGU6NzQ2MjY3"
                },
                "transaction": null
            }
        }
    }
}

