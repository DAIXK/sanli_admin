'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Typography, Space, message } from 'antd';
import { ShoppingOutlined, SafetyCertificateOutlined, ExclamationCircleOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';

import { withBasePath } from '@/lib/basePath';

const { Title, Paragraph } = Typography;

interface Summary {
    totalOrders: number;
    totalSales: number;
    afterSaleOrders: number;
    afterSaleTotal: number;
    afterSalePending: number;
    pendingShip: number;
    pendingPay: number;
    completedOrders: number;
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSummary();
    }, []);

    async function fetchSummary() {
        setLoading(true);
        try {
            const res = await fetch(withBasePath('/api/admin/dashboard/summary'), { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.data) {
                setSummary(data.data);
            } else {
                message.error(data.error || '加载概览失败');
            }
        } catch (error) {
            console.error(error);
            message.error('加载概览失败');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
                <Title level={3} style={{ marginBottom: 8 }}>仪表盘概览</Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                    订单、售后、待处理一目了然
                </Paragraph>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="订单数"
                            value={summary?.totalOrders ?? 0}
                            loading={loading}
                            prefix={<ShoppingOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="售出总额"
                            value={summary ? `¥${summary.totalSales.toFixed(2)}` : '¥0.00'}
                            loading={loading}
                            prefix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="完成订单"
                            value={summary?.completedOrders ?? 0}
                            loading={loading}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="待发货"
                            value={summary?.pendingShip ?? 0}
                            loading={loading}
                            prefix={<SafetyCertificateOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="待支付"
                            value={summary?.pendingPay ?? 0}
                            loading={loading}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="售后待处理"
                            value={summary?.afterSalePending ?? 0}
                            loading={loading}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card>
                        <Statistic
                            title="售后订单数"
                            value={summary?.afterSaleOrders ?? 0}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card>
                        <Statistic
                            title="售后总额(申请/处理)"
                            value={summary ? `¥${summary.afterSaleTotal.toFixed(2)}` : '¥0.00'}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}
