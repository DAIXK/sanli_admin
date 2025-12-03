'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function GoldPricePage() {
    const [price, setPrice] = useState<number | ''>('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPrice();
    }, []);

    async function fetchPrice() {
        try {
            const res = await fetch('/api/gold-price');
            if (res.ok) {
                const data = await res.json();
                setPrice(data.price);
                setUpdatedAt(data.updatedAt);
            }
        } catch (error) {
            console.error('Failed to fetch gold price', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (price === '') return;

        setSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/gold-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: Number(price) }),
            });

            if (res.ok) {
                const data = await res.json();
                setPrice(data.price);
                setUpdatedAt(data.updatedAt);
                setMessage('金价更新成功！');
            } else {
                setMessage('更新金价失败。');
            }
        } catch (error) {
            console.error('Failed to update gold price', error);
            setMessage('更新金价出错。');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">每日金价</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">当前金价 (元/克)</label>
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {updatedAt && (
                        <p className="text-sm text-gray-500">
                            最后更新: {new Date(updatedAt).toLocaleString()}
                        </p>
                    )}

                    {message && (
                        <div className={`p-3 rounded-md text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving || loading}
                        className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? '保存中...' : '更新金价'}
                    </button>
                </form>
            </div>
        </div>
    );
}
