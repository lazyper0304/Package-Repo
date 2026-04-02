import React from 'react';
import { DataList, Flex, Text, Button, CheckboxGroup, Spinner } from '@radix-ui/themes';
import { Field } from '@rc-component/form';
import { useAppType } from '@/contexts/AppTypeContext';
import { copyToClipboard } from '@/utils/copy';

type IProps = Readonly<{
  label: string;
  value?: string | string[];
  editing: boolean;
  formField?: string;
  onValueChange?: (value: any) => void;
  isAdmin?: boolean;
}>

const DataListItem: React.FC<IProps> = ({
  label,
  value,
  editing,
  formField,
  onValueChange,
  isAdmin = false,
}) => {
  const { state: appTypeState } = useAppType();
  const hasValue = value && (typeof value === 'string' ? value.length > 0 : value.length > 0);

  // 对类型进行排序
  const sortedTypes = React.useMemo(() => {
    if (!appTypeState.appTypes || appTypeState.appTypes.length === 0) return [];
    return [...appTypeState.appTypes].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }, [appTypeState.appTypes]);

  // 对展示的分类进行排序
  const sortedDisplayTypes = React.useMemo(() => {
    if (!value || !Array.isArray(value) || value.length === 0) return value;
    if (!appTypeState.appTypes || appTypeState.appTypes.length === 0) return value;

    const typeSortMap = new Map<string, number>();
    appTypeState.appTypes.forEach((appType) => {
      typeSortMap.set(appType.type_name, appType.sort || 0);
    });

    return [...value].sort((a, b) => {
      const sortA = typeSortMap.get(a) ?? 0;
      const sortB = typeSortMap.get(b) ?? 0;
      return sortA - sortB;
    });
  }, [value, appTypeState.appTypes]);

  return (
    <DataList.Item align={editing ? 'center' : 'baseline'}>
      <DataList.Label minWidth="68px">{label}</DataList.Label>

      <DataList.Value style={{ wordBreak: 'break-all' }}>
        <Flex gap="2" align="center" style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            {editing && (
              <>
                {label === '分类' && (
                  <>
                    {formField && <Field name={formField} />}

                    {appTypeState.loading && <Spinner />}

                    {!appTypeState.loading && sortedTypes.length === 0 && (
                      <Text>暂无分类</Text>
                    )}

                    {!appTypeState.loading && sortedTypes.length > 0 && (
                      <CheckboxGroup.Root
                        style={{
                          flexDirection: 'row',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                        defaultValue={Array.isArray(value) ? value : []}
                        onValueChange={onValueChange}
                      >
                        {sortedTypes.map((appType) => (
                          <CheckboxGroup.Item
                            key={appType.id}
                            value={appType.type_name}
                          >
                            {appType.type_name}
                          </CheckboxGroup.Item>
                        ))}
                      </CheckboxGroup.Root>
                    )}
                  </>
                )}

                {label !== '分类' && formField && (
                  <Field name={formField}>
                    <input
                      type="text"
                      defaultValue={value as string}
                      style={{ width: '56vw', maxWidth: '390px' }}
                      placeholder={`请输入${label}`}
                    />
                  </Field>
                )}
              </>
            )}

            {!editing && (
              <>
                {Array.isArray(sortedDisplayTypes) ? (
                  <Flex gap="2">
                    {sortedDisplayTypes.length === 0 && '-'}

                    {sortedDisplayTypes.map((item) => (
                      <span key={item} className="badge">{item}</span>
                    ))}
                  </Flex>
                ) : sortedDisplayTypes ? (
                  <div>{sortedDisplayTypes}</div>
                ) : (
                  '-'
                )}
              </>
            )}
          </div>

          {hasValue && !editing && (
            <Flex gap="1" align="center">
              <Button
                size="1"
                color="gold"
                variant="soft"
                onClick={() => copyToClipboard(value as string)}
              >
                复制
              </Button>
            </Flex>
          )}
        </Flex>
      </DataList.Value>
    </DataList.Item>
  );
};

export default React.memo(DataListItem);