import api from "./axios";

// Fetch the authenticated user's profile
export const getUserProfile = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Update personal details (full name, email, department)
export const updateProfile = async (id, profileData) => {
  const response = await api.put(`/users/${id}/profile`, profileData);
  return response.data;
};

// Change user password
export const updatePassword = async (id, passwordData) => {
  const response = await api.patch(`/users/${id}/password`, passwordData);
  return response.data;
};

// Update personal notification toggles
export const updateNotifications = async (id, notificationData) => {
  const response = await api.patch(`/users/${id}/notifications`, notificationData);
  return response.data;
};