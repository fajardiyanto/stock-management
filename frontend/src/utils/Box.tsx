import React from "react";

export const SummaryBox: React.FC<{
    label: string;
    value: string;
    isRed?: boolean;
}> = ({ label, value, isRed }) => (
    <div className="flex flex-col">
        <span className="text-sm text-gray-600">{label}</span>
        <span
            className={`text-xl font-bold mt-1 ${
                isRed ? "text-red-600" : "text-gray-800"
            }`}
        >
            {value}
        </span>
    </div>
);

export const ProgressBox: React.FC<{
    label: string;
    value: string;
    isBlue?: boolean;
}> = ({ label, value, isBlue }) => (
    <div className="flex flex-col">
        <span className="text-sm text-blue-700 font-medium"> {label} </span>
        <span
            className={`text-xl font-bold mt-1 ${
                isBlue ? "text-blue-700" : "text-blue-600"
            }`}
        >
            {value}
        </span>
    </div>
);
