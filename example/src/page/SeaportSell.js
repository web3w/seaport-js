import {Button, Col, Divider, List, message, Row, Space, Table} from "antd";
import React, {useContext, useEffect, useState} from "react";
import {Context} from '../AppContext'
import Avatar from "antd/es/avatar/avatar";
import {coinbaseIcon, metamaskIcon, walletConnectIcon} from "../js/config";
import {utils} from "web3-wallets";
import {transformDate} from "../js/helper";

export function SeaportSell() {
    const {sdk} = useContext(Context);
    const [assets, setAssets] = useState([])
    const [orders, setOrders] = useState([])

    const seaportGetOrder = async (item) => {
        const order = await sdk.api.getOrders({
            asset_contract_address: item.address,
            token_ids: [item.token_id]
        })
        console.log(order)
        setOrders(order.orders)
        message.success("Seaport  post order success")
    }

    const columns = [
        {
            title: 'side',
            dataIndex: 'side'
        },
        {
            title: 'currentPrice',
            dataIndex: 'currentPrice',
            render: (text, record) => (<a>{utils.formatEther(text)}</a>)
        },
        {
            title: 'expirationTime',
            dataIndex: 'expirationTime',
            render: (text, record) => (<a>{transformDate(text)}</a>)
        },
        {
            title: 'Action',
            dataIndex: 'state',
            render: (text, record) => (<Button onClick={() => seaportCancelOrder(record)}>CancelOrder</Button>)
        }
    ];
    const seaportCreateSellOrder = async (item) => {
        const order = await sdk.createSellOrder({
                asset: {
                    tokenAddress: item.address,
                    tokenId: item.token_id,
                    schemaName: item.schema_name,
                    collection: {
                        royaltyFeeAddress: item.royaltyFeeAddress,
                        royaltyFeePoints: item.royaltyFeePoints
                    }
                },
                startAmount: 0.99
            }
        )
        const orderStr = JSON.stringify(order)
        const orderRes = await sdk.postOrder(orderStr)
        message.success("Seaport  post sell order success")
    }

    const seaportCreateBuyOrder = async (item) => {
        const order = await sdk.createBuyOrder({
                asset: {
                    tokenAddress: item.address,
                    tokenId: item.token_id,
                    schemaName: item.schema_name,
                    collection: {
                        royaltyFeeAddress: item.royaltyFeeAddress,
                        royaltyFeePoints: item.royaltyFeePoints
                    }
                },
                startAmount: 0.001
            }
        )
        const orderStr = JSON.stringify(order)
        const orderRes = await sdk.postOrder(orderStr)
        message.success("Seaport  post buy order success")
    }
    const seaportCancelOrder = async (item) => {
        await sdk.contracts.cancelOrders([item.protocolData.parameters])
    }
    useEffect(() => {
        async function fetchOrder() {
            const assets = await sdk.getOwnerAssets()
            // console.log(orders)
            setAssets(assets)
        }

        fetchOrder().catch(err => {
            // message.error(err);
            console.log(err)
        })
    }, [sdk]);

    const walletItems = [
        {symbol: 'MetaMask', key: 'metamask', icon: metamaskIcon, description: "Popular wallet"},
        {symbol: 'WalletConnect', key: 'wallet_connect', icon: walletConnectIcon, description: "mobile only"},
        {symbol: 'CoinBase', key: 'coinbase', icon: coinbaseIcon, description: "coinbase wallet"}
    ];
    return (
        <>
            {assets.length > 0 && <List
                style={{padding: '20px 60px'}}
                itemLayout="vertical"
                size="large"
                dataSource={assets}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src={item.image_url} shape={'square'} size={60}/>}
                            title={<a>{item.name}</a>}
                            description={item.description}
                        />
                        <Space>
                            <Button key={item.name}
                                    onClick={() => seaportCreateSellOrder(item)}>CreateSellOrder</Button>
                            <Button key={item.name} onClick={() => seaportCreateBuyOrder(item)}>CreateBuyOrder</Button>

                            <Button onClick={() => seaportGetOrder(item)}>GetOrder</Button>
                        </Space>
                        <Divider></Divider>
                        <Table columns={columns} rowKey="listingTime" dataSource={orders} pagination={false}/>
                        {/*{()=>actions(item)}*/}
                    </List.Item>
                )}
            />}


        </>
    )
}



