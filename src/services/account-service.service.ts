import api from "../api/axios";

export const getAccountByEmail = async (email: string) => {
  try {
    const resp = await api.get(`/accounts/email?email=${email}`);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const getAllAccounts = async () => {};
