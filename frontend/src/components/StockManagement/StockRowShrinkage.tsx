import React, { useState } from 'react';
import { formatRupiah } from '../../utils/FormatRupiah';
import { StockSortResponse } from '../../types/stock';

interface StockRowShrinkageProps {
    shrinkageItem: StockSortResponse;
    onToggleShrinkage: () => void;
}

const StockRowShrinkage: React.FC<StockRowShrinkageProps> = ({ shrinkageItem, onToggleShrinkage }) => {
    const [showDeleteTooltip, setShowDeleteTooltip] = useState(false);

    const weightShrinkage = shrinkageItem.weight;
    const totalShrinkage = shrinkageItem.total_cost;

    return (
        <tr className="bg-red-50 border-t border-red-100">
            <td className="px-2 py-3 text-red-600 font-bold text-sm text-center">
                susut
            </td>
            <td className="px-2 py-3 text-red-600 font-semibold text-sm text-center">
                {formatRupiah(shrinkageItem.price_per_kilogram)}
            </td>
            <td className="px-2 py-3 text-red-600 font-bold text-sm text-center">
                {weightShrinkage}
            </td>
            <td className="px-2 py-3 text-gray-400 font-semibold text-sm text-center">
                -
            </td>
            <td className="px-2 py-3 text-red-600 font-bold text-sm text-center border-r border-gray-200">
                {formatRupiah(totalShrinkage)}
            </td>
            <td className="px-2 py-3 text-sm text-center">
                <div className="relative inline-block">
                    <button
                        onClick={onToggleShrinkage}
                        onMouseEnter={() => setShowDeleteTooltip(true)}
                        onMouseLeave={() => setShowDeleteTooltip(false)}
                        className="px-4 py-1.5 text-xs font-bold rounded-lg transition bg-red-600 text-white hover:bg-red-700"
                    >
                        Ya
                    </button>
                    {showDeleteTooltip && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            Susut
                        </div>
                    )}
                </div>
            </td>
            <td className="border-l border-gray-200"></td>
            <td className="border-l border-gray-200"></td>
        </tr>
    );
}

export default StockRowShrinkage;