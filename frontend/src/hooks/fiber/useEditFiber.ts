import { useState, useCallback } from "react";
import { fiberService } from '../../services/fiberService';
import { FiberRequest } from "../../types/fiber";

interface UseEditFiberResult {
    editFiber: (fiberId: string, data: FiberRequest) => Promise<boolean>;
    error: string;
}

export const useEditFiber = (): UseEditFiberResult => {
    const [error, setError] = useState("");

    const editFiber = useCallback(async (fiberId: string, data: FiberRequest) => {
        if (!data.name) {
            setError("Please fill all required fields");
            return false;
        }

        setError("");

        try {
            const response = await fiberService.updateFiber(fiberId, data);

            if (response.status_code === 200 || response.status_code === 201) {
                return true;
            }

            const errorMsg = response.message || "Failed to update fiber";
            setError(errorMsg);
            return false;
        } catch (err) {
            const errMsg = "Failed to update fiber. Please try again.";
            setError(errMsg);
            return false;
        }
    }, []);

    return { editFiber, error };
};
