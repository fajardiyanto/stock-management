import React from "react";
import { DashboardStats, DashboardSalesItem } from "../../types/dashboard";
import { formatNumber } from "../../utils/CleanNumber";
import { formatRupiah } from "../../utils/FormatRupiah";
import { Calendar } from "lucide-react";

interface SummarySaleDayTableProps {
    stats: DashboardStats;
    selectedDate: string;
    salesData: DashboardSalesItem[];
    setSelectedDate: (date: string) => void;
}

const SummarySaleDayTable: React.FC<SummarySaleDayTableProps> = ({
    stats,
    selectedDate,
    salesData,
    setSelectedDate,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Ringkasan Penjualan Harian
                </h3>
                <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-600">
                        Lihat ringkasan penjualan dan stok untuk tanggal
                        tertentu
                    </label>
                    <div className="flex items-center gap-2">
                        <Calendar className="text-gray-400" size={20} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-base font-semibold text-blue-900 mb-2">
                        Total Terjual
                    </h4>
                    <p className="text-3xl font-bold text-blue-700">
                        {stats.daily_sold_weight} kg
                    </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-base font-semibold text-green-900 mb-2">
                        Total Pendapatan
                    </h4>
                    <p className="text-3xl font-bold text-green-700">
                        Rp {formatNumber(stats.daily_revenue)}
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <h4 className="text-base font-semibold text-gray-800 mb-4">
                    Item Terjual
                </h4>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Pembeli
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                ID Stok
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Supplier
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Hasil Sortir
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Berat (kg)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Harga (per kg)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                Total
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                                Fiber
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-12 text-center text-gray-500"
                                >
                                    Tidak ada data penjualan untuk tanggal yang
                                    dipilih
                                </td>
                            </tr>
                        ) : (
                            salesData.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {item.id}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {item.customer_id}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {item.stock_code}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {item.supplier}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {item.sort_result}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                        {item.weight}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                        {formatRupiah(item.price_per_kg)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                        {formatRupiah(item.total)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                            {item.fiber}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Show</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <span className="text-sm text-gray-600">entries</span>
                    </div>
                    <p className="text-sm text-gray-600">
                        Showing 0 to 0 of 0 entries
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SummarySaleDayTable;
