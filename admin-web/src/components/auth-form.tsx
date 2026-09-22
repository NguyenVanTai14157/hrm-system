'use client';
import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd';
import { rememberedUsername, rememberUsername } from '@/lib/login-preference';
import { useRouter } from 'next/navigation';
import { authError, changePassword, login, logout } from '@/lib/api-client';
import { useAuth } from './auth-provider';

interface Values { username: string; password: string; currentPassword: string; newPassword: string; confirm: string; rememberMe: boolean }
export function AuthForm({ mode }: { mode: 'login' | 'password' }) {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const passwordMode = mode === 'password';
  const [form] = Form.useForm<Values>();
  useEffect(() => {
    if (passwordMode) return;
    const username = rememberedUsername();
    form.setFieldsValue({ username, rememberMe: Boolean(username) });
  }, [form, passwordMode]);
  async function submit(values: Values) {
    setError(''); setBusy(true);
    try {
      const account = passwordMode
        ? await changePassword(values.currentPassword, values.newPassword)
        : await login(values.username.trim(), values.password, values.rememberMe);
      router.replace(account.mustChangePassword ? '/change-password' : '/');
    } catch (err) { setError(authError(err)); }
    finally { setBusy(false); }
  }
  return (
    <main className="auth-screen">
      {/* Left: background illustration */}
      <div className="auth-bg" aria-hidden="true" />

      {/* Right: form panel */}
      <div className="auth-panel">
        <section className="auth-card">
          <div className="auth-logo">H</div>
          <span className="auth-kicker">HRM · QUẢN TRỊ</span>
          <Typography.Title level={2}>{passwordMode ? 'Đổi mật khẩu' : 'Đăng nhập'}</Typography.Title>
          <p className="auth-subtitle">{passwordMode
            ? (user?.mustChangePassword ? 'Đổi mật khẩu được cấp để bắt đầu sử dụng tài khoản.' : 'Đặt mật khẩu mới để bảo vệ tài khoản của bạn.')
            : 'Đăng nhập để truy cập không gian làm việc của bạn.'}</p>
          {error && <Alert type="error" message={error} showIcon className="auth-alert" />}
          <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} disabled={busy}
            initialValues={{ rememberMe: false }}
            onValuesChange={(changed: Partial<Values>) => { if (changed.rememberMe === false) rememberUsername('', false); }}>
            {passwordMode ? <>
              <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true, message: 'Nhập mật khẩu hiện tại.' }]}>
                <Input.Password autoComplete="current-password" size="large" maxLength={72} />
              </Form.Item>
              <Form.Item name="newPassword" label="Mật khẩu mới" extra="Ít nhất 10 ký tự, tối đa 72 byte UTF-8." rules={[
                { required: true, message: 'Nhập mật khẩu mới.' },
                { validator: (_, value: string) => !value || (value.length >= 10 && new TextEncoder().encode(value).length <= 72)
                  ? Promise.resolve() : Promise.reject(new Error('Mật khẩu cần ít nhất 10 ký tự, tối đa 72 byte UTF-8.')) },
              ]}>
                <Input.Password autoComplete="new-password" size="large" maxLength={72} />
              </Form.Item>
              <Form.Item name="confirm" label="Nhập lại mật khẩu mới" dependencies={['newPassword']} rules={[
                { required: true, message: 'Nhập lại mật khẩu mới.' },
                ({ getFieldValue }) => ({ validator: (_, value) => !value || getFieldValue('newPassword') === value
                  ? Promise.resolve() : Promise.reject(new Error('Mật khẩu nhập lại chưa khớp.')) }),
              ]}><Input.Password autoComplete="new-password" size="large" maxLength={72} /></Form.Item>
            </> : <>
              <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, whitespace: true, message: 'Nhập tên đăng nhập.' }]}>
                <Input autoComplete="username" autoCapitalize="none" spellCheck={false} size="large" maxLength={50} placeholder="Tên đăng nhập được cấp" />
              </Form.Item>
              <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu.' }]}>
                <Input.Password autoComplete="current-password" size="large" maxLength={72} placeholder="Nhập mật khẩu" />
              </Form.Item>
              <div className="auth-remember-row">
                <Form.Item name="rememberMe" valuePropName="checked" noStyle
                  extra="Giữ phiên tối đa 7 ngày và nhớ tên đăng nhập trên thiết bị này.">
                  <Checkbox>Keep me logged in</Checkbox>
                </Form.Item>
                <Button type="link" className="auth-forgot-inline" onClick={() => setHelp(!help)}>Quên mật khẩu?</Button>
              </div>
              {help && <Alert type="info" message="Liên hệ người quản trị để được cấp lại mật khẩu." showIcon className="auth-alert" />}
            </>}
            <Button htmlType="submit" type="primary" block size="large" loading={busy} className="auth-submit-btn">
              {passwordMode ? 'Lưu mật khẩu mới' : 'ĐĂNG NHẬP'}
            </Button>
          </Form>
          {passwordMode && (
            <div className="auth-footer">
              {!user?.mustChangePassword && <Button type="link" disabled={busy} onClick={() => router.push('/')}>Về trang chủ</Button>}
              <Button type="link" disabled={busy} onClick={async () => {
                setBusy(true); try { await logout(); router.replace('/login'); }
                catch (err) { setError(authError(err)); } finally { setBusy(false); }
              }}>Đăng xuất</Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
