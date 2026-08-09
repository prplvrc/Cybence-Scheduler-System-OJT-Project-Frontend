import api from "./axios";

export const getCalendarEvents = async () => {
    const response = await api.get("/calendar");
    return response.data;
};

export const getCalendarEventById = async (id) => {
    const response = await api.get(`/calendar/${id}`);
    return response.data;
};

export const createCalendarEvent = async (eventData) => {
    const response = await api.post("/calendar", eventData);
    return response.data;
};

export const updateCalendarEvent = async (id, eventData) => {
    const response = await api.put(`/calendar/${id}`, eventData);
    return response.data;
};

export const deleteCalendarEvent = async (id) => {
    const response = await api.delete(`/calendar/${id}`);
    return response.data;
};