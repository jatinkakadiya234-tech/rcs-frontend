import axios from 'axios'

const API_BASE_URL = 'http://localhost:8888/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

class ApiService {
  async registerUser(userData) {
    const { data } = await api.post('/user/register', userData)
    return data
  }

  async loginUser(credentials) {
    const { data } = await api.post('/user/login', credentials)
    return data
  }

  async getTemplates() {
    const { data } = await api.get('/templates')
    return data
  }

  async getTemplateById(id) {
    const { data } = await api.get(`/templates/${id}`)
    return data
  }

  async sendMessage(campaignData) {
   return  await api.post('/user/sendMessage', campaignData)
  }
  async chackcapebalNumber(phoneNumbers) {
    return await api.post('/user/checkAvablityNumber', {phoneNumbers})
  }

  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data } = await api.post('/user/uploadFile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  }

  async getMessageReportsall() {
    const { data } = await api.get('/message-reports/alls')
    return data
  }

  async getMessageById(phoneNumber) {
    const { data } = await api.get(`/message-reports/check/${phoneNumber}`)
    return data
  }
  async getMessageReports() {
    const { data } = await api.get('/message-reports/report')
    return data
  }

  async deleteMessageReport(id) {
    const { data } = await api.delete(`/message-reports/${id}`)
    return data
  }

  async createTemplate(templateData) {
    const { data } = await api.post('/templates', templateData)
    return data
  }

  async updateTemplate(id, templateData) {
    const { data } = await api.put(`/templates/${id}`, templateData)
    return data
  }

  async deleteTemplate(id) {
    const { data } = await api.delete(`/templates/${id}`)
    return data
  }
}

export default new ApiService()