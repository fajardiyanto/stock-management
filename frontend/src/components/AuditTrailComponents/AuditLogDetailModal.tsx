import React from "react";
import { X } from "lucide-react";
import { AuditLog } from "../../types/auditLog";
import { formatDate } from "../../utils/FormatDate";

interface AuditLogDetailModalProps {
    log: AuditLog;
    onClose: () => void;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
    log,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        Audit Log Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                Timestamp
                            </label>
                            <p className="text-gray-900 mt-1">
                                {formatDate(log.timestamp)}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                User
                            </label>
                            <p className="text-gray-900 mt-1">
                                {log.name} ({log.user_role})
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                Action
                            </label>
                            <p className="text-gray-900 mt-1">{log.action}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                Method & Path
                            </label>
                            <p className="text-gray-900 mt-1">
                                {log.method} {log.path}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                Status Code
                            </label>
                            <p className="text-gray-900 mt-1">
                                {log.status_code}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                Duration
                            </label>
                            <p className="text-gray-900 mt-1">
                                {log.duration}ms
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                IP Address
                            </label>
                            <p className="text-gray-900 mt-1">
                                {log.ip_address}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                User ID
                            </label>
                            <p className="text-gray-900 mt-1 font-mono text-sm">
                                {log.user_id}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-600">
                            User Agent
                        </label>
                        <p className="text-gray-900 mt-1 text-sm break-all">
                            {log.user_agent}
                        </p>
                    </div>

                    {log.request_body && (
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                Request Body
                            </label>
                            <pre className="bg-gray-50 p-4 rounded-lg mt-2 text-xs overflow-x-auto border border-gray-200">
                                {log.request_body}
                            </pre>
                        </div>
                    )}

                    {log.response_body && (
                        <div>
                            <label className="text-sm font-semibold text-gray-600">
                                Response Body
                            </label>
                            <pre className="bg-gray-50 p-4 rounded-lg mt-2 text-xs overflow-x-auto border border-gray-200 max-h-64">
                                {log.response_body}
                            </pre>
                        </div>
                    )}

                    {log.error_message && (
                        <div>
                            <label className="text-sm font-semibold text-red-600">
                                Error Message
                            </label>
                            <pre className="bg-red-50 p-4 rounded-lg mt-2 text-xs overflow-x-auto border border-red-200 text-red-800">
                                {log.error_message}
                            </pre>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogDetailModal;
