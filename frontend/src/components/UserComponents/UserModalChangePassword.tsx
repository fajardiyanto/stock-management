import React, { useState, useEffect } from "react";
import { X, Lock, EyeOff, Eye } from "lucide-react";
import { useChangePassword } from "../../hooks/users/useChangePassword";
import { useToast } from "../../contexts/ToastContext";

interface UserModalChangePasswordProps {
    onClose: () => void;
}

const UserModalChangePassword: React.FC<UserModalChangePasswordProps> = ({
    onClose,
}) => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { changePassword, loading, error } = useChangePassword();
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            showToast(error, "error");
        }
    }, [error, showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const success = await changePassword({
            old_password: oldPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
        });

        if (success) {
            showToast("Password changed successfully", "success");
            onClose();
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Lock className="text-blue-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Change Password
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Current Password
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showOldPassword ? "text" : "password"}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Enter current password"
                                disabled={loading}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowOldPassword(!showOldPassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showOldPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            New Password
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min. 8 characters)"
                                disabled={loading}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Password must be at least 8 characters long
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm New Password
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Re-enter new password"
                                disabled={loading}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                        {newPassword &&
                            confirmPassword &&
                            newPassword !== confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">
                                    Passwords do not match
                                </p>
                            )}
                    </div>

                    {newPassword && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                                Password Strength:
                            </p>
                            <div className="space-y-1">
                                <div
                                    className={`flex items-center gap-2 text-xs ${
                                        newPassword.length >= 8
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    <span>
                                        {newPassword.length >= 8 ? "✓" : "○"}
                                    </span>
                                    <span>At least 8 characters</span>
                                </div>
                                <div
                                    className={`flex items-center gap-2 text-xs ${
                                        /[A-Z]/.test(newPassword)
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    <span>
                                        {/[A-Z]/.test(newPassword) ? "✓" : "○"}
                                    </span>
                                    <span>Contains uppercase letter</span>
                                </div>
                                <div
                                    className={`flex items-center gap-2 text-xs ${
                                        /[0-9]/.test(newPassword)
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    <span>
                                        {/[0-9]/.test(newPassword) ? "✓" : "○"}
                                    </span>
                                    <span>Contains number</span>
                                </div>
                                <div
                                    className={`flex items-center gap-2 text-xs ${
                                        /[!@#$%^&*]/.test(newPassword)
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    <span>
                                        {/[!@#$%^&*]/.test(newPassword)
                                            ? "✓"
                                            : "○"}
                                    </span>
                                    <span>Contains special character</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !oldPassword ||
                                !newPassword ||
                                !confirmPassword ||
                                newPassword !== confirmPassword
                            }
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Changing..." : "Change Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModalChangePassword;
