export type PaymentStatus =
  | "PAYMENT_NOT_MADE_YET"
  | "PAYMENT_IN_FULL"
  | "PARTIAL_PAYMENT"
  ;

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
  PAYMENT_NOT_MADE_YET: "Belum dibayar",
  PAYMENT_IN_FULL: "Lunas",
  PARTIAL_PAYMENT: "Sebagian",
};

export interface PurchasingListResponse {
  status_code: number;
  message: string;
  data: PurchasingPagination;
}

export interface PurchasingPagination {
  size: number;
  page_no: number;
  total: number;
  data: Purchasing[];
}

export interface Purchasing {
  purchase_id: string;
  supplier: Supplier;
  purchase_date: string;
  age_in_day: number;
  stock_id: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  stock_entry: StockEntry;
  last_payment: string;
}

export interface Supplier {
  uuid: string;
  name: string;
  phone: string;
}

export interface StockEntry {
  uuid: string;
  stock_code: string;
  items: StockItem[];
}

export interface StockItem {
  uuid: string;
  stock_entry_id: string;
  item_name: string;
  weight: number;
  price_per_kilogram: number;
  total_payment: number;
  sort: StockSortResponse[];
}

export interface StockSortResponse {
  uuid: string;
  stock_item_id: string;
  sorted_item_name: string;
  weight: number;
  price_per_kilogram: number;
  current_weight: number;
  total_cost: number;
  is_shrinkage: boolean;
}

export interface CreatePurchasingRequest {
  supplier_id: string;
  purchase_date: string;
  stock_items: CreateStockItem[];
}

export interface CreateStockItem {
  item_name: string;
  weight: number;
  price_per_kilogram: number;
}

export interface PurchaseFilters {
  page?: number;
  size?: number;
}