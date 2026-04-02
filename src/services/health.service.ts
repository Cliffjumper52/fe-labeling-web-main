import api from "../api/axios";

export const checkHealth = async () => {
  try {
    const resp = await api.get("/health-check");
    return resp;
  } catch (error) {
    throw error;
  }
};
