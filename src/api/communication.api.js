import api from "./axios";

export const getMessages = async () => {
    const response = await api.get("/communication");
    return response.data;
};

export const getMessageById = async (id) => {
    const response = await api.get(`/communication/${id}`);
    return response.data;
};

export const sendMessage = async (messageData) => {
    const response = await api.post("/communication", messageData);
    return response.data;
};

export const updateMessage = async (id, messageData) => {
    const response = await api.put(`/communication/${id}`, messageData);
    return response.data;
};

export const deleteMessage = async (id) => {
    const response = await api.delete(`/communication/${id}`);
    return response.data;
};