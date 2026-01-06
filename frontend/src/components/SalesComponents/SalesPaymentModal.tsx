import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { SaleEntry } from "../../types/sales";
import { CreatePaymentSalesRequest } from "../../types/payment";
import { formatRupiah, formatRupiahInput } from "../../utils/FormatRupiah";
import { useToast } from "../../contexts/ToastContext";
import { cleanNumber } from "../../utils/CleanNumber";
import { paymentService } from "../../services/paymentService";

interface SalesPaymentModalProps {
    sale: SaleEntry;
    onClose: () => void;
    onRefresh: () => void;
}

const SalesPaymentModal: React.FC<SalesPaymentModalProps> = ({
    sale,
    onClose,
    onRefresh,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreatePaymentSalesRequest>({
        sales_code: sale.sale_code,
        sales_date: sale.sales_date,
        sales_id: sale.uuid,
        total: 0,
    });
    const [paymentAmountDisplay, setPaymentAmountDisplay] =
        useState<string>("");

    const { showToast } = useToast();

    const totalSales = sale.total_amount || 0;
    const alreadyPaid = sale.paid_amount || 0;
    const remaining = totalSales - alreadyPaid;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const cleanedValue = cleanNumber(rawValue);

        setPaymentAmountDisplay(String(cleanedValue));
        setFormData({
            ...formData,
            total: cleanedValue,
        });
    };

    const handleAmountBlur = () => {
        if (formData.total > 0) {
            setPaymentAmountDisplay(formatRupiahInput(formData.total));
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

        setLoading(true);

        try {
            const payload: CreatePaymentSalesRequest = {
                ...formData,
                total: formData.total,
            };

            const response =
                await paymentService.createPaymentBySaleIdFromDeposit(payload);

            if (response.status_code === 200 || response.status_code === 201) {
                showToast("Berhasil melakukan pembayaran!", "success");
            } else {
                showToast(
                    response.message ||
                        "Gagal melakukan pembayaran. Coba lagi.",
                    "error"
                );
            }
        } catch (error) {
            showToast("Failed to update purchasing", "error");
        } finally {
            setLoading(false);
            onClose();
            onRefresh();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Edit Jumlah Dibayar
                        </h3>
                        <p className="text-sm text-gray-500">
                            Perbarui jumlah pembayaran untuk penjualan{" "}
                            <b>{sale.sale_code}</b>
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
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">
                                    Total Penjualan
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {formatRupiah(totalSales)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">
                                    Sudah Dibayar
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {formatRupiah(alreadyPaid)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <span className="text-gray-600">
                                    Sisa Pembayaran
                                </span>
                                <span className="font-bold text-red-600 text-lg">
                                    {formatRupiah(remaining)}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Jumlah Dibayar (Baru)
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
                                        sale.remaining_amount
                                    )
                                        .replace("Rp", "")
                                        .trim()}
                                    className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-right"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handlePaymentAmountInput(
                                            sale.remaining_amount
                                        )
                                    }
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Use Remaining Amount"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                type="button"
                                className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                                disabled={loading}
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesPaymentModal;
