import { logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, LogOut } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    async function handleLogout() {
        'use server';
        await logout();
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">管理后台</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        仪表盘
                    </Link>
                    <Link
                        href="/dashboard/gold-price"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <span className="w-5 h-5 mr-3 flex items-center justify-center font-bold text-yellow-600">¥</span>
                        每日金价
                    </Link>
                    <Link
                        href="/dashboard/tabs"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <span className="w-5 h-5 mr-3 flex items-center justify-center font-bold text-blue-600">T</span>
                        分类管理
                    </Link>
                    <Link
                        href="/dashboard/beads"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <span className="w-5 h-5 mr-3 flex items-center justify-center font-bold text-purple-600">B</span>
                        珠子管理
                    </Link>
                </nav>

                <div className="p-4 border-t">
                    <form action={handleLogout}>
                        <button
                            type="submit"
                            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            退出登录
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
