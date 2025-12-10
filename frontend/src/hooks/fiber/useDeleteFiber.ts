import { useState, useCallback } from "react";
import { fiberService } from '../../services/fiberService';

interface UseDeleteFiberResult {
    deleteFiber: (fiberId: string) => Promise<boolean>;
    error: string;
}

export const useDeleteFiber = (): UseDeleteFiberResult => {
    const [error, setError] = useState("");

    const deleteFiber = useCallback(async (fiberId: string) => {
        try {
            const response = await fiberService.deleteFiber(fiberId);

            if (response.status_code === 200) {
                return true
            }
            setError(response.message || "Failed to delete fiber");
            return false;
        } catch (err) {
            setError("Failed to delete fiber. Please try again.");
            return false;
        }
    }, []);

    return { deleteFiber, error };
};