import { invoke } from '@tauri-apps/api/tauri';

export interface FileMetadata {
  id: number;
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  created_at: string;
}

export const filesAPI = {
  uploadFile: async (filename: string, content: Uint8Array, mimetype: string): Promise<FileMetadata> => {
    return invoke('upload_file', {
      filename,
      content: Array.from(content),
      mimetype,
    });
  },

  getFileMetadata: (id: number): Promise<FileMetadata> => {
    return invoke('get_file_metadata', { id });
  },

  readFileContent: (id: number): Promise<number[]> => {
    return invoke('read_file_content', { id });
  },

  deleteFile: (id: number): Promise<void> => {
    return invoke('delete_file', { id });
  },

  listFiles: (limit?: number): Promise<FileMetadata[]> => {
    return invoke('list_files', { limit });
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export async function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

