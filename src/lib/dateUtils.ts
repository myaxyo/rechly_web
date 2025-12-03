import dayjs from "dayjs";
import "dayjs/locale/de";

/**
 * Date Utilities
 */

/**
 * Format date in German format (DD.MM.YYYY)
 */
export const formatDateGerman = (date: Date | string): string => {
    try {
        return dayjs(date).locale("de").format("DD.MM.YYYY");
    } catch (error) {
        console.error("Error formatting date:", error);
        return "";
    }
};

/**
 * Format date in ISO format (YYYY-MM-DD) for database storage
 */
export const formatDateISO = (date: Date | string): string => {
    try {
        return dayjs(date).format("YYYY-MM-DD");
    } catch (error) {
        console.error("Error formatting date to ISO:", error);
        return "";
    }
};

/**
 * Get current date in ISO format
 */
export const getCurrentDateISO = (): string => {
    return formatDateISO(new Date());
};

/**
 * Add days to a date
 */
export const addDaysToDate = (date: Date | string, days: number): Date => {
    return dayjs(date).add(days, "day").toDate();
};

/**
 * Calculate due date (14 days from issue date by default)
 */
export const calculateDueDate = (
    issueDate: Date | string,
    daysUntilDue: number = 14
): string => {
    const dueDate = addDaysToDate(issueDate, daysUntilDue);
    return formatDateISO(dueDate);
};

/**
 * Format date for display based on locale
 */
export const formatDateForLocale = (
    date: Date | string,
    locale: string = "de"
): string => {
    if (locale === "de" || locale === "de-DE") {
        return formatDateGerman(date);
    }
    // English format: MM/DD/YYYY
    try {
        return dayjs(date).format("MM/DD/YYYY");
    } catch (error) {
        console.error("Error formatting date for locale:", error);
        return "";
    }
};

/**
 * Get current timestamp (for created_at/updated_at)
 */
export const getCurrentTimestamp = (): number => {
    return Date.now();
};
