import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronDown, Calendar, X } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { User } from "../../types/user";
import { authService } from "../../services/authService";
import { StockEntriesFilters } from "../../types/stock";
import { AGE_FILTER_OPTIONS } from "../../constants/constants";

interface StockFilterProps {
    onSearch: (filters: StockEntriesFilters) => void;
    onReset: () => void;
}

const StockFilter: React.FC<StockFilterProps> = ({ onSearch, onReset }) => {
    const [supplierId, setSupplierId] = useState("");
    const [date, setDate] = useState("");
    const [ageInDayKey, setAgeInDayKey] = useState(AGE_FILTER_OPTIONS[0].key);
    const [supplierOptions, setSupplierOptions] = useState<User[]>([]);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [keyword, setKeyword] = useState("");

    const { showToast } = useToast();

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authService.getListUserRoles("supplier");
            if (response.status_code === 200) {
                const defaultSupplier: any = {
                    uuid: "",
                    name: "Semua Supplier",
                };
                setSupplierOptions([defaultSupplier, ...response.data]);
            } else {
                setError(response.message || "Failed to fetch supplier data");
                showToast(
                    response.message || "Failed to fetch supplier data",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch supplier data. Please try again");
            showToast(
                "Failed to fetch supplier data. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSearch = () => {
        setIsFiltering(true);
        const filters: StockEntriesFilters = {
            supplier_id: supplierId || undefined,
            purchase_date: date || undefined,
            age_in_day: ageInDayKey === "0" ? undefined : ageInDayKey,
            keyword: keyword || undefined,
        };

        onSearch(filters);
        setIsFiltering(false);
    };

    const handleReset = () => {
        setSupplierId("");
        setDate("");
        setAgeInDayKey("0");
        setKeyword("");
        onReset();
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 border-b pb-3">
                <span className="text-blue-600">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M22 3.5H2l8 9.46V20.5l4 2V12.96z" />
                    </svg>
                </span>
                <span>Filter</span>
                <span className="text-gray-500 font-normal ml-2">
                    Filter data stok berdasarkan kriteria tertentu
                </span>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Pencarian
                    </label>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Cari ID Stok atau Nama Item"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            onKeyPress={handleKeyPress}
                            disabled={isFiltering || loading}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Supplier
                    </label>
                    <div className="relative">
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8"
                            disabled={isFiltering || loading}
                        >
                            {supplierOptions.map((s) => (
                                <option key={s.uuid || "all"} value={s.uuid}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={16}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Tanggal
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={date}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none"
                        />
                        <Calendar
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={18}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Umur Stok
                    </label>
                    <div className="relative">
                        <select
                            value={ageInDayKey}
                            onChange={(e) => setAgeInDayKey(e.target.value)}
                            className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8"
                        >
                            {AGE_FILTER_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={16}
                        />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-1 flex items-end">
                    <button
                        onClick={handleSearch}
                        className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                        disabled={isFiltering || loading}
                    >
                        {isFiltering ? "Searching..." : "Search"}
                    </button>
                </div>
            </div>

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
