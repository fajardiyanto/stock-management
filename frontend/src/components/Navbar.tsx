import React, { useState, useRef, useEffect } from "react";
import { authService } from "../services/authService";
import { widthOptions } from "../types";
import UserModalChangePassword from "./UserComponents/UserModalChangePassword";

interface NavbarProps {
    activeMenu: string;
    onLogout: () => void;
    onWidthChange: (width: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
    activeMenu,
    onLogout,
    onWidthChange,
}) => {
    const userData = authService.getUser();

    const [open, setOpen] = useState(false);
    const [openWidthMenu, setOpenWidthMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const currentWidth = localStorage.getItem("maxWidth") || "";
    const [openChangePassword, setOpenChangePassword] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const changePasswordClose = () => {
        setOpenChangePassword(false);
    };

    return (
        <header className="bg-white shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800 capitalize">
                    {activeMenu}
                </h2>

                <div className="relative" ref={dropdownRef}>
                    <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => setOpen(!open)}
                    >
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">
                                {userData?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                                {userData?.phone || "user@example.com"}
                            </p>
                        </div>

                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {userData?.name?.[0] || "U"}
                        </div>
                    </div>

                    {open && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-20 animate-fadeIn">
                            <div className="relative">
                                <button
                                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100"
                                    onClick={() =>
                                        setOpenWidthMenu(!openWidthMenu)
                                    }
                                >
                                    Width Settings
                                    <span className="text-xs text-gray-500">
                                        {openWidthMenu ? "▲" : "▼"}
                                    </span>
                                </button>

                                {openWidthMenu && (
                                    <div className="px-4 pb-2 pt-1 space-y-1 animate-fadeIn">
                                        {widthOptions.map((item) => (
                                            <button
                                                key={item.percent}
                                                className={`w-full text-left py-1 text-sm rounded flex justify-between ${
                                                    currentWidth === item.label
                                                        ? "bg-blue-600 text-white"
                                                        : "text-black hover:bg-gray-200"
                                                }`}
                                                onClick={() => {
                                                    onWidthChange(item.label);
                                                    setOpen(false);
                                                    setOpenWidthMenu(false);
                                                }}
                                            >
                                                <span className="pl-2">
                                                    {item.percent}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                    onClick={() => {
                                        setOpenChangePassword(true);
                                        setOpen(false);
                                    }}
                                >
                                    Ubah Password
                                </button>
                            </div>

                            <div className="border-t my-1" />

                            <button
                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                onClick={onLogout}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {openChangePassword && (
                    <UserModalChangePassword onClose={changePasswordClose} />
                )}
            </div>
        </header>
    );
};

export default Navbar;
