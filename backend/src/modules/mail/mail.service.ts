import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendCredentialsDto {
  to: string;
  employeeName: string;
  username: string;
  password?: string;
  isPasswordReset?: boolean;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT', 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Transporter initialized for host: ${host}`);
    } else {
      this.logger.warn('SMTP credentials not configured. Email dispatch will operate in simulation/log mode.');
    }
  }

  async sendLoginCredentials(data: SendCredentialsDto) {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const from = this.config.get<string>('SMTP_FROM', '"1Office HRM" <no-reply@1office.vn>');
    const subject = data.isPasswordReset
      ? `[1Office HRM] Mật khẩu mới cho tài khoản ${data.username}`
      : `[1Office HRM] Thư thông tin tài khoản làm việc của ${data.employeeName}`;

    const passHtml = data.password
      ? `<p style="margin: 0 0 8px 0;">🔑 <strong>Mật khẩu:</strong> <code style="color: #e83e8c; font-weight: bold; background: #fff0f5; padding: 3px 8px; border-radius: 4px; border: 1px solid #f8bbd0; font-size: 14px;">${data.password}</code></p>`
      : `<p style="margin: 0 0 8px 0;">🔑 <strong>Mật khẩu:</strong> <em>Mật khẩu tự gán bởi Quản trị viên (hoặc giữ nguyên mật khẩu cũ)</em></p>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #e83e8c; padding: 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">1Office HRM Workspace</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Thông tin tài khoản đăng nhập hệ thống</p>
        </div>
        <div style="padding: 28px; color: #334155; line-height: 1.6; font-size: 14.5px;">
          <p style="margin-top: 0;">Xin chào <strong>${data.employeeName}</strong>,</p>
          <p>Tài khoản sử dụng hệ thống quản trị nhân sự 1Office của bạn đã được kích hoạt thành công. Dưới đây là thông tin chi tiết đăng nhập:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;">🌐 <strong>Đường dẫn truy cập:</strong> <a href="${appUrl}" target="_blank" style="color: #e83e8c; font-weight: 600; text-decoration: underline;">${appUrl}</a></p>
            <p style="margin: 0 0 10px 0;">👤 <strong>Tên đăng nhập:</strong> <code style="color: #e83e8c; font-weight: bold; background: #fff0f5; padding: 3px 8px; border-radius: 4px; border: 1px solid #f8bbd0; font-size: 14px;">${data.username}</code></p>
            ${passHtml}
          </div>

          <div style="background-color: #fffbe6; border: 1px solid #ffe58f; padding: 12px 16px; border-radius: 6px; color: #d48806; font-size: 13px; margin-bottom: 20px;">
            ⚠️ <strong>Lưu ý bảo mật:</strong> Để đảm bảo an toàn cho tài khoản cá nhân, vui lòng đăng nhập và chủ động đổi lại mật khẩu trong lần đầu truy cập.
          </div>

          <p style="margin-bottom: 0;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ Bộ phận Nhân sự hoặc Quản trị viên hệ thống.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          © 1Office HRM Workspace — Email thông báo tự động từ hệ thống.
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: data.to,
          subject,
          html,
        });
        this.logger.log(`Email successfully sent to ${data.to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId, mode: 'SMTP' };
      } catch (err: any) {
        this.logger.error(`Failed to send SMTP email to ${data.to}: ${err?.message || err}`);
        return { success: false, error: err?.message, mode: 'SMTP_FAILED' };
      }
    } else {
      this.logger.log(`[SIMULATED EMAIL DISPATCH]`);
      this.logger.log(`To: ${data.to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Username: ${data.username}, Password: ${data.password || '(Hidden)'}`);
      return { success: true, mode: 'SIMULATED', to: data.to };
    }
  }
}
