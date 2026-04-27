/**
 * 动态构建 SQL SET 子句
 * @param {Object} fieldMap - { fieldName: value } 的对象，值为 undefined 的字段会被跳过
 * @returns {{ setClauses: string[], params: any[] }}
 */
export function buildSetClause(fieldMap) {
  const setClauses = [];
  const params = [];

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value === undefined) continue;

    setClauses.push(`${field} = ?`);
    params.push(value);
  }

  return { setClauses, params };
}
