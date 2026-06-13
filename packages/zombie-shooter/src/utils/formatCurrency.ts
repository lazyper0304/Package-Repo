// 货币格式化 - 三位逗号分隔
export function formatCurrency(num: number): string {
  if (num < 0) return '-' + formatCurrency(-num);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
