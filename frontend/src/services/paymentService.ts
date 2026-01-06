import {
    CashFlowResponse,
    CreatePaymentReqeust,
    CreatePaymentSalesRequest,
    ManualEntryFormRequest,
    UserBalanceDepositResponse,
} from "../types/payment";
import { ApiResponse } from "../types";
import { apiCall } from "./";

export const paymentService = {
    getAllPaymentByUserId: async (
        id: string
    ): Promise<ApiResponse<CashFlowResponse>> => {
        const response = await apiCall<ApiResponse<CashFlowResponse>>(
            `/payment/user/${id}`
        );
        return response;
    },

    createManualPayment: async (
        id: string,
        data: ManualEntryFormRequest[]
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/payment/user/${id}/manual`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    deleteManualPayment: async (id: string): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/payment/${id}/manual`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response;
    },

    getAllPaymentBField: async (
        id: string,
        field: string
    ): Promise<ApiResponse<CashFlowResponse>> => {
        const response = await apiCall<ApiResponse<CashFlowResponse>>(
            `/payment/purchase/${id}/${field}`
        );
        return response;
    },

    createPaymentByPurchaseId: async (
        data: CreatePaymentReqeust
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(`/payment/purchase`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response;
    },

    createPaymentBySaleId: async (
        data: CreatePaymentSalesRequest
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(`/payment/sale`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response;
    },

    createPaymentByPurchaseIdFromDeposit: async (
        data: CreatePaymentReqeust
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/payment/purchase/deposit`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    createPaymentBySaleIdFromDeposit: async (
        data: CreatePaymentSalesRequest
    ): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/payment/sale/deposit`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    },

    getUserBalanceDeposit: async (
        id: string
    ): Promise<ApiResponse<UserBalanceDepositResponse>> => {
        const response = await apiCall<ApiResponse<UserBalanceDepositResponse>>(
            `/payment/user/deposit/${id}`
        );
        return response;
    },
};
