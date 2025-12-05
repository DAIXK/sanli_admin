'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    Tag,
    Space,
    Button,
    Modal,
    Form,
    Input,
    message,
    Descriptions,
    Typography,
} from 'antd';
import dayjs from 'dayjs';

interface Address {
    userName: string;
    telNumber: string;
    provinceName: string;
    cityName: string;
    countyName: string;
    detailInfo: string;
}

interface Order {
    id: string;
    openid: string;
    address?: Address | null;
    products: any[];
    totalPrice: number;
    status: number;
    createdAt: string;
    updatedAt?: string;
    trackingNumber?: string;
    carrierName?: string;
    remark?: string;
    expiresAt?: string | null;
    transactionId?: string | null;
    paidAmount?: number | null;
    paidAt?: string | null;
}

const statusLabel: Record<number, { text: string; color: string }> = {
    0: { text: '未支付', color: 'default' },
    1: { text: '已支付/待发货', color: 'green' },
    2: { text: '已发货', color: 'blue' },
    3: { text: '已完成', color: 'purple' },
    4: { text: '已过期/取消', color: 'red' },
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [shipModalOpen, setShipModalOpen] = useState(false);
    const [shipTarget, setShipTarget] = useState<Order | null>(null);
    const [shipForm] = Form.useForm();

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/orders');
            const data = await res.json();
            if (res.ok && data.data) {
                setOrders(data.data);
            } else {
                message.error(data.error || '获取订单失败');
            }
        } catch (error) {
            console.error(error);
            message.error('获取订单失败');
        } finally {
            setLoading(false);
        }
    }

    function openShipModal(order: Order) {
        setShipTarget(order);
        shipForm.resetFields();
        shipForm.setFieldsValue({
            trackingNumber: order.trackingNumber,
            carrierName: order.carrierName,
        });
        setShipModalOpen(true);
    }

    async function handleShip() {
        try {
            const values = await shipForm.validateFields();
            const res = await fetch('/api/admin/orders/ship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: shipTarget?.id,
                    trackingNumber: values.trackingNumber,
                    carrierName: values.carrierName,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                message.success('发货信息已更新');
                setShipModalOpen(false);
                fetchOrders();
            } else {
                message.error(data.error || '发货失败');
            }
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error('发货失败');
        }
    }

    const columns = [
        {
            title: '订单号',
            dataIndex: 'id',
            width: 180,
            render: (text: string) => <Typography.Text copyable>{text}</Typography.Text>,
        },
        {
            title: 'openid',
            dataIndex: 'openid',
            width: 200,
            ellipsis: true,
        },
        {
            title: '金额',
            dataIndex: 'totalPrice',
            width: 100,
            render: (_: any, record: Order) => `¥${record.totalPrice}`,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 140,
            render: (status: number) => {
                const info = statusLabel[status] || { text: '未知', color: 'default' };
                return <Tag color={info.color}>{info.text}</Tag>;
            },
        },
        {
            title: '支付',
            dataIndex: 'transactionId',
            width: 200,
            render: (_: any, record: Order) =>
                record.transactionId ? (
                    <Space direction="vertical" size={2}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {record.transactionId}
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>
                            {record.paidAmount ? `¥${record.paidAmount}` : ''}
                            {record.paidAt ? ` · ${dayjs(record.paidAt).format('MM-DD HH:mm')}` : ''}
                        </Typography.Text>
                    </Space>
                ) : (
                    <Typography.Text type="secondary">未支付</Typography.Text>
                ),
        },
        {
            title: '收货',
            dataIndex: 'address',
            render: (_: any, record: Order) =>
                record.address ? (
                    <Space direction="vertical" size={2}>
                        <span>{record.address.userName} / {record.address.telNumber}</span>
                        <span style={{ color: '#666', fontSize: 12 }}>
                            {record.address.provinceName}{record.address.cityName}{record.address.countyName}{record.address.detailInfo}
                        </span>
                    </Space>
                ) : (
                    <Typography.Text type="secondary">未填写</Typography.Text>
                ),
        },
        {
            title: '时间',
            dataIndex: 'createdAt',
            width: 160,
            render: (_: any, record: Order) => (
                <Space direction="vertical" size={2}>
                    <span>{dayjs(record.createdAt).format('MM-DD HH:mm')}</span>
                    {record.updatedAt && <Typography.Text type="secondary" style={{ fontSize: 12 }}>更新 {dayjs(record.updatedAt).format('MM-DD HH:mm')}</Typography.Text>}
                </Space>
            ),
        },
        {
            title: '操作',
            key: 'actions',
            width: 140,
            render: (_: any, record: Order) => (
                <Space>
                    <Button size="small" onClick={() => showDetail(record)}>详情</Button>
                    <Button
                        size="small"
                        type="primary"
                        disabled={![1, 2].includes(record.status)}
                        onClick={() => openShipModal(record)}
                    >
                        发货
                    </Button>
                </Space>
            ),
        },
    ];

    const [detailModal, setDetailModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });

    function showDetail(order: Order) {
        setDetailModal({ open: true, order });
    }

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>订单管理</Typography.Title>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>查看订单并更新发货信息</Typography.Paragraph>
            </div>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={orders}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
            />

            <Modal
                title="填写物流信息"
                open={shipModalOpen}
                onCancel={() => setShipModalOpen(false)}
                onOk={handleShip}
                okText="保存并发货"
            >
                <Form form={shipForm} layout="vertical">
                    <Form.Item
                        name="carrierName"
                        label="物流公司"
                        rules={[{ required: true, message: '请输入物流公司' }]}
                    >
                        <Input placeholder="如：顺丰/圆通" />
                    </Form.Item>
                    <Form.Item
                        name="trackingNumber"
                        label="运单号"
                        rules={[{ required: true, message: '请输入运单号' }]}
                    >
                        <Input placeholder="运单号" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="订单详情"
                open={detailModal.open}
                onCancel={() => setDetailModal({ open: false, order: null })}
                footer={null}
                width={720}
            >
                {detailModal.order && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="订单号">{detailModal.order.id}</Descriptions.Item>
                            <Descriptions.Item label="openid">{detailModal.order.openid}</Descriptions.Item>
                            <Descriptions.Item label="金额">¥{detailModal.order.totalPrice}</Descriptions.Item>
                            <Descriptions.Item label="状态">{statusLabel[detailModal.order.status]?.text || detailModal.order.status}</Descriptions.Item>
                            <Descriptions.Item label="支付单号">{detailModal.order.transactionId || '-'}</Descriptions.Item>
                            <Descriptions.Item label="支付金额">{detailModal.order.paidAmount ? `¥${detailModal.order.paidAmount}` : '-'}</Descriptions.Item>
                            <Descriptions.Item label="支付时间">{detailModal.order.paidAt ? dayjs(detailModal.order.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                            <Descriptions.Item label="创建时间">{dayjs(detailModal.order.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                            <Descriptions.Item label="更新时间">{detailModal.order.updatedAt ? dayjs(detailModal.order.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                            <Descriptions.Item label="物流">{detailModal.order.carrierName && detailModal.order.trackingNumber ? `${detailModal.order.carrierName} / ${detailModal.order.trackingNumber}` : '-'}</Descriptions.Item>
                            <Descriptions.Item label="收货地址">
                                {detailModal.order.address
                                    ? `${detailModal.order.address.userName} ${detailModal.order.address.telNumber} ${detailModal.order.address.provinceName}${detailModal.order.address.cityName}${detailModal.order.address.countyName}${detailModal.order.address.detailInfo}`
                                    : '未填写'}
                            </Descriptions.Item>
                            <Descriptions.Item label="备注">{detailModal.order.remark || '-'}</Descriptions.Item>
                        </Descriptions>
                        <div>
                            <Typography.Title level={5}>商品明细</Typography.Title>
                            {(detailModal.order.products || []).map((item: any, idx: number) => (
                                <div key={idx} style={{ padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 8 }}>
                                    <Space direction="vertical" size={4}>
                                        <div><strong>{item.braceletName || item.productName || '手串'}</strong>（{item.braceletId || item.productId || '-'}）</div>
                                        <div style={{ color: '#666' }}>价格：¥{item.price || item.formattedPrice || '-'}</div>
                                        {item.snapshotUrl && <div style={{ color: '#666' }}>图片：{item.snapshotUrl}</div>}
                                        {item.beadSummary && <div style={{ color: '#666' }}>珠子明细：{typeof item.beadSummary === 'string' ? item.beadSummary : JSON.stringify(item.beadSummary)}</div>}
                                        {item.videoUrl && <div style={{ color: '#666' }}>视频：{item.videoUrl}</div>}
                                    </Space>
                                </div>
                            ))}
                        </div>
                    </Space>
                )}
            </Modal>
        </div>
    );
}
