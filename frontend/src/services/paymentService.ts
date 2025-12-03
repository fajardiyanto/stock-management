import { CashFlowResponse, CreatePaymentReqeust, ManualEntryFormRequest } from "../types/payment";
import { ApiResponse } from "../types";
import { apiCall } from "./";

export const paymentService = {
    getAllPaymentByUserId: async (id: string): Promise<ApiResponse<CashFlowResponse>> => {
        const response = await apiCall<ApiResponse<CashFlowResponse>>(
            `/payments/user/${id}`
        );
        return response;
    },

    createManualPayment: async (id: string, data: ManualEntryFormRequest[]): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/payment/user/${id}manual/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response;
    },

    getAllPaymentBField: async (id: string, field: string): Promise<ApiResponse<CashFlowResponse>> => {
        const response = await apiCall<ApiResponse<CashFlowResponse>>(
            `/purchase/${id}/payments/${field}`
        );
        return response;
    },

    createPaymentByPurchaseId: async (data: CreatePaymentReqeust): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/payment`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }
        );
        return response;
    }
}