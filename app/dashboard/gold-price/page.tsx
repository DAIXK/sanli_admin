'use client';

import { useEffect, useState } from 'react';
import { Card, Form, InputNumber, Button, Typography, Space, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function GoldPricePage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatedAt, setUpdatedAt] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchPrice();
    }, []);

    async function fetchPrice() {
        try {
            const res = await fetch('/api/gold-price');
            if (res.ok) {
                const data = await res.json();
                form.setFieldsValue({ price: data.price });
                setUpdatedAt(data.updatedAt);
            }
        } catch (error) {
            console.error('Failed to fetch gold price', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(values: { price: number }) {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/gold-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: Number(values.price) }),
            });

            if (res.ok) {
                const data = await res.json();
                form.setFieldsValue({ price: data.price });
                setUpdatedAt(data.updatedAt);
                setMessage({ type: 'success', text: '金价更新成功！' });
            } else {
                setMessage({ type: 'error', text: '更新金价失败。' });
            }
        } catch (error) {
            console.error('Failed to update gold price', error);
            setMessage({ type: 'error', text: '更新金价出错。' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
                <Title level={3} style={{ marginBottom: 8 }}>每日金价</Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                    更新用于报价计算的最新金价（元/克）
                </Paragraph>
            </div>

            <Card loading={loading} style={{ maxWidth: 420 }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    initialValues={{ price: undefined }}
                >
                    <Form.Item
                        name="price"
                        label="当前金价"
                        rules={[{ required: true, message: '请输入金价' }]}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            stringMode
                            addonAfter="元/克"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        {updatedAt && (
                            <Text type="secondary">最后更新：{new Date(updatedAt).toLocaleString()}</Text>
                        )}
                        {message && (
                            <Alert
                                type={message.type}
                                message={message.text}
                                showIcon
                            />
                        )}
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={saving}
                            block
                        >
                            更新金价
                        </Button>
                    </Space>
                </Form>
            </Card>
        </Space>
    );
}
