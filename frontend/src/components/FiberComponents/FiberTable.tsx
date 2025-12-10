import React from "react";
import { Edit2, Trash2, CheckCircle, EyeIcon } from "lucide-react";
import {
    FiberResponse,
    FiberPaginationResponse,
    STATUS_MAP,
} from "../../types/fiber";
import Pagination from "../Pagination";

interface FiberTableProps {
    data: FiberPaginationResponse;
    currentPage: number;
    totalPages: number;
    loading: boolean;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
    onEdit: (unit: FiberResponse) => void;
    onDelete: (unit: FiberResponse) => void;
    onStatusChange: (unit: FiberResponse) => void;
}

const getStatusBadge = (status: "FREE" | "USED") => {
    const style =
        status === "FREE"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800";
    return (
        <span
            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
        >
            {STATUS_MAP[status] ?? "-"}
        </span>
    );
};

const FiberTable: React.FC<FiberTableProps> = ({
    data,
    currentPage,
    totalPages,
    loading,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDelete,
    onStatusChange,
}) => {
    const startIdx = (currentPage - 1) * (data?.size ?? 0) + 1;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {["#", "Nama", "Status", "Used By", "Actions"].map(
                                (header) => (
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
                                )
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="py-10 text-center text-gray-500"
                                >
                                    Loading data...
                                </td>
                            </tr>
                        ) : data?.data?.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="py-10 text-center text-gray-500"
                                >
                                    No fiber units found.
                                </td>
                            </tr>
                        ) : (
                            data?.data?.map((unit, index) => (
                                <tr
                                    key={unit.uuid}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {startIdx + index}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {unit.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(unit.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {unit.sale_code && (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {unit.sale_code}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 items-center">
                                            {unit.status === "USED" && (
                                                <button
                                                    onClick={() =>
                                                        onStatusChange(unit)
                                                    }
                                                    title="Tandai Tersedia (Check In)"
                                                    className="p-2 text-green-600 hover:bg-green-100 rounded-full transition"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}

                                            {unit.status === "USED" && (
                                                <button
                                                    onClick={() =>
                                                        onStatusChange(unit)
                                                    }
                                                    title="Lihat Detail Fiber"
                                                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition"
                                                >
                                                    <EyeIcon size={18} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => onEdit(unit)}
                                                title="Edit"
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"
                                            >
                                                <Edit2 size={18} />
                                            </button>

                                            {unit.status === "FREE" && (
                                                <button
                                                    onClick={() =>
                                                        onDelete(unit)
                                                    }
                                                    title="Hapus"
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                entryName="fibers"
                currentPage={currentPage}
                pageSize={data.size}
                totalData={data.total}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};

export default FiberTable;
