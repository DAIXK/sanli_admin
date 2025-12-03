'use client';

import { Card, Statistic, Row, Col, Typography, Space, Tag } from 'antd';
import { UserOutlined, DatabaseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
                <Title level={3} style={{ marginBottom: 8 }}>仪表盘概览</Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                    快速查看运营概况与系统状态
                </Paragraph>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="总用户数"
                            value={1}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="总商品数"
                            value="加载中..."
                            prefix={<DatabaseOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="系统状态"
                            valueRender={() => <Tag color="green">运行中</Tag>}
                            prefix={<SafetyCertificateOutlined />}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}
