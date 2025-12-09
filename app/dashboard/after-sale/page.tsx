'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Modal, Form, Input, InputNumber, Select, message, Typography, Descriptions, Image, Divider, DatePicker } from 'antd';
import dayjs from 'dayjs';

interface Order {
    id: string;
    openid: string;
    totalPrice: number;
    status: number;
    afterSaleStatus: number | null;
    afterSaleType: string | null;
    afterSaleReason: string | null;
    afterSaleDesc: string | null;
    afterSaleImages: string[] | null;
    afterSaleDeadline: string | null;
    refundAmount: number | null;
    returnTrackingNumber: string | null;
    returnCarrierCode: string | null;
    createdAt: string;
    updatedAt?: string;
    transactionId?: string | null;
    address?: {
        userName?: string;
        telNumber?: string;
        provinceName?: string;
        cityName?: string;
        countyName?: string;
        detailInfo?: string;
    } | null;
    products?: any[];
}

const statusLabel: Record<number, { text: string; color: string }> = {
    5: { text: '待审核', color: 'orange' },
    6: { text: '处理中', color: 'blue' },
    7: { text: '已完成', color: 'green' },
    8: { text: '已拒绝', color: 'red' },
};

const typeLabel: Record<string, string> = {
    refund_only: '仅退款',
    return_refund: '退货退款',
    exchange: '换货',
};

