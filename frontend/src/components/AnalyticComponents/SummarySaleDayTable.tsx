import React from "react";
import { DailyDashboardStats } from "../../types/analytic";
import { formatNumber } from "../../utils/CleanNumber";
import { Calendar } from "lucide-react";

interface SummarySaleDayTableProps {
    stats: DailyDashboardStats | null;
    selectedDate: string;
}

const SummarySaleDayTable: React.FC<SummarySaleDayTableProps> = ({
    stats,
    selectedDate,
}) => {
    return (
        <>
            {stats && (
                <div>
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Ringkasan Penjualan Harian
                            </h3>
                            <div className="flex items-center gap-4">
                                <label className="text-sm text-gray-600">
                                    Lihat ringkasan penjualan dan stok untuk
                                    tanggal tertentu
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h4 className="text-base font-semibold text-blue-900 mb-2">
                                    Total Terjual
                                </h4>
                                <p className="text-3xl font-bold text-blue-700 mb-2">
                                    Rp {formatNumber(stats.daily_sales_value)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Total nilai penjualan untuk{" "}
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

                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <h4 className="text-base font-semibold text-green-900 mb-2">
                                    Total Pembelian
                                </h4>
                                <p className="text-3xl font-bold text-green-700 mb-2">
                                    Rp{" "}
                                    {formatNumber(stats.daily_purchase_value)}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <h4 className="text-base font-semibold text-orange-900 mb-2">
                                    Total Berat Terjual
                                </h4>
                                <p className="text-3xl font-bold text-orange-700 mb-2">
                                    {stats.daily_sales_weight} kg
                                </p>
                                <p className="text-sm text-gray-500">
                                    Total berat penjualan untuk{" "}
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

                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <h4 className="text-base font-semibold text-purple-900 mb-2">
                                    Total Berat Pembelian
                                </h4>
                                <p className="text-3xl font-bold text-purple-700 mb-2">
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
                    </div>
                </div>
            )}
        </>
    );
};

export default SummarySaleDayTable;
