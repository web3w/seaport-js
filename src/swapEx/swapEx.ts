import EventEmitter from 'events'
import {Contract, ethers} from 'ethers'
import {
    EXSWAP_CONTRACTS_ADDRESSES,
    ContractABI
} from '../contracts'


import {
    ethSend, LimitedCallSpec,
    WalletInfo, getEstimateGas, CHAIN_CONFIG, getChainRpcUrl, TokenSchemaNames
} from 'web3-wallets'

import {transactionToCallData, Web3Accounts} from "web3-accounts"
import {SeaportEx} from "../seaportEx/seaportEx";

export interface SimpleTrades {
    value: string
    tradeData: string
}

export interface TradeDetails extends SimpleTrades {
    marketId: string
}

export interface ExSwapTradeData {
    buyer: string
    chain: string
    chainId: string
    contractAddress: string
    data: string
    errorDetail: string
    exchangeData: string
    executeType: string
    marketId: string
    orderId: string
    standard: string
    toAddress: string
    tokenId: string
    value: string
    orderHash: string
    schema: TokenSchemaNames
}


function getValidSwaps(intData: number, swaps: Array<TradeDetails>) {
    // console.log(err)
    // debugger
    // const data = err.data
    // if (err.error.data) {
    //     // metamask
    //     data = err.error.data.originalError.data
    // } else {
    //     // ethers
    //     data = err.error.error.data
    // }

    // const intData = parseInt(data, 16)
    // if (intData == 0) throw 'No valid swaps data by simulate'
    let bData = intData.toString(2)

    if (bData.length != swaps.length) {
        const diffLen = swaps.length - bData.length
        if (bData.length > 200) throw 'GetValidSwaps error'
        const b0 = Array(diffLen).fill(0).join('')
        bData = `${b0}${bData}`
    }
    let allValue = ethers.BigNumber.from(0)
    let swapValid: Array<TradeDetails> = []
    const swapIsValid = swaps.map((val, index) => {
        const isValid = bData[swaps.length - index - 1] == '1' ? true : false
        if (isValid) {
            allValue = allValue.add(val.value)
            swapValid.push(val)
        }
        return {
            index,
            isValid,
            swap: val
        }
    })
    return {swapIsValid, swaps: swapValid, value: allValue.toString(), bData}
}

function getSwapsValue(swaps: Array<TradeDetails>) {
    let value = ethers.BigNumber.from(0)
    swaps.forEach(val => {
        value = value.add(val.value)
    })
    return value
}

export class SwapEx extends EventEmitter {
    public swapExContract: Contract
    public walletInfo: WalletInfo
    public userAccount: Web3Accounts
    public contractAddr

    constructor(wallet: WalletInfo) {
        super()
        this.walletInfo = {...wallet, rpcUrl: CHAIN_CONFIG[wallet.chainId].rpcs[0]}
        this.userAccount = new Web3Accounts(wallet)
        const contractAddr = EXSWAP_CONTRACTS_ADDRESSES[this.walletInfo.chainId]
        if (!contractAddr) throw 'ElementExSwap config error ' + this.walletInfo.chainId
        this.swapExContract = new ethers.Contract(contractAddr.ExSwap, ContractABI.swapEx.abi, this.userAccount.signer)
        this.contractAddr = contractAddr
    }

    public async batchBuyWithETHSimulate(swaps: Array<TradeDetails>): Promise<any> {
        if (swaps.length == 0) return {swaps: [], value: '0'}// throw 'BatchBuyWithETHSimulate swaps is null'
        // if (swaps.find(val => !val.tradeData) || swaps.find(val => !val.value)) throw 'BatchBuyWithETHSimulate swaps tradeData or value is undefined'
        for (const val of swaps) {
            if (!val.tradeData || !val.value) throw 'BatchBuyWithETHSimulate swaps tradeData or value is undefined'
            const funcID = val.tradeData.substring(0, 10)
            //markId 0 opensea 0xab834bab atomicMatch_(address[14],uint256[18],uint8[8],bytes,bytes,bytes,bytes,bytes,bytes,uint8[2],bytes32[5])
            if (this.walletInfo.chainId == 1 || this.walletInfo.chainId == 4) {
                if (val.marketId == '0' && funcID != '0xab834bab') throw 'Market 0 match function encode error'

                //markId 1 element 0x9d6c2062 orderMatch(DataType.Order memory buy, DataType.Sig memory buySig, DataType.Order memory sell, DataType.Sig memory sellSig, bytes32 metadata)
                if (val.marketId == '1' && funcID != '0x9d6c2062') throw 'Element match function encode error'
            } else {

            }
        }
        const value = getSwapsValue(swaps)
        return new Promise(async (resolve, reject) => {
            const callData = await this.swapExContract.populateTransaction.batchBuyWithETHSimulate(swaps, {value})
            const rpcUrl = await getChainRpcUrl(this.walletInfo.chainId)
            return getEstimateGas(rpcUrl, {
                ...callData,
                value: value.toString()
            } as LimitedCallSpec).catch(async (err: any) => {
                if (err.code == '-32000') {
                    console.log(value.toString())
                    const bal = await this.userAccount.getGasBalances({})
                    console.log(bal)
                    reject(err.message)
                } else {
                    //0x4e487b71
                    if (err.data.substr(0, 10) == '0x4e487b71') {
                        console.log('Panic(uint256)', err.data)
                        throw 'BatchBuyWithETHSimulate Panic'
                    }

                    const intData = parseInt(err.data, 16)
                    if (intData == 0) reject('No valid swaps data by batchBuyWithETHSimulate')
                    const swapData = getValidSwaps(intData, swaps)
                    resolve(swapData)
                }
            })
        })
    }

