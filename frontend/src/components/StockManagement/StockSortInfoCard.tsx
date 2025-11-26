import React from 'react';
import { StockSortInfoCardResponse } from '../../types/stock';

interface StockItemInfoCardProps {
    info: StockSortInfoCardResponse;
    formatRupiah: (amount: number) => string;
}

const StockSortInfoCard: React.FC<StockItemInfoCardProps> = ({ info, formatRupiah }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Informasi Item Stok</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <InfoRow label="Stock ID" value={info?.stock_code} isBold />
            <InfoRow label="Nama Item" value={info?.stock_item?.item_name} isBold />

            <InfoRow label="Berat Total" value={`${info?.stock_item?.weight} kg`} />
            <InfoRow label="Harga per kg" value={formatRupiah(info?.stock_item?.price_per_kilogram)} />
        </div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string; isBold?: boolean; isWarning?: boolean }> = ({ label, value, isBold, isWarning }) => (
    <div>
        <p className="text-gray-500">{label}</p>
        <p className={`mt-0.5 ${isBold ? 'font-bold text-gray-900' : 'text-gray-700'} ${isWarning ? 'text-red-500 font-bold' : ''}`}>
            {value}
        </p>
    </div>
);

export default StockSortInfoCard;