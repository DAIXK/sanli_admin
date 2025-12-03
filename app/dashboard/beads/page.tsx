'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

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

export default function BeadsPage() {
    const [beads, setBeads] = useState<Bead[]>([]);
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        model: '',
        weight: '',
        width: '',
        material: '',
        orientation: 'center',
        hasGold: false,
        goldWeight: '',
        price: '',
        processingFee: '',
        tabId: '',
        isVisible: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [beadsRes, tabsRes] = await Promise.all([
                fetch('/api/beads'),
                fetch('/api/tabs')
            ]);

            if (beadsRes.ok && tabsRes.ok) {
                setBeads(await beadsRes.json());
                setTabs(await tabsRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'model') {
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
                setFormData(prev => ({ ...prev, [field]: data.url }));
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
        if (!formData.name || !formData.tabId) {
            alert('名称和分类是必填项');
            return;
        }

        setSubmitting(true);
        try {
            const url = editingId ? `/api/beads/${editingId}` : '/api/beads';
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                processingFee: parseFloat(formData.processingFee) || 0,
                weight: parseFloat(formData.weight) || 0,
                width: parseFloat(formData.width) || 0,
                goldWeight: parseFloat(formData.goldWeight) || 0,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error('Failed to save bead', error);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('确定要删除吗？')) return;

        try {
            const res = await fetch(`/api/beads/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Failed to delete bead', error);
        }
    }

    function startEdit(bead: Bead) {
        setFormData({
            ...(bead as any),
            price: String(bead.price || ''),
            processingFee: String(bead.processingFee || ''),
            weight: String(bead.weight || ''),
            width: String(bead.width || ''),
            goldWeight: String(bead.goldWeight || ''),
        });
        setEditingId(bead.id);
        setShowForm(true);
    }

    function resetForm() {
        setFormData({
            name: '',
            image: '',
            model: '',
            weight: '',
            width: '',
            material: '',
            orientation: 'center',
            hasGold: false,
            goldWeight: '',
            price: '',
            processingFee: '',
            tabId: '',
            isVisible: true,
        });
        setEditingId(null);
        setShowForm(false);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">珠子管理</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    添加珠子
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingId ? '编辑珠子' : '添加新珠子'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                                    <select
                                        value={formData.tabId}
                                        onChange={e => setFormData({ ...formData, tabId: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                        required
                                    >
                                        <option value="">选择分类</option>
                                        {tabs.map(tab => (
                                            <option key={tab.id} value={tab.id}>{tab.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">单价</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.price}
                                        onChange={e => {
                                            const { value } = e.target;
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                setFormData({ ...formData, price: value })
                                            }
                                        }}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">加工费</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.processingFee}
                                        onChange={e => {
                                            const { value } = e.target;
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                setFormData({ ...formData, processingFee: value })
                                            }
                                        }}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">重量 (g)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.weight}
                                        onChange={e => {
                                            const { value } = e.target;
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                setFormData({ ...formData, weight: value })
                                            }
                                        }}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">宽度 (mm)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.width}
                                        onChange={e => {
                                            const { value } = e.target;
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                setFormData({ ...formData, width: value })
                                            }
                                        }}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
                                    <input
                                        type="text"
                                        value={formData.material}
                                        onChange={e => setFormData({ ...formData, material: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">朝向</label>
                                    <select
                                        value={formData.orientation}
                                        onChange={e => setFormData({ ...formData, orientation: e.target.value })}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    >
                                        <option value="left">左</option>
                                        <option value="center">中</option>
                                        <option value="right">右</option>
                                    </select>
                                </div>

                                <div className="col-span-2 flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="hasGold"
                                            checked={formData.hasGold}
                                            onChange={e => setFormData({ ...formData, hasGold: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="hasGold" className="ml-2 text-sm text-gray-900">包含金</label>
                                    </div>
                                    {formData.hasGold && (
                                        <div className="flex items-center">
                                            <label className="mr-2 text-sm text-gray-700">金重 (g):</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.goldWeight}
                                                onChange={e => {
                                                    const { value } = e.target;
                                                    if (/^\d*\.?\d*$/.test(value)) {
                                                        setFormData({ ...formData, goldWeight: value })
                                                    }
                                                }}
                                                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-gray-900"
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isVisible"
                                            checked={formData.isVisible}
                                            onChange={e => setFormData({ ...formData, isVisible: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="isVisible" className="ml-2 text-sm text-gray-900">显示</label>
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">图片</label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleFileUpload(e, 'image')}
                                            className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {formData.image && (
                                            <div className="relative w-16 h-16">
                                                <Image src={formData.image} alt="预览" fill className="object-cover rounded" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">3D 模型 (.glb)</label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="file"
                                            accept=".glb"
                                            onChange={e => handleFileUpload(e, 'model')}
                                            className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {formData.model && <span className="text-sm text-green-600">模型已上传</span>}
                                    </div>
                                </div>
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
                                    {submitting ? '保存中...' : '保存珠子'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {beads.map(bead => (
                    <div key={bead.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="relative h-48 bg-gray-100">
                            {bead.image ? (
                                <Image src={bead.image} alt={bead.name} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">无图片</div>
                            )}
                            <div className="absolute top-2 right-2 flex space-x-1">
                                <button onClick={() => startEdit(bead)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100">
                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                </button>
                                <button onClick={() => handleDelete(bead.id)} className="p-1 bg-white rounded-full shadow hover:bg-gray-100">
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{bead.name}</h3>
                                <span className="text-sm font-medium text-green-600">¥{bead.price}</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                                分类: {tabs.find(t => t.id === bead.tabId)?.name || '未知'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded">重: {bead.weight}g</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">宽: {bead.width}mm</span>
                                {bead.processingFee > 0 && <span className="bg-gray-100 px-2 py-1 rounded">加工费: {bead.processingFee}</span>}
                                <span className="bg-gray-100 px-2 py-1 rounded">{bead.material}</span>
                                {bead.hasGold && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">金: {bead.goldWeight}g</span>}
                                {!bead.isVisible && <span className="bg-red-100 text-red-800 px-2 py-1 rounded">隐藏</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
