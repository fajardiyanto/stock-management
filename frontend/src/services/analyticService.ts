import { ApiResponse } from "../types";
import { apiCall } from "./";
import {
    DashboardStats,
    DailyDashboardStats,
    SalesTrendData,
    StockDistributionData,
    UserData,
    SalesSupplierDetailPaginationResponse,
    SalesSupplierDetailWithPurchasePaginationResponse,
    DailyBookKeepingFilter,
    AnalyticStatsFilter,
} from "../types/analytic";

export const analyticService = {
    getDashboardStats: async (
        filter: AnalyticStatsFilter
    ): Promise<ApiResponse<DashboardStats>> => {
        const queryParams = new URLSearchParams();

        if (filter.start_date) queryParams.append("start_date", filter.start_date);
        if (filter.end_date) queryParams.append("end_date", filter.end_date);

        const response = await apiCall<ApiResponse<DashboardStats>>(
            `/analytics/stats/overal?${queryParams.toString()}`
        );
        return response;
    },

    getDailyDashboardStats: async (
        date: string
    ): Promise<ApiResponse<DailyDashboardStats>> => {
        const queryParams = new URLSearchParams();

        if (date) queryParams.append("date", date);

        const response = await apiCall<ApiResponse<DailyDashboardStats>>(
            `/analytics/daily/stats?${queryParams.toString()}`
        );
        return response;
    },

    getSalesTrendData: async (
        year: string
    ): Promise<ApiResponse<SalesTrendData[]>> => {
        const queryParams = new URLSearchParams();

        if (year) queryParams.append("year", year);

        const response = await apiCall<ApiResponse<SalesTrendData[]>>(
            `/analytics/sales/trend?${queryParams.toString()}`
        );
        return response;
    },

    getStockDistributionData: async (
        filters: AnalyticStatsFilter
    ): Promise<
        ApiResponse<StockDistributionData[]>
    > => {
        const queryParams = new URLSearchParams();

        if (filters.start_date) queryParams.append("start_date", filters.start_date);
        if (filters.end_date) queryParams.append("end_date", filters.end_date);

        const response = await apiCall<ApiResponse<StockDistributionData[]>>(
            `/analytics/stock/distribution?${queryParams.toString()}`
        );
        return response;
    },

    getSupplierPerformance: async (
         filters: AnalyticStatsFilter
    ): Promise<ApiResponse<UserData[]>> => {
        const queryParams = new URLSearchParams();

        if (filters.start_date) queryParams.append("start_date", filters.start_date);
        if (filters.end_date) queryParams.append("end_date", filters.end_date);

        const response = await apiCall<ApiResponse<UserData[]>>(
            `/analytics/supplier/performance?${queryParams.toString()}`
        );
        return response;
    },

    getCustomerPerformance: async (
         filters: AnalyticStatsFilter
    ): Promise<ApiResponse<UserData[]>> => {
        const queryParams = new URLSearchParams();

        if (filters.start_date) queryParams.append("start_date", filters.start_date);
        if (filters.end_date) queryParams.append("end_date", filters.end_date);

        const response = await apiCall<ApiResponse<UserData[]>>(
            `/analytics/customer/performance?${queryParams.toString()}`
        );
        return response;
    },

    getSalesSupplierDetail: async (
        filters: DailyBookKeepingFilter
    ): Promise<ApiResponse<SalesSupplierDetailPaginationResponse>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page_no", String(filters.page_no || 1));
        queryParams.append("size", String(filters.size || 10));
        if (filters.start_date) queryParams.append("start_date", filters.start_date);
        if (filters.end_date) queryParams.append("end_date", filters.end_date);

        const response = await apiCall<
            ApiResponse<SalesSupplierDetailPaginationResponse>
        >(`/analytics/sales/supplier?${queryParams.toString()}`);
        return response;
    },

    getSalesSupplierDetailWithPurchase: async (
        filters: DailyBookKeepingFilter
    ): Promise<
        ApiResponse<SalesSupplierDetailWithPurchasePaginationResponse>
    > => {
        const queryParams = new URLSearchParams();

        queryParams.append("page_no", String(filters.page_no || 1));
        queryParams.append("size", String(filters.size || 10));
        if (filters.start_date) queryParams.append("start_date", filters.start_date);
        if (filters.end_date) queryParams.append("end_date", filters.end_date);

        const response = await apiCall<
            ApiResponse<SalesSupplierDetailWithPurchasePaginationResponse>
        >(`/analytics/sales/supplier/purchase?${queryParams.toString()}`);
        return response;
    },
};
