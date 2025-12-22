import { useState, useCallback } from "react";
import { authService } from "../../services/authService";
import { ChangePasswordRequest } from "../../types/user";

interface UseChangePasswordResult {
    changePassword: (data: ChangePasswordRequest) => Promise<boolean>;
    loading: boolean;
    error: string;
}

export const useChangePassword = (): UseChangePasswordResult => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const changePassword = useCallback(async (data: ChangePasswordRequest) => {
        try {
            setLoading(true);
            setError("");

            const response = await authService.changePassword(data);

            if (response.status_code === 200) {
                setLoading(false);
                return true;
            }

            const errorMsg = response.message || "Failed to change password";
            setError(errorMsg);
            setLoading(false);
            return false;
        } catch (err: any) {
            const errMsg =
                err.response?.data?.message ||
                "Failed to change password. Please try again.";
            setError(errMsg);
            setLoading(false);
            return false;
        }
    }, []);

    return { changePassword, loading, error };
};
