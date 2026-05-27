export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export function formatDate(value?: string): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatLongDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${weekday}, ${day}/${month}/${year}`;
}

export function formatShortDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getCountdown(dateStr: string, timeStr: string): string {
  const apptDate = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diffMs = apptDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 0) return 'Đã qua';
  if (diffDays === 0) return `Hôm nay lúc ${timeStr}`;
  if (diffDays === 1) return `Ngày mai lúc ${timeStr}`;
  return `Trong ${diffDays} ngày`;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { error?: { message?: string } } } })
      .response;
    return resp?.data?.error?.message ?? 'Đã có lỗi xảy ra.';
  }
  return 'Đã có lỗi xảy ra.';
}
