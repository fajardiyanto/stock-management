import React, { useState } from "react";
import { Calendar, Edit2 } from "lucide-react";
import PurchaseStatusBadge from "./PurchaseStatusBadge";
import { formatRupiah } from "../../utils/FormatRupiah";
import { Purchasing } from "../../types/purchase";
import { PaymentResponse, PaymentStatusLabel } from "../../types/payment";
import { formatDate } from "../../utils/FormatDate";
import Pagination from "../Pagination";
import RecordPaymentModal from "./RecordPaymentModal";
import { paymentService } from "../../services/paymentService";
import { useToast } from "../../contexts/ToastContext";
import PurchaseEditModal from "./PurchaseEditModal";

interface PurchaseTableProps {
    data: Purchasing[];
    currentPage: number;
    pageSize: number;
    totalPurchases: number;
    totalPages: number;
    loading: boolean;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
    onRefresh: () => void;
}

const PurchaseTable: React.FC<PurchaseTableProps> = ({
    data,
    currentPage,
    pageSize,
    totalPurchases,
    totalPages,
    loading,
    onPageChange,
    onPageSizeChange,
    onRefresh,
}) => {
    const [purchase, setPurchase] = useState<Purchasing>({} as Purchasing);
    const [modalType, setModalType] = useState<"ADD" | "EDIT" | null>(null);
    const [payments, setPayments] = useState<PaymentResponse[]>([]);
    const [error, setError] = useState<string>("");

    const { showToast } = useToast();

    const startIdx = (currentPage - 1) * pageSize + 1;

    const handleOpenPayment = async (data: Purchasing) => {
        setModalType("ADD");
        setPurchase(data);

        try {
            const response = await paymentService.getAllPaymentBField(
                data.purchase_id,
                "purchase"
            );

            if (response.status_code === 200) {
                setPayments(response.data.payment);
            } else {
                setError(response.message || "Failed to fetch cash flows");
                showToast(
                    response.message || "Failed to fetch cash flows",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch cash flows. Please try again.");
            showToast("Failed to fetch cash flows. Please try again.", "error");
        }
    };

    const handleEditPurchase = async (data: Purchasing) => {
        setModalType("EDIT");
        setPurchase(data);
    };

    const handleCloseModal = () => {
        setModalType(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[
                                "ID",
                                "Supplier",
                                "Stock",
                                "Tanggal Pembelian",
                                "Total Bayar",
                                "Dibayar",
                                "Sisa",
                                "Status Pembayaran",
                                "Tanggal Bayar",
                                "Actions",
                            ].map((header) => (
                                <th
                                    key={header}
                                    className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                                        header === "Actions"
                                            ? "text-right"
                                            : "text-left"
                                    }`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((item, index) => {
                            const percentage =
                                item.total_amount > 0
                                    ? (item.paid_amount / item.total_amount) *
                                      100
                                    : 0;
                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {startIdx + index}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.supplier.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800`}
                                        >
                                            {item.stock_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(item.purchase_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {formatRupiah(item.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatRupiah(item.paid_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatRupiah(item.remaining_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <PurchaseStatusBadge
                                            status={
                                                PaymentStatusLabel[
                                                    item.payment_status
                                                ]
                                            }
                                            percentage={percentage}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(item.last_payment)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    handleEditPurchase(item)
                                                }
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleOpenPayment(item)
                                                }
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition"
                                                title="Payment"
                                            >
                                                <Calendar size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {modalType === "ADD" && (
                <RecordPaymentModal
                    purchase={purchase}
                    payments={payments}
                    error={error}
                    onClose={handleCloseModal}
                    onRefresh={onRefresh}
                />
            )}

            {modalType === "EDIT" && (
                <PurchaseEditModal
                    purchase={purchase}
                    onClose={handleCloseModal}
                />
            )}

            <Pagination
                entryName="purchases"
                currentPage={currentPage}
                pageSize={pageSize}
                totalData={totalPurchases}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};

export default PurchaseTable;
