import React from "react";
import {
    SalesSupplierDetailWithPurchasePaginationResponse,
    SupplierGroupWithPurchase,
} from "../../types/analytic";
import { formatRupiah } from "../../utils/FormatRupiah";
import Pagination from "../Pagination";

interface SupplierSalesTableWithPurchaseProps {
    data: SalesSupplierDetailWithPurchasePaginationResponse;
    selectedDate: string;
    totalPages: number;
    loading: boolean;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
}

const SupplierSalesTableWithPurchase: React.FC<
    SupplierSalesTableWithPurchaseProps
> = ({
    data,
    selectedDate,
    totalPages,
    loading,
    onPageChange,
    onPageSizeChange,
}) => {
    const groupedData = React.useMemo(() => {
        const suppliers: { [key: string]: SupplierGroupWithPurchase } = {};

        data?.data?.forEach((item) => {
            if (!suppliers[item.supplier_name]) {
                suppliers[item.supplier_name] = {
                    supplier_name: item.supplier_name,
                    items: [],
                };
            }

            const SupplierGroupWithPurchase = suppliers[item.supplier_name];
            let itemGroup = SupplierGroupWithPurchase.items.find(
                (i) => i.item_name === item.item_name
            );

            if (!itemGroup) {
                itemGroup = {
                    item_name: item.item_name,
                    sales: [],
                };
                SupplierGroupWithPurchase.items.push(itemGroup);
            }

            itemGroup.sales.push({
                qty: item.qty,
                price: item.price,
                customer_name: item.customer_name,
                fiber_name: item.fiber_name,
                age_in_day: item.age_in_day,
                purchase_date: item.purchase_date,
                stock_weight: item.stock_weight,
                current_weight: item.current_weight,
            });
        });

        return Object.values(suppliers);
    }, []);

    var startIdx = 0;

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
                </div>
            </div>

            <div className="mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-green-200">
                        <tr>
                            {[
                                "#",
                                "Supplier",
                                "Umur Stock",
                                "Item",
                                "Berat Beli",
                                "Harga Beli",
                                "Pembeli",
                                "Berat Penjualan",
                                "Sisa",
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
                        {groupedData.map((supplier, supplierIndex) => {
                            const supplierRowSpan = supplier.items.reduce(
                                (sum, item) => sum + item.sales.length,
                                0
                            );

                            return supplier.items.map((item, itemIndex) => {
                                const ageInDay = Math.max(
                                    ...item.sales.map((s) => s.age_in_day ?? 0)
                                );
                                const totalStockWeight = Math.max(
                                    ...item.sales.map(
                                        (s) => s.stock_weight ?? 0
                                    )
                                );
                                const currentWeight = Math.max(
                                    ...item.sales.map(
                                        (s) => s.current_weight ?? 0
                                    )
                                );
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
                                                {(startIdx += 1)}
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
                                                    {ageInDay} hari
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

                                            {isFirstRowOfItem && (
                                                <td
                                                    rowSpan={item.sales.length}
                                                    className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                >
                                                    {totalStockWeight} Kg
                                                </td>
                                            )}

                                            <td className="px-6 py-4 border border-gray-300 whitespace-nowrap">
                                                {formatRupiah(sale.price)}
                                            </td>

                                            <td className="px-6 py-4 border border-gray-300 whitespace-nowrap">
                                                {sale.customer_name}
                                            </td>

                                            <td className="px-6 py-4 border border-gray-300 whitespace-nowrap">
                                                {sale.qty} Kg
                                            </td>
                                            {isFirstRowOfItem && (
                                                <td
                                                    rowSpan={item.sales.length}
                                                    className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                >
                                                    {currentWeight} Kg
                                                </td>
                                            )}
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
                currentPage={data.page_no}
                pageSize={data.size}
                totalData={data.total}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};

export default SupplierSalesTableWithPurchase;
