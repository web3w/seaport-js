import {message, notification} from "antd";

import {utils} from "web3-wallets";
import {msg712sign} from "./config";

import {Web3Accounts, MockContract} from 'web3-accounts';


export const walletAction = async (wallet, action) => {
    const account = new Web3Accounts({address: wallet.address, chainId: wallet.chainId})

    const mock = new MockContract(wallet)
    if (!wallet) {
        message.error('Please select wallet');
        return
    }
    const walletName = wallet.walletName
    const {walletSigner, walletProvider} = wallet

    if (action == 'Connect') {
        if (walletProvider.walletName == 'wallet_connect') {
            const {walletName, wc} = walletProvider
            const {clientMeta, peerId, peerMeta, uri, session} = wc
            const {name, description} = peerMeta
            // debugger
            notification['info']({
                message: walletName,
                description: `Please open ${description} App`,
            });
        } else {
            const addresses = await wallet.connect()
            notification["info"]({
                message: `Connect ${walletName}`,
                description: addresses
            });
        }
    }

    if (action == "DisConnect") {
        if (walletProvider.walletName == 'wallet_connect') {
            const {walletName, wc} = walletProvider
            debugger
            const {clientMeta, peerId, peerMeta, uri, session} = wc
            if (!peerMeta) return
            const {name, description} = peerMeta

            notification['info']({
                message: walletName + "-" + action,
                description: `DisConnect ${description} App`,
            });
            walletProvider.close()
        }
    }

    if (action == 'SignMessage') {
        const signInfo = prompt("Sign Info")
        const signature = await wallet.signMessage(signInfo)
        notification["info"]({
            message: `SignMessage ${walletName}`,
            description: signature
        });
    }

    if (action == 'SignTypedData') {
        const signature = await wallet.signTypedData(msg712sign)
        notification["info"]({
            message: `SignTypedData ${walletName}`,
            description: signature
        });
    }

    if (action == 'GetBalance') {
        const balance = await walletSigner.getBalance()
        const eth = utils.formatEther(balance)

        const msg = `Address: ${wallet.address}  
                       ChainId: ${wallet.chainId}  
                       Balance: ${eth}ETH`
        notification["info"]({
            message: `GetBalance ${walletName}`,
            description: msg
        });
    }

    if (action == 'wethDeposit') {
        // const iface = new ethers.utils.Interface(['function migrate()']);
        // const callData = iface.encodeFunctionData('migrate', []);
        // console.log('callData: ', callData.toString());

        if (walletProvider.walletName == 'wallet_connect') {
            const {walletName, wc} = walletProvider
            const {clientMeta, peerId, peerMeta, uri, session} = wc
            if (!peerMeta) return
            const {name, description} = peerMeta
            notification['info']({
                message: walletName,
                description: `Please open ${description} App accept WethDeposit`,
            });
        }
        debugger
        const ethBal = await account.getGasBalances()
        debugger
        if (ethBal == "0") {
            message.error("WETH balance eq 0")
            return
        } else {
            await account.wethDeposit(ethBal)
        }

    }

    if (action == 'wethWithdraw') {
        // const iface = new ethers.utils.Interface(['function migrate()']);
        // const callData = iface.encodeFunctionData('migrate', []);
        // console.log('callData: ', callData.toString());

        if (walletProvider.walletName == 'wallet_connect') {
            const {walletName, wc} = walletProvider

            const {clientMeta, peerId, peerMeta, uri, session} = wc
            if (!peerMeta) return
            const {name, description} = peerMeta
            notification['info']({
                message: walletName,
                description: `Please open ${description} App accept WethWithdraw`,
            });
        }
        // const wethBal = await account.getTokenBalances({tokenAddr: account.GasWarpperContract.address})

        const wethBal = await account.wethBalances()
        if (wethBal == "0") {
            message.error("WETH balance eq 0")
            return
        } else {
            debugger
            await account.wethWithdraw("1")

            debugger
        }
    }

    if (action == 'wethBalances') {
        // const iface = new ethers.utils.Interface(['function migrate()']);
        // const callData = iface.encodeFunctionData('migrate', []);
        // console.log('callData: ', callData.toString());

        const tokenAddr = account.GasWarpperContract.address
        const wethBal = await account.getTokenBalances({tokenAddr})

        const msg = `WETH_Address: ${tokenAddr}    
                     Balance: ${wethBal} WETH`
        notification["info"]({
            message: `GetBalance ${walletName}`,
            description: msg
        });
    }

    if (action == 'mint') {
        const mint721 = await mock.Mock721.mint()
        const mint721Tx = await mint721.wait()
        console.log("tokenId:", mint721Tx.events[0].args.tokenId.toString())
    }

    if (action == 'transfer') {

    }

    if (action == 'AddChain') {
        walletProvider.addChainId(56)
    }

    if (action == 'AddToken') {
        walletProvider.addToken()
    }

    if (action == "SwitchChain") {
        walletProvider.switchBSCTEST()
    }

    // if(action =="scanQRCode"){
    //     walletProvider.scanQRCode()
    // }

};

// if (action == 'Get1559Fee') {
//     const {walletSigner, walletProvider} = wallet
//     const {chainId} = walletProvider
//     console.log(await walletSigner.getBalance())
//     console.log(RPC_PROVIDER[chainId])
//     if (chainId.toString() == '56' || chainId.toString() == '97') {
//         return
//     }
//     // console.log(await walletSDK.get1559Fee())
// }
