import {Button, Col, Form, Input, Row, Table, Select, DatePicker, Tag, Space} from 'antd';
import React, {useContext, useEffect, useState} from "react";
import {Context} from '../AppContext'
import moment from "moment";
import {useAntdTable} from "ahooks";
import {utils} from 'web3-wallets'
import Avatar from "antd/es/avatar/avatar";
import {transformDate, transformTime} from "../js/helper";

const {RangePicker} = DatePicker;
const {Option} = Select;


export function SeaportBuy() {
    const {sdk} = useContext(Context);
    const [form] = Form.useForm();
    const userAccount = "userAccountuserAccount"//sdk.walletInfo.address
    const dateFormat = 'YYYY-MM-DD HH:mm';
    const defaultDateRange = [
        moment(transformTime(new Date().getTime() - 24 * 60 * 60 * 1000), dateFormat),
        moment(transformTime(Date.now()), dateFormat)
    ]

    const [orders, setOrders] = useState([])

    const defaultExpandable = {
        expandedRowRender: (record) => (
            [<Avatar src={record.takerAssetBundle.asset_contract.image_url} shape={'square'} size={60}/>,
                <a> TokenId:{record.takerAssetBundle.assets[0].token_id}</a>])
    };
    const [expandable, setExpandable] = useState(
        defaultExpandable,
    );

    const handleExpandChange = (enable) => {
        setExpandable(enable ? defaultExpandable : undefined);
    };

    const seaportBuyOrder = async (item) => {

        await sdk.fulfillOrder(JSON.stringify(item))
    }

    const columns = [
        {
            title: 'side',
            dataIndex: 'side'
        },
        {
            title: 'makerAsset',
            dataIndex: 'makerAssetBundle',
            render: (text, record) => (<a>{text.asset_contract.name}</a>)
        }, {
            title: 'takerAsset',
            dataIndex: 'takerAssetBundle',
            render: (text, record) => ([
                <Tag>{text.asset_contract.name}</Tag>,
                <Tag>{text.asset_contract.schema_name}</Tag>,
                <Tag>Fee({text.asset_contract.seller_fee_basis_points})</Tag>
            ])
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
            render: (text, record) => (<Button onClick={() => seaportBuyOrder(record)}>BuyOrder</Button>)
        }
    ];

    // useEffect(() => {
    //     async function fetchOrder() {
    //         const orders = await sdk.api.getOrders({side: 1, limit: 5})
    //         debugger
    //         console.log(orders)
    //         setOrders(orders)
    //     }
    //
    //     fetchOrder().catch(err => {
    //         // message.error(err);
    //         console.log(err)
    //     })
    // }, [sdk]);
    const getEventLogs = async (page, formData, host) => {
        if (!formData.account) throw new Error("eventLogs account undefined")
        const res = await sdk.api.getOrders({side: 0, limit: 20})

        const orders = res.orders.filter(val=>val.makerAssetBundle.asset_contract.address !="0x495f947276749ce646f68ac8c248420045cb7b5e")
        // debugger

        return {
            total: orders.length < 50 ? orders.length : 50,
            list: orders,
        }
    }
    const {tableProps, search, loading} =
        useAntdTable((page, formData) => getEventLogs(page, formData),
            {
                defaultPageSize: 10,
                form
            });

    // const {type, changeType, submit, reset} = search;
    const {submit} = search;


    if (!loading) {
        console.log("Data", loading, tableProps)
    }
    const onChange = (value, dateString) => {
        console.log('Selected Time: ', value);
        console.log('Formatted Selected Time: ', dateString);
    };

    const onOk = (value) => {
        console.log('onOk: ', value);
    };

    const advanceSearchForm = (
        <Form form={form} style={{
            margin: '0px 0px',
            padding: 10,
        }}>
            <Row gutter={24}>

                <Col span={8}>
                    <Form.Item label="Account" name="account" initialValue={userAccount}>
                        <Input placeholder="Account Address"/>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="DateRange" name="dateRange"
                               initialValue={defaultDateRange}>
                        <RangePicker
                            showTime={{format: 'HH:mm'}}
                            format={dateFormat}
                            onChange={onChange}
                            onOk={onOk}
                        />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Space>
                        <Button type="primary" onClick={submit}>
                            Search
                        </Button>
                    </Space>
                </Col>
            </Row>
        </Form>
    );

    return (
        <div>
            {advanceSearchForm}
            {/*//expandable={expandable}*/}
            <Table columns={columns} expandable={expandable} onChange={handleExpandChange}
                   rowKey="clientSignature" {...tableProps} />
        </div>
    );
}



