import React, { useState } from "react";
import { X, Trash2, ChevronDown } from "lucide-react";
import { ManualEntryFormRequest } from "../../types/payment";
import { formatRupiah } from "../../utils/FormatRupiah";
import { cleanNumber } from "../../utils/CleanNumber";

interface ManualEntryFormProps {
    index: number;
    entry: ManualEntryFormRequest;
    onChange: (
        id: string,
        field: keyof ManualEntryFormRequest,
        value: string | number
    ) => void;
    onRemove: (id: string) => void;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
    index,
    entry,
    onChange,
    onRemove,
}) => {
    const [formattedAmount, setFormattedAmount] = useState(() =>
        formatRupiah(entry.total)
    );

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const cleanedValue = cleanNumber(rawValue);
        setFormattedAmount(rawValue);
        onChange(entry.tempId, "total", cleanedValue);
    };

    const handleAmountBlur = () => {
        setFormattedAmount(formatRupiah(entry.total));
    };

    const handleAmountFocus = () => {
        if (entry.total !== 0) {
            setFormattedAmount(String(entry.total));
        }
    };

    return (
        <div className="border border-gray-300 rounded-xl p-4 shadow-sm">
            <h5 className="text-md font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
                Kelola Keuangan #{index + 1}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jumlah
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formattedAmount}
                            onChange={handleAmountChange}
                            onFocus={handleAmountFocus}
                            onBlur={handleAmountBlur}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            title="Clear"
                        />
                        <X
                            size={16}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                            onClick={() => {
                                onChange(entry.tempId, "total", 0);
                                setFormattedAmount("");
                            }}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                    </label>
                    <div className="relative">
                        <select
                            value={entry.type}
                            onChange={(e) =>
                                onChange(
                                    entry.tempId,
                                    "type",
                                    e.target.value as "INCOME" | "EXPENSE"
                                )
                            }
                            className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                        >
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={16}
                        />
                    </div>
                </div>

                <div className="md:col-span-2 flex items-end space-x-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi
                        </label>
                        <input
                            type="text"
                            value={entry.description}
                            onChange={(e) =>
                                onChange(
                                    entry.tempId,
                                    "description",
                                    e.target.value
                                )
                            }
                            placeholder="Deskripsi cash flow"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => onRemove(entry.tempId)}
                        className="p-3 mb-0.5 text-red-500 hover:text-red-700 rounded-lg transition"
                        title="Remove Entry"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualEntryForm;
