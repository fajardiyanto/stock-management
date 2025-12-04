import React, { useState } from "react";
import { User } from "../../types/user";
import { X, Edit2, Plus } from "lucide-react";
import { formatDate } from "../../utils/FormatDate";
import CashFlowHistoryTable from "../PaymentComponents/CashFlowHistoryTable";
import {
    CashFlowResponse,
    ManualEntryFormRequest,
    PaymentResponse,
} from "../../types/payment";
import ManualEntryForm from "../PaymentComponents/ManualEntryForm";
import { paymentService } from "../../services/paymentService";
import { useToast } from "../../contexts/ToastContext";
import PaymentModalDelete from "../PaymentComponents/PaymentModalDelete";

interface UserModalDetailProps {
    user: User;
    cashFlows: CashFlowResponse;
    onClose: () => void;
    onEdit: () => void;
    onRefresh: () => Promise<void>;
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

const initialManualEntry: ManualEntryFormRequest = {
    tempId: "new-" + Math.random().toString(16).slice(2),
    total: 0,
    type: "INCOME",
    description: "",
};

const UserModalDetail: React.FC<UserModalDetailProps> = ({
    user,
    cashFlows,
    onClose,
    onEdit,
    onRefresh,
}) => {
    const [manualForms, setManualForms] = useState<ManualEntryFormRequest[]>(
        []
    );
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);
    const [manualError, setManualError] = useState("");
    const [modalType, setModalType] = useState<"DELETE" | null>(null);
    const [cashFlow, setCashFlow] = useState<PaymentResponse>(
        {} as PaymentResponse
    );

    const { showToast } = useToast();

    const getRoleBadge = (role: string) => {
        let style = "bg-gray-100 text-gray-800";
        if (role === "ADMIN") style = "bg-purple-100 text-purple-800";
        else if (role === "SUPPLIER") style = "bg-blue-100 text-blue-800";
        else if (role === "BUYER") style = "bg-yellow-100 text-yellow-800";
        return (
            <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
            >
                {role}
            </span>
        );
    };

    const getStatusBadge = (status: boolean) => {
        const style = status
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
        return (
            <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
            >
                {status ? "Active" : "Inactive"}
            </span>
        );
    };

    const handleAddForm = () => {
        if (isSubmittingManual) return;

        setManualForms((prev) => [
            ...prev,
            {
                ...initialManualEntry,
                tempId: "new-" + Math.random().toString(16).slice(2),
            },
        ]);
        setManualError("");
    };

    const handleFormChange = (
        id: string,
        field: keyof ManualEntryFormRequest,
        value: string | number
    ) => {
        setManualForms((prev) =>
            prev.map((form) =>
                form.tempId === id ? { ...form, [field]: value } : form
            )
        );
    };

    const handleRemoveForm = (id: string) => {
        if (isSubmittingManual) return;
        setManualForms((prev) => prev.filter((form) => form.tempId !== id));
        setManualError("");
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setManualError("");

        const validEntries = manualForms.filter(
            (f) => f.total > 0 && f.description.trim() !== ""
        );

        if (validEntries.length === 0) {
            setManualError(
                "Harap masukkan minimal satu entri Kas yang valid (Jumlah > 0 dan Deskripsi)."
            );
            return;
        }

        setIsSubmittingManual(true);

        try {
            const response = await paymentService.createManualPayment(
                user.uuid,
                validEntries
            );
            if (response.status_code === 200) {
                await onRefresh();
            } else {
                setManualError(
                    response.message || "Failed to create manual payment"
                );
                showToast(
                    response.message || "Failed to create manual payment",
                    "error"
                );
            }
        } catch (err) {
            setManualError(
                "Failed to create manual payment. Please try again."
            );
            showToast(
                "Failed to create manual payment. Please try again.",
                "error"
            );
        } finally {
            setIsSubmittingManual(false);
            setManualForms([]);
        }
    };

    const handleRemovePayment = async (data: PaymentResponse) => {
        setCashFlow(data);
        setModalType("DELETE");
    };

    const handleConfirmDelete = async () => {
        if (!cashFlow) return;

        try {
            const response = await paymentService.deleteManualPayment(
                cashFlow.uuid
            );

            if (response.status_code === 200) {
                await onRefresh();
            } else {
                setManualError(
                    response.message || "Failed to remove manual payment"
                );
                showToast(
                    response.message || "Failed to remove manual payment",
                    "error"
                );
            }
        } catch (err) {
            setManualError(
                "Failed to remove manual payment. Please try again."
            );
            showToast(
                "Failed to remove manual payment. Please try again.",
                "error"
            );
        } finally {
            setModalType(null);
        }
    };

    const handleCloseModal = () => {
        setModalType(null);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                    <div className="flex justify-between items-center pb-4 border-b">
                        <h3 className="text-2xl font-bold text-gray-800">
                            User Details
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full transition"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-8 pt-6">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-200">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="text-3xl font-extrabold text-gray-800">
                                    {user.name}
                                </h4>
                                <p className="text-gray-500 mt-1">
                                    <span className="font-mono text-xs text-gray-400">
                                        UUID:{" "}
                                    </span>
                                    <span className="font-mono text-sm">
                                        {user.uuid.substring(0, 8)}...
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 border p-4 rounded-lg bg-gray-50">
                            <DetailRow
                                label="User ID"
                                value={
                                    <span className="font-mono text-sm">
                                        {user.id}
                                    </span>
                                }
                            />
                            <DetailRow label="Phone" value={user.phone} />
                            <DetailRow
                                label="Role"
                                value={getRoleBadge(user.role)}
                            />
                            <DetailRow
                                label="Status"
                                value={getStatusBadge(user.status)}
                            />
                            <div className="sm:col-span-2">
                                <DetailRow
                                    label="Registered At"
                                    value={formatDate(user.created_at)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xl font-bold text-gray-700">
                                Address Information
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                <DetailRow
                                    label="Primary Address"
                                    value={user.address}
                                />
                                <DetailRow
                                    label="Shipping Address"
                                    value={user.shipping_address}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-8">
                        <CashFlowHistoryTable
                            user={user}
                            cashFlows={cashFlows}
                            onRemove={handleRemovePayment}
                        />
                    </div>

                    <form
                        onSubmit={handleManualSubmit}
                        className="mt-8 border-t pt-8 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-xl font-bold text-gray-700">
                                Kelola Keuangan
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddForm}
                                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                                disabled={isSubmittingManual}
                            >
                                <Plus size={16} /> Tambah Keuangan
                            </button>
                        </div>

                        {manualError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
                                {manualError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {manualForms.map((form, index) => (
                                <ManualEntryForm
                                    key={form.tempId}
                                    index={index}
                                    entry={form}
                                    onChange={handleFormChange}
                                    onRemove={handleRemoveForm}
                                />
                            ))}
                        </div>

                        {manualForms.length > 0 && (
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                                    disabled={isSubmittingManual}
                                >
                                    {isSubmittingManual
                                        ? "Menyimpan..."
                                        : `Simpan ${manualForms.length} Entri`}
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                        >
                            <Edit2 size={16} />
                            Edit User
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {modalType === "DELETE" && (
                    <PaymentModalDelete
                        item={cashFlow}
                        onConfirm={handleConfirmDelete}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </>
    );
};

export default UserModalDetail;
