import { useState, useEffect, useCallback } from 'react';
import { fiberService } from '../../services/fiberService';
import { FiberPaginationResponse, FiberFilter } from "../../types/fiber";

interface UseFiberResult {
    data: FiberPaginationResponse;
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const useFiber = (filter: FiberFilter): UseFiberResult => {
    const [data, setData] = useState<FiberPaginationResponse>({} as FiberPaginationResponse);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchFibers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fiberService.getAllFiber(filter);

            if (response.status_code === 200) {
                setData(response.data);
            } else {
                setError(response.message || "Failed to fetch fibers data");
            }
        } catch (err) {
            setError("Failed to fetch fibers. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchFibers();
    }, [fetchFibers]);

    return {
        data,
        loading,
        error,
        refetch: fetchFibers,
    };
};

