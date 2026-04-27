/**
 * 将 type 字段归一化为字符串数组
 * 支持：数组、单个字符串、undefined/null
 */
export function normalizeType(type) {
  if (Array.isArray(type)) {
    return type.filter((item) => typeof item === 'string' && item.trim() !== '');
  }
  if (typeof type === 'string' && type.trim() !== '') {
    return [type.trim()];
  }
  return [];
}
