import React from "react";
import { Package, Layers, ShoppingCart, TrendingUp } from "lucide-react";
import { formatNumber } from "../../utils/CleanNumber";
import { DashboardStats } from "../../types/dashboard";

interface TopStatsAnalyticsProps {
    stats: DashboardStats;
    selectedDate: string;
}

const TopStatsAnalytics: React.FC<TopStatsAnalyticsProps> = ({
    stats,
    selectedDate,
}) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Total Stok Tersedia
                        </h3>
                        <Package className="text-green-600" size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-4xl font-bold text-gray-900">
                            {formatNumber(stats.total_stock)}
                        </p>
                        <p className="text-sm text-gray-600">kg</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Total Fiber Tersedia
                        </h3>
                        <Layers className="text-purple-600" size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-4xl font-bold text-gray-900">
                            {stats.total_fiber}
                        </p>
                        <p className="text-sm text-gray-600">units</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Total Pembelian
                        </h3>
                        <ShoppingCart className="text-orange-600" size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-gray-500">Rp</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatNumber(stats.total_purchase)}
                        </p>
                    </div>
                </div>

                {/* Total Penjualan */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Total Penjualan
                        </h3>
                        <TrendingUp className="text-blue-600" size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-gray-500">Rp</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatNumber(stats.total_sales)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-800">
                            Total Pembelian Harian
                        </h3>
                        <ShoppingCart className="text-orange-500" size={20} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-gray-900">
                            {stats.daily_purchase_weight} kg
                        </p>
                        <p className="text-sm text-gray-500">
                            Total berat pembelian untuk{" "}
                            {new Date(selectedDate).toLocaleDateString(
                                "id-ID",
                                {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                }
                            )}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-800">
                            Total Nilai Pembelian
                        </h3>
                        <TrendingUp className="text-orange-500" size={20} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-3xl font-bold text-gray-900">
                            Rp {formatNumber(stats.daily_purchase_value)}
                        </p>
                        <p className="text-sm text-gray-500">
                            Total nilai pembelian untuk{" "}
                            {new Date(selectedDate).toLocaleDateString(
                                "id-ID",
                                {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                }
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
export default TopStatsAnalytics;
