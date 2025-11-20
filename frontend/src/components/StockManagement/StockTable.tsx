import React from 'react';
import StockRowDetails from './StockRowDetails';
import { Stock } from "../../types/stock";


interface StockTableProps {
    data: Stock[];
    onSortItem: (stockId: string, itemIndex: number) => void;
    onEditStock: (stockId: string) => void;
    onDeleteStock: (stockId: string) => void;
}

const StockTable: React.FC<StockTableProps> = ({ data, onSortItem, onEditStock, onDeleteStock }) => {

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

                            <th colSpan={9} className="px-2 py-2 text-center text-xs font-semibold text-gray-600 bg-gray-100 border-l border-r">
                                Items
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
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Berat Tersedia (kg)</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Total</th>
                            <th className="px-2 py-1 text-xs text-left text-gray-500">Susut</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((stockEntry) => (
                            // Iterate over the nested items
                            stockEntry.items.map((item, itemIndex) => (
                                <StockRowDetails
                                    key={`${stockEntry.id}-${itemIndex}`}
                                    item={item}
                                    stockEntry={stockEntry}
                                    itemIndex={itemIndex}
                                    totalItems={stockEntry.items.length}
                                    onSort={() => onSortItem(stockEntry.id, itemIndex)}
                                    onEditStock={onEditStock}
                                    onDeleteStock={onDeleteStock}
                                />
                            ))
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination/Show Entries */}
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className='mr-2'>Show</span>
                    <select className='border rounded-md px-2 py-1'>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>
                    <span>entries</span>
                </div>
                <div className="text-sm text-gray-600">
                    Showing 1 to {data.length} of {data.length} entries
                </div>
            </div>
        </div>
    );
};

export default StockTable;