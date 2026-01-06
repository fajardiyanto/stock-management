import React, { useState, useMemo } from "react";
import TopStatsAnalytics from "../components/AnalyticComponents/TopStatsAnalytics";
import SummarySaleDayTable from "../components/AnalyticComponents/SummarySaleDayTable";
import ChartAnalytics from "../components/AnalyticComponents/ChartAnalytics";
import {
    getDefaultDateOnly,
    getYearFromDate,
    getMonthFromDate,
} from "../utils/DefaultDate";
import { useDashboardStats } from "../hooks/analytics/useDashboardStats";
import { useDailyDashboardStats } from "../hooks/analytics/useDailyDashboardStats";
import { useSalesTrendData } from "../hooks/analytics/useSalesTrendData";
import { useStockDistributionData } from "../hooks/analytics/useStockDistributionData";
import { usePerformanceData } from "../hooks/analytics/usePerformanceData";
import { authService } from "../services/authService";
import { Calendar } from "lucide-react";

const AnalyticsPage: React.FC = () => {
    const userData = authService.getUser();

    const [selectedDate, setSelectedDate] = useState<string>(
        getDefaultDateOnly()
    );

    const dateNow = getDefaultDateOnly();
    const dateYear = useMemo(
        () => getYearFromDate(selectedDate),
        [selectedDate]
    );
    const dateMonth = useMemo(
        () => getMonthFromDate(selectedDate),
        [selectedDate]
    );

    const {
        stats,
        loading: dashboardStatsLoading,
        error: dashboardStatsError,
        refetch: refetchDashboardStats,
    } = useDashboardStats(dateYear, dateMonth);

    const { dailyStats, refetch: refetchDailyDashboardStats } =
        useDailyDashboardStats(selectedDate);

    const {
        salesTrendData,
        loading: salesTrendDataLoading,
        error: salesTrendDataError,
        refetch: refetchSalesTrendData,
    } = useSalesTrendData(dateYear);

    const {
        stockDistributionData,
        loading: stockDistributionDataLoading,
        error: stockDistributionDataError,
        refetch: refetchStockDistributionData,
    } = useStockDistributionData();

    const {
        userData: supplierData,
        loading: supplierPerformanceDataLoading,
        error: supplierPerformanceDataError,
        refetch: refetchSupplierPerformanceData,
    } = usePerformanceData("supplier");

    const {
        userData: customerData,
        loading: customerPerformanceDataLoading,
        error: customerPerformanceDataError,
        refetch: refetchCustomerPerformanceData,
    } = usePerformanceData("customer");

    const refreshButton = () => {
        refetchDashboardStats();
        refetchDailyDashboardStats();
        refetchSalesTrendData();
        refetchStockDistributionData();
        refetchSupplierPerformanceData();
        refetchCustomerPerformanceData();
    };

    if (
        dashboardStatsLoading ||
        salesTrendDataLoading ||
        stockDistributionDataLoading ||
        supplierPerformanceDataLoading ||
        customerPerformanceDataLoading
    ) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    if (
        dashboardStatsError ||
        salesTrendDataError ||
        stockDistributionDataError ||
        supplierPerformanceDataError ||
        customerPerformanceDataError
    ) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{dashboardStatsError}</p>
                <button
                    onClick={refreshButton}
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
                            Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Selamat datang, <b>{userData?.name || "User"}</b>!
                            Berikut adalah ringkasan sistem StockFish
                            Management.
                        </p>
                    </div>
                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={18}
                        />
                    </div>
                </header>
            </div>

            <TopStatsAnalytics stats={stats} selectedDate={dateNow} />

            {selectedDate !== "" && (
                <SummarySaleDayTable
                    stats={dailyStats}
                    selectedDate={selectedDate}
                />
            )}

            <ChartAnalytics
                salesTrendData={salesTrendData}
                stockDistributionData={stockDistributionData}
                supplierData={supplierData}
                customerData={customerData}
            />
        </div>
    );
};

export default AnalyticsPage;
