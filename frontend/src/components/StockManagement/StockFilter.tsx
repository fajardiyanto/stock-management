import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, X } from 'lucide-react';

const MOCK_SUPPLIERS = ["Semua Supplier", "PT. Nelayan Nusantara", "CV. Sumber Laut Jaya"];
const MOCK_AGE = ["Semua Umur", "1 Hari", "3 Hari", "7 Hari"];

interface StockFilterProps {
    onSearch: (filters: any) => void;
    onReset: () => void;
}

const StockFilter: React.FC<StockFilterProps> = ({ onSearch, onReset }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [supplier, setSupplier] = useState(MOCK_SUPPLIERS[0]);
    const [date, setDate] = useState('');
    const [stockAge, setStockAge] = useState(MOCK_AGE[0]);

    const handleSearch = () => {
        onSearch({ searchQuery, supplier, date, stockAge });
    };

    const handleReset = () => {
        setSearchQuery('');
        setSupplier(MOCK_SUPPLIERS[0]);
        setDate('');
        setStockAge(MOCK_AGE[0]);
        onReset();
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 border-b pb-3">
                <span className="text-blue-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3.5H2l8 9.46V20.5l4 2V12.96z" /></svg>
                </span>
                <span>Filter</span>
                <span className="text-gray-500 font-normal ml-2">Filter data stok berdasarkan kriteria tertentu</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* (Search Input) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pencarian</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari ID Stok"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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

                {/* Tanggal (Date) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                </div>

                {/* Umur Stok (Stock Age) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Umur Stok</label>
                    <div className="relative">
                        <select
                            value={stockAge}
                            onChange={(e) => setStockAge(e.target.value)}
                            className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8"
                        >
                            {MOCK_AGE.map(a => <option key={a} value={a}>{a}</option>)}
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

export default StockFilter;