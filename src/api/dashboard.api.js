import api from "./axios";

export const getWeeklyActivity = async () => {
    const response = await api.get("/dashboard/weekly-activity");
    return response.data; // Expecting { success: true, data: [...] }
};