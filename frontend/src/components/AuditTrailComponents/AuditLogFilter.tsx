import React from "react";
import { Search, ChevronDown, Calendar } from "lucide-react";
import { METHOD_OPTIONS, STATUS_CODE_OPTIONS } from "../../types/auditLog";

interface AuditLogFilterProps {
    searchUsername: string;
    setSearchUsername: (username: string) => void;
    searchAction: string;
    setSearchAction: (action: string) => void;
    methodFilter: string;
    setMethodFilter: (method: string) => void;
    statusCodeFilter: string;
    setStatusCodeFilter: (status: string) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    onSearch: () => void;
    onReset: () => void;
}

const AuditLogFilter: React.FC<AuditLogFilterProps> = ({
    searchUsername,
    setSearchUsername,
    searchAction,
    setSearchAction,
    methodFilter,
    setMethodFilter,
    statusCodeFilter,
    setStatusCodeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onSearch,
    onReset,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Username Search */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                    </label>
                    <Search
                        className="absolute left-3 top-11 transform -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search username..."
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && onSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>

                {/* Action Search */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action
                    </label>
                    <input
                        type="text"
                        placeholder="Search action..."
                        value={searchAction}
                        onChange={(e) => setSearchAction(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && onSearch()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>

                {/* Method Filter */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        HTTP Method
                    </label>
                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                    >
                        {METHOD_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Code Filter */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status Code
                    </label>
                    <select
                        value={statusCodeFilter}
                        onChange={(e) => setStatusCodeFilter(e.target.value)}
                        className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                    >
                        {STATUS_CODE_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                    />
                </div>

                {/* Start Date */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                    </label>
                    <Calendar
                        className="absolute left-3 top-11 transform -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="date"
                        value={startDate}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>

                {/* End Date */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                    </label>
                    <Calendar
                        className="absolute left-3 top-11 transform -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={onReset}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                    Reset
                </button>
                <button
                    onClick={onSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    Search
                </button>
            </div>
        </div>
    );
};

export default AuditLogFilter;
