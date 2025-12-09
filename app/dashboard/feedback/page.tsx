'use client';

import { useEffect, useState } from 'react';
import { Table, Space, Typography, message, Input, DatePicker, Button, Tag } from 'antd';
import dayjs from 'dayjs';

interface Feedback {
    id: string;
    content: string;
    contact?: string | null;
    openid?: string | null;
    createdAt: string;
}

export default function FeedbackPage() {
    const [list, setList] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData(opts?: { keyword?: string; range?: [dayjs.Dayjs | null, dayjs.Dayjs | null] }) {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const kw = opts?.keyword ?? keyword;
            const range = opts?.range ?? dateRange;
            if (kw) params.set('keyword', kw);
            if (range?.[0]) params.set('createdFrom', range[0].startOf('day').toISOString());
            if (range?.[1]) params.set('createdTo', range[1].endOf('day').toISOString());
            const res = await fetch(`/api/admin/feedback${params.toString() ? `?${params.toString()}` : ''}`);
            const data = await res.json();
            if (res.ok && data.data) {
                setList(data.data);
            } else {
                message.error(data.error || '获取反馈失败');
            }
        } catch (error) {
            console.error(error);
            message.error('获取反馈失败');
        } finally {
            setLoading(false);
        }
    }

    function handleSearch() {
        fetchData();
    }

    function handleReset() {
        setKeyword('');
        setDateRange([null, null]);
        fetchData({ keyword: '', range: [null, null] });
    }

    function exportCsv() {
        if (!list.length) {
            message.info('暂无可导出的数据');
            return;
        }
        const headers = ['内容', '联系方式', 'openid', '提交时间'];
        const rows = list.map((f) => [
            f.content,
            f.contact || '',
            f.openid || '',
            f.createdAt ? dayjs(f.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    const columns = [
        {
            title: '内容',
            dataIndex: 'content',
            render: (t: string) => <Typography.Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2 }}>{t}</Typography.Paragraph>,
        },
        {
            title: '联系方式',
            dataIndex: 'contact',
            width: 180,
            render: (t: string | null) => t ? t : <Typography.Text type="secondary">未留</Typography.Text>,
        },
        {
            title: '提交时间',
            dataIndex: 'createdAt',
            width: 180,
            render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>反馈建议</Typography.Title>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>用户提交的问题与建议</Typography.Paragraph>
            </div>

            <Space style={{ marginBottom: 16 }} wrap>
                <Input
                    placeholder="内容 / 联系方式 / openid"
                    style={{ width: 260 }}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    allowClear
                    onPressEnter={handleSearch}
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
                dataSource={list}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}
