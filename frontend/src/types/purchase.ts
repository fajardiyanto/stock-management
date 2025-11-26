import { CreateStockItem } from "./stock";
import { PaymentStatus } from "./payment";

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
  stock_id: string;
  stock_code: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  last_payment: string | null;
}

export interface Supplier {
  uuid: string;
  name: string;
  phone: string;
}

export interface CreatePurchasingRequest {
  supplier_id: string;
  purchase_date: string;
  stock_items: CreateStockItem[];
}

export interface PurchaseFilters {
  page?: number;
  size?: number;
  purchase_id?: string;
  supplier_id?: string;
  purchase_date?: string;
  payment_status?: PaymentStatus;
  age_in_day?: string;
}