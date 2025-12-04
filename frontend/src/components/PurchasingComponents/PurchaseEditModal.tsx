import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
import { Purchasing, UpdatePurchaseRequest } from "../../types/purchase";
import { useToast } from "../../contexts/ToastContext";
import { purchaseService } from "../../services/purchaseService";

interface PurchaseEditModalProps {
    purchase: Purchasing;
    onClose: () => void;
}

const PurchaseEditModal: React.FC<PurchaseEditModalProps> = ({
    purchase,
    onClose,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UpdatePurchaseRequest>({
        purchase_date: purchase.purchase_date.slice(0, 16),
    });

    const { showToast } = useToast();

    const handleDateChange = (date: string) => {
        setFormData((prev) => ({ ...prev, purchase_date: date }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        if (!formData.purchase_date) {
            showToast("Date are required.", "error");
            return;
        }

        setLoading(true);
        setIsSubmitting(true);

        try {
            const finalPayload: UpdatePurchaseRequest = {
                purchase_date: formData.purchase_date + ":00Z",
            };

            const response = await purchaseService.updatePurchase(
                purchase.purchase_id,
                finalPayload
            );

            if (response.status_code === 201 || response.status_code === 200) {
                showToast("Berhasil melakukan update pembelian!", "success");
            } else {
                const errorMessage =
                    response.message || "Gagal update pembelian. Coba lagi.";
                showToast(errorMessage, "error");
            }
        } catch (error) {
            showToast("Failed to update purchasing", "error");
        } finally {
            setIsSubmitting(false);
            setLoading(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                <div className="flex items-center justify-between border-b border-gray-100 p-5">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Edit Pembelian
                        </h3>
                        <p className="text-sm text-gray-500">
                            Perbarui informasi pembelian{" "}
                            <b>${purchase.stock_code}</b>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-8 pt-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Supplier
                            </label>
                            <div className="relative">
                                <select
                                    value={purchase.supplier.uuid}
                                    className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                                >
                                    <option
                                        key={purchase.supplier.uuid || "all"}
                                        value={purchase.supplier.uuid}
                                    >
                                        {purchase.supplier.name}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Stok
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    value={formData.purchase_date}
                                    onChange={(e) =>
                                        handleDateChange(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 appearance-none pr-8 shadow-sm"
                                    disabled={isSubmitting || loading}
                                />
                                <Calendar
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                    size={18}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-end gap-3 border-t border-gray-100 p-5 pt-4">
                                <button
                                    onClick={onClose}
                                    type="button"
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Updating..."
                                        : "Update Pembelian"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseEditModal;
