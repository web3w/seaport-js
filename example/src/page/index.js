import {message, Layout, Descriptions, Menu} from 'antd';
import React, {useContext, useState} from "react";
import "../assets/css/index.css"
import {Context} from '../AppContext'
import {SeaportSell} from "./SeaportSell";
import {SeaportBuy} from "./SeaportBuy";
import {WalletList} from "./WalletList";
// import {WalletFunc} from "./WalletFunc";
import pkg from "../../package.json"


const {Header, Content, Footer, Sider} = Layout;

export function MainLayout() {
    const {wallet, sdk} = useContext(Context);
    const [collapsed, setCollapsed] = useState(false);
    const [page, setPage] = useState("seaport_sell");


    const items = [
        {label: 'SeaportSell', key: 'seaport_sell'},
        {label: 'SeaportBuy', key: 'seaport_buy'},
        {label: 'Wallets', key: 'wallets'},
    ];
    return (
        // <AppContext.Provider value={[wallet, setWallet]}>
        <Layout style={{minHeight: '100vh'}}>
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                <div className="logo">{`${pkg.name}@${sdk.version}`}</div>
                <Menu theme="dark"
                      defaultSelectedKeys={[page]}
                      onClick={(val) => setPage(val.key)}
                      items={items}
                />
            </Sider>
            <Layout className="site-layout">
                <Header className="site-layout-background" style={{padding: 10}}>
                    {wallet.walletName && <Descriptions size="small" column={2}>
                        <Descriptions.Item label="Name">{wallet.walletName}</Descriptions.Item>
                        <Descriptions.Item label="ChainId">
                            <a>{wallet.walletProvider.chainId}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="Address">{wallet.walletProvider.address}</Descriptions.Item>
                        {wallet.walletProvider.peerMetaName &&
                        <Descriptions.Item
                            label="PeerMetaName">{wallet.walletProvider.peerMetaName}</Descriptions.Item>}
                    </Descriptions>}
                </Header>
                {page == "wallets" && <WalletList/>}
                {page == "seaport_sell" && <SeaportSell/>}
                {page == "seaport_buy" && <SeaportBuy/>}
            </Layout>
        </Layout>
        // </AppContext.Provider>
    )
}



