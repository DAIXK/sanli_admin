export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘概览</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">总用户数</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">1</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">总商品数</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">加载中...</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">系统状态</h3>
                    <p className="text-3xl font-bold text-gray-600 mt-2">运行中</p>
                </div>
            </div>
        </div>
    );
}
