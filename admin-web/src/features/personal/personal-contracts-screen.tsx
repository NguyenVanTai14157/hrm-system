'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, Modal, Input, App, Tag } from 'antd';
import {
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

export function PersonalContractsScreen() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [signingContract, setSigningContract] = useState<any | null>(null);
  const [otp, setOtp] = useState('');
  const [signing, setSigning] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/me/contracts');
      setContracts(res.data.contracts || []);
    } catch {
      message.error('Không thể tải danh sách hợp đồng ký số.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleSign = async () => {
    if (!otp || otp.length < 4) {
      message.warning('Vui lòng nhập mã OTP xác thực (tối thiểu 4 chữ số).');
      return;
    }

    setSigning(true);
    try {
      await apiClient.post(`/me/contracts/${signingContract.id}/sign`, { otp });
      message.success('🎉 Ký số điện tử thành công! Hợp đồng đã có hiệu lực.');
      setSigningContract(null);
      setOtp('');
      fetchContracts();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Ký số thất bại.');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="personal-content" style={{ paddingBottom: 24 }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 12, color: '#64748b' }}>Đang tải hợp đồng & ký số…</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contracts.map((cnt) => {
            const isSigned = cnt.status === 'SIGNED';
            return (
              <div key={cnt.id} className="personal-section-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <FileProtectOutlined style={{ fontSize: 24, color: isSigned ? '#10b981' : '#f59e0b' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                        {cnt.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Số hiệu: <strong>{cnt.code}</strong>
                      </div>
                    </div>
                  </div>

                  <Tag color={isSigned ? 'green' : 'orange'}>
                    {isSigned ? 'Đã ký số' : 'Chờ ký số'}
                  </Tag>
                </div>

                <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12.5, color: '#475569' }}>
                  <div>Người ký: <strong>{cnt.signerName}</strong></div>
                  <div style={{ marginTop: 4 }}>
                    Phương thức: <strong>{cnt.signMethod}</strong>
                  </div>
                  {isSigned && (
                    <div style={{ marginTop: 4, color: '#16a34a' }}>
                      Thời gian ký: {cnt.signedAt}
                    </div>
                  )}
                </div>

                {!isSigned && (
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="primary"
                      icon={<SafetyCertificateOutlined />}
                      style={{ backgroundColor: '#10b981', fontWeight: 600 }}
                      onClick={() => setSigningContract(cnt)}
                    >
                      Ký số OTP ngay
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Ký số OTP ── */}
      <Modal
        title="🔐 Xác thực ký số điện tử (OTP)"
        open={Boolean(signingContract)}
        onCancel={() => setSigningContract(null)}
        footer={null}
        centered
        width={380}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ color: '#4b5563', fontSize: 13, marginBottom: 16 }}>
            Mã OTP xác thực đã được gửi tới ứng dụng / SMS / Email của bạn cho văn bản: <strong>{signingContract?.title}</strong>.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Nhập mã OTP (Ví dụ: 123456)
            </label>
            <Input
              prefix={<KeyOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Nhập mã OTP"
              size="large"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ textAlign: 'center', letterSpacing: 4, fontSize: 18, fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setSigningContract(null)}>Hủy</Button>
            <Button
              type="primary"
              loading={signing}
              icon={<CheckCircleOutlined />}
              style={{ backgroundColor: '#10b981' }}
              onClick={handleSign}
            >
              Xác nhận ký
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
