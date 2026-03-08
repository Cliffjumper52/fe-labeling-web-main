import api from "../api/axios";
import type {
  CreateAccountDto,
  FilterAccountDto,
  UpdateAccountDto,
} from "../interface/account/dtos";

export const getAccountByEmail = async (email: string) => {
  try {
    const resp = await api.get(`/accounts/email?email=${email}`);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const getAllAccounts = async (
  filter: FilterAccountDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());

    const resp = await api.get(`/accounts/all?${queryParams.toString()}`);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const getAccountPaginated = async (
  filter: FilterAccountDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/accounts?${queryParams.toString()}`);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const getAccountById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/accounts/${id}?${queryParams.toString()}`);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const createAccount = async (dto: CreateAccountDto) => {
  try {
    const resp = await api.post("/accounts", dto);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const updateAccount = async (id: string, dto: UpdateAccountDto) => {
  try {
    const resp = await api.patch(`/accounts/${id}`, dto);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async (id: string) => {
  try {
    const resp = await api.delete(`/accounts/${id}`);
    return resp;
  } catch (error) {
    throw error;
  }
};

export const restoreAccount = async (id: string) => {
  try {
    const resp = await api.patch(`/accounts/restore/${id}`);
    return resp;
  } catch (error) {
    throw error;
  }
};
