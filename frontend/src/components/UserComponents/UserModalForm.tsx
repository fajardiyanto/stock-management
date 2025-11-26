import React from 'react';
import { X } from 'lucide-react';
import { CreateUserRequest, UpdateUserRequest } from '../../types/user';

type FormData = CreateUserRequest | UpdateUserRequest;

interface UserModalFormProps {
    type: 'ADD' | 'EDIT';
    title: string;
    initialData: FormData;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: () => void;
    onClose: () => void;
}

const UserModalForm: React.FC<UserModalFormProps> = ({
    type,
    title,
    formData,
    setFormData,
    onSubmit,
    onClose
}) => {
    const isAdd = type === 'ADD';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: FormData) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="BUYER">BUYER</option>
                                <option value="SUPPLIER">SUPPLIER</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password {isAdd ? '*' : '(leave empty to keep current)'}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={isAdd ? "Enter password" : "New password (optional)"}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Enter primary address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Address *</label>
                        <textarea
                            name="shipping_address"
                            value={formData.shipping_address}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Enter shipping address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                        {isAdd ? 'Save User' : 'Update User'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserModalForm;