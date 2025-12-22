import React, { useEffect, useState } from "react";
import { RefreshCw, X, Copy, Check } from "lucide-react";
import { CreateUserRequest, UpdateUserRequest, User } from "../../types/user";
import { formatInputNPWP } from "../../utils/FormatNPWP";
import { useResetPassword } from "../../hooks/users/useResetPassword";
import { useToast } from "../../contexts/ToastContext";

type FormData = CreateUserRequest | UpdateUserRequest;

interface UserModalFormProps {
    type: "ADD" | "EDIT";
    title: string;
    initialData: User | null;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: () => void;
    onClose: () => void;
}

const UserModalForm: React.FC<UserModalFormProps> = ({
    type,
    title,
    initialData,
    formData,
    setFormData,
    onSubmit,
    onClose,
}) => {
    const isAdd = type === "ADD";
    const { showToast } = useToast();
    const [resetedPassword, setResetedPassword] = useState<string>("");
    const [copied, setCopied] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        if (name === "tax_payer_identification_number_raw") {
            const digits = value.replace(/\D/g, "").slice(0, 15); // raw digits
            const formatted = formatInputNPWP(digits); // formatted for display

            setFormData({
                ...formData,
                tax_payer_identification_number: digits,
                tax_payer_identification_number_raw: formatted,
            });
            return;
        }

        setFormData((prev: FormData) => ({ ...prev, [name]: value }));
    };

    const { loading, error, resetPassword } = useResetPassword();
    const resetPasswordChangeButton = async () => {
        if (initialData) {
            const password = await resetPassword(initialData.uuid);
            if (password && !loading) {
                const decoded = atob(password);
                setResetedPassword(decoded);
                showToast(
                    "Password reset successfully! Please copy the new password.",
                    "success"
                );
            }
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(resetedPassword);
            setCopied(true);
            showToast("Password copied to clipboard!", "success");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            showToast("Failed to copy password", "error");
        }
    };

    useEffect(() => {
        if (error) {
            showToast(error, "error");
        }
    }, [showToast, error]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-2xl font-bold text-gray-800">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone *
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role *
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="BUYER">BUYER</option>
                                <option value="SUPPLIER">SUPPLIER</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            {!resetedPassword ? (
                                <button
                                    type="button"
                                    className="p-2 border text-white border-red-700 bg-red-500 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition w-full justify-center"
                                    onClick={resetPasswordChangeButton}
                                    disabled={loading || !initialData}
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw
                                                size={16}
                                                className="animate-spin"
                                            />
                                            <p className="pl-2">Resetting...</p>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={16} />
                                            <p className="pl-2">
                                                Reset Password
                                            </p>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={resetedPassword}
                                        disabled
                                        placeholder="New password"
                                        className="w-full px-4 py-2 pr-10 border border-green-300 bg-green-50 rounded-lg text-green-800 font-mono text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-green-100 rounded transition"
                                        title="Copy password"
                                    >
                                        {copied ? (
                                            <Check
                                                size={16}
                                                className="text-green-600"
                                            />
                                        ) : (
                                            <Copy
                                                size={16}
                                                className="text-green-600"
                                            />
                                        )}
                                    </button>
                                </div>
                            )}
                            {resetedPassword && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ Password reset successfully. Please save
                                    it securely.
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            NPWP
                        </label>
                        <input
                            type="text"
                            name="tax_payer_identification_number_raw"
                            value={formData.tax_payer_identification_number_raw}
                            onChange={handleChange}
                            maxLength={20}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Enter primary address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {formData.role === "BUYER" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Shipping Address *
                            </label>
                            <textarea
                                name="shipping_address"
                                value={formData.shipping_address}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Enter shipping address"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                        {isAdd ? "Save User" : "Update User"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserModalForm;
