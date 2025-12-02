import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Trash2 } from 'lucide-react';
import { SelectedSaleItem } from '../../types/sales';
import { StockSortResponse } from '../../types/stock';
import { formatRupiah } from '../../utils/FormatRupiah';
import { cleanNumber } from '../../utils/CleanNumber';

interface ItemSelectionSectionProps {
    selectedItems: SelectedSaleItem[];
    itemSortirOptions: StockSortResponse[];
    onAddItem: (item: SelectedSaleItem) => void;
    onRemoveItem: (tempId: string) => void;
}


const ItemSelectionSection: React.FC<ItemSelectionSectionProps> = ({ selectedItems, itemSortirOptions, onAddItem, onRemoveItem }) => {
    const [selectedSortirId, setSelectedSortirId] = useState('');
    const [sortirSearchTerm, setSortirSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [weight, setWeight] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState('');

    const currentItem = itemSortirOptions.find(item => item.uuid === selectedSortirId);
    const maxWeight = currentItem?.current_weight || 0;
    const currentWeight = cleanNumber(weight);
    const currentPrice = cleanNumber(price);

    const filteredSortirItems = itemSortirOptions.filter(item =>
        item.sorted_item_name.toLowerCase().includes(sortirSearchTerm.toLowerCase())
    );

    useEffect(() => {
        if (currentItem) {
            setPrice(String(currentItem.price_per_kilogram));
        } else {
            setPrice('');
        }
    }, [currentItem]);

    const handleSelectItem = (item: StockSortResponse) => {
        setSelectedSortirId(item.uuid);
        setSortirSearchTerm(item.sorted_item_name);
        setIsDropdownOpen(false);
    };


    const handleAddItem = () => {
        setError('');
        if (!currentItem || currentWeight <= 0 || currentWeight > maxWeight) {
            setError(`Pilih item sortir dan masukkan berat yang valid (maks. ${maxWeight} kg).`);
            return;
        }

        const newItem: SelectedSaleItem = {
            tempId: Math.random().toString(16).slice(2),
            id: currentItem.id,
            stock_sort_id: currentItem.uuid,
            stock_code: currentItem.stock_code,
            item_name: currentItem.sorted_item_name,
            weight: currentWeight,
            price_per_kilogram: currentPrice,
            total_amount: currentWeight * currentPrice,
        };

        onAddItem(newItem);
        setSelectedSortirId('');
        setSortirSearchTerm('');
        setWeight('');
        setPrice('');
    };

    return (
        <div className="border border-gray-200 p-6 rounded-xl space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">Item Penjualan</h3>
            <p className="text-gray-500 text-sm">Pilih item dari hasil sortir untuk dijual</p>
            <div className="border border-gray-300 p-4 rounded-xl space-y-4">
                <h4 className="text-md font-semibold text-gray-700">Tambah Item</h4>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="grid grid-cols-1">
                    <div className="mb-4 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Sortir</label>
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={sortirSearchTerm}
                                onChange={(e) => {
                                    setSortirSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onClick={() => setIsDropdownOpen(true)}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="Pilih item..."
                                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                            />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />

                            {isDropdownOpen && (
                                <ul className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                                    {filteredSortirItems.length === 0 ? (
                                        <li className="px-3 py-2 text-gray-500 text-sm">Tidak ditemukan.</li>
                                    ) : (
                                        filteredSortirItems.map(item => (
                                            <li
                                                key={item.uuid}
                                                onClick={() => handleSelectItem(item)}
                                                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition ${item.uuid === selectedSortirId ? 'bg-blue-100' : ''
                                                    }`}
                                            >
                                                <p className="text-sm font-medium text-gray-900">
                                                    {item.stock_code} - {item.sorted_item_name}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    Tersedia {item.current_weight} kg @ {formatRupiah(item.price_per_kilogram)}/kg
                                                </p>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            max={maxWeight}
                            min="0"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            disabled={!currentItem || maxWeight === 0}
                        />
                        <p className="text-xs text-gray-500 mt-1">Max: {maxWeight} kg</p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga per kg</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            disabled={!currentItem}
                        />
                    </div>

                    <div className="flex justify-between items-center h-[42px]">
                        <p className="text-lg font-bold text-gray-800">Total:</p>
                        <p className="text-lg font-bold text-gray-800">{formatRupiah(currentWeight * currentPrice)}</p>
                    </div>
                </div>

                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
                        disabled={!currentItem || currentWeight <= 0 || currentWeight > maxWeight}
                    >
                        <Plus size={20} /> Tambah
                    </button>
                </div>
            </div>

            <h4 className="text-md font-semibold text-gray-700 pt-4">Item Terpilih</h4>
            <p className="text-gray-500 text-sm pb-2">Daftar item yang akan ditambahkan ke penjualan</p>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Berat (kg)</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga/kg</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {selectedItems.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">Belum ada item terpilih.</td></tr>
                        ) : (
                            selectedItems.map(item => (
                                <tr key={item.tempId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                        {item.stock_code} - {item.item_name}
                                        <p className="text-xs text-gray-400">ID: {item.id}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.weight}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatRupiah(item.price_per_kilogram)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{formatRupiah(item.total_amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button onClick={() => onRemoveItem(item.tempId)} className="text-red-500 hover:text-red-700 p-1 rounded-full transition">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ItemSelectionSection;