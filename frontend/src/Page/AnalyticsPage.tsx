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
    const [salesTrendData, setSalesTrendData] = useState<SalesTrendData[]>([]);
    const [stockDistributionData, setStockDistributionData] = useState<
        StockDistributionData[]
    >([]);
    const [supplierData, setSupplierData] = useState<UserData[]>([]);
    const [customerData, setCustomerData] = useState<UserData[]>([]);

    const { showToast } = useToast();

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

    const fetchSalesTrendData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getSalesTrendData("2025");

            if (response.status_code === 200) {
                setSalesTrendData(response.data);
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
    }, [showToast]);

    const fetchStockDistributionData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getStockDistributionData();

            if (response.status_code === 200) {
                setStockDistributionData(response.data);
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
    }, [showToast]);

    const fetchSupplierPerformanceData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getSupplierPerformance();

            if (response.status_code === 200) {
                setSupplierData(response.data);
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
    }, [showToast]);

    const fetchCustomerPerformanceData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getCustomerPerformance();

            if (response.status_code === 200) {
                setCustomerData(response.data);
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
    }, [showToast]);

    useEffect(() => {
        fetchDailyDashboardStats();
        fetchDashboardStats();
        fetchSalesTrendData();
        fetchStockDistributionData();
        fetchSupplierPerformanceData();
        fetchCustomerPerformanceData();
    }, [
        fetchDashboardStats,
        fetchDailyDashboardStats,
        fetchSalesTrendData,
        fetchStockDistributionData,
        fetchSupplierPerformanceData,
        fetchCustomerPerformanceData,
    ]);

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
