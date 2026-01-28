import { useState, useEffect, useCallback } from 'react';
import { analyticService } from '../../services/analyticService';
import { useToast } from '../../contexts/ToastContext';
import { UserData, AnalyticStatsFilter } from "../../types/analytic";

interface UsePerformanceDataResult {
    userData: UserData[];
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const usePerformanceData = (type: string, filter: AnalyticStatsFilter): UsePerformanceDataResult => {
    const [userData, setUserData] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const fetchPerformaceData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response =
                type === "customer"
                    ? await analyticService.getCustomerPerformance(filter)
                    : await analyticService.getSupplierPerformance(filter);

            if (response.status_code === 200) {
                setUserData(response.data);
            } else {
                setError(
                    response.message || "Failed to fetch daily dashboard stats"
                );
                showToast(
                    response.message || "Failed to fetch daily dashboard stats",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch daily dashboard stats. Please try again");
            showToast(
                "Failed to fetch daily dashboard stats. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [type, filter, showToast]);

    useEffect(() => {
        fetchPerformaceData();
    }, [fetchPerformaceData]);

    return {
        userData,
        loading,
        error,
        refetch: fetchPerformaceData,
    };
};

