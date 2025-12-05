export const cleanNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
};

export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("id-ID").format(num);
};