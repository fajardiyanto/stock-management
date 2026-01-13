import React from "react";
import {
    SalesSupplierDetailPaginationResponse,
    SupplierGroup,
} from "../../types/analytic";
import { formatRupiah } from "../../utils/FormatRupiah";
import Pagination from "../Pagination";

interface SupplierSalesTableProps {
    data: SalesSupplierDetailPaginationResponse;
    selectedDate: string;
    totalPages: number;
    loading: boolean;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
}

const SupplierSalesTable: React.FC<SupplierSalesTableProps> = ({
    data,
    selectedDate,
    totalPages,
    loading,
    onPageChange,
    onPageSizeChange,
}) => {
    const groupedData = React.useMemo(() => {
        const suppliers: { [key: string]: SupplierGroup } = {};

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
                        {groupedData.map((supplier, supplierIndex) => {
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

export default SupplierSalesTable;
