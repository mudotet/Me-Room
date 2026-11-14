export const colors = {
  ink: '#211936',
  muted: '#80758F',
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
  checking: 'Đang kết nối trợ lý',
  online: 'Trợ lý AI đang online',
  offline: 'Trợ lý đang mất kết nối',
  unconfigured: 'Khám phá cùng Roomie',
};
