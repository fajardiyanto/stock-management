export const MaxDate = (): string => {
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    const maxDateTime = today.toISOString().slice(0, 16);

    return maxDateTime;
}