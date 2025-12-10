import React, { useState } from "react";
import { User } from "../types/user";
import TopStatsAnalytics from "../components/AnalyticComponents/TopStatsAnalytics";
import SummarySaleDayTable from "../components/AnalyticComponents/SummarySaleDayTable";
import ChartAnalytics from "../components/AnalyticComponents/ChartAnalytics";
import { getDefaultDateOnly } from "../utils/DefaultDate";
import { useDashboardStats } from "../hooks/analytics/useDashboardStats";
import { useDailyDashboardStats } from "../hooks/analytics/useDailyDashboardStats";
import { useSalesTrendData } from "../hooks/analytics/useSalesTrendData";
import { useStockDistributionData } from "../hooks/analytics/useStockDistributionData";
import { usePerformanceData } from "../hooks/analytics/usePerformanceData";

interface AnalyticsPageProps {
    userData: User | null;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ userData }) => {
    const [selectedDate, setSelectedDate] = useState<string>(
        getDefaultDateOnly()
    );

    const {
        stats,
        loading: dashboardStatsLoading,
        error: dashboardStatsError,
        refetch: refetchDashboardStats,
    } = useDashboardStats();

    const {
        dailyStats,
        loading: dailyDashboardStatsLoading,
        error: dailyDashboardStatsError,
        refetch: refetchDailyDashboardStats,
    } = useDailyDashboardStats(selectedDate);

    const {
        salesTrendData,
        loading: salesTrendDataLoading,
        error: salesTrendDataError,
        refetch: refetchSalesTrendData,
    } = useSalesTrendData();

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
        dailyDashboardStatsLoading ||
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
        dailyDashboardStatsError ||
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Selamat datang, <b>{userData?.name || "User"}</b>! Berikut
                    adalah ringkasan sistem StockFish Management.
                </p>
            </div>

            <TopStatsAnalytics stats={stats} selectedDate={selectedDate} />

            <SummarySaleDayTable
                stats={dailyStats}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />

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
