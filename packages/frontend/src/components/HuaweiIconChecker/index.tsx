import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Dialog,
  Flex,
  Text,
  ScrollArea,
  Box,
  Spinner,
} from '@radix-ui/themes';
import JSZip from 'jszip';
import API from '@/services';
import { useRequest } from 'ahooks';
import { notify } from '@/utils/notify';

// 华为必做图标类型
const HUAWEI_REQUIRED_TYPE = '华为必做';

type IProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

type AppInfo = {
  app_name: string;
  package_name: string;
};

const HuaweiIconChecker: React.FC<IProps> = ({ open, onClose }) => {
  const [hwtFile, setHwtFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    missingApps: AppInfo[];
    missingBgApps: AppInfo[];
    missingFgApps: AppInfo[];
    foundApps: AppInfo[];
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const hwtInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // 从数据库获取华为必做图标
  const getHuaweiRequiredAppsReq = useRequest(API.getAppsByType, {
    defaultParams: [{ typeName: HUAWEI_REQUIRED_TYPE }],
    onSuccess(res) {
      if (res.success) {
        // 保存华为必做图标
        setHuaweiRequiredApps(res.data || []);
      } else {
        notify('获取华为必做图标失败');
      }
    },
  });

  const [huaweiRequiredApps, setHuaweiRequiredApps] = useState<AppInfo[]>([]);

  // 处理HWT文件上传
  const handleHwtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setHwtFile(selectedFile);
      setFolderFiles([]); // 清除文件夹上传
      setResult(null);
    }
  };

  // 处理文件夹上传
  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFolderFiles(selectedFiles);
      setHwtFile(null); // 清除HWT文件上传
      setResult(null);
    }
  };

  // 从HWT文件中提取图标包
  const extractPackagesFromHwt = async (file: File): Promise<Set<string>> => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    // 检查是否存在icons文件夹
    const iconsFolder = Object.keys(zipContent.files).find(
      (path) => path.startsWith('icons/') && path.endsWith('/')
    );

    if (!iconsFolder) {
      throw new Error('未找到icons文件夹');
    }

    // 提取icons文件夹下的所有子文件夹名（图标包名）
    const foundPackages = new Set<string>();
    Object.keys(zipContent.files).forEach((path) => {
      if (
        path.startsWith('icons/') &&
        path.includes('/') &&
        !path.endsWith('/')
      ) {
        const parts = path.split('/');
        if (parts.length >= 3) {
          // 支持启动类格式：icons/package_name/entry/AbilityName/background.png
          if (parts[2] === 'entry' && parts.length >= 4) {
            const abilityName = parts[3];
            if (abilityName.includes('Ability')) {
              foundPackages.add(abilityName);
            } else {
              foundPackages.add(parts[1]);
            }
          } else {
            foundPackages.add(parts[1]);
          }
        } else if (parts.length >= 2) {
          foundPackages.add(parts[1]);
        }
      }
    });

    return foundPackages;
  };

  // 从文件夹中提取图标包
  const extractPackagesFromFolder = (files: File[]): Set<string> => {
    const foundPackages = new Set<string>();
    const bgFiles = new Set<string>();
    const fgFiles = new Set<string>();
    
    files.forEach(file => {
      const fileName = file.name;
      const filePath = file.webkitRelativePath || '';
      
      // 情况1：文件夹里面全是鸿蒙的图标文件夹
      // 示例路径1：folder/package_name/icon.png
      // 示例路径2：folder/package_name/entry/AbilityName/background.png
      if (filePath.includes('/')) {
        const pathParts = filePath.split('/');
        if (pathParts.length >= 4) {
          // 支持启动类格式：folder/package_name/entry/AbilityName/background.png
          if (pathParts[2] === 'entry') {
            const abilityName = pathParts[3];
            if (abilityName.includes('Ability')) {
              foundPackages.add(abilityName);
            } else {
              foundPackages.add(pathParts[1]);
            }
          } else {
            foundPackages.add(pathParts[1]);
          }
        } else if (pathParts.length >= 2) {
          // 传统格式：folder/package_name/icon.png
          const packageName = pathParts[1];
          if (packageName) {
            foundPackages.add(packageName);
          }
        }
      } 
      // 情况2：文件夹里面全是bgfg的png文件
      // 示例文件名：package_name_bg.png 或 package_name_fg.png
      else if (fileName.endsWith('_bg.png')) {
        const packageName = fileName.replace('_bg.png', '');
        if (packageName) {
          bgFiles.add(packageName);
        }
      } else if (fileName.endsWith('_fg.png')) {
        const packageName = fileName.replace('_fg.png', '');
        if (packageName) {
          fgFiles.add(packageName);
        }
      }
      // 其他情况：直接使用文件名（不含扩展名）作为包名
      else {
        const packageName = fileName.split('.')[0];
        if (packageName) {
          foundPackages.add(packageName);
        }
      }
    });
    
    // 对于bgfg文件，只有同时存在_bg.png和_fg.png的包名才被视为完整
    bgFiles.forEach(packageName => {
      if (fgFiles.has(packageName)) {
        foundPackages.add(packageName);
      }
    });
    
    return foundPackages;
  };

  // 开始检查
  const handleCheck = async () => {
    if (!hwtFile && folderFiles.length === 0) {
      notify('请选择HWT文件或文件夹');
      return;
    }

    if (huaweiRequiredApps.length === 0) {
      notify('未获取到华为必做图标列表');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let foundPackages: Set<string>;
      let missingBgApps: AppInfo[] = [];
      let missingFgApps: AppInfo[] = [];

      if (hwtFile) {
        // 处理HWT文件
        foundPackages = await extractPackagesFromHwt(hwtFile);
      } else {
        // 处理文件夹
        // 先分别收集bg和fg文件
        const bgFiles = new Set<string>();
        const fgFiles = new Set<string>();
        
        folderFiles.forEach(file => {
          const fileName = file.name;
          if (fileName.endsWith('_bg.png')) {
            const packageName = fileName.replace('_bg.png', '');
            if (packageName) {
              bgFiles.add(packageName);
            }
          } else if (fileName.endsWith('_fg.png')) {
            const packageName = fileName.replace('_fg.png', '');
            if (packageName) {
              fgFiles.add(packageName);
            }
          }
        });
        
        // 提取完整的包（同时有bg和fg）
        foundPackages = new Set<string>();
        bgFiles.forEach(packageName => {
          if (fgFiles.has(packageName)) {
            foundPackages.add(packageName);
          }
        });
        
        // 检查缺少bg或fg的应用
        missingBgApps = huaweiRequiredApps.filter(
          app => !bgFiles.has(app.package_name)
        );
        missingFgApps = huaweiRequiredApps.filter(
          app => !fgFiles.has(app.package_name)
        );
      }

      // 检查完全缺失的图标包
      const missingApps = huaweiRequiredApps.filter(
        (app) => !foundPackages.has(app.package_name)
      );

      const foundApps = huaweiRequiredApps.filter((app) =>
        foundPackages.has(app.package_name)
      );

      setResult({
        success: missingApps.length === 0,
        missingApps,
        missingBgApps,
        missingFgApps,
        foundApps,
      });
    } catch (error) {
      setResult({
        success: false,
        missingApps: huaweiRequiredApps,
        missingBgApps: [],
        missingFgApps: [],
        foundApps: [],
        error:
          '处理文件失败：' +
          (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 处理HWT文件拖拽
  const handleHwtDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setHwtFile(droppedFile);
      setFolderFiles([]); // 清除文件夹上传
      setResult(null);
    }
  };

  // 处理文件夹拖拽
  const handleFolderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      setFolderFiles(droppedFiles);
      setHwtFile(null); // 清除HWT文件上传
      setResult(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>华为必做图标完整性检查</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          上传HWT文件或包含图标的文件夹，检查是否包含所有华为必做图标
        </Dialog.Description>

        {/* 加载华为必做图标 */}
        {getHuaweiRequiredAppsReq.loading && (
          <Box
            mb="4"
            p="4"
            border="1"
            borderRadius="4"
            style={{ textAlign: 'center' }}
          >
            <Spinner /> <Text ml="2">正在获取华为必做图标列表...</Text>
          </Box>
        )}

        {/* HWT文件上传 */}
        <Box mb="4">
          <Text size="2" weight="medium" mb="2">
            上传HWT文件
          </Text>
          <div
            style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => hwtInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleHwtDrop}
          >
            <input
              ref={hwtInputRef}
              type="file"
              accept=".hwt"
              onChange={handleHwtFileChange}
              style={{ display: 'none' }}
            />
            {!hwtFile ? (
              <>
                <Text size="2" weight="medium" mb="1">
                  点击或拖拽HWT文件到此处上传
                </Text>
                <Text size="1" color="gray">
                  支持.hwt格式文件
                </Text>
              </>
            ) : (
              <Flex align="center" gap="2" justify="center">
                <Text size="2" weight="medium">
                  {hwtFile.name}
                </Text>
                <Button
                  size="1"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHwtFile(null);
                    setResult(null);
                  }}
                >
                  更换
                </Button>
              </Flex>
            )}
          </div>
        </Box>

        {/* 文件夹上传 */}
        <Box mb="4">
          <Text size="2" weight="medium" mb="2">
            或上传包含图标的文件夹
          </Text>
          <div
            style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => folderInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleFolderDrop}
          >
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory="true"
              directory="true"
              onChange={handleFolderChange}
              style={{ display: 'none' }}
            />
            {folderFiles.length === 0 ? (
              <>
                <Text size="2" weight="medium" mb="1">
                  点击或拖拽文件夹到此处上传
                </Text>
                <Text size="1" color="gray">
                  支持包含图标文件的文件夹
                </Text>
              </>
            ) : (
              <Flex
                align="center"
                gap="2"
                justify="center"
                style={{ flexWrap: 'wrap' }}
              >
                <Text size="2" weight="medium">
                  已选择 {folderFiles.length} 个文件
                </Text>
                <Button
                  size="1"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderFiles([]);
                    setResult(null);
                  }}
                >
                  更换
                </Button>
              </Flex>
            )}
          </div>
        </Box>

        <Flex justify="end" mb="4">
          <Button
            onClick={handleCheck}
            disabled={
              (!hwtFile && folderFiles.length === 0) ||
              loading ||
              getHuaweiRequiredAppsReq.loading
            }
            loading={loading}
          >
            开始检查
          </Button>
        </Flex>

        {result && (
          <Box mt="4" p="4" border="1" borderRadius="4">
            <Box mb="4">
              <Text size="3" weight="bold">
                {result.success ? '检查通过' : '缺少必做图标'}
              </Text>
              {result.error && (
                <Text size="2" color="red">
                  {result.error}
                </Text>
              )}
            </Box>
            <ScrollArea style={{ maxHeight: '400px' }}>
              {result.missingBgApps.length > 0 && (
                <Box mb="4">
                  <Text size="2" weight="medium" mb="2" color="orange">
                    缺少_bg.png文件的应用 ({result.missingBgApps.length}个):
                  </Text>
                  <Flex direction="column" gap="1">
                    {result.missingBgApps.map((app, index) => (
                      <Text key={index} size="2" color="orange">
                        • {app.app_name} ({app.package_name})
                      </Text>
                    ))}
                  </Flex>
                </Box>
              )}
              {result.missingFgApps.length > 0 && (
                <Box mb="4">
                  <Text size="2" weight="medium" mb="2" color="orange">
                    缺少_fg.png文件的应用 ({result.missingFgApps.length}个):
                  </Text>
                  <Flex direction="column" gap="1">
                    {result.missingFgApps.map((app, index) => (
                      <Text key={index} size="2" color="orange">
                        • {app.app_name} ({app.package_name})
                      </Text>
                    ))}
                  </Flex>
                </Box>
              )}
              {result.missingApps.length > 0 && (
                <Box mb="4">
                  <Text size="2" weight="medium" mb="2" color="red">
                    缺少的必做图标 ({result.missingApps.length}个):
                  </Text>
                  <Flex direction="column" gap="1">
                    {result.missingApps.map((app, index) => (
                      <Text key={index} size="2" color="red">
                        • {app.app_name} ({app.package_name})
                      </Text>
                    ))}
                  </Flex>
                </Box>
              )}
              <Box>
                <Text size="2" weight="medium" mb="2" color="green">
                  已找到的必做图标 ({result.foundApps.length}个):
                </Text>
                <Flex direction="column" gap="1">
                  {result.foundApps.map((app, index) => (
                    <Text key={index} size="2" color="green">
                      • {app.app_name} ({app.package_name})
                    </Text>
                  ))}
                </Flex>
              </Box>
            </ScrollArea>
          </Box>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(HuaweiIconChecker);
