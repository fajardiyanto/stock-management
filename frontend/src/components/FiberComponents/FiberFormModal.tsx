import React from 'react';
import { X } from 'lucide-react';
import { FiberRequest } from '../../types/fiber';

type FormData = FiberRequest;

interface FiberFormModalProps {
    type: 'ADD' | 'EDIT';
    title: string;
    initialData: FormData;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: () => void;
    onClose: () => void;
}

const FiberFormModal: React.FC<FiberFormModalProps> = ({
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl overflow-y-auto transform transition-all duration-300 scale-100">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="FREE">Tersedia</option>
                            <option value="USED">Digunakan</option>
                        </select>
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
                        {isAdd ? 'Save Fiber' : 'Update Fiber'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FiberFormModal;