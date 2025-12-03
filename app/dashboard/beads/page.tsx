'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
    Card,
    Row,
    Col,
    Button,
    Tag,
    Space,
    Drawer,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    Upload,
    Radio,
    Typography,
    Empty,
    Divider,
    App,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';

interface Tab {
    id: string;
    name: string;
}

interface Bead {
    id: string;
    name: string;
    image: string;
    model: string;
    weight: number;
    width: number;
    material: string;
    orientation: string;
    hasGold: boolean;
    goldWeight: number;
    price: number;
    processingFee: number;
    tabId: string;
    isVisible: boolean;
}

const { Title, Paragraph, Text } = Typography;
const COVER_HEIGHT = 160;

const defaultFormValues = {
    name: '',
    image: '',
    model: '',
    weight: undefined as number | undefined,
    width: undefined as number | undefined,
    material: '',
    orientation: 'radial',
    hasGold: false,
    goldWeight: undefined as number | undefined,
    price: undefined as number | undefined,
    processingFee: undefined as number | undefined,
    tabId: '',
    isVisible: true,
};

const ORIENTATIONS = [
    { value: 'radial', label: '径向' },
    { value: 'tangent', label: '切向' },
    { value: 'normal', label: '法向' },
];

const orientationLabelMap: Record<string, string> = {
    radial: '径向',
    tangent: '切向',
    normal: '法向',
    left: '左',
    center: '中',
    right: '右',
};

function normalizeOrientation(value?: string) {
    const found = ORIENTATIONS.find((o) => o.value === value);
    return found ? found.value : 'radial';
}

function isValidImageSrc(src?: string) {
    if (!src) return false;
    return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:');
}

