'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import './notification-bell.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// Demo notifications for when API is unavailable
const DEMO_NOTIFS: Notification[] = [
  { id: 'n1', title: 'Đơn mới: Đơn làm thêm giờ', body: 'Nguyễn Thị B vừa gửi Đơn làm thêm giờ. Vui lòng xem xét và duyệt.', type: 'APPLICATION', referenceId: 'app1', isRead: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'n2', title: 'Đơn mới: Xác nhận Check-in', body: 'Trần Văn C vừa gửi Xác nhận Check-in. Vui lòng xem xét và duyệt.', type: 'APPLICATION', referenceId: 'app2', isRead: false, createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'n3', title: 'Đơn mới: Đơn nghỉ phép', body: 'Lê Thị D vừa gửi Đơn nghỉ phép. Vui lòng xem xét và duyệt.', type: 'APPLICATION', referenceId: 'app3', isRead: true, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const useDemoRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('hrm_token');
      if (!token) { useDemoRef.current = true; setNotifications(DEMO_NOTIFS); setUnread(DEMO_NOTIFS.filter(n => !n.isRead).length); return; }
      const res = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const items: Notification[] = json.items ?? json ?? [];
      setNotifications(items.slice(0, 10));
      setUnread(items.filter((n: Notification) => !n.isRead).length);
      useDemoRef.current = false;
    } catch {
      if (notifications.length === 0) {
        useDemoRef.current = true;
        setNotifications(DEMO_NOTIFS);
        setUnread(DEMO_NOTIFS.filter(n => !n.isRead).length);
      }
    }
  }, []);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    if (useDemoRef.current) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
      return;
    }
    try {
      const token = localStorage.getItem('hrm_token');
      await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  const markRead = async (id: string) => {
    if (useDemoRef.current) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
      return;
    }
    try {
      const token = localStorage.getItem('hrm_token');
      await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <div className="notif-bell-wrap" ref={dropdownRef}>
      <button
        className={`notif-bell-btn ${open ? 'is-open' : ''}`}
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        aria-label={`Thông báo${unread > 0 ? ` (${unread} chưa đọc)` : ''}`}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-title">Thông báo</span>
            {unread > 0 && (
              <button className="notif-read-all-btn" onClick={markAllRead}>Đọc tất cả</button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">
                <span>🔔</span>
                <p>Không có thông báo mới</p>
              </div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => markRead(n.id)}
              >
                <div className={`notif-item-dot ${!n.isRead ? 'visible' : ''}`} />
                <div className="notif-item-icon">
                  {n.type === 'APPLICATION' ? '📋' : '🔔'}
                </div>
                <div className="notif-item-content">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-body">{n.body}</div>
                  <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                </div>
                {n.type === 'APPLICATION' && n.referenceId && (
                  <Link
                    href={`/hrm/applications`}
                    className="notif-action-btn"
                    onClick={e => e.stopPropagation()}
                  >
                    Xem →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="notif-dropdown-footer">
            <Link href="/hrm/applications" className="notif-all-link" onClick={() => setOpen(false)}>
              Xem tất cả đơn từ →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
