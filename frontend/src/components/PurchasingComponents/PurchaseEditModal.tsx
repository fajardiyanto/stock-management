import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { Purchasing, UpdatePurchaseRequest } from "../../types/purchase";
import { useToast } from "../../contexts/ToastContext";
import { purchaseService } from "../../services/purchaseService";
import { MaxDate } from "../../utils/MaxDate";
import { formatRupiah, formatRupiahInput } from "../../utils/FormatRupiah";
import { cleanNumber } from "../../utils/CleanNumber";
import { paymentService } from "../../services/paymentService";

interface PurchaseEditModalProps {
    purchase: Purchasing;
    onClose: () => void;
    onRefresh: () => void;
}

const PurchaseEditModal: React.FC<PurchaseEditModalProps> = ({
    purchase,
    onClose,
    onRefresh,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UpdatePurchaseRequest>({
        purchase_date: purchase.purchase_date.slice(0, 16),
        purchase_id: "",
        stock_code: "",
        total: 0,
    });
    const [isDateChanged, setIsDateChanged] = useState(false);
    const [isPaymentAmountChanged, setIsPaymentAmountChanged] = useState(false);
    const [paymentAmountDisplay, setPaymentAmountDisplay] =
        useState<string>("");

    const { showToast } = useToast();

    const handleDateChange = (date: string) => {
        setFormData((prev) => ({ ...prev, purchase_date: date }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const cleanedValue = cleanNumber(rawValue);

        setIsPaymentAmountChanged(true);
        setPaymentAmountDisplay(String(cleanedValue));
        setFormData({
            ...formData,
            total: cleanedValue,
            purchase_id: purchase.purchase_id,
            stock_code: purchase.stock_code,
        });
    };

    const handleAmountBlur = () => {
        if (formData.total > 0) {
            setPaymentAmountDisplay(formatRupiahInput(formData.total));
        }

        if (formData.total > purchase.remaining_amount) {
            setPaymentAmountDisplay(
                formatRupiahInput(purchase.remaining_amount)
            );
        }
    };

    const handlePaymentAmountInput = (paymentAmount: number) => {
        setFormData({ ...formData, total: paymentAmount });
        setPaymentAmountDisplay(formatRupiahInput(paymentAmount));
    };

    useEffect(() => {
        setPaymentAmountDisplay(formatRupiahInput(formData.total));
    }, [formData.total]);

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
                purchase_id: formData.purchase_id,
                stock_code: formData.stock_code,
                total: formData.total,
            };

            const isSuccess = (code?: number) => code === 200 || code === 201;
            if (isDateChanged) {
                const response = await purchaseService.updatePurchase(
                    purchase.purchase_id,
                    finalPayload
                );

                if (isSuccess(response.status_code)) {
                    showToast(
                        "Berhasil melakukan update pembelian!",
                        "success"
                    );
                } else {
                    showToast(
                        response.message ||
                            "Gagal update pembelian. Coba lagi.",
                        "error"
                    );
                }
            }

            if (isPaymentAmountChanged) {
                const response =
                    await paymentService.createPaymentByPurchaseIdFromDeposit(
                        finalPayload
                    );

                if (isSuccess(response.status_code)) {
                    showToast("Berhasil melakukan pembayaran!", "success");
                } else {
                    showToast(
                        response.message ||
                            "Gagal melakukan pembayaran. Coba lagi.",
                        "error"
                    );
                }
            }
        } catch (error) {
            showToast("Failed to update purchasing", "error");
        } finally {
            setIsSubmitting(false);
            setLoading(false);
            onClose();
            onRefresh();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Edit Pembelian
                        </h3>
                        <p className="text-sm text-gray-500">
                            Perbarui informasi pembelian{" "}
                            <b>{purchase.stock_code}</b>
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
                                    disabled
                                    className="appearance-none w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white pr-8 cursor-pointer"
                                >
                                    <option value={purchase.supplier.uuid}>
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
                                    max={MaxDate()}
                                    onChange={(e) => {
                                        handleDateChange(e.target.value);
                                        setIsDateChanged(true);
                                    }}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Di Bayaran
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    value={formatRupiah(purchase.paid_amount)
                                        .replace("Rp", "")
                                        .trim()}
                                    className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-right"
                                    disabled
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Pembayaran
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    value={paymentAmountDisplay}
                                    onChange={handleAmountChange}
                                    onBlur={handleAmountBlur}
                                    placeholder={formatRupiah(
                                        purchase.remaining_amount
                                    )
                                        .replace("Rp", "")
                                        .trim()}
                                    className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-right"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePaymentAmountInput(
                                            purchase.remaining_amount
                                        )
                                    }
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Use Remaining Amount"
                                >
                                    <X size={16} />
                                </button>
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
