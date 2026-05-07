import axios from 'axios'

// Dev: Vite proxy handles /api → localhost:8000 (baseURL = '')
// Prod: VITE_API_URL = https://[HF_USERNAME]-woundwatch.hf.space
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 60000, // 60s — Gemma inference can be slow
})

export default api
