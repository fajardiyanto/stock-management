import React from "react";
import { X } from "lucide-react";
import { FiberResponse } from "../../types/fiber";
import { SaleEntry, SaleEntryById } from "../../types/sales";
import { formatDate } from "../../utils/FormatDate";

interface FiberDetailModalProps {
    onClose: () => void;
    fiber: FiberResponse;
    sale: SaleEntryById | null;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
    label,
    value,
}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">
            {label}
        </label>
        <div className="text-gray-900 font-medium break-words">{value}</div>
    </div>
);

const FiberDetailModal: React.FC<FiberDetailModalProps> = ({
    onClose,
    fiber,
    sale,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        Fiber Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 p-4 rounded-lg">
                        <DetailRow
                            label="Fiber Name"
                            value={
                                <span className="text-sm">{fiber.name}</span>
                            }
                        />
                        <DetailRow
                            label="Sales ID"
                            value={
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {fiber.sale_code}
                                </span>
                            }
                        />
                        <DetailRow
                            label="Customer"
                            value={
                                <span className="text-sm">
                                    {sale?.customer.name}
                                </span>
                            }
                        />
                        <DetailRow
                            label="Tanggal Penggunaan"
                            value={
                                <span className="text-sm">
                                    {formatDate(sale?.sales_date)}
                                </span>
                            }
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FiberDetailModal;
