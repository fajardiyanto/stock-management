import React, { useState, useMemo } from "react";
import AuditLogFilter from "../components/AuditTrailComponents/AuditLogFilter";
import AuditLogTable from "../components/AuditTrailComponents/AuditLogTable";
import AuditLogDetailModal from "../components/AuditTrailComponents/AuditLogDetailModal";
import { AuditLog } from "../types/auditLog";
import { Download } from "lucide-react";
import { useAuditLogs } from "../hooks/auditTrail/useAuditLogs";
import { useToast } from "../contexts/ToastContext";
import { auditLogService } from "../services/auditTrailService";

const AuditLogPage: React.FC = () => {
    const [searchUsername, setSearchUsername] = useState("");
    const [searchAction, setSearchAction] = useState("");
    const [methodFilter, setMethodFilter] = useState("");
    const [statusCodeFilter, setStatusCodeFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const { showToast } = useToast();

    const auditLogFilter = {
        page: currentPage,
        page_size: pageSize,
        name: searchUsername || undefined,
        action: searchAction || undefined,
        method: methodFilter || undefined,
        status_code: statusCodeFilter ? parseInt(statusCodeFilter) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
    };

    // eslint-disable-next-line
    const memoFilter = useMemo(
        () => auditLogFilter,
        [JSON.stringify(auditLogFilter)]
    );

    const {
        data,
        loading: auditLogsLoading,
        error: auditLogsError,
        refetch: refetchAuditLogs,
    } = useAuditLogs(memoFilter);

    const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

    const handleSearch = () => {
        setCurrentPage(1);
        refetchAuditLogs();
    };

    const handleReset = () => {
        setSearchUsername("");
        setSearchAction("");
        setMethodFilter("");
        setStatusCodeFilter("");
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
        refetchAuditLogs();
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleViewDetail = (log: AuditLog) => {
        setSelectedLog(log);
    };

    const handleCloseDetail = () => {
        setSelectedLog(null);
    };

    const handleExport = async () => {
        try {
            const response = await auditLogService.exportAuditLogs(
                startDate,
                endDate
            );

            const url = window.URL.createObjectURL(response.blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = response.filename;

            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast("Audit logs exported successfully", "success");
        } catch (error) {
            showToast("Failed to export audit logs", "error");
        }
    };

    if (auditLogsLoading && !data) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
                <div className="text-gray-500">Loading audit logs...</div>
            </div>
        );
    }

    if (auditLogsError) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow">
                <p className="font-bold mb-2">Error Loading Data</p>
                <p>{auditLogsError}</p>
                <button
                    onClick={refetchAuditLogs}
                    className="mt-4 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-4 bg-white p-6 rounded-xl shadow-md">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">
                        Audit Trail
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Monitor and track all system activities
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-lg"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </header>

            <AuditLogFilter
                searchUsername={searchUsername}
                setSearchUsername={setSearchUsername}
                searchAction={searchAction}
                setSearchAction={setSearchAction}
                methodFilter={methodFilter}
                setMethodFilter={setMethodFilter}
                statusCodeFilter={statusCodeFilter}
                setStatusCodeFilter={setStatusCodeFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                onSearch={handleSearch}
                onReset={handleReset}
            />

            {data && (
                <AuditLogTable
                    data={data}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    loading={auditLogsLoading}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onViewDetail={handleViewDetail}
                />
            )}

            {selectedLog && (
                <AuditLogDetailModal
                    log={selectedLog}
                    onClose={handleCloseDetail}
                />
            )}
        </div>
    );
};

export default AuditLogPage;
