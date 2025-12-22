import { useState, useCallback } from "react";
import { authService } from "../../services/authService";

interface UseResetPasswordResult {
    loading: boolean;
    error: string;
    resetPassword: (uuid: string) => Promise<string | null>;
}

export const useResetPassword = (): UseResetPasswordResult => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const resetPassword = useCallback(async (uuid: string) => {
        try {
            setLoading(true);
            setError("");

            const response = await authService.resetPassword(uuid);

            if (response.status_code === 200) {
                const pwd = response.data.password;

                return pwd;
            }

            setError(response.message || "Failed to reset password");
            return null;
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    "Failed to reset password. Please try again."
            );
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, resetPassword };
};
