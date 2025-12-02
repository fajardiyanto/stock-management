import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { SubmitSaleRequest, BuyerOption } from '../../types/sales';

interface SaleInfoSectionProps {
    formData: SubmitSaleRequest;
    buyerList: BuyerOption[];
    onFormChange: (field: keyof SubmitSaleRequest, value: string | boolean) => void;
}

const SaleInfoSection: React.FC<SaleInfoSectionProps> = ({ formData, buyerList, onFormChange }) => {
    return (
        <div className="border border-gray-200 p-6 rounded-xl space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">Informasi Dasar</h3>
            <p className="text-gray-500 text-sm">Isi informasi dasar penjualan</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pembeli</label>
                    <div className="relative">
                        <select
                            value={formData.customer_id}
                            onChange={(e) => onFormChange('customer_id', e.target.value)}
                            className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                        >
                            {buyerList.map(b => (
                                <option key={b.uuid} value={b.uuid} disabled={b.uuid === ''}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu Penjualan</label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={formData.sales_date}
                            onChange={(e) => onFormChange('sales_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none pr-8"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Tanggal dan waktu transaksi penjualan</p>
                </div>

                <div className="flex items-center space-x-2 md:col-span-2">
                    <input
                        id="jual_luar"
                        type="checkbox"
                        checked={formData.export_sale}
                        onChange={(e) => onFormChange('export_sale', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="jual_luar" className="text-sm font-medium text-gray-700">
                        Jual Luar
                    </label>
                    <p className="text-xs text-gray-500">Centang jika ini adalah penjualan jual luar (tanpa menggunakan fiber)</p>
                </div>
            </div>
        </div>
    );
};

export default SaleInfoSection;