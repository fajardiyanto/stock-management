import { ApiResponse } from "../types";
import { apiCall } from "./";
import {
    AuditLog,
    AuditLogFilter,
    AuditLogPaginationResponse,
    ExportResult,
    UserActivity,
} from "../types/auditLog";
import { API_BASE_URL } from "../constants/constants";

export const auditLogService = {
    getAllAuditLogs: async (
        filters: AuditLogFilter = {}
    ): Promise<ApiResponse<AuditLogPaginationResponse>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page", String(filters.page || 1));
        queryParams.append("page_size", String(filters.page_size || 20));

        if (filters.id) {
            queryParams.append("id", filters.id);
        }
        if (filters.user_id) {
            queryParams.append("user_id", filters.user_id);
        }
        if (filters.name) {
            queryParams.append("name", filters.name);
        }
        if (filters.action) {
            queryParams.append("action", filters.action);
        }
        if (filters.method) {
            queryParams.append("method", filters.method);
        }
        if (filters.path) {
            queryParams.append("path", filters.path);
        }
        if (filters.start_date) {
            queryParams.append("start_date", filters.start_date);
        }
        if (filters.end_date) {
            queryParams.append("end_date", filters.end_date);
        }
        if (filters.status_code) {
            queryParams.append("status_code", String(filters.status_code));
        }
        if (filters.keyword) {
            queryParams.append("keyword", String(filters.keyword));
        }

        const response = await apiCall<ApiResponse<AuditLogPaginationResponse>>(
            `/audit-logs?${queryParams.toString()}`
        );
        return response;
    },

    getAuditLogById: async (id: number): Promise<ApiResponse<AuditLog>> => {
        const response = await apiCall<ApiResponse<AuditLog>>(
            `/audit-logs/${id}`
        );
        return response;
    },

    getUserAuditLogs: async (
        userId: string,
        filters: AuditLogFilter = {}
    ): Promise<ApiResponse<AuditLogPaginationResponse>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page", String(filters.page || 1));
        queryParams.append("page_size", String(filters.page_size || 20));

        if (filters.start_date) {
            queryParams.append("start_date", filters.start_date);
        }

        if (filters.end_date) {
            queryParams.append("end_date", filters.end_date);
        }

        const response = await apiCall<ApiResponse<AuditLogPaginationResponse>>(
            `/audit-logs/user/${userId}?${queryParams.toString()}`
        );
        return response;
    },

    getUserActivity: async (
        userId: string,
        days: number = 30
    ): Promise<ApiResponse<UserActivity>> => {
        const response = await apiCall<ApiResponse<UserActivity>>(
            `/audit-logs/user/${userId}/activity?days=${days}`
        );
        return response;
    },

    exportAuditLogs: async (
        startDate: string,
        endDate: string,
        userId?: string
    ): Promise<ExportResult> => {
        const queryParams = new URLSearchParams();
        if (startDate) {
            queryParams.append("start_date", startDate);
        }
        if (endDate) {
            queryParams.append("end_date", endDate);
        }
        if (userId) {
            queryParams.append("user_id", userId);
        }

        const response = await fetch(
            `${API_BASE_URL}/audit-logs/export?${queryParams.toString()}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to export audit logs");
        }

        const disposition = response.headers.get("Content-Disposition");

        let filename = "audit_logs.xlsx";

        if (disposition) {
            const match = disposition.match(/filename="(.+)"/);
            if (match?.[1]) {
                filename = match[1];
            }
        }

        const blob = await response.blob();

        return { blob, filename };
    },
};
