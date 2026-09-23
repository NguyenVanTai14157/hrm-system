'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, App, Input } from 'antd';
import {
  FolderOpenOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

export function PersonalDocumentsScreen() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/me/documents');
      setFolders(res.data.folders || []);
    } catch {
      message.error('Không thể tải danh mục tài liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 20 }} />;
    if (name.endsWith('.docx') || name.endsWith('.doc')) return <FileWordOutlined style={{ color: '#0284c7', fontSize: 20 }} />;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileExcelOutlined style={{ color: '#10b981', fontSize: 20 }} />;
    return <FilePdfOutlined style={{ color: '#64748b', fontSize: 20 }} />;
  };

  const handleDownload = (fileName: string) => {
    message.success(`📥 Đang tải xuống tài liệu: ${fileName}`);
  };

  return (
    <div className="personal-content" style={{ paddingBottom: 24 }}>
      {/* ── Search Bar ── */}
      <div style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Tìm kiếm tài liệu, quy chế, biểu mẫu…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
          style={{ borderRadius: 8 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 12, color: '#64748b' }}>Đang tải kho tài liệu…</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {folders.map((folder) => {
            const filteredFiles = folder.files.filter((f: any) =>
              f.name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            if (searchTerm && filteredFiles.length === 0) return null;

            return (
              <div key={folder.id} className="personal-section-card" style={{ padding: '14px 16px' }}>
                <div className="personal-section-title" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                    📁 {folder.name} ({filteredFiles.length})
                  </span>
                  <FolderOpenOutlined style={{ color: '#f59e0b' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredFiles.map((file: any) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                        {getFileIcon(file.name)}
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            {file.size} • Cập nhật {file.updatedAt}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="text"
                        icon={<DownloadOutlined style={{ color: '#0284c7', fontSize: 16 }} />}
                        onClick={() => handleDownload(file.name)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
