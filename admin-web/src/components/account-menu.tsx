'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { App, Avatar, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { authError, logout } from '@/lib/api-client';

const items = [
  { id: 'settings', label: 'Cài đặt hệ thống', path: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M10 3h4l1 3 3 1 3 3v4l-3 1-1 3-3 3h-4l-1-3-3-1-3-3v-4l3-1 1-3Z', description: 'Các thiết lập hệ thống sẽ được bổ sung sau khi thống nhất yêu cầu và quyền quản trị.' },
  { id: 'billing', label: 'Thông tin đối soát', path: 'M16 4h3v15H5V4h3 M9 7h6 M12 5v12 M15 9c0-3-6-3-6 0s6 1 6 4-6 3-6 0', description: 'Mục đối soát hiện là khung giao diện. Nội dung và nguồn dữ liệu cần được xác định trước khi triển khai.' },
  { id: 'guide', label: 'Hướng dẫn sử dụng', path: 'M6 3h12v18H6a3 3 0 0 1 0-6h12 M6 3a3 3 0 0 0-3 3v12 M8 7h6 M8 11h6', description: 'Bấm menu 4 ô ở góc trên bên trái để mở 8 chức năng HRM. Chọn một chức năng để xem trang khung; bấm Trang chủ để quay lại tổng quan.' },
  { id: 'theme', label: 'Màu giao diện', path: 'M4 3h6v15a3 3 0 0 1-6 0Z M10 8l4-4 4 4-8 9 M10 15h11v6H7 M7 17v1', description: 'Giao diện hiện sử dụng tông tím. Chức năng chọn và lưu màu cá nhân sẽ được bổ sung sau.' },
  { id: 'language', label: 'Ngôn ngữ', path: 'M3 4h11 M8 2v2 M5 7c1 4 4 6 8 8 M12 4c0 5-4 9-9 11 M14 21l4-10 4 10 M16 17h4', description: 'Ngôn ngữ hiện tại là Tiếng Việt. Các ngôn ngữ khác chưa được triển khai.' },
  { id: 'password', label: 'Đổi mật khẩu', path: 'M14 10l7-7 M17 7l3 3 M19 5l2 2 M14 14a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z', description: 'Chức năng đổi mật khẩu sẽ khả dụng khi hệ thống đăng nhập được kết nối.' },
  { id: 'logout', label: 'Đăng xuất', path: 'M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5 M9 12h12 M17 8l4 4-4 4', description: 'Đây là giao diện khởi tạo, chưa có phiên đăng nhập để đăng xuất.' },
] as const;

export function AccountMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const [loggingOut, setLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<typeof items[number] | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [open]);
  return (
    <>
      <button ref={triggerRef} className="account-trigger" aria-label="Mở menu tài khoản" aria-haspopup="dialog"
        aria-controls={open ? 'account-panel' : undefined}
        aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Avatar size={38} style={{ backgroundColor: '#568574' }}>{user?.displayName.charAt(0).toUpperCase()}</Avatar>
      </button>
      {open && createPortal(<>
        <div className="account-backdrop" aria-hidden="true" />
        <div ref={panelRef} id="account-panel" role="dialog" className="account-panel" aria-labelledby="account-menu-title">
        <header className="account-card-header">
          <Avatar size={60} style={{ backgroundColor: '#568574', fontSize: 34 }}>{user?.displayName.charAt(0).toUpperCase()}</Avatar>
          <h2 id="account-menu-title">{user?.displayName}</h2>
          <button className="account-close" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Đóng menu tài khoản">×</button>
        </header>
        <nav className="account-actions" aria-label="Tùy chọn tài khoản">
          {items.map((item) => (
            <button key={item.id} className={'account-action account-action-' + item.id}
              disabled={loggingOut}
              onClick={async () => {
                setOpen(false);
                if (item.id === 'password') { router.push('/change-password'); return; }
                if (item.id === 'settings') { router.push('/hrm/admin/departments'); return; }
                if (item.id === 'logout') {
                  setLoggingOut(true);
                  try { await logout(); router.replace('/login'); }
                  catch (error) { void message.error(authError(error)); }
                  finally { setLoggingOut(false); }
                  return;
                }
                setDetail(item);
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={item.path} />
              </svg>
              <span>{item.label}</span>
              {item.id === 'theme' && <span className="account-color" aria-label="Màu tím" />}
              {item.id === 'language' && <span className="account-language">VN <span aria-hidden="true">›</span></span>}
            </button>
          ))}
        </nav>
        </div>
      </>, document.body)}
      <Modal title={detail?.label} open={detail !== null} onCancel={() => setDetail(null)}
        footer={null} width={440}>
        <p className="account-detail">{detail?.description}</p>
      </Modal>
    </>
  );
}
