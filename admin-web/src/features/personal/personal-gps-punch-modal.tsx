'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Spin, Tag, App } from 'antd';
import {
  EnvironmentOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  AimOutlined,
  AlertOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

interface PersonalGpsPunchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Client-side Haversine Distance helper (meters)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function PersonalGpsPunchModal({ open, onClose, onSuccess }: PersonalGpsPunchModalProps) {
  const { message } = App.useApp();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoPosition, setGeoPosition] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [assignedLocations, setAssignedLocations] = useState<any[]>([]);
  const [todayData, setTodayData] = useState<any>(null);
  const [punching, setPunching] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Acquire HTML5 GPS Geolocation
  const acquireGPS = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ định vị GPS Geolocation.');
      return;
    }
    setLocating(true);
    setGeoError(null);
    setSuccessInfo(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Quyền truy cập vị trí GPS bị từ chối. Vui lòng cho phép quyền vị trí trên trình duyệt để chấm công.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Hết thời gian chờ tín hiệu GPS. Vui lòng kiểm tra lại kết nối mạng/định vị và bấm "Lấy lại vị trí".');
        } else {
          setGeoError(`Không thể lấy vị trí GPS (${err.message || 'Lỗi thiết bị'}). Vui lòng thử lại.`);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  // Fetch today's data & assigned locations
  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [homeRes, locsRes] = await Promise.all([
        apiClient.get('/me/home'),
        apiClient.get('/me/attendance/gps-locations').catch(() => ({ data: [] })),
      ]);
      setTodayData(homeRes.data?.todayAttendance || null);
      setAssignedLocations(locsRes.data || homeRes.data?.todayAttendance?.assignedLocations || []);
    } catch {
      setTodayData(null);
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchData();
      acquireGPS();
    } else {
      setSuccessInfo(null);
    }
  }, [open, fetchData, acquireGPS]);

  // Handle GPS Punch
  const handlePunch = async () => {
    if (!geoPosition) {
      message.warning('Vui lòng đợi thiết bị lấy xong vị trí GPS.');
      return;
    }
    setPunching(true);
    setSuccessInfo(null);
    try {
      const res = await apiClient.post('/me/attendance/checkin', {
        latitude: geoPosition.latitude,
        longitude: geoPosition.longitude,
        accuracy: geoPosition.accuracy,
      });
      message.success(res.data?.message || 'Chấm công GPS thành công!');
      setSuccessInfo(res.data?.message || 'Chấm công thành công!');
      await fetchData();
      onSuccess?.();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Chấm công thất bại, vui lòng thử lại.';
      message.error(errMsg);
    } finally {
      setPunching(false);
    }
  };

  const shift = todayData?.shift || todayData?.shifts?.[0];
  const rawLogs: any[] = todayData?.rawLogs || [];

  // Evaluate closest distance
  let isAnyLocationInside = false;
  const locationDistances = assignedLocations.map((loc) => {
    if (!geoPosition) return { ...loc, distance: null, isInside: false };
    const dist = calculateHaversineDistance(
      geoPosition.latitude,
      geoPosition.longitude,
      loc.latitude,
      loc.longitude,
    );
    const inside = dist <= loc.radius;
    if (inside) isAnyLocationInside = true;
    return { ...loc, distance: dist, isInside: inside };
  });

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
          <EnvironmentOutlined style={{ color: '#16a34a' }} />
          <span>Chấm công GPS Di động</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      destroyOnClose
    >
      <div style={{ padding: '6px 0 16px 0' }}>
        {/* Employee & Shift Info Card */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: 10,
            padding: '12px 14px',
            border: '1px solid #e2e8f0',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Nhân sự:</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
              {user?.displayName || user?.username || 'Nhân sự'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Ca hôm nay:</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0284c7' }}>
              {shift ? `${shift.name} (${shift.startTime} - ${shift.endTime})` : 'Chưa được phân ca'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Địa điểm quy định:</span>
            <span style={{ fontSize: 12.5, color: '#334155' }}>
              {assignedLocations.length > 0 ? assignedLocations.map((l) => l.name).join(' • ') : 'Chưa gán địa điểm'}
            </span>
          </div>
        </div>

        {/* GPS Live Status Box */}
        <div
          style={{
            background: geoError ? '#fef2f2' : geoPosition ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${geoError ? '#fecaca' : geoPosition ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AimOutlined style={{ color: geoError ? '#ef4444' : geoPosition ? '#16a34a' : '#0284c7' }} />
              Tọa độ GPS thiết bị
            </span>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              loading={locating}
              onClick={acquireGPS}
              style={{ fontSize: 12, color: '#0284c7', padding: '0 4px' }}
            >
              Lấy lại vị trí
            </Button>
          </div>

          {locating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, padding: '6px 0' }}>
              <Spin size="small" />
              <span>Đang lấy tín hiệu vệ tinh GPS...</span>
            </div>
          ) : geoError ? (
            <div style={{ color: '#dc2626', fontSize: 12.5, lineHeight: 1.4 }}>
              <AlertOutlined style={{ marginRight: 4 }} />
              {geoError}
            </div>
          ) : geoPosition ? (
            <div>
              <div style={{ fontSize: 12.5, color: '#166534', fontWeight: 600 }}>
                ✓ Đã định vị: {geoPosition.latitude.toFixed(5)}, {geoPosition.longitude.toFixed(5)}
              </div>
              <div style={{ fontSize: 11.5, color: '#4b5563', marginTop: 2 }}>
                Độ chính xác cảm biến: ±{geoPosition.accuracy}m
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: 12.5 }}>Chưa có tọa độ GPS</div>
          )}
        </div>

        {/* Assigned GPS Locations Distance Checklist */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Khoảng cách đến các địa điểm được phép chấm ({locationDistances.length}):
          </div>
          {locationDistances.length === 0 ? (
            <div style={{ fontSize: 12.5, color: '#dc2626', background: '#fef2f2', padding: '8px 10px', borderRadius: 8 }}>
              ⚠️ Tài khoản chưa được gán địa điểm GPS hợp lệ. Vui lòng liên hệ HR.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {locationDistances.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #f1f5f9',
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{loc.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Bán kính: {loc.radius}m</div>
                  </div>
                  <div>
                    {loc.distance === null ? (
                      <span style={{ color: '#94a3b8' }}>Đang đo…</span>
                    ) : loc.isInside ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Cách {loc.distance}m (Hợp lệ)
                      </Tag>
                    ) : (
                      <Tag color="red" icon={<CloseCircleOutlined />}>
                        Cách {loc.distance}m (Ngoài bán kính)
                      </Tag>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Success Banner */}
        {successInfo && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#065f46',
              fontSize: 13,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckOutlined style={{ color: '#10b981', fontSize: 16 }} />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Main Punch Action Button */}
        <Button
          type="primary"
          block
          size="large"
          loading={punching}
          disabled={!geoPosition || locationDistances.length === 0}
          onClick={handlePunch}
          style={{
            height: 46,
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            background: isAnyLocationInside ? '#16a34a' : '#0284c7',
            borderColor: isAnyLocationInside ? '#16a34a' : '#0284c7',
            marginBottom: 14,
          }}
        >
          {punching ? 'Đang gửi dữ liệu chấm công…' : 'Chấm công GPS'}
        </Button>

        {/* Today's Punch History */}
        {rawLogs.length > 0 && (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Lịch sử các lần chấm hôm nay ({rawLogs.length} lần):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto' }}>
              {rawLogs.map((log: any, idx: number) => (
                <div
                  key={log.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f1f5f9',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    🕒 {log.timeStr}
                  </span>
                  <span style={{ color: '#64748b' }}>
                    {log.location || 'GPS Chuẩn'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
