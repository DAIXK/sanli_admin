'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu, Button, theme } from 'antd';
import {
    DashboardOutlined,
    GoldOutlined,
    AppstoreOutlined,
    ApiOutlined,
    LogoutOutlined,
    ShoppingOutlined,
    SafetyCertificateOutlined,
    MessageOutlined,
} from '@ant-design/icons';
import { logoutAction } from './logout-action';

const { Sider, Content, Header } = Layout;

const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link href="/dashboard">仪表盘</Link> },
    { key: '/dashboard/gold-price', icon: <GoldOutlined />, label: <Link href="/dashboard/gold-price">每日金价</Link> },
    { key: '/dashboard/tabs', icon: <AppstoreOutlined />, label: <Link href="/dashboard/tabs">分类管理</Link> },
    { key: '/dashboard/beads', icon: <ApiOutlined />, label: <Link href="/dashboard/beads">珠子管理</Link> },
    { key: '/dashboard/orders', icon: <ShoppingOutlined />, label: <Link href="/dashboard/orders">订单管理</Link> },
    { key: '/dashboard/after-sale', icon: <SafetyCertificateOutlined />, label: <Link href="/dashboard/after-sale">售后管理</Link> },
    { key: '/dashboard/feedback', icon: <MessageOutlined />, label: <Link href="/dashboard/feedback">反馈建议</Link> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const selectedKey =
        menuItems
            .reduce((best, item) => {
                if (pathname.startsWith(item.key) && item.key.length > best.length) {
                    return item.key;
                }
                return best;
            }, '')
        || '/dashboard';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={230} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="text-lg font-semibold text-gray-800">管理后台</div>
                    <div className="text-xs text-gray-500 mt-1">运营配置中心</div>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    style={{ height: '100%', borderInlineEnd: 'none' }}
                />
                <div className="p-4 border-t border-gray-100">
                    <form action={logoutAction}>
                        <Button
                            icon={<LogoutOutlined />}
                            danger
                            block
                            htmlType="submit"
                        >
                            退出登录
                        </Button>
                    </form>
                </div>
            </Sider>
            <Layout>
                <Header
                    style={{
                        background: colorBgContainer,
                        borderBottom: '1px solid #f0f0f0',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 12,
                    }}
                >
                    <span className="text-sm text-gray-500">欢迎回来</span>
                </Header>
                <Content style={{ padding: '24px', background: '#f5f7fa' }}>
                    <div
                        style={{
                            background: colorBgContainer,
                            padding: 24,
                            borderRadius: borderRadiusLG,
                            minHeight: 'calc(100vh - 120px)',
                            boxShadow: '0 10px 30px -16px rgba(0,0,0,0.1)',
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
