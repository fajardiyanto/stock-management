import React from 'react';
import { User } from '../../types';
import { Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

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
    onPageChange
}) => {
    const startIdx = ((currentPage - 1) * pageSize) + 1;
    const endIdx = Math.min(currentPage * pageSize, totalUsers);

    const paginationRange = [];
    const maxPages = Math.min(totalPages, 5);
    const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);

    for (let i = startPage; i <= endPage; i++) {
        paginationRange.push(i);
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center h-40">
                <p className="text-gray-500">Refreshing user list...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['#', 'User', 'Phone', 'Role', 'Status', 'Address', 'Created At', 'Actions'].map(header => (
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

            {/* Pagination */}
            <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-100">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{startIdx}</span> to{' '}
                    <span className="font-semibold">{endIdx}</span> of{' '}
                    <span className="font-semibold">{totalUsers}</span> users
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="flex gap-1">
                        {paginationRange.map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'border border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        {totalPages > endPage && (
                            <span className="px-4 py-2 text-gray-500">...</span>
                        )}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition"
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserTable;