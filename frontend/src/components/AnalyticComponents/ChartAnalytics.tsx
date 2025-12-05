import React from "react";
import {
    SalesTrendData,
    StockDistributionData,
    UserData,
} from "../../types/dashboard";
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
import { formatRupiah } from "../../utils/FormatRupiah";

interface ChartAnalyticsProps {
    salesTrendData: SalesTrendData[];
    stockDistributionData: StockDistributionData[];
    supplierData: UserData[];
    customerData: UserData[];
}

const ChartAnalytics: React.FC<ChartAnalyticsProps> = ({
    salesTrendData,
    stockDistributionData,
    supplierData,
    customerData,
}) => {
    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Tren Penjualan & Pembelian
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) =>
                                    formatRupiah(value)
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
                                {stockDistributionData.map((entry, index) => (
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
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={supplierData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) =>
                                    formatRupiah(value)
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
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Performa Customer
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={customerData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) =>
                                    formatRupiah(value)
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
                </div>
            </div>
        </div>
    );
};

export default ChartAnalytics;
