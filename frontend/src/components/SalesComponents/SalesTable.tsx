import React from 'react';
import { SaleEntry } from '../../types/sales';
import SaleItemRow from './SaleItemRow';
import Pagination from "../Pagination";

interface SalesTableProps {
    data: SaleEntry[];
    currentPage: number;
    pageSize: number;
    totalPurchases: number;
    totalPages: number;
    loading: boolean;
    onPageSizeChange: (newSize: number) => void;
    onPageChange: (newPage: number) => void;
    onDelete: (sale_id: string, sale_code: string) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({ data, currentPage, pageSize, totalPurchases, totalPages, loading, onPageSizeChange, onPageChange, onDelete }) => {

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]">ID</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[10rem]">Pembeli</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[12rem]">Tanggal Dibuat</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]">Hari Terlambat</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]">Jual Luar?</th>

                            <th colSpan={5} className="px-6 py-2 text-center text-xs font-semibold text-gray-700 bg-blue-100 border-l border-r">Item</th>

                            <th colSpan={3} className="px-6 py-2 text-center text-xs font-semibold text-gray-700 bg-green-100 border-l border-r">AddOns</th>

                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]">Total</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[7rem]">Total Dibayarkan</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[10rem]">Status Pembayaran</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[12rem]">Tanggal Pembayaran</th>
                            <th rowSpan={2} className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider align-bottom min-w-[10rem]">Aksi</th>
                        </tr>

                        <tr>
                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-blue-100 min-w-[7rem]">ID Stok</th>
                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-blue-100 min-w-[10rem]">Nama Item</th>
                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-blue-100 min-w-[8rem]">Harga (per Kg)</th>
                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-blue-100 min-w-[8rem]">Berat (kg)</th>
                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-blue-100 min-w-[8rem]">Sub Total</th>

                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-green-100 min-w-[10rem]">Nama Tambahan</th>
                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-green-100 min-w-[8rem]">Harga Tambahan</th>
                            <th className="px-6 py-1 text-xs text-left text-gray-700 bg-green-100 min-w-[8rem]">Fiber</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map(sale => (
                            sale.sold_items.map((item, itemIndex) => (
                                <SaleItemRow
                                    key={`${sale.id}-${item.id}`}
                                    sale={sale}
                                    item={item}
                                    itemIndex={itemIndex}
                                    totalItems={sale.sold_items.length}
                                    onDelete={onDelete}
                                />
                            ))
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                entryName="sales"
                currentPage={currentPage}
                pageSize={pageSize}
                totalData={totalPurchases}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};

export default SalesTable;