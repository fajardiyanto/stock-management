export type PaymentStatus =
    | "ALL"
    | "PAYMENT_NOT_MADE_YET"
    | "PAYMENT_IN_FULL"
    | "PARTIAL_PAYMENT"
    ;

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
    "ALL": "Semua Status",
    PAYMENT_NOT_MADE_YET: "Belum dibayar",
    PAYMENT_IN_FULL: "Lunas",
    PARTIAL_PAYMENT: "Sebagian",
};

export const MOCK_FILTER_STATUS_OPTIONS = [
    { key: 'ALL', label: 'Semua Status' },
    { key: 'PAYMENT_IN_FULL', label: PaymentStatusLabel.PAYMENT_IN_FULL },
    { key: 'PARTIAL_PAYMENT', label: PaymentStatusLabel.PARTIAL_PAYMENT },
    { key: 'PAYMENT_NOT_MADE_YET', label: PaymentStatusLabel.PAYMENT_NOT_MADE_YET },
];

export type PaymentType =
    | "INCOME"
    | "EXPENSE"
    ;

export interface CashFlowResponse {
    balance: number,
    payment: PaymentResponse[]
}

export interface PaymentResponse {
    uuid: string;
    user_id: string;
    total: number;
    type: PaymentType;
    description: string;
    sales_id: string;
    purchase_id: string;
    created_at: string;
    updated_at: string;
}

export interface ManualEntryFormRequest {
    tempId: string;
    total: number;
    type: PaymentType
    description: string;
}

export interface CreatePaymentReqeust {
    purchase_id: string;
    purchase_date: string;
    stock_code: string;
    total: number;
}