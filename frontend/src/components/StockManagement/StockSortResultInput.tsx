import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { StockSortRequest } from '../../types/stock';
import { formatRupiah } from '../../utils/FormatRupiah';

interface StockSortResultInputProps {
    index: number;
    result: StockSortRequest;
    onChange: (index: number, field: keyof StockSortRequest, value: string | number | boolean) => void;
    onRemove: (uuidToRemove: string) => void;
    canRemove: boolean;
}

const cleanNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
};

const StockSortResultInput: React.FC<StockSortResultInputProps> = ({ index, result, onChange, onRemove, canRemove }) => {
    const [formattedPrice, setFormattedPrice] = useState<string>(formatRupiah(result.price_per_kilogram));

    useEffect(() => {
        setFormattedPrice(formatRupiah(result.price_per_kilogram));
    }, [result.price_per_kilogram]);


    const handleValueChange = (field: keyof StockSortRequest, value: string) => {
        const parsedValue = (field === 'sorted_item_name') ? value : parseFloat(value) || 0;
        onChange(index, field, parsedValue);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const cleanedValue = cleanNumber(rawValue);
        setFormattedPrice(rawValue);
        onChange(index, 'price_per_kilogram', cleanedValue);
    };

    const handlePriceBlur = () => {
        setFormattedPrice(formatRupiah(result.price_per_kilogram));
    };

    const handlePriceFocus = () => {
        if (result.price_per_kilogram !== 0) {
            setFormattedPrice(String(result.price_per_kilogram));
        }
    };

    return (
        <div className="border border-gray-200 p-4 rounded-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h4 className="text-md font-bold text-gray-700">Hasil Sortir #{index + 1}</h4>
                <button
                    type="button"
                    onClick={() => onRemove(result.uuid || '')}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30 transition p-1"
                    title="Hapus Hasil Sortir"
                    disabled={!canRemove}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Hasil</label>
                    <input
                        type="text"
                        value={result.sorted_item_name}
                        onChange={(e) => handleValueChange('sorted_item_name', e.target.value)}
                        placeholder="Nama hasil sortir"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                    <input
                        type="number"
                        value={result.weight || ''}
                        onChange={(e) => handleValueChange('weight', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga per kg</label>
                    <input
                        type="text"
                        value={formattedPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={result.is_shrinkage}
                    />
                </div>

                <div className="md:col-span-2 flex items-center justify-between h-[42px] mt-4 md:mt-0">
                    <span className="text-sm font-medium text-gray-700">Susut</span>
                    <button
                        type="button"
                        onClick={() => onChange(index, 'is_shrinkage', !result.is_shrinkage)}
                        className={`w-16 h-8 rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 ${result.is_shrinkage ? 'bg-red-500 justify-end' : 'bg-gray-300 justify-start'}`}
                        title={result.is_shrinkage ? "Set as marketable" : "Set as shrinkage"}
                    >
                        <span className={`w-7 h-7 bg-white rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center`}>
                            {result.is_shrinkage && <Check size={16} className="text-red-500" />}
                        </span>
                    </button>
                    <button type="button" className="ml-4 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                        {!result.is_shrinkage ? "Simpan Dijual" : "Tidak Dijual"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockSortResultInput;