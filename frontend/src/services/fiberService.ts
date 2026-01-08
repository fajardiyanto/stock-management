import { ApiResponse } from "../types";
import { apiCall } from "./";
import {
    FiberRequest,
    FiberResponse,
    FiberPaginationResponse,
    FiberFilter,
} from "../types/fiber";

export const fiberService = {
    getAllFiber: async (
        filters: FiberFilter = {}
    ): Promise<ApiResponse<FiberPaginationResponse>> => {
        const queryParams = new URLSearchParams();

        queryParams.append("page_no", String(filters.page_no || 1));
        queryParams.append("size", String(filters.size || 10));

        if (filters.status) {
            queryParams.append("status", filters.status);
        }
        if (filters.name) {
            queryParams.append("name", filters.name);
        }

        const response = await apiCall<ApiResponse<FiberPaginationResponse>>(
            `/fibers?${queryParams.toString()}`
        );
        return response;
    },

    getFiberById: async (id: string): Promise<ApiResponse<FiberResponse>> => {
        const response = await apiCall<ApiResponse<FiberResponse>>(
            `/fibers/${id}`
        );
        return response;
    },

    createFiber: async (
        data: FiberRequest
    ): Promise<ApiResponse<FiberResponse>> => {
        const response = await apiCall<ApiResponse<FiberResponse>>(`/fibers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response;
    },

    markFiberAvailable: async (id: string): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(`/fibers/${id}/mark`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response;
    },

    deleteFiber: async (id: string): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(`/fibers/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response;
    },

    updateFiber: async (
        id: string,
        data: FiberRequest
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(`/fibers/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response;
    },

    getAllUsedFiber: async (): Promise<ApiResponse<FiberResponse[]>> => {
        const response = await apiCall<ApiResponse<FiberResponse[]>>(
            `/fibers/used`
        );
        return response;
    },

    getAllAvailableFiber: async (): Promise<ApiResponse<FiberResponse[]>> => {
        const response = await apiCall<ApiResponse<FiberResponse[]>>(
            `/fibers/available`
        );
        return response;
    },
};
