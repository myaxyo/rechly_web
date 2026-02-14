import type { DashboardAnalytics } from "@/types";

const defaultAnalytics: DashboardAnalytics = {
    forecast: {
        next30Days: 0,
        next90Days: 0,
        confidence: 0,
    },
    latePaymentRisk: [],
    customerSegments: [],
    anomalies: [],
    kpiInsights: [],
    generatedAt: new Date(0).toISOString(),
};

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
    try {
        const response = await fetch("/api/analytics/insights");

        if (!response.ok) {
            return defaultAnalytics;
        }

        const data = await response.json();
        return data as DashboardAnalytics;
    } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        return defaultAnalytics;
    }
};
