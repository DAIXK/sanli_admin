'use client';

import { useEffect, useState } from 'react';
import { Button, Table, Tag, Switch, Space, Modal, Form, Input, InputNumber, Upload, Typography, message } from 'antd';
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';

import { withBasePath } from '@/lib/basePath';

interface Tab {
    id: string;
    name: string;
    isVisible: boolean;
    maxBeads: number;
    model: string;
    createdAt: string;
}

const { Title, Paragraph } = Typography;

export default function TabsPage() {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchTabs();
    }, []);

    async function fetchTabs() {
        setLoading(true);
        try {
            const res = await fetch(withBasePath('/api/tabs'));
            if (res.ok) {
                const data = await res.json();
                setTabs(data);
            }
        } catch (error) {
            console.error('Failed to fetch tabs', error);
            message.error('获取分类失败');
        } finally {
            setLoading(false);
        }
    }

    async function uploadModel(file: RcFile) {
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
            const res = await fetch(withBasePath('/api/upload'), { method: 'POST', body: formData });
            if (!res.ok) throw new Error('上传失败');
            const data = await res.json();
            form.setFieldsValue({ model: data.url });
            message.success('模型上传成功');
        } catch (error) {
            console.error('Upload error', error);
            message.error('模型上传失败');
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit() {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const url = editingId ? `/api/tabs/${editingId}` : '/api/tabs';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(withBasePath(url), {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    isVisible: values.isVisible ?? true,
                    maxBeads: Number(values.maxBeads) || 0,
                    model: values.model || '',
                }),
            });

            if (res.ok) {
                message.success(editingId ? '分类已更新' : '分类已创建');
                setModalOpen(false);
                setEditingId(null);
                form.resetFields();
                fetchTabs();
            } else {
                message.error('保存失败');
            }
        } catch (error) {
            if ((error as any).errorFields) return; // 表单校验未通过
            console.error('Failed to save tab', error);
            message.error('保存失败');
        } finally {
            setSubmitting(false);
        }
    }

    function openCreate() {
        setEditingId(null);
        form.resetFields();
        form.setFieldsValue({ isVisible: true, maxBeads: 0 });
        setModalOpen(true);
    }

    function startEdit(tab: Tab) {
        setEditingId(tab.id);
        form.setFieldsValue({
            name: tab.name,
            isVisible: tab.isVisible,
            maxBeads: tab.maxBeads,
            model: tab.model,
        });
        setModalOpen(true);
    }

    function handleDelete(tab: Tab) {
        Modal.confirm({
            title: '确认删除该分类？',
            content: '删除后可能影响关联的珠子展示，请谨慎操作。',
            okText: '删除',
            okType: 'danger',
            centered: true,
            onOk: async () => {
                try {
                    const res = await fetch(withBasePath(`/api/tabs/${tab.id}`), { method: 'DELETE' });
                    if (res.ok) {
                        message.success('已删除');
                        fetchTabs();
                    } else {
                        message.error('删除失败');
                    }
                } catch (error) {
                    console.error('Failed to delete tab', error);
                    message.error('删除失败');
                }
            },
        });
    }

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
        },
        {
            title: '最大珠子数',
            dataIndex: 'maxBeads',
            width: 120,
            align: 'center' as const,
        },
        {
            title: '模型',
            dataIndex: 'model',
            width: 120,
            render: (value: string) =>
                value ? <Tag color="green">已上传</Tag> : <Tag>未上传</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'isVisible',
            width: 120,
            render: (value: boolean) =>
                value ? (
                    <Tag icon={<EyeOutlined />} color="success">显示</Tag>
                ) : (
                    <Tag icon={<EyeInvisibleOutlined />} color="default">隐藏</Tag>
                ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            width: 180,
            render: (value: string) => new Date(value).toLocaleDateString(),
        },
        {
            title: '操作',
            key: 'actions',
            width: 180,
            render: (_: any, record: Tab) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(record)}>
                        编辑
                    </Button>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <div>
                    <Title level={4} style={{ marginBottom: 4 }}>分类管理</Title>
                    <Paragraph type="secondary" style={{ margin: 0 }}>维护手串分类和对应的 3D 模型</Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    添加分类
                </Button>
            </div>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={tabs}
                pagination={false}
                bordered
            />

            <Modal
                title={editingId ? '编辑分类' : '添加分类'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={submitting}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                        <Input placeholder="例如：7*8 手串" />
                    </Form.Item>
                    <Form.Item name="maxBeads" label="最大珠子数">
                        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="模型 (.glb)" name="model">
                        <Space>
                            <Upload
                                accept=".glb"
                                maxCount={1}
                                showUploadList={false}
                                beforeUpload={(file) => {
                                    uploadModel(file);
                                    return false;
                                }}
                            >
                                <Button icon={<UploadOutlined />} loading={uploading}>
                                    上传模型
                                </Button>
                            </Upload>
                            {form.getFieldValue('model') && <Tag color="green">已上传</Tag>}
                        </Space>
                    </Form.Item>
                    <Form.Item
                        name="isVisible"
                        label="显示"
                        valuePropName="checked"
                        initialValue
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
