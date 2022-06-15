import * as secrets from '../../../../secrets.json'
import {SeaportEx} from "../../src/seaportEx/seaportEx";
import {SeaportExAgent} from "../../src/seaportEx/seaportExAgent";


const seller = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

const Test_API_CONFIG = {
        1: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 10200,
            protocolFeePoint: 250
        },
        4: {
            proxyUrl: 'http://127.0.0.1:7890',
            apiTimeout: 10200,
            protocolFeePoint: 250
        }
    }

;(async () => {
        try {

            const chainId = 4
            // const config = {proxyUrl: 'http://127.0.0.1:7890',protocolFeePoint:2}
            const config = Test_API_CONFIG[chainId]
            const wallet = {
                chainId,
                address: seller,
                privateKeys: secrets.privateKeys
            }
            const sdk = new SeaportExAgent(wallet, config)

            const seaport = new SeaportEx(wallet, config)

            const counter = await seaport.exchange.getCounter(seller)
            console.log(counter.toNumber())


            const conduitKey =await seaport.conduitController.getKey(seaport.conduit.address)
            const conduit =await seaport.conduitController.getConduit(conduitKey)
            console.log(conduit)



            const fragments = seaport.exchange.interface.fragments
            for (const ff of fragments) {
                if (ff.type != "function") continue
                // console.log(ff.format())
                // console.log(ff.format("minimal"))
                console.log(ff.name, seaport.exchange.interface.getSighash(ff.name))

            }

            const assets = await sdk.getOwnerAssets()
            console.log(assets)


            // await buyEx.exAgent.acceptOrder(JSON.stringify(sellData))
        } catch (e) {
            console.log(e)
        }
    }
)()
