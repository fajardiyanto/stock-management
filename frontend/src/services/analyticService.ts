import { ApiResponse } from "../types";
import { apiCall } from "./";
import { DashboardStats, DailyDashboardStats } from "../types/analytic";

export const analyticService = {
    getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
        const response = await apiCall<ApiResponse<DashboardStats>>(
            `/analytics/stats`
        );
        return response;
    },

    getDailyDashboardStats: async (date: string): Promise<ApiResponse<DailyDashboardStats>> => {
        const response = await apiCall<ApiResponse<DailyDashboardStats>>(
            `/analytics/daily/${date}/stats`
        );
        return response;
    },
};

