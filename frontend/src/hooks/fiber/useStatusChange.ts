import { useState, useCallback } from "react";
import { fiberService } from '../../services/fiberService';
import { FiberResponse } from "../../types/fiber";

interface UseStatusChangeResult {
    statusChange: (data: FiberResponse) => Promise<boolean>;
    error: string;
}

export const useStatusChange = (): UseStatusChangeResult => {
    const [error, setError] = useState("");

    const statusChange = useCallback(async (fiber: FiberResponse) => {
        try {
            const response = await fiberService.markFiberAvailable(fiber.uuid);

            if (response.status_code === 200) {
                return true;
            }
            setError(response.message || "Failed to mark fiber available");
            return false;
        } catch (err) {
            setError("Failed to mark fiber available. Please try again.");
            return false;
        };
    }, []);

    return { statusChange, error };
};
