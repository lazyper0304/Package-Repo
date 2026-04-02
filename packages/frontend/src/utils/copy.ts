import copy from 'copy-to-clipboard';
import { notify } from './notify';

export function copyToClipboard(text: string, successMessage: string = '复制成功'): boolean {
  const result = copy(text);
  if (result) {
    notify(successMessage);
  }
  return result;
}