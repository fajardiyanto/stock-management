import React from 'react';
import StockRowDetails from './StockRowDetails';
import { Purchasing } from '../../types/purchase';
import Pagination from "../Pagination";

interface StockTableProps {
    data: Purchasing[];
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
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SUPPLIER</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">TANGGAL DIBUAT</th>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">UMUR</th>

                            <th colSpan={5} className="px-2 py-2 text-center text-xs font-semibold text-gray-600 bg-gray-100 border-l border-r">
                                Items
                            </th>
                            <th colSpan={5} className="px-2 py-2 text-center text-xs font-semibold text-gray-600 bg-gray-100 border-l border-r">
                                Sortir
                            </th>

                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sortir Item</th>
                            <th rowSpan={2} className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                        <tr>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Nama</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Berat (kg)</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Harga (per kg)</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Total</th>

                            <th className="px-2 py-1 text-xs text-left text-gray-500">Nama</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Harga (per kg)</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Berat (kg)</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Berat Tersedia (kg)</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Total</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Susut</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((stockEntry) => (
                            stockEntry.stock_entry.stock_items?.map((item, itemIndex) => (
                                <StockRowDetails
                                    key={`${item.uuid}-${itemIndex}`}
                                    item={item}
                                    stockEntry={stockEntry.stock_entry}
                                    purchase={stockEntry}
                                    itemIndex={itemIndex}
                                    totalItems={stockEntry.stock_entry.stock_items.length}
                                    onSort={() => onSortItem(stockEntry.stock_entry.uuid, itemIndex)}
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