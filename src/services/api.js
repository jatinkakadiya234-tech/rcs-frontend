import axios from "axios";

const API_BASE_URL = "https://rcssender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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

  async getTemplateById(id) {
    const { data } = await api.get(`/api/v1/templates/${id}`);
    return data;
  }

  async sendMessage(campaignData) {
    return await api.post("/api/v1/user/sendMessage", campaignData);
  }
  async chackcapebalNumber(phoneNumbers) {
    return await api.post("/api/v1/user/checkAvablityNumber", { phoneNumbers });
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

  async getMessageReportsall() {
    const { data } = await api.get("/api/v1/message-reports/alls");
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
}

export default new ApiService();
