import React, { useState, useEffect, useCallback } from "react";
import { User } from "../types/user";
import {
    DashboardStats,
    SalesTrendData,
    StockDistributionData,
    UserData,
    DailyDashboardStats,
} from "../types/analytic";
import TopStatsAnalytics from "../components/AnalyticComponents/TopStatsAnalytics";
import SummarySaleDayTable from "../components/AnalyticComponents/SummarySaleDayTable";
import ChartAnalytics from "../components/AnalyticComponents/ChartAnalytics";
import { analyticService } from "../services/analyticService";
import { useToast } from "../contexts/ToastContext";
import { getDefaultDateOnly } from "../utils/DefaultDate";

interface AnalyticsPageProps {
    userData: User | null;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ userData }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [stats, setStats] = useState<DashboardStats>({} as DashboardStats);
    const [dailyStats, setDailyStats] = useState<DailyDashboardStats>(
        {} as DailyDashboardStats
    );
    const [selectedDate, setSelectedDate] = useState<string>(
        getDefaultDateOnly()
    );

    const { showToast } = useToast();

    const salesTrendData: SalesTrendData[] = [
        { month: "Jan", sales_revenue: 12000000, purchase_revenue: 8000000 },
        { month: "Feb", sales_revenue: 15000000, purchase_revenue: 10000000 },
        { month: "Mar", sales_revenue: 18000000, purchase_revenue: 12000000 },
        { month: "Apr", sales_revenue: 14000000, purchase_revenue: 9000000 },
        { month: "May", sales_revenue: 22000000, purchase_revenue: 15000000 },
        { month: "Jun", sales_revenue: 25000000, purchase_revenue: 18000000 },
    ];

    const stockDistributionData: StockDistributionData[] = [
        { name: "Grade A", value: 350, color: "#3b82f6" },
        { name: "Grade B", value: 280, color: "#8b5cf6" },
        { name: "Grade C", value: 200, color: "#ec4899" },
        { name: "Susut", value: 90.5, color: "#ef4444" },
    ];

    const supplierData: UserData[] = [
        { name: "Supplier A", total: 35000000 },
        { name: "Supplier B", total: 28000000 },
        { name: "Supplier C", total: 20000000 },
        { name: "Supplier D", total: 11553500 },
    ];

    const customerData: UserData[] = [
        { name: "Customer A", total: 35000000 },
        { name: "Customer B", total: 28000000 },
        { name: "Customer C", total: 20000000 },
        { name: "Customer D", total: 11553500 },
    ];

    const fetchDashboardStats = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getDashboardStats();

            if (response.status_code === 200) {
                setStats(response.data);
            } else {
                setError(response.message || "Failed to fetch dashboard stats");
                showToast(
                    response.message || "Failed to fetch dashboard stats",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch dashboard stats. Please try again");
            showToast(
                "Failed to fetch dashboard stats. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchDailyDashboardStats = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getDailyDashboardStats(
                selectedDate
            );

            if (response.status_code === 200) {
                setDailyStats(response.data);
            } else {
                setError(
                    response.message || "Failed to fetch daily dashboard stats"
                );
                showToast(
                    response.message || "Failed to fetch daily dashboard stats",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch daily dashboard stats. Please try again");
            showToast(
                "Failed to fetch daily dashboard stats. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [selectedDate, showToast]);

    useEffect(() => {
        fetchDailyDashboardStats();
        fetchDashboardStats();
    }, [fetchDashboardStats, fetchDailyDashboardStats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading purchases...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{error}</p>
                <button
                    onClick={fetchDashboardStats}
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
