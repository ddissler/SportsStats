import axios from 'axios'

const axiosClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response?.status, error.message)
    return Promise.reject(error)
  }
)

export default axiosClient
