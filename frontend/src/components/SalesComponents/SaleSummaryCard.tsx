import React from 'react';
import { formatRupiah } from '../../utils/FormatRupiah';

interface SaleSummaryCardProps {
    totalItem: number;
    totalAddon: number;
    totalFiber: number;
    total: number;
}

const SummaryRow: React.FC<{ label: string; value: string; isTotal?: boolean }> = ({ label, value, isTotal }) => (
    <div className={`flex justify-between py-2 ${isTotal ? 'border-t-2 border-gray-300 pt-3' : ''}`}>
        <span className={`text-sm ${isTotal ? 'font-bold text-lg' : 'text-gray-700'}`}>
            {label}
        </span>
        <span className={`text-sm ${isTotal ? 'font-bold text-lg text-gray-900' : 'text-gray-800'}`}>
            {value}
        </span>
    </div>
);

const SaleSummaryCard: React.FC<SaleSummaryCardProps> = ({ totalItem, totalAddon, totalFiber, total }) => {
    return (
        <div className="border border-gray-200 p-6 rounded-xl shadow-lg w-full max-w-sm ml-auto bg-white">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-3">Ringkasan</h3>
            <p className="text-gray-500 text-sm mb-4">Ringkasan total penjualan</p>

            <SummaryRow label="Total Item" value={formatRupiah(totalItem)} />
            <SummaryRow label="Total AddOn" value={formatRupiah(totalAddon)} />
            <SummaryRow label="Total Fiber" value={formatRupiah(totalFiber)} />

            <SummaryRow label="Total:" value={formatRupiah(total)} isTotal />
        </div>
    );
};

export default SaleSummaryCard;