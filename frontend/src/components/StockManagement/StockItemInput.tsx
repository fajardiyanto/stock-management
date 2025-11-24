import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CreateStockItem } from '../../types/stock';

interface StockItemInputProps {
    index: number;
    item: CreateStockItem;
    onChange: (index: number, field: keyof CreateStockItem, value: string | number) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}

const formatRupiahInput = (amount: number): string => {
    if (amount === 0) return '';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
};

const cleanNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
};

const StockItemInput: React.FC<StockItemInputProps> = ({ index, item, onChange, onRemove, canRemove }) => {

    const [formattedPrice, setFormattedPrice] = useState<string>(formatRupiahInput(item.price_per_kilogram));

    const handleValueChange = (field: keyof CreateStockItem, value: string) => {
        const parsedValue = (field === 'item_name') ? value : parseFloat(value) || 0;
        onChange(index, field, parsedValue);
    };

    const handleClearNumeric = (field: 'weight' | 'price_per_kilogram') => {
        onChange(index, field, 0);
        if (field === 'price_per_kilogram') {
            setFormattedPrice('');
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const cleanedValue = cleanNumber(rawValue);

        setFormattedPrice(rawValue);

        onChange(index, 'price_per_kilogram', cleanedValue);
    };

    const handlePriceBlur = () => {
        setFormattedPrice(formatRupiahInput(item.price_per_kilogram));
    };

    const handlePriceFocus = () => {
        if (item.price_per_kilogram !== 0) {
            setFormattedPrice(String(item.price_per_kilogram));
        }
    };

    const formatRupiahDisplay = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="border border-gray-200 p-4 rounded-xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h4 className="text-md font-semibold text-gray-700">Item #{index + 1}</h4>
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30 transition p-1"
                    title="Remove Item"
                    disabled={!canRemove}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                    <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => handleValueChange('item_name', e.target.value)}
                        placeholder="Nama item"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={item.weight === 0 ? '' : item.weight}
                            onChange={(e) => handleValueChange('weight', e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => handleClearNumeric('weight')}
                            title="Clear weight input"
                            className="absolute right-0 top-0 h-full flex items-center justify-center p-2 text-gray-400 hover:text-red-600 transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga per kg</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formattedPrice}
                            onChange={handlePriceChange}
                            onFocus={handlePriceFocus}
                            onBlur={handlePriceBlur}
                            placeholder="0"
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => handleClearNumeric('price_per_kilogram')}
                            title="Clear price input"
                            className="absolute right-0 top-0 h-full flex items-center justify-center p-2 text-gray-400 hover:text-red-600 transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="self-center">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
                    <p className="font-semibold text-gray-900 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {formatRupiahDisplay(item.weight * item.price_per_kilogram)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StockItemInput;