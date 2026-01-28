import { useState, useEffect, useCallback } from "react";
import { analyticService } from "../../services/analyticService";
import { useToast } from "../../contexts/ToastContext";
import { DashboardStats, AnalyticStatsFilter } from "../../types/analytic";

interface UseDashboardStatsResult {
    stats: DashboardStats | null;
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
}

export const useDashboardStats = (
    filter: AnalyticStatsFilter
): UseDashboardStatsResult => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    const fetchDashboardStats = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticService.getDashboardStats(
                filter,
            );

            if (response.status_code === 200) {
                setStats(response.data);
            } else {
                setError(response.message || "Failed to fetch dashboard stats");
                showToast(
                    response.message || "Failed to fetch dashboard stats",
                    "error"
                );
            }
        } catch (err) {
            setError("Failed to fetch dashboard stats. Please try again");
            showToast(
                "Failed to fetch dashboard stats. Please try again",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [filter, showToast]);

    useEffect(() => {
        fetchDashboardStats();
    }, [filter, fetchDashboardStats]);

    return {
        stats,
        loading,
        error,
        refetch: fetchDashboardStats,
    };
};
