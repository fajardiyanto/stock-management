import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { SelectedAddOn } from '../../types/sales';
import { cleanNumber } from '../../utils/CleanNumber';
import { formatRupiah } from '../../utils/FormatRupiah';

interface AddOnSectionProps {
    selectedAddOns: SelectedAddOn[];
    onAddAddOn: (addOn: SelectedAddOn) => void;
    onRemoveAddOn: (tempId: string) => void;
}

const AddOnSection: React.FC<AddOnSectionProps> = ({ selectedAddOns, onAddAddOn, onRemoveAddOn }) => {
    const [nameAddon, setNameAddon] = useState('');
    const [priceAddon, setPriceAddon] = useState('');
    // const [formattedPrice, setFormattedPrice] = useState<string>(formatRupiah(selectedAddOns.length > 0 ? selectedAddOns[0].price : 0));

    const currentPrice = cleanNumber(priceAddon);

    const handleAddAddOn = () => {
        if (!nameAddon || currentPrice <= 0) return;

        const newAddOn: SelectedAddOn = {
            tempId: Math.random().toString(16).slice(2),
            name: nameAddon,
            price: currentPrice,
            total_price: currentPrice,
        };

        onAddAddOn(newAddOn);
        setNameAddon('');
        setPriceAddon('');
    };

    return (
        <div className="border border-gray-200 p-6 rounded-xl space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">AddOns</h3>
            <p className="text-gray-500 text-sm">Tambahkan layanan, material, atau biaya tambahan</p>

            <div className="border border-gray-300 p-4 rounded-xl space-y-4">
                <h4 className="text-md font-semibold text-gray-700">Tambah AddOn</h4>

                <div className="grid grid-cols-1 gap-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama AddOn</label>
                        <input
                            type="text"
                            value={nameAddon}
                            onChange={(e) => setNameAddon(e.target.value)}
                            placeholder="Contoh: Ongkos Kirim"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={priceAddon}
                                onChange={(e) => setPriceAddon(e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                title="Clear price"
                            />
                            <X className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" size={16}
                                onClick={() => setPriceAddon('0')} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-start pt-2">
                    <button
                        type="button"
                        onClick={handleAddAddOn}
                        className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition"
                        disabled={!nameAddon || currentPrice <= 0}
                    >
                        <Plus size={20} /> Tambah
                    </button>
                </div>
            </div>

            <h4 className="text-md font-semibold text-gray-700 pt-4">AddOns Terpilih</h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {selectedAddOns.length === 0 ? (
                            <tr><td colSpan={3} className="py-4 text-center text-gray-500">Belum ada add-on terpilih.</td></tr>
                        ) : (
                            selectedAddOns.map(addon => (
                                <tr key={addon.tempId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{addon.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatRupiah(addon.price)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button onClick={() => onRemoveAddOn(addon.tempId)} className="text-red-500 hover:text-red-700 p-1 rounded-full transition">
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

export default AddOnSection;