import { useState, useEffect, useCallback } from 'react';
import { analyticService } from '../../services/analyticService';
import { useToast } from '../../contexts/ToastContext';
import { DailyDashboardStats } from "../../types/analytic";

interface UseDailyDashboardStats {
    dailyStats: DailyDashboardStats | null;
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const useDailyDashboardStats = (selectedDate: string): UseDailyDashboardStats => {
    const [dailyStats, setDailyStats] = useState<DailyDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const fetchDailyDashboardStats = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getDailyDashboardStats(
                selectedDate
            );

            if (response.status_code === 200) {
                setDailyStats(response.data);
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
    }, [selectedDate, showToast]);

    useEffect(() => {
        fetchDailyDashboardStats();
    }, [fetchDailyDashboardStats]);

    return {
        dailyStats,
        loading,
        error,
        refetch: fetchDailyDashboardStats,
    };
}