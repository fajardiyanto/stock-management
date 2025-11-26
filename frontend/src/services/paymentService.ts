import { CashFlowResponse, ManualEntryFormRequest } from "../types/payment";
import { ApiResponse } from "../types";
import { apiCall } from "./";

export const paymentService = {
    getAllPaymentByUserId: async (id: string): Promise<ApiResponse<CashFlowResponse>> => {
        const response = await apiCall<ApiResponse<CashFlowResponse>>(
            `/payments/${id}`
        );
        return response;
    },

    createManualPayment: async (id: string, data: ManualEntryFormRequest[]): Promise<ApiResponse<any>> => {
        const response = await apiCall<ApiResponse<any>>(
            `/payment/manual/${id}`,
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
            `/payment/manual/${id}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response;
    }
}