export default function BeadsPage() {
    const [beads, setBeads] = useState<Bead[]>([]);
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState<'image' | 'model' | null>(null);
    const [form] = Form.useForm<typeof defaultFormValues>();
    const { message, modal } = App.useApp();
    const imageValue = Form.useWatch('image', form);
    const modelValue = Form.useWatch('model', form);

    const tabOptions = useMemo(
        () => tabs.map((tab) => ({ label: tab.name, value: tab.id })),
        [tabs]
    );

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [beadsRes, tabsRes] = await Promise.all([
                fetch('/api/beads', { credentials: 'include' }),
                fetch('/api/tabs', { credentials: 'include' }),
            ]);

            if (beadsRes.ok && tabsRes.ok) {
                setBeads(await beadsRes.json());
                setTabs(await tabsRes.json());
            } else {
                message.error('获取数据失败');
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
            message.error('获取数据失败');
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        if (tabs.length === 0) {
            message.warning('请先在分类管理里创建分类');
            fetchData();
            return;
        }
        setEditingId(null);
        form.resetFields();
        form.setFieldsValue(defaultFormValues);
        setDrawerOpen(true);
    }

    function startEdit(bead: Bead) {
        setEditingId(bead.id);
        form.setFieldsValue({
            name: bead.name,
            image: bead.image,
            model: bead.model,
            weight: bead.weight || undefined,
            width: bead.width || undefined,
            material: bead.material,
            orientation: normalizeOrientation(bead.orientation),
            hasGold: bead.hasGold,
            goldWeight: bead.goldWeight || undefined,
            price: bead.price || undefined,
            processingFee: bead.processingFee || undefined,
            tabId: bead.tabId,
            isVisible: bead.isVisible,
        });
        setDrawerOpen(true);
    }

    function handleDelete(bead: Bead) {
        modal.confirm({
            title: `删除「${bead.name}」？`,
            content: '删除后无法恢复，确认继续？',
            okText: '删除',
            okType: 'danger',
            centered: true,
            onOk: async () => {
                try {
                    const res = await fetch(`/api/beads/${bead.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        message.success('已删除');
                        fetchData();
                    } else {
                        message.error('删除失败');
                    }
                } catch (error) {
                    console.error('Failed to delete bead', error);
                    message.error('删除失败');
                }
            },
        });
    }

    async function uploadFile(file: RcFile, field: 'image' | 'model') {
        const formData = new FormData();
        formData.append('file', file);
        setUploadingField(field);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('upload failed');
            const data = await res.json();
            form.setFieldsValue({ [field]: data.url } as any);
            message.success(field === 'image' ? '图片上传成功' : '模型上传成功');
        } catch (error) {
            console.error('Upload error', error);
            message.error('上传失败，请重试');
        } finally {
            setUploadingField(null);
        }
    }

    async function handleSubmit() {
        try {
            const values = await form.validateFields();
            setSaving(true);
            const url = editingId ? `/api/beads/${editingId}` : '/api/beads';
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                ...values,
                price: Number(values.price) || 0,
                processingFee: Number(values.processingFee) || 0,
                weight: Number(values.weight) || 0,
                width: Number(values.width) || 0,
                goldWeight: Number(values.goldWeight) || 0,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                message.success(editingId ? '珠子已更新' : '珠子已创建');
                setDrawerOpen(false);
                setEditingId(null);
                form.resetFields();
                fetchData();
            } else {
                message.error('保存失败');
            }
        } catch (error: any) {
            if (error?.errorFields) return;
            console.error('Failed to save bead', error);
            message.error('保存失败');
        } finally {
            setSaving(false);
        }
    }

    const coverNode = (bead: Bead) => {
        if (!isValidImageSrc(bead.image)) {
            return (
                <div
                    style={{
                        height: COVER_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f7f9fc',
                        color: '#999',
                    }}
                >
                    无图片
                </div>
            );
        }
        return (
            <div style={{ position: 'relative', height: COVER_HEIGHT, background: '#f7f9fc' }}>
                <Image
                    src={bead.image}
                    alt={bead.name}
                    fill
                    sizes="300px"
                    style={{ objectFit: 'contain', padding: 12 }}
                    unoptimized
                />
            </div>
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ marginBottom: 4 }}>珠子管理</Title>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                        管理珠子信息、图片与 3D 模型
                    </Paragraph>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    添加珠子
                </Button>
            </div>

            {beads.length === 0 && !loading ? (
                <Empty description="暂无珠子数据" />
            ) : (
                <Row gutter={[12, 12]} wrap>
                    {beads.map((bead) => (
                        <Col xs={24} sm={12} md={12} lg={8} xl={6} key={bead.id}>
                            <Card
                                cover={coverNode(bead)}
                                style={{ width: 280 }}
                                actions={[
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => startEdit(bead)}
                                        key="edit"
                                    >
                                        编辑
                                    </Button>,
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(bead)}
                                        key="delete"
                                    >
                                        删除
                                    </Button>,
                                ]}
                                loading={loading}
                                bodyStyle={{ padding: 16 }}
                            >
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong>{bead.name}</Text>
                                        <Text type="success">¥{bead.price}</Text>
                                    </div>
                                    <Text type="secondary">
                                        分类：{tabs.find((t) => t.id === bead.tabId)?.name || '未知'}
                                    </Text>
                                    <Space size={[8, 8]} wrap>
                                        <Tag>重 {bead.weight}g</Tag>
                                        <Tag>宽 {bead.width}mm</Tag>
                                        {bead.processingFee > 0 && <Tag>加工费 {bead.processingFee}</Tag>}
                                        {bead.material && <Tag color="blue">{bead.material}</Tag>}
                                        {bead.hasGold && <Tag color="gold">含金 {bead.goldWeight}g</Tag>}
                                        <Tag color="purple">{orientationLabelMap[bead.orientation] || bead.orientation || '径向'}</Tag>
                                        {bead.model ? <Tag color="green">模型</Tag> : <Tag>无模型</Tag>}
                                        {bead.isVisible ? (
                                            <Tag icon={<EyeOutlined />} color="success">显示</Tag>
                                        ) : (
                                            <Tag icon={<EyeInvisibleOutlined />} color="default">隐藏</Tag>
                                        )}
                                    </Space>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Drawer
                title={editingId ? '编辑珠子' : '添加新珠子'}
                open={drawerOpen}
                size="large"
                onClose={() => setDrawerOpen(false)}
                destroyOnClose
                extra={
                    <Space>
                        <Button onClick={() => setDrawerOpen(false)}>取消</Button>
                        <Button type="primary" onClick={handleSubmit} loading={saving}>
                            保存
                        </Button>
                    </Space>
                }
            >
                <Form
                    layout="vertical"
                    form={form}
                    initialValues={defaultFormValues}
                >
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                                <Input placeholder="请输入" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="tabId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                                <Select
                                    options={tabOptions}
                                    placeholder={tabs.length ? '选择分类' : '请先创建分类'}
                                    loading={loading}
                                    disabled={!tabs.length}
                                    notFoundContent="暂无分类，请先创建"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="price" label="单价">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="processingFee" label="加工费">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="weight" label="重量 (g)">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="width" label="宽度 (mm)">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="material" label="材质">
                                <Input placeholder="如：南红玛瑙" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="orientation" label="朝向">
                                <Radio.Group>
                                    {ORIENTATIONS.map((item) => (
                                        <Radio.Button value={item.value} key={item.value}>
                                            {item.label}
                                        </Radio.Button>
                                    ))}
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider style={{ margin: '16px 0' }}>图片 & 3D 模型</Divider>

                    <Form.Item label="图片" name="image">
                        <Space>
                            <Upload
                                accept="image/*"
                                maxCount={1}
                                showUploadList={false}
                                beforeUpload={(file) => {
                                    uploadFile(file, 'image');
                                    return false;
                                }}
                            >
                                <Button icon={<UploadOutlined />} loading={uploadingField === 'image'}>
                                    上传图片
                                </Button>
                            </Upload>
                            {isValidImageSrc(imageValue) && (
                                <div style={{ position: 'relative', width: 60, height: 60 }}>
                                    <Image
                                        src={imageValue as string}
                                        alt="预览"
                                        fill
                                        sizes="60px"
                                        style={{ objectFit: 'cover', borderRadius: 6 }}
                                        unoptimized
                                    />
                                </div>
                            )}
                        </Space>
                    </Form.Item>

                    <Form.Item label="3D 模型 (.glb)" name="model">
                        <Space>
                            <Upload
                                accept=".glb"
                                maxCount={1}
                                showUploadList={false}
                                beforeUpload={(file) => {
                                    uploadFile(file, 'model');
                                    return false;
                                }}
                            >
                                <Button icon={<UploadOutlined />} loading={uploadingField === 'model'}>
                                    上传模型
                                </Button>
                            </Upload>
                            {modelValue && <Tag color="green">已上传</Tag>}
                        </Space>
                    </Form.Item>

                    <Divider style={{ margin: '16px 0' }}>其他</Divider>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="hasGold" label="包含金" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="goldWeight" label="金重 (g)">
                                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="isVisible" label="显示" valuePropName="checked">
                        <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
}