export default function AfterSalePage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [handleModal, setHandleModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
    const [form] = Form.useForm();
    const [returnInfo, setReturnInfo] = useState<{ receiverName: string; telNumber: string; address: string; note: string }>({
        receiverName: '',
        telNumber: '',
        address: '',
        note: '',
    });
    const [returnInfoModal, setReturnInfoModal] = useState(false);
    const [returnInfoForm] = Form.useForm();
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders(opts?: { keyword?: string; status?: number | undefined; range?: [dayjs.Dayjs | null, dayjs.Dayjs | null] }) {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const kw = opts?.keyword ?? keyword;
            const st = opts?.status ?? statusFilter;
            const range = opts?.range ?? dateRange;

            if (kw) params.set('keyword', kw);
            if (st !== undefined && st !== null && !Number.isNaN(st)) params.set('afterSaleStatus', String(st));
            if (range?.[0]) params.set('createdFrom', range[0].startOf('day').toISOString());
            if (range?.[1]) params.set('createdTo', range[1].endOf('day').toISOString());

            const [ordersRes, returnInfoRes] = await Promise.all([
                fetch(`/api/admin/orders/after-sale${params.toString() ? `?${params.toString()}` : ''}`),
                fetch('/api/admin/orders/after-sale/return-info'),
            ]);
            const ordersData = await ordersRes.json();
            const returnData = await returnInfoRes.json();
            if (ordersRes.ok && ordersData.data) {
                setOrders(ordersData.data);
            } else {
                message.error(ordersData.error || '获取售后列表失败');
            }
            if (returnInfoRes.ok && returnData.data) {
                setReturnInfo(returnData.data);
                returnInfoForm.setFieldsValue(returnData.data);
            }
        } catch (error) {
            console.error(error);
            message.error('获取售后列表失败');
        } finally {
            setLoading(false);
        }
    }

    async function saveReturnInfo() {
        try {
            const values = await returnInfoForm.validateFields();
            const res = await fetch('/api/admin/orders/after-sale/return-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (res.ok) {
                message.success('退货信息已更新');
                setReturnInfo(data.data);
                setReturnInfoModal(false);
            } else {
                message.error(data.error || '更新失败');
            }
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error('更新失败');
        }
    }

    function handleSearch() {
        fetchOrders();
    }

    function handleReset() {
        setKeyword('');
        setStatusFilter(undefined);
        setDateRange([null, null]);
        fetchOrders({ keyword: '', status: undefined, range: [null, null] });
    }

    function exportCsv() {
        if (!orders.length) {
            message.info('暂无可导出的数据');
            return;
        }
        const headers = [
            '商品',
            '支付单号',
            '售后类型',
            '状态',
            '退款金额',
            '说明',
            '收货信息',
            '申请时间',
            '更新时间',
            '退货单号',
        ];
        const rows = orders.map((o) => {
            const item = o.products?.[0] || {};
            const name = item.braceletName || item.productName || item.name || '手串';
            const logistic = o.returnTrackingNumber || '';
            return [
                name,
                o.transactionId || '',
                typeLabel[o.afterSaleType || ''] || '',
                o.afterSaleStatus ? statusLabel[o.afterSaleStatus]?.text || o.afterSaleStatus : '',
                o.refundAmount ?? o.totalPrice ?? '',
                o.afterSaleDesc || '',
                o.address
                    ? `${o.address.userName || ''} ${o.address.telNumber || ''} ${(o.address.provinceName || '') + (o.address.cityName || '') + (o.address.countyName || '') + (o.address.detailInfo || '')}`
                    : '',
                o.createdAt ? dayjs(o.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
                o.updatedAt ? dayjs(o.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '',
                logistic,
            ];
        });
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `after_sale_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function openHandleModal(order: Order) {
        setHandleModal({ open: true, order });
        form.resetFields();
        form.setFieldsValue({
            afterSaleStatus: order.afterSaleStatus ?? 5,
            refundAmount: order.refundAmount,
            remark: '',
            returnCarrierCode: order.returnCarrierCode,
            returnTrackingNumber: order.returnTrackingNumber,
        });
    }

    async function handleSubmit() {
        try {
            const values = await form.validateFields();
            const res = await fetch('/api/admin/orders/after-sale/handle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: handleModal.order?.id,
                    ...values,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                message.success('处理成功');
                setHandleModal({ open: false, order: null });
                fetchOrders();
            } else {
                message.error(data.error || '处理失败');
            }
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error('处理失败');
        }
    }

    const columns = [
        {
            title: '商品',
            dataIndex: 'products',
            render: (_: any, record: Order) => {
                const item = record.products?.[0] || {};
                const img = item.snapshotUrl || item.productImage || item.image;
                return img ? <Image src={img} width={60} height={60} style={{ objectFit: 'cover' }} /> : '-';
            },
        },
        {
            title: '支付单号',
            dataIndex: 'transactionId',
            render: (t: string | null | undefined) => t ? <Typography.Text copyable>{t}</Typography.Text> : '-',
        },
        {
            title: '说明',
            dataIndex: 'afterSaleDesc',
            render: (t: string | null) => (
                <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                    {t || '-'}
                </Typography.Paragraph>
            ),
        },
        {
            title: '退款金额',
            dataIndex: 'refundAmount',
            render: (v: number | null, record: Order) => {
                const applied = record.refundAmount ?? record.totalPrice;
                return v ? `¥${v}` : applied ? `¥${applied}` : '-';
            },
        },
        {
            title: '收货信息',
            dataIndex: 'address',
            render: (addr: Order['address']) =>
                addr ? (
                    <Space direction="vertical" size={2}>
                        <span>{addr.userName} / {addr.telNumber}</span>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {(addr.provinceName || '') + (addr.cityName || '') + (addr.countyName || '') + (addr.detailInfo || '')}
                        </Typography.Text>
                    </Space>
                ) : '-',
        },
        {
            title: '售后类型',
            dataIndex: 'afterSaleType',
            render: (t: string | null) => typeLabel[t || ''] || '-',
        },
        {
            title: '状态',
            dataIndex: 'afterSaleStatus',
            render: (s: number | null) => {
                const info = s ? statusLabel[s] : null;
                return info ? <Tag color={info.color}>{info.text}</Tag> : <Tag>无</Tag>;
            },
        },
        {
            title: '更新时间',
            dataIndex: 'updatedAt',
            render: (t: string) => (t ? dayjs(t).format('MM-DD HH:mm') : '-'),
        },
        {
            title: '操作',
            render: (_: any, record: Order) => (
                <Button type="primary" size="small" onClick={() => openHandleModal(record)}>
                    处理
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>售后管理</Typography.Title>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>审核用户售后申请，记录退款/退货物流</Typography.Paragraph>
                <div style={{ marginTop: 8 }}>
                    <Space>
                        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                            退货信息：{returnInfo.receiverName} {returnInfo.telNumber} {returnInfo.address} {returnInfo.note}
                        </Typography.Text>
                        <Button size="small" onClick={() => setReturnInfoModal(true)}>编辑退货信息</Button>
                    </Space>
                </div>
            </div>

            <Space style={{ marginBottom: 16 }} wrap>
                <Input
                    placeholder="订单/支付单号/收件人/电话/退货单号"
                    style={{ width: 260 }}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    allowClear
                    onPressEnter={handleSearch}
                />
                <Select
                    placeholder="全部状态"
                    style={{ width: 160 }}
                    allowClear
                    value={statusFilter}
                    onChange={(v) => {
                        setStatusFilter(v);
                        fetchOrders({ status: v });
                    }}
                    options={[
                        { label: '全部状态', value: undefined },
                        { label: '待审核', value: 5 },
                        { label: '处理中', value: 6 },
                        { label: '已完成', value: 7 },
                        { label: '已拒绝', value: 8 },
                    ]}
                />
                <DatePicker.RangePicker
                    value={dateRange}
                    onChange={(v) => setDateRange(v as any)}
                    onOpenChange={(open) => {
                        if (!open) handleSearch();
                    }}
                />
                <Button type="primary" onClick={handleSearch}>查询</Button>
                <Button onClick={handleReset}>重置</Button>
                <Button onClick={exportCsv}>导出 CSV</Button>
            </Space>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={orders}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="处理售后"
                open={handleModal.open}
                onCancel={() => setHandleModal({ open: false, order: null })}
                onOk={handleSubmit}
                okText="保存"
            >
                {handleModal.order && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="订单号">{handleModal.order.id}</Descriptions.Item>
                            <Descriptions.Item label="售后类型">{typeLabel[handleModal.order.afterSaleType || ''] || '-'}</Descriptions.Item>
                            <Descriptions.Item label="原因">{handleModal.order.afterSaleReason || '-'}</Descriptions.Item>
                            <Descriptions.Item label="说明">{handleModal.order.afterSaleDesc || '-'}</Descriptions.Item>
                            <Descriptions.Item label="截止时间">
                                {handleModal.order.afterSaleDeadline
                                    ? dayjs(handleModal.order.afterSaleDeadline).format('YYYY-MM-DD HH:mm')
                                    : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="申请退款">
                                {handleModal.order.refundAmount ? `¥${handleModal.order.refundAmount}` : `¥${handleModal.order.totalPrice}`}
                            </Descriptions.Item>
                            <Descriptions.Item label="售后图片">
                                {handleModal.order.afterSaleImages && handleModal.order.afterSaleImages.length > 0 ? (
                                    <Image.PreviewGroup>
                                        <Space wrap>
                                            {handleModal.order.afterSaleImages.map((img, idx) => (
                                                <Image key={idx} src={img} width={60} height={60} style={{ objectFit: 'cover' }} />
                                            ))}
                                        </Space>
                                    </Image.PreviewGroup>
                                ) : (
                                    '-'
                                )}
                            </Descriptions.Item>
                        </Descriptions>

                        <Form layout="vertical" form={form}>
                            <Form.Item
                                name="afterSaleStatus"
                                label="售后状态"
                                rules={[{ required: true, message: '请选择状态' }]}
                            >
                                <Select
                                    options={[
                                        { label: '待审核', value: 5 },
                                        { label: '处理中', value: 6 },
                                        { label: '已完成', value: 7 },
                                        { label: '已拒绝', value: 8 },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item name="refundAmount" label="退款金额">
                                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item name="returnCarrierCode" label="退货快递公司编码">
                                <Input placeholder="如：zhongtong/shunfeng" />
                            </Form.Item>
                            <Form.Item name="returnTrackingNumber" label="退货运单号">
                                <Input placeholder="退货单号" />
                            </Form.Item>
                            <Form.Item name="remark" label="备注">
                                <Input.TextArea rows={3} />
                            </Form.Item>
                        </Form>
                    </Space>
                )}
            </Modal>

            <Modal
                title="编辑退货信息"
                open={returnInfoModal}
                onCancel={() => setReturnInfoModal(false)}
                onOk={saveReturnInfo}
            >
                <Form layout="vertical" form={returnInfoForm}>
                    <Form.Item name="receiverName" label="收件人" rules={[{ required: true, message: '请输入收件人' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="telNumber" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="退货地址" rules={[{ required: true, message: '请输入退货地址' }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="note" label="备注">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
