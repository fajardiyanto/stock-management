import React from 'react';
import { User } from '../../types';
import { X, Edit2 } from 'lucide-react';

interface UserModalDetailProps {
    user: User;
    onClose: () => void;
    onEdit: () => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
        <div className="text-gray-900 font-medium break-words">{value}</div>
    </div>
);

const UserModalDetail: React.FC<UserModalDetailProps> = ({ user, onClose, onEdit }) => {
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadge = (role: string) => {
        let style = 'bg-gray-100 text-gray-800';
        if (role === 'ADMIN') style = 'bg-purple-100 text-purple-800';
        else if (role === 'SUPPLIER') style = 'bg-blue-100 text-blue-800';
        else if (role === 'BUYER') style = 'bg-yellow-100 text-yellow-800';
        return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>{role}</span>;
    };

    const getStatusBadge = (status: boolean) => {
        const style = status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>{status ? 'Active' : 'Inactive'}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-2xl font-bold text-gray-800">User Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-8 pt-6">
                    {/* User Avatar & Name Section */}
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-200">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 className="text-3xl font-extrabold text-gray-800">{user.name}</h4>
                            <p className="text-gray-500 mt-1">
                                <span className="font-mono text-xs text-gray-400">UUID: </span>
                                <span className="font-mono text-sm">{user.uuid.substring(0, 8)}...</span>
                            </p>
                        </div>
                    </div>

                    {/* User Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 border p-4 rounded-lg bg-gray-50">
                        <DetailRow label="User ID" value={<span className="font-mono text-sm">{user.id}</span>} />
                        <DetailRow label="Phone" value={user.phone} />
                        <DetailRow label="Role" value={getRoleBadge(user.role)} />
                        <DetailRow label="Status" value={getStatusBadge(user.status)} />
                        <div className="sm:col-span-2">
                            <DetailRow label="Registered At" value={formatDateTime(user.created_at)} />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                        <h4 className="text-xl font-bold text-gray-700">Address Information</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <DetailRow label="Primary Address" value={user.address} />
                            <DetailRow label="Shipping Address" value={user.shipping_address} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                        <Edit2 size={16} />
                        Edit User
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserModalDetail;