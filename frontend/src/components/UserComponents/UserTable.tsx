import React from 'react';
import { User } from '../../types';
import { Trash2, Eye, PencilIcon } from 'lucide-react';
import Pagination from "../Pagination";
import { CashFlowResponse } from '../../types/payment';
import { formatRupiah } from '../../utils/FormatRupiah';

interface UserTableProps {
    users: User[];
    loading: boolean;
    currentPage: number;
    pageSize: number;
    totalUsers: number;
    totalPages: number;
    onViewDetail: (user: User) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
}

const getRoleStyle = (role: string) => {
    switch (role) {
        case 'ADMIN': return 'bg-purple-100 text-purple-800';
        case 'SUPPLIER': return 'bg-blue-100 text-blue-800';
        case 'BUYER': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getStatusStyle = (status: boolean) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

const getBalanceStyle = (balance: number) => {
    if (balance > 0) return 'bg-green-100 text-green-800'
    else return 'bg-red-100 text-red-800'
}

const UserTable: React.FC<UserTableProps> = ({
    users,
    loading,
    currentPage,
    pageSize,
    totalUsers,
    totalPages,
    onViewDetail,
    onEdit,
    onDelete,
    onPageChange,
    onPageSizeChange
}) => {
    const startIdx = ((currentPage - 1) * pageSize) + 1;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['#', 'User', 'Phone', 'Role', 'Status', 'Address', 'Saldo', 'Created At', 'Actions'].map(header => (
                                <th
                                    key={header}
                                    className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${header === 'Actions' ? 'text-right' : 'text-left'}`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-lg">
                                    No users found matching the criteria.
                                </td>
                            </tr>
                        ) : (
                            users.map((user, idx) => (
                                <tr key={user.uuid} className="hover:bg-blue-50 transition duration-150 ease-in-out">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {startIdx + idx}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleStyle(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(user.status)}`}>
                                            {user.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={`Home: ${user.address} | Shipping: ${user.shipping_address}`}>
                                        <div className="truncate">{user.address}</div>
                                        <div className="text-xs text-gray-400 truncate">Ship: {user.shipping_address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBalanceStyle(user.balance)}`}>
                                            {formatRupiah(user?.balance)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewDetail(user)}
                                                className="text-blue-600 hover:text-white hover:bg-blue-500 p-2 rounded-full transition duration-150"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(user)}
                                                className="text-red-600 hover:text-white hover:bg-red-500 p-2 rounded-full transition duration-150"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                entryName="users"
                currentPage={currentPage}
                pageSize={pageSize}
                totalData={totalUsers}
                totalPages={totalPages}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};

export default UserTable;