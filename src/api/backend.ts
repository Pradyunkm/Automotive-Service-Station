// src/api/backend.ts
import { API_CONFIG } from '../config/api.config';

const API_BASE = API_CONFIG.baseURL;

export interface AnalysisResponse {
  success: boolean;
  detections: Array<{
    type: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  annotatedImage: string;
  scratchCount: number;
  dentCount: number;
  crackCount: number;
}

export async function analyzeImageFile(file: File): Promise<AnalysisResponse> {
  const url = `${API_BASE}/api/analyze-image`;
  const formData = new FormData();
  formData.append("file", file);

  const resp = await fetch(url, { method: "POST", body: formData });
  if (!resp.ok) throw new Error(`API error ${resp.status}: ${await resp.text()}`);

  const data = await resp.json();

  return {
    success: data.success,
    detections: data.detections,
    annotatedImage: data.annotatedImage,
    scratchCount: data.scratchCount || 0,
    dentCount: data.dentCount || 0,
    crackCount: data.crackCount || 0
  };
}

export async function healthCheck() {
  const resp = await fetch(`${API_BASE}/api/health`);
  return resp.json();
}
