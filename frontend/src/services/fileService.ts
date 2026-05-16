import api from './api';

export interface UploadedFile {
  id: number;
  filename: string;
  size: number;
  uploaded_at: string;
}

export const fileService = {
  async upload(file: File): Promise<{ filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async list(): Promise<UploadedFile[]> {
    const { data } = await api.get('/files');
    return data;
  },

  async deleteFile(filename: string): Promise<void> {
    await api.delete(`/files/${filename}`);
  },

  async filelessExec(sessionId: string, scriptPath: string): Promise<void> {
    await api.post('/files/fileless-exec', null, {
      params: { session_id: sessionId, script_path: scriptPath },
    });
  },
};
