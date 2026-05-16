import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, File, FileCode } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { fileService } from '../services/fileService';
import type { UploadedFile } from '../services/fileService';
import { formatDistanceToNow } from 'date-fns';

export default function Files() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const data = await fileService.list();
      setFiles(data);
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await fileService.upload(file);
      refresh();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (confirm(`Delete ${filename}?`)) {
      await fileService.deleteFile(filename);
      refresh();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <TopBar title="File Manager" />
      <div className="p-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Uploaded Files ({files.length})</h3>
            <div>
              <input ref={fileInput} type="file" onChange={handleUpload} className="hidden" />
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.length === 0 ? (
              <div className="text-center text-text-muted py-12 text-sm">
                No files uploaded yet. Upload scripts, binaries, or payloads.
              </div>
            ) : (
              files.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-border/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-accent-purple" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{f.filename}</p>
                      <p className="text-xs text-text-muted">
                        {formatSize(f.size)} &middot; {formatDistanceToNow(new Date(f.uploaded_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(f.filename)}
                    className="p-1.5 rounded hover:bg-danger/10 text-danger transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
