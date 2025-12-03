'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';

interface Tab {
    id: string;
    name: string;
    isVisible: boolean;
    maxBeads: number;
    model: string;
    createdAt: string;
}

export default function TabsPage() {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [maxBeads, setMaxBeads] = useState(0);
    const [model, setModel] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTabs();
    }, []);

    async function fetchTabs() {
        try {
            const res = await fetch('/api/tabs');
            if (res.ok) {
                const data = await res.json();
                setTabs(data);
            }
        } catch (error) {
            console.error('Failed to fetch tabs', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const form = new FormData();
        form.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: form,
            });

            if (res.ok) {
                const data = await res.json();
                setModel(data.url);
            } else {
                alert('上传失败');
            }
        } catch (error) {
            console.error('Upload error', error);
            alert('上传出错');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name) return;

        setSubmitting(true);
        try {
            const url = editingId ? `/api/tabs/${editingId}` : '/api/tabs';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, isVisible, maxBeads, model }),
            });

            if (res.ok) {
                resetForm();
                fetchTabs();
            }
        } catch (error) {
            console.error('Failed to save tab', error);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('确定要删除吗？这可能会影响关联的珠子。')) return;

        try {
            const res = await fetch(`/api/tabs/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchTabs();
            }
        } catch (error) {
            console.error('Failed to delete tab', error);
        }
    }

    function startEdit(tab: Tab) {
        setName(tab.name);
        setIsVisible(tab.isVisible);
        setMaxBeads(tab.maxBeads || 0);
        setModel(tab.model || '');
        setEditingId(tab.id);
        setShowForm(true);
    }

    function resetForm() {
        setName('');
        setIsVisible(true);
        setMaxBeads(0);
        setModel('');
        setEditingId(null);
        setShowForm(false);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    添加分类
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">{editingId ? '编辑分类' : '添加新分类'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="例如：7*8 手串"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">最大珠子数</label>
                                <input
                                    type="number"
                                    value={maxBeads}
                                    onChange={(e) => setMaxBeads(Number(e.target.value))}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">模型 (.glb)</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="file"
                                        accept=".glb"
                                        onChange={handleFileUpload}
                                        className="block w-full text-sm text-gray-900 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {model && <span className="text-xs text-green-600 whitespace-nowrap">已上传</span>}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isVisible"
                                    checked={isVisible}
                                    onChange={(e) => setIsVisible(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isVisible" className="ml-2 block text-sm text-gray-900">
                                    显示
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? '保存中...' : (editingId ? '更新' : '添加')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最大珠子数</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模型</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">加载中...</td>
                            </tr>
                        ) : tabs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">暂无分类</td>
                            </tr>
                        ) : (
                            tabs.map((tab) => (
                                <tr key={tab.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tab.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tab.maxBeads}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {tab.model ? <span className="text-green-600">有</span> : <span className="text-gray-400">无</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {tab.isVisible ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <Eye className="w-3 h-3 mr-1" /> 显示
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                <EyeOff className="w-3 h-3 mr-1" /> 隐藏
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tab.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => startEdit(tab)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tab.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
