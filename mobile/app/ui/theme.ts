export const colors = {
  ink: '#211936',
  muted: '#80758F',
  olive: '#7356E8',
  purple: '#7356E8',
  purpleDeep: '#5640C4',
  lavender: '#F0EDFF',
  surface: '#FBFAFF',
  line: '#ECE8FA',
  mint: '#A8F2D0',
  dark: '#151025',
};

export type ApiStatus = 'checking' | 'online' | 'offline' | 'unconfigured';

export const statusLabel: Record<ApiStatus, string> = {
  checking: 'Đang kiểm tra kết nối',
  online: 'Dịch vụ đã kết nối',
  offline: 'Không thể kết nối dịch vụ',
  unconfigured: 'Chưa cấu hình dịch vụ',
};
