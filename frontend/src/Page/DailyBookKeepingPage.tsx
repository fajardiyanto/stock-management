import React, { useState, useMemo } from "react";
import SupplierSalesTableWithPurchase from "../components/AnalyticComponents/SupplierSalesTableWithPurchase";
import { useSalesSupplierDetailWithPurchase } from "../hooks/analytics/useSalesSupplierDetailWithPurchase";
import { Calendar } from "lucide-react";

const DailyBookKeepingPage: React.FC = () => {
    const [dateNow, setDateNow] = React.useState<string>(
        new Date().toISOString().split("T")[0]
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);


    const salesSupplierFilter = {
        page_no: currentPage,
        size: pageSize,
    };

    const memoFilterWithPurchase = useMemo(
        () => salesSupplierFilter,
        [JSON.stringify(salesSupplierFilter)]
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSize = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const {
        salesSupplier: salesSupplierDetailData,
        loading: salesSupplierDetailLoading,
        error: salesSupplierDetailError,
        refetch: refetchSalesSupplierDetail,
    } = useSalesSupplierDetailWithPurchase(memoFilterWithPurchase);

    const totalPages = Math.ceil(
        salesSupplierDetailData?.total / pageSize
    );

    if (
        salesSupplierDetailLoading
    ) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    if (
        salesSupplierDetailError
    ) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{salesSupplierDetailError}</p>
                <button
                    onClick={refetchSalesSupplierDetail}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="space-y-6">
                <header className="flex justify-between items-center mb-4 bg-white p-6 rounded-xl shadow-md">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Pembukuan Harian
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Lihat ringkasan penjualan dan stok untuk tanggal tertentu
                        </p>
                    </div>
                    <div className="relative">
                        <input
                            type="date"
                            value={dateNow}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setDateNow(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={18}
                        />
                    </div>
                </header>

                <SupplierSalesTableWithPurchase
                    data={salesSupplierDetailData}
                    selectedDate={dateNow}
                    loading={salesSupplierDetailLoading}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSize}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default DailyBookKeepingPage;