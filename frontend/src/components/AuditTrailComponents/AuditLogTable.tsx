import React from "react";
import { Eye } from "lucide-react";
import { AuditLog, AuditLogPaginationResponse } from "../../types/auditLog";
import Pagination from "../Pagination";
import { formatDate } from "../../utils/FormatDate";

interface AuditLogTableProps {
    data: AuditLogPaginationResponse;
    currentPage: number;
    totalPages: number;
    loading: boolean;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
    onViewDetail: (log: AuditLog) => void;
}

const getStatusBadge = (statusCode: number) => {
    let style = "";
    if (statusCode >= 200 && statusCode < 300) {
        style = "bg-green-100 text-green-800";
    } else if (statusCode >= 400 && statusCode < 500) {
        style = "bg-yellow-100 text-yellow-800";
    } else if (statusCode >= 500) {
        style = "bg-red-100 text-red-800";
    } else {
        style = "bg-gray-100 text-gray-800";
    }

    return (
        <span
            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
        >
            {statusCode}
        </span>
    );
};

const getMethodBadge = (method: string) => {
    const methodColors: Record<string, string> = {
        GET: "bg-blue-100 text-blue-800",
        POST: "bg-green-100 text-green-800",
        PUT: "bg-yellow-100 text-yellow-800",
        PATCH: "bg-purple-100 text-purple-800",
        DELETE: "bg-red-100 text-red-800",
    };

    return (
        <span
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                methodColors[method] || "bg-gray-100 text-gray-800"
            }`}
        >
            {method}
        </span>
    );
};

const AuditLogTable: React.FC<AuditLogTableProps> = ({
    data,
    currentPage,
    totalPages,
    loading,
    onPageChange,
    onPageSizeChange,
    onViewDetail,
}) => {
    const startIdx = (currentPage - 1) * (data?.data?.length ?? 0) + 1;
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[
                                "#",
                                "Timestamp",
                                "User",
                                "Role",
                                "Action",
                                "Method",
                                "Status",
                                "Duration",
                                "IP Address",
                                "Actions",
                            ].map((header) => (
                                <th
                                    key={header}
                                    className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                                        header === "Actions"
                                            ? "text-right"
                                            : "text-left"
                                    }`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="py-10 text-center text-gray-500"
                                >
                                    Loading audit logs...
                                </td>
                            </tr>
                        ) : data?.data?.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="py-10 text-center text-gray-500"
                                >
                                    No audit logs found.
                                </td>
                            </tr>
                        ) : (
                            data?.data?.map((log, index) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {startIdx + index}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(log.timestamp)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {log.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {log.user_role}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getMethodBadge(log.method)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(log.status_code)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {log.duration}ms
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {log.ip_address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => onViewDetail(log)}
                                            title="View Details"
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                entryName="audit logs"
                currentPage={currentPage}
                pageSize={data?.data?.length || 10}
                totalData={data?.total || 0}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};

export default AuditLogTable;
