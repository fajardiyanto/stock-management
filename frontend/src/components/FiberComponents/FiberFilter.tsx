import React from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { STATUS_OPTIONS } from '../../types/fiber';

interface FiberFilterProps {
    searchName: string;
    setSearchName: (name: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    onSearch: () => void;
    onOpenAddModal: () => void;
}

const FiberFilter: React.FC<FiberFilterProps> = ({
    searchName,
    setSearchName,
    statusFilter,
    setStatusFilter,
    onSearch,
    onOpenAddModal,
}) => {
    return (
        <div className="flex justify-between items-end p-4 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex space-x-4 w-full max-w-lg">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search nama fiber..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>

                <div className="relative flex-shrink-0 w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-lg"
            >
                <Plus size={18} /> Tambah Fiber
            </button>
        </div>
    );
};

export default FiberFilter;