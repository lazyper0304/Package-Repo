import { Card, Dialog, Flex, Text, Button, ScrollArea } from '@radix-ui/themes';
import { useSetState } from 'ahooks';
import React, { useState, useEffect } from 'react';
import styles from './index.module.less';
import { AiOutlineLoading } from 'react-icons/ai';
import { notify } from '@/utils/notify';
import { ColorImageConverter } from 'vtracer';
import copy from 'copy-to-clipboard';

type IProps = Readonly<{
  open: boolean;
  onClose: () => void;
  imageUrl: string;
}>;

type ProcessedFile = {
  name: string;
  svgContent: string;
  svgUrl: string;
  originalUrl: string;
};

const ImageVectorizer: React.FC<IProps> = (props) => {
  const { open, onClose, imageUrl } = props;
  const [progress, setProgress] = useState(0);

  const [state, setState] = useSetState({
    fileName: '',
    processedFile: null as ProcessedFile | null,
    success: false,
    loading: false,
    showConfig: false,
    config: {
      mode: 'none',
      clustering_mode: 'color',
      hierarchical: 'stacked',
      corner_threshold: 180,
      length_threshold: 10,
      max_iterations: 20,
      splice_threshold: 45,
      filter_speckle: 0,
      color_precision: 4,
      layer_difference: 16,
      path_precision: 8,
    },
  });

  // 角度转弧度
  function deg2rad(deg: number): number {
    return (deg / 180) * Math.PI;
  }

  // 当组件打开且imageUrl存在时，自动显示配置界面
  useEffect(() => {
    if (open && imageUrl) {
      setState({
        fileName: imageUrl.split('/').pop() || 'image.png',
        showConfig: true,
        success: false,
        processedFile: null,
      });
    }
  }, [open, imageUrl]);

  // 从URL下载图片并转换为File对象
  async function downloadImageFromUrl(url: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    const fileName = url.split('/').pop() || 'image.png';
    return new File([blob], fileName, { type: blob.type });
  }

  // 执行转换
  async function executeConversion() {
    setState({ loading: true, showConfig: false });

    try {
      const file = await downloadImageFromUrl(imageUrl);

      // 创建临时canvas和svg元素
      const canvas = document.createElement('canvas');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // 设置id
      canvas.id = `canvas-${Date.now()}`;
      svg.id = `svg-${Date.now()}`;

      // 隐藏元素
      canvas.style.display = 'none';

      // 添加到DOM
      document.body.appendChild(canvas);
      document.body.appendChild(svg);

      // 加载图像
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;

          // 设置canvas和svg尺寸
          canvas.width = width;
          canvas.height = height;
          svg.setAttribute('width', width.toString());
          svg.setAttribute('height', height.toString());
          svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

          // 绘制图像到canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
          }

          resolve();
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // 配置参数
      const converterParams = JSON.stringify({
        canvas_id: canvas.id,
        svg_id: svg.id,
        mode: state.config.mode,
        clustering_mode: state.config.clustering_mode,
        hierarchical: state.config.hierarchical,
        corner_threshold: deg2rad(state.config.corner_threshold),
        length_threshold: state.config.length_threshold,
        max_iterations: state.config.max_iterations,
        splice_threshold: deg2rad(state.config.splice_threshold),
        filter_speckle:
          state.config.filter_speckle * state.config.filter_speckle,
        color_precision: 8 - state.config.color_precision,
        layer_difference: state.config.layer_difference,
        path_precision: state.config.path_precision,
      });

      // 创建转换器
      const converter = ColorImageConverter.new_with_string(converterParams);
      converter.init();

      // 处理图像
      let done = false;
      let progressValue = 0;

      while (!done) {
        done = converter.tick();
        progressValue = converter.progress();
        setProgress(progressValue);
      }

      // 获取SVG内容
      const svgContent = new XMLSerializer().serializeToString(svg);

      // 创建SVG URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const originalUrl = URL.createObjectURL(file);

      // 保存处理结果
      const processedFile: ProcessedFile = {
        name: file.name,
        svgContent,
        svgUrl,
        originalUrl,
      };

      // 释放资源
      converter.free();
      document.body.removeChild(canvas);
      document.body.removeChild(svg);
      URL.revokeObjectURL(img.src);

      // 更新状态显示处理结果
      setState({
        success: true,
        processedFile,
        loading: false,
      });

      notify('图片矢量化成功');
    } catch (error) {
      console.error('处理失败:', error);
      notify('处理失败，请重试');
      setState({ loading: false });
    }
  }

  // 下载 SVG 文件
  function downloadSvg(svgContent: string, fileName: string) {
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = svgUrl;
    a.download = fileName.replace('.png', '.svg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(svgUrl);
  }

  function handleClose() {
    onClose();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Content maxWidth="1060px">
        <Dialog.Title>
          <div>图片矢量化</div>
        </Dialog.Title>

        <Dialog.Description>
          {state.showConfig && (
            <Card style={{ marginTop: 16, marginBottom: 16, padding: 16 }}>
              <Flex justify="between" style={{ marginBottom: 16 }}>
                <Text size="5">配置参数</Text>
              </Flex>

              <ScrollArea style={{ maxHeight: '50vh' }}>
                <Flex gap="8" direction="column">
                  {/* 模式选择 */}
                  <div>
                    <Flex direction="column">
                      <Text size="3" style={{ marginBottom: 8 }}>
                        模式
                      </Text>
                      <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                        选择路径简化模式：无（保留原始路径）、多边形（使用直线）、样条曲线（使用曲线）
                      </Text>
                    </Flex>
                    <Flex gap="4">
                      <button
                        onClick={() =>
                          setState({
                            config: { ...state.config, mode: 'none' },
                          })
                        }
                        style={{
                          padding: '4px 12px',
                          backgroundColor:
                            state.config.mode === 'none'
                              ? 'var(--blue-9)'
                              : 'var(--gray-3)',
                          color:
                            state.config.mode === 'none'
                              ? 'white'
                              : 'var(--gray-9)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        无
                      </button>
                      <button
                        onClick={() =>
                          setState({
                            config: { ...state.config, mode: 'polygon' },
                          })
                        }
                        style={{
                          padding: '4px 12px',
                          backgroundColor:
                            state.config.mode === 'polygon'
                              ? 'var(--blue-9)'
                              : 'var(--gray-3)',
                          color:
                            state.config.mode === 'polygon'
                              ? 'white'
                              : 'var(--gray-9)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        多边形
                      </button>
                      <button
                        onClick={() =>
                          setState({
                            config: { ...state.config, mode: 'spline' },
                          })
                        }
                        style={{
                          padding: '4px 12px',
                          backgroundColor:
                            state.config.mode === 'spline'
                              ? 'var(--blue-9)'
                              : 'var(--gray-3)',
                          color:
                            state.config.mode === 'spline'
                              ? 'white'
                              : 'var(--gray-9)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        样条曲线
                      </button>
                    </Flex>
                  </div>

                  {/* 聚类模式 */}
                  <div>
                    <Flex direction="column">
                      <Text size="3" style={{ marginBottom: 8 }}>
                        聚类模式
                      </Text>
                      <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                        选择颜色聚类模式：二值化（黑白）、彩色（保留颜色）
                      </Text>
                    </Flex>
                    <Flex gap="4">
                      <button
                        onClick={() =>
                          setState({
                            config: {
                              ...state.config,
                              clustering_mode: 'binary',
                            },
                          })
                        }
                        style={{
                          padding: '4px 12px',
                          backgroundColor:
                            state.config.clustering_mode === 'binary'
                              ? 'var(--blue-9)'
                              : 'var(--gray-3)',
                          color:
                            state.config.clustering_mode === 'binary'
                              ? 'white'
                              : 'var(--gray-9)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        二值化
                      </button>
                      <button
                        onClick={() =>
                          setState({
                            config: {
                              ...state.config,
                              clustering_mode: 'color',
                            },
                          })
                        }
                        style={{
                          padding: '4px 12px',
                          backgroundColor:
                            state.config.clustering_mode === 'color'
                              ? 'var(--blue-9)'
                              : 'var(--gray-3)',
                          color:
                            state.config.clustering_mode === 'color'
                              ? 'white'
                              : 'var(--gray-9)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        彩色
                      </button>
                    </Flex>
                  </div>

                  {/* 层次模式 */}
                  <div>
                    <Flex direction="column">
                      <Text size="3" style={{ marginBottom: 8 }}>
                        层次模式
                      </Text>
                      <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                        选择图层层次模式：剪切（保留透明区域）、堆叠（图层叠加）
                      </Text>
                    </Flex>
                    <Flex gap="4">
                      <button
                        onClick={() =>
                          setState({
                            config: { ...state.config, hierarchical: 'cutout' },
                          })
                        }
                        style={{
                          padding: '4px 12px',
                          backgroundColor:
                            state.config.hierarchical === 'cutout'
                              ? 'var(--blue-9)'
                              : 'var(--gray-3)',
                          color:
                            state.config.hierarchical === 'cutout'
                              ? 'white'
                              : 'var(--gray-9)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        剪切
                      </button>
                      <button
                        onClick={() =>
                          setState({
                            config: {
                              ...state.config,
                              hierarchical: 'stacked',
                            },
                          })
                        }
                        style={{
                          padding: '4px 12px',
                          backgroundColor:
                            state.config.hierarchical === 'stacked'
                              ? 'var(--blue-9)'
                              : 'var(--gray-3)',
                          color:
                            state.config.hierarchical === 'stacked'
                              ? 'white'
                              : 'var(--gray-9)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        堆叠
                      </button>
                    </Flex>
                  </div>

                  {/* 角度阈值 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        角度阈值: {state.config.corner_threshold}°
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制角点检测的敏感度，值越大，检测到的角点越少
                    </Text>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      value={state.config.corner_threshold}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            corner_threshold: parseInt(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 长度阈值 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        长度阈值: {state.config.length_threshold}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制路径点的简化程度，值越大，路径点越少
                    </Text>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.1"
                      value={state.config.length_threshold}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            length_threshold: parseFloat(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 拼接阈值 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        拼接阈值: {state.config.splice_threshold}°
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制路径拼接的角度阈值，值越大，拼接的路径越多
                    </Text>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={state.config.splice_threshold}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            splice_threshold: parseInt(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 噪点过滤 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        噪点过滤: {state.config.filter_speckle}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制噪点过滤的阈值，值越大，过滤的噪点越多
                    </Text>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={state.config.filter_speckle}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            filter_speckle: parseInt(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 颜色精度 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        颜色精度: {state.config.color_precision}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制颜色量化的精度，值越大，颜色越丰富
                    </Text>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={state.config.color_precision}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            color_precision: parseInt(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 图层差异 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        图层差异: {state.config.layer_difference}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制图层分离的阈值，值越大，图层分离越明显
                    </Text>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.config.layer_difference}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            layer_difference: parseInt(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 路径精度 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        路径精度: {state.config.path_precision}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制SVG路径的精度，值越大，路径越精确
                    </Text>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={state.config.path_precision}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            path_precision: parseInt(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 最大迭代次数 */}
                  <div>
                    <Flex justify="between" style={{ marginBottom: 4 }}>
                      <Text size="3">
                        最大迭代次数: {state.config.max_iterations}
                      </Text>
                    </Flex>
                    <Text size="2" color="gray" style={{ marginBottom: 8 }}>
                      控制路径优化的最大迭代次数，值越大，优化效果越好
                    </Text>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={state.config.max_iterations}
                      onChange={(e) =>
                        setState({
                          config: {
                            ...state.config,
                            max_iterations: parseInt(e.target.value),
                          },
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                </Flex>
              </ScrollArea>

              <Flex justify="end" style={{ marginTop: 16 }}>
                <Button onClick={executeConversion}>确定并转换</Button>
              </Flex>
            </Card>
          )}

          {state.loading && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text size="3">处理进度</Text>
                <Text size="3">{Math.round(progress)}%</Text>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {state.success && state.processedFile && (
            <div className={styles.pngVectorizer__preview}>
              <Card>
                <Flex justify="between" style={{ marginBottom: 16 }}>
                  <Text size="5">处理结果</Text>

                  <Flex gap="4">
                    <button
                      onClick={() =>
                        setState({ success: false, showConfig: true })
                      }
                      style={{
                        padding: '4px 12px',
                        backgroundColor: 'var(--gray-5)',
                        color: 'var(--gray-9)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      修改参数
                    </button>
                    <button
                      onClick={() => {
                        copy(state.processedFile!.svgContent);
                        notify('SVG内容已复制到剪贴板');
                      }}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: 'var(--green-9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      复制到剪贴板
                    </button>
                    <button
                      onClick={() =>
                        downloadSvg(
                          state.processedFile!.svgContent,
                          state.processedFile!.name
                        )
                      }
                      style={{
                        padding: '4px 12px',
                        backgroundColor: 'var(--blue-9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      下载SVG
                    </button>
                  </Flex>
                </Flex>

                <Card style={{ marginBottom: 16, padding: 16 }}>
                  <Flex gap="8" style={{ marginTop: 12 }}>
                    <Card
                      style={{
                        flex: 1,
                        padding: 16,
                        backgroundColor: 'var(--gray-1)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Text size="3" style={{ marginBottom: 8 }}>
                        原图片
                      </Text>
                      <img
                        src={state.processedFile.originalUrl}
                        style={{ maxWidth: '100%' }}
                      />
                    </Card>
                    <Card
                      style={{
                        flex: 1,
                        padding: 16,
                        backgroundColor: 'var(--gray-1)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Text size="3" style={{ marginBottom: 8 }}>
                        矢量化结果
                      </Text>
                      <img
                        src={state.processedFile.svgUrl}
                        style={{ maxWidth: '100%' }}
                      />
                    </Card>
                  </Flex>
                </Card>
              </Card>
            </div>
          )}
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(ImageVectorizer);
