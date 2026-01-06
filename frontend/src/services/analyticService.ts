import { ApiResponse } from "../types";
import { apiCall } from "./";
import {
    DashboardStats,
    DailyDashboardStats,
    SalesTrendData,
    StockDistributionData,
    UserData,
} from "../types/analytic";

export const analyticService = {
    getDashboardStats: async (
        year: string,
        month: string
    ): Promise<ApiResponse<DashboardStats>> => {
        const response = await apiCall<ApiResponse<DashboardStats>>(
            `/analytics/stats/${month}/${year}`
        );
        return response;
    },

    getDailyDashboardStats: async (
        date: string
    ): Promise<ApiResponse<DailyDashboardStats>> => {
        const response = await apiCall<ApiResponse<DailyDashboardStats>>(
            `/analytics/daily/${date}/stats`
        );
        return response;
    },

    getSalesTrendData: async (
        year: string
    ): Promise<ApiResponse<SalesTrendData[]>> => {
        const response = await apiCall<ApiResponse<SalesTrendData[]>>(
            `/analytics/sales/trend/${year}`
        );
        return response;
    },

    getStockDistributionData: async (): Promise<
        ApiResponse<StockDistributionData[]>
    > => {
        const response = await apiCall<ApiResponse<StockDistributionData[]>>(
            `/analytics/stock/distribution`
        );
        return response;
    },

    getSupplierPerformance: async (): Promise<ApiResponse<UserData[]>> => {
        const response = await apiCall<ApiResponse<UserData[]>>(
            `/analytics/supplier/performance`
        );
        return response;
    },

    getCustomerPerformance: async (): Promise<ApiResponse<UserData[]>> => {
        const response = await apiCall<ApiResponse<UserData[]>>(
            `/analytics/customer/performance`
        );
        return response;
    },
};
