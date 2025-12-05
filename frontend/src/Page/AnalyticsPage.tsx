import React, { useState, useEffect } from "react";
import { User } from "../types/user";
import {
    DashboardStats,
    DashboardSalesItem,
    SalesTrendData,
    StockDistributionData,
    UserData,
} from "../types/dashboard";
import TopStatsAnalytics from "../components/AnalyticComponents/TopStatsAnalytics";
import SummarySaleDayTable from "../components/AnalyticComponents/SummarySaleDayTable";
import ChartAnalytics from "../components/AnalyticComponents/ChartAnalytics";

interface AnalyticsPageProps {
    userData: User | null;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ userData }) => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [stats, setStats] = useState<DashboardStats>({
        total_stock: 920.5,
        total_fiber: 6,
        total_purchase: 94553500,
        total_sales: 13997920,
        daily_purchase_weight: 0,
        daily_purchase_value: 0,
        daily_sold_weight: 0,
        daily_revenue: 0,
    });
    const [salesData, setSalesData] = useState<DashboardSalesItem[]>([]);

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

    useEffect(() => {
        // Fetch dashboard data
        // const fetchData = async () => {
        //   const response = await dashboardService.getStats();
        //   setStats(response.data);
        // };
        // fetchData();
        console.log("Selected Date:", selectedDate);
    }, [selectedDate]);

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
                stats={stats}
                selectedDate={selectedDate}
                salesData={salesData}
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
