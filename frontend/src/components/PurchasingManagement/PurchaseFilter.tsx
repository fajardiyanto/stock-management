import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, X } from 'lucide-react';

const MOCK_SUPPLIERS = ["Semua Supplier", "PT. Melayani Nusantara", "CV. Sumber Laut Jaya", "UD. Laut Biru"];
const MOCK_STATUS = ["Semua Status", "Lunas", "Sebagian", "Belum Dibayar"];

interface PurchaseFilterProps {
    onSearch: (filters: any) => void;
    onReset: () => void;
}

const PurchaseFilter: React.FC<PurchaseFilterProps> = ({ onSearch, onReset }) => {
    const [name, setName] = useState('');
    const [supplier, setSupplier] = useState(MOCK_SUPPLIERS[0]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentStatus, setPaymentStatus] = useState(MOCK_STATUS[0]);
    const [paymentTerm, setPaymentTerm] = useState('Semua Keterlambatan');

    const handleSearch = () => {
        onSearch({ name, supplier, startDate, endDate, paymentStatus, paymentTerm });
    };

    const handleReset = () => {
        setName('');
        setSupplier(MOCK_SUPPLIERS[0]);
        setStartDate('');
        setEndDate('');
        setPaymentStatus(MOCK_STATUS[0]);
        setPaymentTerm('Semua Keterlambatan');
        onReset();
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 border-b pb-3">
                <span className="text-blue-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3.5H2l8 9.46V20.5l4 2V12.96z" /></svg>
                </span>
                <span>FILTER</span>
                <span className="text-gray-500 font-normal ml-2">Filter data berdasarkan pembelian, tanggal bayar, dan kriteria lainnya</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pencarian (Search Input) */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pencarian</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="ID atau nama supplier"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>

                {/* Supplier Dropdown */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Supplier</label>
                    <div className="relative">
                        <select
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8"
                        >
                            {MOCK_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>

                {/* Tanggal Pembelian (Start Date) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Pembelian</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                </div>

                {/* Tanggal Bayar (End Date) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Bayar</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                </div>

                {/* Keterlambatan Bayar (Payment Term) 
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Keterlambatan Bayar</label>
                    <div className="relative">
                        <select
                            value={paymentTerm}
                            onChange={(e) => setPaymentTerm(e.target.value)}
                            className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8"
                        >
                            <option>Semua Keterlambatan</option>
                            <option>Tertunda</option>
                            <option>Tepat Waktu</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div> */}

                {/* Status Pembayaran (Payment Status) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status Pembayaran</label>
                    <div className="relative">
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8"
                        >
                            {MOCK_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleReset}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition"
                >
                    <X size={16} className="mr-1" />
                    Reset Filter
                </button>
            </div>
        </div>
    );
};

export default PurchaseFilter;