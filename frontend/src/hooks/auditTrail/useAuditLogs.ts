import { useState, useEffect, useCallback } from "react";
import { auditLogService } from "../../services/auditTrailService";
import {
    AuditLogFilter,
    AuditLogPaginationResponse,
} from "../../types/auditLog";

interface UseAuditLogsResult {
    data: AuditLogPaginationResponse | null;
    loading: boolean;
    error: string;
    refetch: () => void;
}

export const useAuditLogs = (filters: AuditLogFilter): UseAuditLogsResult => {
    const [data, setData] = useState<AuditLogPaginationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAuditLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await auditLogService.getAllAuditLogs(filters);

            if (response.status_code === 200) {
                setData(response.data);
            } else {
                setError(response.message || "Failed to fetch audit logs");
            }
        } catch (err) {
            setError("Failed to fetch audit logs. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    return {
        data,
        loading,
        error,
        refetch: fetchAuditLogs,
    };
};
