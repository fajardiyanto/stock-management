import React from "react";
import { X, Trash2 } from "lucide-react";
import { StockConfirmRequest } from "../../types/stock";

interface UserModalDeleteProps {
    item: StockConfirmRequest | null | undefined;
    onConfirm: () => void;
    onClose: () => void;
}

const StockModalDelete: React.FC<UserModalDeleteProps> = ({
    item,
    onConfirm,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <Trash2 className="text-red-600" size={24} />
                        <h3 className="text-xl font-bold text-red-700">
                            Confirm Deletion
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <p className="text-gray-700 mb-6 border-t pt-4">
                    Are you absolutely sure you want to delete stock{" "}
                    <b>{item?.stock_code}</b>?
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition shadow-md"
                    >
                        <Trash2 size={16} />
                        Yes, Delete Stock
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockModalDelete;
