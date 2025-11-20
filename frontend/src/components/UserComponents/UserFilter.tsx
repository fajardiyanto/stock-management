import React from 'react';
import { Search, X } from 'lucide-react';

interface UserFilterProps {
    searchName: string;
    setSearchName: (name: string) => void;
    searchPhone: string;
    setSearchPhone: (phone: string) => void;
    onSearch: () => void;
    onClear: () => void;
}

const UserFilter: React.FC<UserFilterProps> = ({
    searchName,
    setSearchName,
    searchPhone,
    setSearchPhone,
    onSearch,
    onClear
}) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-700 border-b pb-3">Search & Filter</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by phone..."
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>

                <div className="flex gap-4 col-span-1 md:col-span-1 lg:col-span-2">
                    <button
                        onClick={onSearch}
                        className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={onClear}
                        className="flex items-center justify-center gap-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition shadow-sm"
                    >
                        <X size={18} />
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserFilter;