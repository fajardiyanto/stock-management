import React from 'react';
import StockRowDetails from './StockRowDetails';
import { StockEntry } from '../../types/stock';
import Pagination from "../Pagination";

interface StockTableProps {
    data: StockEntry[];
    currentPage: number;
    pageSize: number;
    totalPurchases: number;
    totalPages: number;
    loading: boolean;
    onSortItem: (stockId: string, itemIndex: number) => void;
    onEditStock: (stockId: string) => void;
    onDeleteStock: (stockId: string) => void;
    onPageSizeChange: (newSize: number) => void;
    onPageChange: (newPage: number) => void;
}

const StockTable: React.FC<StockTableProps> = ({ data, currentPage, pageSize, totalPurchases, totalPages, loading, onSortItem, onEditStock, onDeleteStock, onPageSizeChange, onPageChange }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[7rem]">ID</th>
                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[10rem]">SUPPLIER</th>
                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[12rem]">TANGGAL DIBUAT</th>
                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[8rem]">UMUR</th>

                            <th colSpan={4} className="px-2 py-2 text-center text-xs font-semibold text-gray-700 bg-blue-50 border-l border-r">
                                Items
                            </th>
                            <th colSpan={6} className="px-2 py-2 text-center text-xs font-semibold text-gray-700 bg-green-50 border-l border-r">
                                Sortir
                            </th>

                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[7rem]">SORTIR ITEM</th>
                            <th rowSpan={2} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[6rem]">Aksi</th>
                        </tr>
                        <tr>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-blue-50 min-w-[7rem]">Nama</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-blue-50 min-w-[4rem]">Berat (kg)</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-blue-50 min-w-[8rem]">Harga (per kg)</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-blue-50 min-w-[9rem]">Total</th>

                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-green-50 min-w-[7rem]">Nama</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-green-50 min-w-[8rem]">Harga (per kg)</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-green-50 min-w-[4rem]">Berat (kg)</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-green-50 min-w-[7rem]">Berat Tersedia (kg)</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-green-50 min-w-[9rem]">Total</th>
                            <th className="px-2 py-1 text-xs text-center text-gray-700 bg-green-50 min-w-[5rem]">Susut</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((stockEntry) => (
                            stockEntry.stock_items?.map((item, itemIndex) => (
                                <StockRowDetails
                                    key={`${item.uuid}-${itemIndex}`}
                                    item={item}
                                    stockEntry={stockEntry}
                                    itemIndex={itemIndex}
                                    totalItems={stockEntry.stock_items.length}
                                    onSort={() => onSortItem(stockEntry.uuid, itemIndex)}
                                    onEditStock={onEditStock}
                                    onDeleteStock={onDeleteStock}
                                />
                            ))
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                entryName="stock"
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

export default StockTable;