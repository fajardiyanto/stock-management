import React from 'react';
import { formatRupiah } from '../../utils/FormatRupiah';
import { StockSortResponse } from '../../types/purchase';

interface StockRowSusutProps {
    shrinkageItem: StockSortResponse;
    onToggleSusut: () => void;
}

const StockRowSusut: React.FC<StockRowSusutProps> = ({ shrinkageItem, onToggleSusut }) => {
    const weightShrinkage = shrinkageItem.weight;
    const totalShrinkage = shrinkageItem.total_cost;
    const currentWeightShrinkage = shrinkageItem.current_weight;

    return (
        <tr className="bg-white border-t border-gray-100">
            <td colSpan={8}></td>

            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-center">
                susut
            </td>
            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-center">
                {formatRupiah(shrinkageItem.price_per_kilogram)}
            </td>
            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-center">
                {weightShrinkage}
            </td>
            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-center">
                {currentWeightShrinkage}
            </td>
            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-center">
                {formatRupiah(totalShrinkage)}
            </td>
            <td className="px-2 py-2 text-sm text-center">
                <button
                    onClick={onToggleSusut}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${shrinkageItem.is_shrinkage ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {shrinkageItem.is_shrinkage ? 'Ya' : 'Tidak'}
                </button>
            </td>
        </tr>
    );
}

export default StockRowSusut;