export const formatNPWP = (value: string | undefined): string => {
    if (!value) return "-";
    const str = String(value).replace(/\D/g, "");

    if (str.length !== 15) {
        return value.toString();
    }

    return (
        str.substring(0, 2) + "." +
        str.substring(2, 5) + "." +
        str.substring(5, 8) + "." +
        str.substring(8, 9) + "-" +
        str.substring(9, 12) + "." +
        str.substring(12, 15)
    );
}

export const formatInputNPWP = (value: string | undefined): string => {
    if (!value) return "";

    const digits = value.replace(/\D/g, "").slice(0, 15);

    let result = "";

    if (digits.length > 0) result += digits.substring(0, 2);
    if (digits.length > 2) result += "." + digits.substring(2, 5);
    if (digits.length > 5) result += "." + digits.substring(5, 8);
    if (digits.length > 8) result += "." + digits.substring(8, 9);
    if (digits.length > 9) result += "-" + digits.substring(9, 12);
    if (digits.length > 12) result += "." + digits.substring(12, 15);

    return result;
}