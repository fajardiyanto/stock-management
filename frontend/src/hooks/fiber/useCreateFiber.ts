import { useState, useCallback } from "react";
import { fiberService } from '../../services/fiberService';
import { FiberRequest } from "../../types/fiber";

interface UseCreateFiberResult {
    createFiber: (data: FiberRequest) => Promise<boolean>;
    error: string;
}

export const useCreateFiber = (): UseCreateFiberResult => {
    const [error, setError] = useState("");

    const createFiber = useCallback(async (data: FiberRequest) => {
        if (!data.name) {
            setError("Please fill all required fields");
            return false;
        }

        try {
            const response = await fiberService.createFiber(data);

            if (response.status_code === 200 || response.status_code === 201) {
                return true;
            }

            const errorMsg = response.message || "Failed to create fiber";
            setError(errorMsg);
            return false;
        } catch (err) {
            const errMsg = "Failed to create fiber. Please try again.";
            setError(errMsg);
            return false;
        }
    }, []);

    return { createFiber, error };
};
