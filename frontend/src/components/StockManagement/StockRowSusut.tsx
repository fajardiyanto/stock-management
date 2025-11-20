import React from 'react';
import { formatRupiah } from '../../utils/FormatRupiah';

interface StockRowSusutProps {
    susutBerat: number;
    susutTotal: number;
    onToggleSusut: () => void;
}

const StockRowSusut: React.FC<StockRowSusutProps> = ({ susutBerat, susutTotal, onToggleSusut }) => {
    const isNo = susutBerat === 0;

    return (
        <tr className="bg-white border-t border-gray-100">
            {/* Blank columns corresponding to ID, Supplier, Tgl, Umur, Items (Nama, Berat, Harga, Total) */}
            {/* The 5 here is for ID, Sup, Tgl, Umur, and the first "Nama" column of Items, as Susut starts under the second "Nama" of Sortir */}
            <td colSpan={5}></td>

            {/* Susut Row Content (aligned under Sortir columns) */}
            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-center">
                susut
            </td>
            {/* Sortir Nama */}
            <td className="px-2 py-2 text-red-600 font-semibold text-sm">
                {formatRupiah(0)}
            </td>
            {/* Sortir Harga (per kg) */}
            <td className="px-2 py-2 text-red-600 font-semibold text-sm">
                {susutBerat}
            </td>
            {/* Sortir Berat Tersedia (kg) */}
            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-right">
                -
            </td>
            {/* Sortir Total */}
            <td className="px-2 py-2 text-red-600 font-semibold text-sm text-right">
                {formatRupiah(susutTotal)}
            </td>
            {/* Susut */}
            <td className="px-2 py-2 text-sm text-right">
                <button
                    onClick={onToggleSusut}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${isNo ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {isNo ? 'Ya' : 'Tidak'}
                </button>
            </td>

            {/* Blank column for "Sortir Item" and "Aksi" */}
            <td colSpan={2} className="px-6 py-2"></td>
        </tr>
    );
}

export default StockRowSusut;