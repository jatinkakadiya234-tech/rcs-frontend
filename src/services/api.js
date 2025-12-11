import axios from "axios";
import { getCookie } from "../utils/cookieUtils";

const API_BASE_URL = "https://rcssender.com/api/api";
// const API_BASE_URL = "http://localhost:8888";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getCookie('jio_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class ApiService {
  async registerUser(userData) {
    const { data } = await api.post("/api/v1/user/register", userData);
    return data;
  }

  async loginUser(credentials) {
    const { data } = await api.post("/api/v1/user/login", credentials);
    return data;
  }

  async getTemplates() {
    const { data } = await api.get("/api/v1/templates");
    return data;
  }

  async getUserTemplates(userId) {
    const { data } = await api.get(`/api/v1/templates/user/${userId}`);
    return data;
  }

  async getTemplateById(id) {
    const { data } = await api.get(`/api/v1/templates/${id}`);
    return data;
  }

  async sendMessage(campaignData) {
    return await api.post("/api/v1/user/sendMessage", campaignData);
  }
  async chackcapebalNumber(phoneNumbers, userId) {
    return await api.post("/api/v1/user/checkAvablityNumber", { phoneNumbers,userId });
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post("/api/v1/user/uploadFile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  }

  async getMessageReportsall(userId) {
    const { data } = await api.get(`/api/v1/message-reports/alls/${userId}`);
    return data;
  }

  async getMessageById(phoneNumber) {
    const { data } = await api.get(`/api/v1/message-reports/check/${phoneNumber}`);
    return data;
  }
  async getMessageReports() {
    const { data } = await api.get("/api/v1/message-reports/report");
    return data;
  }

  async deleteMessageReport(id) {
    const { data } = await api.delete(`/api/v1/message-reports/${id}`);
    return data;
  }

  async createTemplate(templateData) {
    const { data } = await api.post("/api/v1/templates", templateData);
    return data;
  }

  async updateTemplate(id, templateData) {
    const { data } = await api.put(`/api/v1/templates/${id}`, templateData);
    return data;
  }

  async deleteTemplate(id) {
    const { data } = await api.delete(`/api/v1/templates/${id}`);
    return data;
  }

  async getUserMessages(userId) {
    const { data } = await api.get(`/api/v1/user/messages/${userId}`);
    return data;
  }

  async getAllUsers() {
    const { data } = await api.get('/api/v1/user/users');
    return data;
  }

  async addWalletRequest(requestData) {
    const { data } = await api.post("/api/v1/user/wallet/request", requestData);
    return data;
  }
  async getrecentorders(userId) {
    const { data } = await api.get(`/api/v1/message-reports/recent/${userId}`);
    return data;
  }

  async getMessageStats(userId) {
    const { data } = await api.get(`/api/v1/message-reports/stats/${userId}`);
    return data;
  }
}

export default new ApiService();
