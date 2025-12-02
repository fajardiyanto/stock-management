import React, { useState } from 'react';
import { Search, ChevronDown, Calendar } from 'lucide-react';
import { SaleFilter } from '../../types/sales';
import { PaymentStatus, MOCK_FILTER_STATUS_OPTIONS } from '../../types/payment';

interface SalesFilterProps {
    onSearch: (filters: SaleFilter) => void;
    onReset: () => void;
    onAddSale: () => void;
}

const SalesFilter: React.FC<SalesFilterProps> = ({ onSearch, onReset, onAddSale }) => {
    const [search, setSearch] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [salesDate, setSalesDate] = useState('');

    const handleSearch = () => {
        onSearch({
            search: search,
            payment_status: paymentStatus as PaymentStatus,
            created_at: createdAt,
            sales_date: salesDate,
        });
    };

    const handleReset = () => {
        setSearch('');
        setPaymentStatus('');
        setCreatedAt('');
        setSalesDate('');
        onReset();
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 border-b pb-3">
                <span className="text-blue-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3.5H2l8 9.46V20.5l4 2V12.96z" /></svg>
                </span>
                <span>Filter</span>
                <span className="text-gray-500 font-normal ml-2">Filter data penjualan berdasarkan kriteria tertentu</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pencarian</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="ID atau nama pembeli"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pembeli</label>
                    <div className="relative">
                        <select className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer">
                            <option value="">Semua Pembeli</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Dibuat</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={createdAt}
                            onChange={(e) => setCreatedAt(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Pembayaran</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={salesDate}
                            onChange={(e) => setSalesDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status Pembayaran</label>
                    <div className="relative">
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                        >
                            {MOCK_FILTER_STATUS_OPTIONS.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleReset}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800 transition px-4 py-2 border border-gray-300 rounded-lg"
                >
                    Reset Filter
                </button>
            </div>
        </div>
    );
};

export default SalesFilter;