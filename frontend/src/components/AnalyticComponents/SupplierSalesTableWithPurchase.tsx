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

                const supplierGroup = suppliers[item.supplier_name];
                let itemGroup = supplierGroup.items.find(
                    (i) => i.item_name === item.item_name
                );

                if (!itemGroup) {
                    itemGroup = {
                        item_name: item.item_name,
                        sorts: [],
                    };
                    supplierGroup.items.push(itemGroup);
                }

                let sortGroup = itemGroup.sorts.find(
                    (s) => s.item_sort_name === item.item_sort_name
                );

                if (!sortGroup) {
                    sortGroup = {
                        item_sort_name: item.item_sort_name,
                        stock_sort_weight: item.stock_sort_weight,
                        sales: [],
                    };
                    itemGroup.sorts.push(sortGroup);
                }

                sortGroup.sales.push({
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
                    {/* <h1 className="text-xl font-bold text-gray-900 mb-2">Pembukuan Harian Barang Terjual</h1> */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "#",
                                    "Supplier",
                                    "Umur Stock",
                                    "Item",
                                    "Berat Beli",
                                    "Item Sort",
                                    "Berat Beli Sort",
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
                                    (sum, item) => sum + item.sorts.reduce(
                                        (sortSum, sort) => sortSum + sort.sales.length,
                                        0
                                    ),
                                    0
                                );

                                let isFirstRowOfSupplierRendered = false;

                                return supplier.items.map((item, itemIndex) => {
                                    const itemRowSpan = item.sorts.reduce(
                                        (sum, sort) => sum + sort.sales.length,
                                        0
                                    );
                                    const ageInDay = Math.max(
                                        ...item.sorts.flatMap((sort) =>
                                            sort.sales.map((s) => s.age_in_day ?? 0)
                                        )
                                    );
                                    const totalStockWeight = Math.max(
                                        ...item.sorts.flatMap((sort) =>
                                            sort.sales.map((s) => s.stock_weight ?? 0)
                                        )
                                    );
                                    const currentWeight = Math.max(
                                        ...item.sorts.flatMap((sort) =>
                                            sort.sales.map((s) => s.current_weight ?? 0)
                                        )
                                    );

                                    let isFirstRowOfItemRendered = false;

                                    return item.sorts.map((sort, sortIndex) => {
                                        return sort.sales.map((sale, saleIndex) => {
                                            const showSupplier = !isFirstRowOfSupplierRendered;
                                            const showItem = !isFirstRowOfItemRendered;
                                            const isFirstRowOfSort = saleIndex === 0;

                                            if (showSupplier) isFirstRowOfSupplierRendered = true;
                                            if (showItem) isFirstRowOfItemRendered = true;

                                            return (
                                                <tr
                                                    key={`${supplierIndex}-${itemIndex}-${sortIndex}-${saleIndex}`}
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 border border-gray-300 whitespace-nowrap text-sm text-gray-700">
                                                        {(startIdx += 1)}
                                                    </td>
                                                    {showSupplier && (
                                                        <td
                                                            rowSpan={supplierRowSpan}
                                                            className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                        >
                                                            {supplier.supplier_name}
                                                        </td>
                                                    )}

                                                    {showItem && (
                                                        <td
                                                            rowSpan={itemRowSpan}
                                                            className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                        >
                                                            {ageInDay} hari
                                                        </td>
                                                    )}

                                                    {showItem && (
                                                        <td
                                                            rowSpan={itemRowSpan}
                                                            className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                        >
                                                            {item.item_name}
                                                        </td>
                                                    )}

                                                    {showItem && (
                                                        <td
                                                            rowSpan={itemRowSpan}
                                                            className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                        >
                                                            {totalStockWeight} Kg
                                                        </td>
                                                    )}

                                                    {isFirstRowOfSort && (
                                                        <td
                                                            rowSpan={sort.sales.length}
                                                            className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                        >
                                                            {sort.item_sort_name}
                                                        </td>
                                                    )}

                                                    {isFirstRowOfSort && (
                                                        <td
                                                            rowSpan={sort.sales.length}
                                                            className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                        >
                                                            {sort.stock_sort_weight} Kg
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
                                                    {showItem && (
                                                        <td
                                                            rowSpan={itemRowSpan}
                                                            className="px-6 py-4 border border-gray-300 whitespace-nowrap"
                                                        >
                                                            {currentWeight} Kg
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        });
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
