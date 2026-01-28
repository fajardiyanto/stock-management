import React, { useState, useMemo } from "react";
import {
    getDefaultDateOnly,
    getYearFromDate,
} from "../utils/DefaultDate";
import { useDashboardStats } from "../hooks/analytics/useDashboardStats";
import { useSalesTrendData } from "../hooks/analytics/useSalesTrendData";
import { useStockDistributionData } from "../hooks/analytics/useStockDistributionData";
import { usePerformanceData } from "../hooks/analytics/usePerformanceData";
import { useSalesSupplierDetail } from "../hooks/analytics/useSalesSupplierDetail";
import { authService } from "../services/authService";
import { Package, Layers, ShoppingCart, TrendingUp } from "lucide-react";
import { formatNumber } from "../utils/CleanNumber";
import {
    AnalyticStatsFilter,
    SupplierGroup,
} from "../types/analytic";
import { formatRupiah } from "../utils/FormatRupiah";
import Pagination from "../components/Pagination";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { useDebounce } from "../utils/useDebounce";
import DateRangeInput from "../components/DateRangeInput";
import { format, startOfMonth } from "date-fns";
import { Range } from "react-date-range";

const AnalyticsPage: React.FC = () => {
    const userData = authService.getUser();

    // Initialize with default date directly to ensure consistent initial state
    const [dateRange, setDateRange] = useState<Range[]>([
        {
            startDate: startOfMonth(new Date()),
            endDate: new Date(),
            key: "selection",
        },
    ]);
    const debouncedDate = useDebounce(dateRange[0].startDate, 500);

    const formattedDate = debouncedDate
        ? format(debouncedDate, "yyyy-MM-dd")
        : getDefaultDateOnly();

    const dateYear = getYearFromDate(formattedDate);

    const dateNow = getDefaultDateOnly();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const analyticStatsFilter: AnalyticStatsFilter = {
        page_no: currentPage,
        size: pageSize,
        start_date: dateRange[0].startDate
            ? format(dateRange[0].startDate, "yyyy-MM-dd")
            : undefined,
        end_date: dateRange[0].endDate
            ? format(dateRange[0].endDate, "yyyy-MM-dd")
            : undefined,
    }
    const memoAnalyticStatsFilter = useMemo(
        () => analyticStatsFilter,
        [JSON.stringify(analyticStatsFilter)]
    );

    const {
        stats,
        loading: dashboardStatsLoading,
        error: dashboardStatsError,
        refetch: refetchDashboardStats,
    } = useDashboardStats(memoAnalyticStatsFilter);

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
    } = useStockDistributionData(memoAnalyticStatsFilter);

    const {
        userData: supplierData,
        loading: supplierPerformanceDataLoading,
        error: supplierPerformanceDataError,
        refetch: refetchSupplierPerformanceData,
    } = usePerformanceData("supplier", memoAnalyticStatsFilter);

    const {
        userData: customerData,
        loading: customerPerformanceDataLoading,
        error: customerPerformanceDataError,
        refetch: refetchCustomerPerformanceData,
    } = usePerformanceData("customer", memoAnalyticStatsFilter);

    const {
        salesSupplier: salesSupplierDetailData,
        loading: salesSupplierDetailLoading,
        error: salesSupplierDetailError,
        refetch: refetchSalesSupplierDetail,
    } = useSalesSupplierDetail(memoAnalyticStatsFilter);

    const totalPages = Math.ceil(salesSupplierDetailData?.total / pageSize);



    const refreshButton = () => {
        refetchDashboardStats();
        refetchSalesTrendData();
        refetchStockDistributionData();
        refetchSupplierPerformanceData();
        refetchCustomerPerformanceData();
        refetchSalesSupplierDetail();
    };

    const groupedDataSupplierSales = useMemo(() => {
        const suppliers: { [key: string]: SupplierGroup } = {};

        salesSupplierDetailData?.data?.forEach((item) => {
            if (!suppliers[item.supplier_name]) {
                suppliers[item.supplier_name] = {
                    supplier_name: item.supplier_name,
                    items: [],
                };
            }

            const supplierGroup = suppliers[item.supplier_name];
            let itemGroup = supplierGroup.items.find(
                (i) => i.item_name === item.item_name
            );

            if (!itemGroup) {
                itemGroup = {
                    item_name: item.item_name,
                    sales: [],
                };
                supplierGroup.items.push(itemGroup);
            }

            itemGroup.sales.push({
                qty: item.qty,
                price: item.price,
                customer_name: item.customer_name,
                fiber_name: item.fiber_name,
            });
        });

        return Object.values(suppliers);
    }, [salesSupplierDetailData]);

    var startIdxSupplierSales = 0;

    const values = salesTrendData.flatMap((item) => [
        item.sales_revenue,
        item.purchase_revenue,
    ]);

    const nonZeroValues = values.filter((v) => v > 0);
    const minValue = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 0;

    const padding = (maxValue - minValue) * 0.1;
    const finalMin = Math.max(0, minValue);
    const finalMax = maxValue + padding;

    const isLoading =
        dashboardStatsLoading ||
        salesTrendDataLoading ||
        stockDistributionDataLoading ||
        supplierPerformanceDataLoading ||
        customerPerformanceDataLoading ||
        salesSupplierDetailLoading;

    const isError =
        dashboardStatsError ||
        salesTrendDataError ||
        stockDistributionDataError ||
        supplierPerformanceDataError ||
        customerPerformanceDataError ||
        salesSupplierDetailError;


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
                        <DateRangeInput
                            ranges={dateRange}
                            onChange={(item) => setDateRange([item.selection])}
                        />
                    </div>
                </header>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                    <div className="text-gray-500">Loading dashboard...</div>
                </div>
            ) : isError ? (
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
            ) : (
                <>
                    <div>
                        {stats && (
                            <div>
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
                                            <ShoppingCart
                                                className="text-orange-600"
                                                size={24}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500">Rp</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {formatNumber(stats.total_purchase)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-700">
                                                Total Penjualan
                                            </h3>
                                            <TrendingUp
                                                className="text-blue-600"
                                                size={24}
                                            />
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
                                                Total Berat Pembelian
                                            </h3>
                                            <ShoppingCart
                                                className="text-orange-500"
                                                size={20}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-3xl font-bold text-gray-900">
                                                {stats.total_purchase_weight} kg
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Total berat pembelian untuk{" "}
                                                {new Date(dateNow).toLocaleDateString(
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
                                                Total Berat Penjualan
                                            </h3>
                                            <TrendingUp
                                                className="text-orange-500"
                                                size={20}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-3xl font-bold text-gray-900">
                                                {stats.total_sales_weight} kg
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Total nilai penjualan untuk{" "}
                                                {new Date(dateNow).toLocaleDateString(
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
                    </div>

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
                            </div>
                        </div>

                        <div className="mb-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-200">
                                    <tr>
                                        {[
                                            "#",
                                            "Supplier",
                                            "Item",
                                            "Berat Penjualan",
                                            "Harga Beli",
                                            "Pembeli",
                                            "Fiber",
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-3 border border-gray-300 text-xs font-semibold text-black uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {groupedDataSupplierSales?.map((supplier, supplierIndex) => {
                                        const supplierRowSpan = supplier.items.reduce(
                                            (sum, item) => sum + item.sales.length,
                                            0
                                        );

                                        return supplier.items.map((item, itemIndex) => {
                                            return item.sales.map((sale, saleIndex) => {
                                                const isFirstRowOfSupplier =
                                                    itemIndex === 0 && saleIndex === 0;
                                                const isFirstRowOfItem = saleIndex === 0;

                                                return (
                                                    <tr
                                                        key={`${supplierIndex}-${itemIndex}-${saleIndex}`}
                                                        className="hover:bg-gray-50 transition"
                                                    >
                                                        <td className="px-6 py-4 border border-gray-300 whitespace-nowrap text-sm text-gray-700">
                                                            {(startIdxSupplierSales += 1)}
                                                        </td>
                                                        {isFirstRowOfSupplier && (
                                                            <td
                                                                rowSpan={supplierRowSpan}
                                                                className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                            >
                                                                {supplier.supplier_name}
                                                            </td>
                                                        )}

                                                        {isFirstRowOfItem && (
                                                            <td
                                                                rowSpan={item.sales.length}
                                                                className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                            >
                                                                {item.item_name}
                                                            </td>
                                                        )}

                                                        <td className="px-6 py-4 border border-gray-300 whitespace-nowrap">
                                                            {sale.qty}kg
                                                        </td>

                                                        <td className="px-6 py-4 border border-gray-300 whitespace-nowrap">
                                                            {formatRupiah(sale.price)}
                                                        </td>

                                                        <td className="px-6 py-4 border border-gray-300 whitespace-nowrap">
                                                            {sale.customer_name}
                                                        </td>

                                                        <td className="px-6 py-4 border border-gray-300 whitespace-nowrap">
                                                            {sale.fiber_name || "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        });
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            entryName="fibers"
                            currentPage={salesSupplierDetailData.page_no}
                            pageSize={salesSupplierDetailData.size}
                            totalData={salesSupplierDetailData.total}
                            totalPages={totalPages}
                            loading={salesSupplierDetailLoading}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                        />
                    </div>

                    <div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Tren Penjualan & Pembelian
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={salesTrendData}
                                        margin={{ top: 20, right: 10, left: 60, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis
                                            domain={[finalMin, finalMax]}
                                            tickFormatter={(value) => formatRupiah(value)}
                                        />
                                        <Tooltip
                                            formatter={(value: number | undefined) =>
                                                value != null ? formatRupiah(value) : "-"
                                            }
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="sales_revenue"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            name="Penjualan"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="purchase_revenue"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            name="Pembelian"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Distribusi Stok
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={stockDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) =>
                                                `${name}: ${value} kg`
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {stockDistributionData?.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Performa Supplier
                                </h3>
                                {supplierData && (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={supplierData}
                                            margin={{
                                                top: 20,
                                                right: 10,
                                                left: 60,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis
                                                width={80}
                                                tickFormatter={(value) =>
                                                    formatRupiah(value)
                                                }
                                            />
                                            <Tooltip
                                                formatter={(value: number | undefined) =>
                                                    value != null
                                                        ? formatRupiah(value)
                                                        : "-"
                                                }
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="total"
                                                fill="#8b5cf6"
                                                name="Total Pembelian"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Performa Customer
                                </h3>
                                {customerData && (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={customerData}
                                            margin={{
                                                top: 20,
                                                right: 10,
                                                left: 60,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis
                                                width={80}
                                                tickFormatter={(value) =>
                                                    formatRupiah(value)
                                                }
                                            />
                                            <Tooltip
                                                formatter={(value: number | undefined) =>
                                                    value != null
                                                        ? formatRupiah(value)
                                                        : "-"
                                                }
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="total"
                                                fill="#8b5cf6"
                                                name="Total Pembelian"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
