import React from 'react';
import { ChevronRight, Edit2, Trash2 } from 'lucide-react';
import StockRowSusut from './StockRowSusut';
import { Stock, StockItem } from "../../types/stock";
import { formatRupiah } from '../../utils/FormatRupiah';

interface StockRowDetailsProps {
    item: StockItem;
    stockEntry: Stock;
    itemIndex: number;
    totalItems: number;
    onSort: () => void;
    onEditStock: (stockId: string) => void;
    onDeleteStock: (stockId: string) => void;
}

const StockRowDetails: React.FC<StockRowDetailsProps> = ({
    item,
    stockEntry,
    itemIndex,
    totalItems,
    onSort,
    onEditStock,
    onDeleteStock
}) => {

    const isFirstRow = itemIndex === 0;

    const isSorted = item.sortirName !== undefined;
    const mockSortirName = item.sortirName || 'ikan A 90';
    const mockSortirHarga = item.sortirPricePerKilogram || 10;
    const mockSortirBerat = item.sortirWeightAvailable || 90;
    const mockSortirTotal = item.sortirTotal || 900;
    const isSortAvailable = true;

    const mockSusutBerat = item.shrinkage !== undefined ? item.shrinkage : 5;
    const mockSusutTotal = item.shrinkageTotal !== undefined ? item.shrinkageTotal : 0;
    const handleToggleSusut = () => {
        console.log("Toggle Susut status");
    };

    const rowClass = isFirstRow ? 'border-t-2 border-gray-300' : '';

    return (
        <React.Fragment>
            <tr className={`bg-white hover:bg-gray-50 transition ${rowClass}`}>
                {isFirstRow && (
                    <>
                        <td rowSpan={totalItems} className="px-6 py-4 text-sm font-bold text-gray-900 align-middle">
                            {stockEntry.id}
                        </td>
                        <td rowSpan={totalItems} className="px-6 py-4 text-sm text-gray-600 align-middle">
                            {stockEntry.supplier}
                        </td>
                        <td rowSpan={totalItems} className="px-6 py-4 text-sm text-gray-500 align-middle">
                            {stockEntry.createdDate}
                        </td>
                        <td rowSpan={totalItems} className="px-6 py-4 whitespace-nowrap align-middle">
                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {stockEntry.ageInDays} Hari
                            </span>
                        </td>
                    </>
                )}


                {/* Items Group */}
                <td className="px-6 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">{item.name}</td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">{item.weight} <span className='text-xs text-gray-500'>Kg</span></td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">{formatRupiah(item.pricePerKilogram)}</td>
                <td className="px-2 py-4 text-sm text-gray-900 font-bold whitespace-nowrap">{formatRupiah(item.total)}</td>

                {/* Sortir Group */}
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">{isSortAvailable ? mockSortirName : '-'}</td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">{isSortAvailable ? formatRupiah(mockSortirHarga) : '-'}</td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">{isSortAvailable ? mockSortirBerat : '-'} <span className='text-xs text-gray-500'>Kg</span></td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">{isSortAvailable ? formatRupiah(mockSortirTotal) : '-'}</td>
                <td className="px-2 py-4 text-sm text-gray-700 whitespace-nowrap">{isSortAvailable ? 'Tidak' : '-'}</td>


                {/* Sortir Item Button Column */}
                <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                        onClick={onSort}
                        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition float-right border border-gray-300 rounded-lg px-3 py-1 bg-white hover:bg-gray-50"
                    >
                        <ChevronRight size={16} />
                        Sortir
                    </button>
                </td>

                {/* Action Column (Only rendered on the FIRST row) */}
                {isFirstRow && (
                    <td rowSpan={totalItems} className="px-6 py-4 text-right whitespace-nowrap align-middle">
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => onEditStock(stockEntry.id)}
                                className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-blue-600 transition"
                                title="Edit Stock"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => onDeleteStock(stockEntry.id)}
                                className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-red-600 transition"
                                title="Delete Stock"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                )}
            </tr>

            {/* Only shown if sorted */}
            {isSorted && (
                <StockRowSusut
                    susutBerat={mockSusutBerat}
                    susutTotal={mockSusutTotal}
                    onToggleSusut={handleToggleSusut}
                />
            )}

        </React.Fragment>
    );
};

export default StockRowDetails;