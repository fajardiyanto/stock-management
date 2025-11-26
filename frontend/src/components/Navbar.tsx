import React from 'react';
import { User } from '../types/user';

interface NavbarProps {
    activeMenu: string;
    userData: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ activeMenu, userData }) => {
    return (
        <header className="bg-white shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800 capitalize">
                    {activeMenu}
                </h2>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                            {userData?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {userData?.phone || 'user@example.com'}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {userData?.name?.[0] || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;