import { useState, useCallback } from 'react'
import api from '../lib/api'

const STORAGE_KEY = 'ww_patient'

export const DEMO_PATIENT = {
  patient_id:    'demo-patient',
  name:          'Alex Henderson',
  diabetes_type: 'Type 2',
  since:         'Apr 2026',
  is_demo:       true,
}

export const DEMO_RECORDS = [
  { id: 1, patient_id: 'demo-patient', image_path: '', date: 'Apr 3',  infection: false, ischemia: false, severity: 3.0, wound_area_cm2: 1.8, risk_level: 'LOW',    description: 'Wound appears stable with minimal signs of inflammation. Regular monitoring recommended.' },
  { id: 2, patient_id: 'demo-patient', image_path: '', date: 'Apr 10', infection: false, ischemia: true,  severity: 5.5, wound_area_cm2: 2.6, risk_level: 'MEDIUM', description: 'Wound area has increased by 44%. Reduced blood flow detected. Closer monitoring advised.' },
  { id: 3, patient_id: 'demo-patient', image_path: '', date: 'Apr 17', infection: true,  ischemia: true,  severity: 8.0, wound_area_cm2: 4.1, risk_level: 'HIGH',   description: 'Significant wound progression detected. Erythema and exudate suggest bacterial colonization. Compromised blood flow confirmed. Immediate medical attention is strongly recommended.' },
]

const REQUIRED_KEYS = ['patient_id', 'name', 'diabetes_type', 'since', 'is_demo']

function loadPatient() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // 구형 데이터(is_demo 없는 버전) 자동 마이그레이션
    if (!REQUIRED_KEYS.every(k => k in parsed)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function usePatient() {
  const [patient, setPatient] = useState(loadPatient)

  const enterDemo = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PATIENT))
    setPatient(DEMO_PATIENT)
  }, [])

  const register = useCallback(async ({ name, diabetes_type }) => {
    try {
      const { data } = await api.post('/api/patients', { name, diabetes_type })
      const info = {
        patient_id:    data.patient_id,
        name:          data.name,
        diabetes_type: data.diabetes_type,
        since:         data.created_at,
        is_demo:       false,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
      setPatient(info)
      return info
    } catch {
      const info = {
        patient_id:    crypto.randomUUID(),
        name:          name.trim(),
        diabetes_type,
        since:         new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        is_demo:       false,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
      setPatient(info)
      return info
    }
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPatient(null)
  }, [])

  return { patient, register, enterDemo, clear }
}
