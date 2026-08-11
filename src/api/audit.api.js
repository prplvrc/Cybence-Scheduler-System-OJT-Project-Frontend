import api from "./axios";

export const getAuditLogs = async () => {
    const response = await api.get("/audit-logs");
    return response.data;
};