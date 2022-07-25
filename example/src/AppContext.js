import React, {createContext, useEffect, useState} from "react";
import {Web3Wallets} from "web3-wallets";
import {SeaportSDK} from "seaport-js";

export const Context = createContext();
export const AppContext = ({children}) => {
    const [wallet, setWallet] = useState({});
    const [sdk, setSdk] = useState({});
    useEffect(() => {
        // setLoading(true);
        async function init() {
            console.log("AppContext: wallet change")
            const wallet = new Web3Wallets('metamask')
            await wallet.connect()
            setWallet(wallet)
            const {chainId, address} = wallet
            const sdk = new SeaportSDK({chainId, address})
            setSdk(sdk)
        }

        init()
    }, [])
    return (<Context.Provider value={{wallet, setWallet, sdk, setSdk}}>
        {children}
    </Context.Provider>)
}
