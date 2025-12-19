export interface AuditLog {
    id: number;
    user_id: string;
    name: string;
    user_role: string;
    action: string;
    method: string;
    path: string;
    ip_address: string;
    user_agent: string;
    request_body: string;
    response_body: string;
    status_code: number;
    duration: number;
    error_message: string;
    timestamp: string;
    created_at: string;
}

export interface AuditLogFilter {
    id?: string;
    user_id?: string;
    name?: string;
    action?: string;
    method?: string;
    path?: string;
    start_date?: string;
    end_date?: string;
    status_code?: number;
    page?: number;
    page_size?: number;
    keyword?: string;
}

export interface AuditLogPaginationResponse {
    total: number;
    page: number;
    data: AuditLog[];
}

export interface UserActivity {
    user_id: string;
    period_days: number;
    total_actions: number;
    action_breakdown: Record<string, number>;
    avg_response_time_ms: number;
}

export interface ExportResult {
    blob: Blob;
    filename: string;
}

export const METHOD_OPTIONS = [
    { key: "", label: "All Methods" },
    { key: "GET", label: "GET" },
    { key: "POST", label: "POST" },
    { key: "PUT", label: "PUT" },
    { key: "PATCH", label: "PATCH" },
    { key: "DELETE", label: "DELETE" },
];

export const STATUS_CODE_OPTIONS = [
    { key: "", label: "All Status" },
    { key: "200", label: "200 - Success" },
    { key: "201", label: "201 - Created" },
    { key: "400", label: "400 - Bad Request" },
    { key: "401", label: "401 - Unauthorized" },
    { key: "403", label: "403 - Forbidden" },
    { key: "404", label: "404 - Not Found" },
    { key: "500", label: "500 - Server Error" },
];
