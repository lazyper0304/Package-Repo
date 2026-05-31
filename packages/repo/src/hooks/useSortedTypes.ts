import { useMemo } from 'react';
import { useAppType } from '@/contexts/AppTypeContext';

export function useSortedTypes(types?: string[]) {
  const { state: appTypeState } = useAppType();

  return useMemo(() => {
    if (!types || types.length === 0) return [];
    if (!appTypeState.appTypes || appTypeState.appTypes.length === 0) return types;

    const typeSortMap = new Map<string, number>();
    appTypeState.appTypes.forEach((appType) => {
      typeSortMap.set(appType.type_name, appType.sort || 0);
    });

    return [...types].sort((a, b) => {
      const sortA = typeSortMap.get(a) ?? 0;
      const sortB = typeSortMap.get(b) ?? 0;
      return sortA - sortB;
    });
  }, [types, appTypeState.appTypes]);
}