import { ApiResponse } from "../types";
import { apiCall } from "./";
import {
    DashboardStats,
    DailyDashboardStats,
    SalesTrendData,
    StockDistributionData,
    UserData,
    SalesSupplierDetailPaginationResponse,
    SalesSupplierDetailFilter,
    SalesSupplierDetailWithPurchasePaginationResponse,
    DailyBookKeepingFilter,
} from "../types/analytic";

export const analyticService = {
    getDashboardStats: async (
        year: string,
        month: string
    ): Promise<ApiResponse<DashboardStats>> => {
        const queryParams = new URLSearchParams();

        if (month) queryParams.append("month", month);
        if (year) queryParams.append("year", year);

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

    getSalesSupplierDetail: async (
        filters: SalesSupplierDetailFilter
    ): Promise<ApiResponse<SalesSupplierDetailPaginationResponse>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page_no", String(filters.page_no || 1));
        queryParams.append("size", String(filters.size || 10));
        if (filters.month) queryParams.append("month", filters.month);
        if (filters.year) queryParams.append("year", filters.year);

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
