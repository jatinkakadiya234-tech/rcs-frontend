import axios from "axios";
import { getCookie } from "../utils/cookieUtils";

const API_BASE_URL = "https://rcssender.com/api";
// const API_BASE_URL = "http://localhost:8888/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getCookie("jio_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class ApiService {
  async registerUser(userData) {
    const { data } = await api.post("/register", userData);
    return data;
  }

  async loginUser(credentials) {
    const { data } = await api.post("/login", credentials);
    console.log(data , '--loginUsers-----data----------');
    return data;
  }

  async getTemplates() {
    const { data } = await api.get("/v1/templates");
    return data;
  }

  async getUserTemplates(userId) {
    const { data } = await api.get(`/v1/templates/user/${userId}`);
    return data;
  }

  async getTemplateById(id) {
    const { data } = await api.get(`/v1/templates/${id}`);
    return data;
  }

  async sendMessage(campaignData) {
    return await api.post("/v1/send-message/send", campaignData);
  }
  
  async chackcapebalNumber(phoneNumbers, userId) {
    return await api.post("/checkAvablityNumber", {
      phoneNumbers,
      userId,
    });
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post("/uploadFile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  }

  async getMessageReportsall(userId, page = 1, limit = 10) {
    const { data } = await api.get(`/v1/message-reports/alls/${userId}?page=${page}&limit=${limit}`);
    return data;
  }

  async getMessageDetails(messageId, page = 1, limit = 50) {
    const { data } = await api.get(`/v1/message-reports/details/${messageId}?page=${page}&limit=${limit}`);
    return data;
  }

  async getMessageById(phoneNumber) {
    const { data } = await api.get(`/v1/message-reports/check/${phoneNumber}`);
    return data;
  }
  async getMessageReports(page = 1, limit = 10) {
    const { data } = await api.get(`/v1/message-reports/report?page=${page}&limit=${limit}`);
    return data;
  }

  async deleteMessageReport(id) {
    const { data } = await api.delete(`/v1/message-reports/${id}`);
    return data;
  }

  async createTemplate(templateData) {
    const { data } = await api.post("/v1/templates", templateData);
    return data;
  }

  async updateTemplate(id, templateData) {
    const { data } = await api.put(`/v1/templates/${id}`, templateData);
    return data;
  }

  async deleteTemplate(id) {
    const { data } = await api.delete(`/v1/templates/${id}`);
    return data;
  }

  async getUserMessages(userId, page = 1, limit = 10) {
    const { data } = await api.get(`/messages/${userId}?page=${page}&limit=${limit}`);
    return data;
  }

  async getAllUsers() {
    const { data } = await api.get("/users");
    return data;
  }

  async addWalletRequest(requestData) {
    const { data } = await api.post("/wallet/request", requestData);
    return data;
  }

  async getrecentorders(userId) {
    const { data } = await api.get(`/v1/message-reports/recent/${userId}`);
    return data;
  }

  async getMessageStats(userId) {
    const { data } = await api.get(`/v1/message-reports/stats/${userId}`);
    return data;
  }

  async editUser(userId, userData) {
    const { data } = await api.put(`/admin/edit-user/${userId}`, userData);
    return data;
  }

  async addWalletBalance(userId, amount) {
    const { data } = await api.post(`/admin/add-wallet/${userId}`, { amount });
    return data;
  }

  async getUser(userId) {
    const { data } = await api.get(`/admin/user/${userId}`);
    return data;
  }

  async createUser(userData) {
    const { data } = await api.post('/admin/create-user', userData);
    return data;
  }

  async deleteUser(userId) {
    const { data } = await api.delete(`/admin/delete-user/${userId}`);
    return data;
  }

  async updateUserStatus(userId, status) {
    const { data } = await api.put(`/admin/user-status/${userId}`, { status });
    return data;
  }

  async resetPassword(userId, newPassword) {
    const { data } = await api.put(`/admin/reset-password/${userId}`, { newPassword });
    return data;
  }

  async deductWallet(userId, amount) {
    const { data } = await api.post(`/admin/deduct-wallet/${userId}`, { amount });
    return data;
  }

  async getWalletRequests() {
    const { data } = await api.get('/admin/wallet-requests');
    return data;
  }

  async approveWalletRequest(requestId, adminId, note) {
    const { data } = await api.post(`/admin/wallet/approve/${requestId}`, { adminId, note });
    return data;
  }

  async rejectWalletRequest(requestId, adminId, note) {
    const { data } = await api.post('/admin/wallet/reject', { requestId, adminId, note });
    return data;
  }

  async deleteWalletRequest(requestId) {
    const { data } = await api.delete(`/admin/wallet-request/${requestId}`);
    return data;
  }

  async getUserTransactions(userId, page = 1, limit = 20) {
    const { data } = await api.get(`/v1/transactions/user/${userId}?page=${page}&limit=${limit}`);
    return data;
  }

  async getUserTransactionSummary(userId) {
    const { data } = await api.get(`/v1/transactions/user/${userId}/summary`);
    return data;
  }

  async getAllTransactions(page = 1, limit = 50) {
    const { data } = await api.get(`/v1/transactions/admin/all?page=${page}&limit=${limit}`);
    return data;
  }

  async getUserStats(userId) {
    const { data } = await api.get(`/admin/user-stats/${userId}`);
    return data;
  }

  async getUserAdminMessages(userId, page = 1, limit = 10) {
    const { data } = await api.get(`/admin/user-messages/${userId}?page=${page}&limit=${limit}`);
    return data;
  }

  async getUserReports(userId) {
    const { data } = await api.get(`/admin/user-reports/${userId}`);
    return data;
  }

  async getProfileWithTransactions(userId, limit = 10) {
    const { data } = await api.get(`/profile-with-transactions/${userId}?limit=${limit}`);
    return data;
  }

  async getDashboard() {
    const { data } = await api.get('/admin/dashboard');
    return data;
  }

  async getUserOrders(userId, page = 1, limit = 10) {
    const { data } = await api.get(`/admin/user-orders/${userId}?page=${page}&limit=${limit}`);
    return data;
  }

  async updateProfile(userId, profileData) {
    const { data } = await api.put(`/update-profile/${userId}`, profileData);
    return data;
  }
}

export default new ApiService();