    public async buyOneWithETH(swap: TradeDetails) {
        const value = ethers.BigNumber.from(swap.value)
        const marketProxy = this.contractAddr[swap.marketId]
        if (!marketProxy) `The Market id ${swap.marketId} is invalid in the buy one of eth`
        const tradeDetail: SimpleTrades = {
            value: swap.value,
            tradeData: swap.tradeData
        }
        const tx = await this.swapExContract.populateTransaction.buyOneWithETH(marketProxy, tradeDetail, {value})
        const callData = {...tx, value: tx.value?.toString()} as LimitedCallSpec
        return ethSend(this.walletInfo, callData)
    }

    public async batchBuyFromSingleMarketWithETH(swaps: Array<TradeDetails>) {
        const value = getSwapsValue(swaps)
        const marketProxy = this.contractAddr[swaps[0].marketId]
        if (!marketProxy) `The Market id ${swaps[0].marketId} is invalid in the  batch buy`
        const tradeDetails: SimpleTrades[] = swaps.map((val: TradeDetails) => {
            return {
                value: val.value,
                tradeData: val.tradeData
            }
        })
        // return this.swapExContract.batchBuyFromSingleMarketWithETH(marketProxy, tradeDetails, {value})

        const tx = await this.swapExContract.populateTransaction.batchBuyFromSingleMarketWithETH(marketProxy, tradeDetails, {value})
        const callData = {...tx, value: tx.value?.toString()} as LimitedCallSpec
        return ethSend(this.walletInfo, callData)
        // console.log("batchBuyFromSingleMarketWithETH", swaps.length, callData.value)
        // swaps.map(val => {
        //     console.log(val.marketId, val.value)
        // })
        // return getEstimateGas(this.walletInfo.rpcUrl || "", callData)

    }

    public async batchBuyWithETH(swaps: Array<TradeDetails>) {
        const value = getSwapsValue(swaps)
        const tx = await this.swapExContract.populateTransaction.batchBuyWithETH(swaps, {value})
        const callData = {...tx, value: tx.value?.toString()} as LimitedCallSpec
        return ethSend(this.walletInfo, callData)

        // console.log("batchBuyWithETH", swaps.length, callData.value)
        // swaps.map(val => {
        //     console.log(val.marketId, val.value)
        // })
        //
        // return getEstimateGas(this.walletInfo.rpcUrl || "", callData)
        //

    }

    public async buyNFTsWithETH(swaps: Array<TradeDetails>): Promise<any> {
        if (!swaps || swaps.length == 0) throw 'No valid swap data'
        if (swaps.length == 1) {
            const swap = swaps[0]
            return this.buyOneWithETH(swap)
        }
        if (swaps.length > 1) {
            const marktIds = swaps.map(val => val.marketId)
            // if(this.walletInfo.chainId != 1 ||this.walletInfo.chainId != 4)
            const elementsAreEqual = array => array.every(el => el === array[0])
            if (elementsAreEqual(marktIds)) {
                // 单一市场
                if (this.walletInfo.chainId == 1 || this.walletInfo.chainId == 4) {
                    return this.batchBuyFromSingleMarketWithETH(swaps)
                }
            } else {
                // 跨市场
                return this.batchBuyWithETH(swaps)
            }
        }
    }

    // public tradeDataToSwapSimulate(tradeData: ExSwapTradeData[]) {
    //     const swaps: Array<TradeDetails> = []
    //     const validTrades: Array<ExSwapTradeData> = []
    //     const invalidTrades: Array<ExSwapTradeData> = []
    //     let value = ethers.BigNumber.from(0)
    //     for (let i = 0; i < tradeData.length; i++) {
    //         const data = tradeData[i]
    //         if (!data.value || !data.data || !data.exchangeData) {
    //             invalidTrades.push(data)
    //             this.emit("TradeDataError", tradeData)
    //             continue
    //         }
    //         swaps.push({
    //             'marketId': data.marketId,
    //             'value': data.value,
    //             'tradeData': data.data
    //         })
    //         validTrades.push(data)
    //         value = value.add(data.value)
    //     }
    //     return {swaps, validTrades, invalidTrades, value: value.toString()}
    // }
    // public async batchBuyWithERC20s(swaps: Array<TradeDetails>) {
    //     const value = getSwapsValue(swaps)
    //     return this.swapExContract.batchBuyWithERC20s(swaps, {value})
    // }


}



