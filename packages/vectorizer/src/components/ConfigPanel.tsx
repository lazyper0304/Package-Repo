import React from 'react';
import { Flex, Text, ScrollArea, Button, Card } from '@radix-ui/themes';
import type { VectorizeConfig } from '../utils/vectorize';
import styles from './ConfigPanel.module.less';

type Props = {
  config: VectorizeConfig;
  onChange: (config: VectorizeConfig) => void;
  onConvert: () => void;
  onBack: () => void;
};

const MODE_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'polygon', label: '多边形' },
  { value: 'spline', label: '样条曲线' },
];

const CLUSTERING_OPTIONS = [
  { value: 'binary', label: '二值化' },
  { value: 'color', label: '彩色' },
];

const HIERARCHICAL_OPTIONS = [
  { value: 'cutout', label: '剪切' },
  { value: 'stacked', label: '堆叠' },
];

function SliderParam({
  label,
  description,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.param}>
      <Flex justify="between" style={{ marginBottom: 4 }}>
        <Text size="3">
          {label}: {value}
          {unit}
        </Text>
      </Flex>
      <Text size="2" color="gray" style={{ marginBottom: 8 }}>
        {description}
      </Text>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={styles.slider}
      />
    </div>
  );
}

function ButtonGroup({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.param}>
      <Flex direction="column">
        <Text size="3" style={{ marginBottom: 8 }}>
          {label}
        </Text>
        <Text size="2" color="gray" style={{ marginBottom: 8 }}>
          {description}
        </Text>
      </Flex>
      <Flex gap="2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`${styles.modeBtn} ${value === opt.value ? styles.modeBtnActive : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </Flex>
    </div>
  );
}

export const ConfigPanel: React.FC<Props> = ({
  config,
  onChange,
  onConvert,
  onBack,
}) => {
  const update = (partial: Partial<VectorizeConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <Card className={styles.panel}>
      <Flex justify="between" align="center" style={{ marginBottom: 16 }}>
        <Text size="5" weight="bold">
          配置参数
        </Text>
        <Button size="1" color="gray" variant="soft" onClick={onBack}>
          重新选择图片
        </Button>
      </Flex>

      <ScrollArea style={{ maxHeight: '60vh' }}>
        <Flex gap="4" direction="column">
          <ButtonGroup
            label="模式"
            description="选择路径简化模式：无（保留原始路径）、多边形（使用直线）、样条曲线（使用曲线）"
            value={config.mode}
            options={MODE_OPTIONS}
            onChange={(v) => update({ mode: v })}
          />

          <ButtonGroup
            label="聚类模式"
            description="选择颜色聚类模式：二值化（黑白）、彩色（保留颜色）"
            value={config.clusteringMode}
            options={CLUSTERING_OPTIONS}
            onChange={(v) => update({ clusteringMode: v })}
          />

          <ButtonGroup
            label="层次模式"
            description="选择图层层次模式：剪切（保留透明区域）、堆叠（图层叠加）"
            value={config.hierarchical}
            options={HIERARCHICAL_OPTIONS}
            onChange={(v) => update({ hierarchical: v })}
          />

          <SliderParam
            label="角度阈值"
            description="控制角点检测的敏感度，值越大，检测到的角点越少"
            value={config.cornerThreshold}
            min={0}
            max={180}
            unit="°"
            onChange={(v) => update({ cornerThreshold: v })}
          />

          <SliderParam
            label="长度阈值"
            description="控制路径点的简化程度，值越大，路径点越少"
            value={config.lengthThreshold}
            min={1}
            max={10}
            step={0.1}
            onChange={(v) => update({ lengthThreshold: v })}
          />

          <SliderParam
            label="拼接阈值"
            description="控制路径拼接的角度阈值，值越大，拼接的路径越多"
            value={config.spliceThreshold}
            min={0}
            max={90}
            unit="°"
            onChange={(v) => update({ spliceThreshold: v })}
          />

          <SliderParam
            label="噪点过滤"
            description="控制噪点过滤的阈值，值越大，过滤的噪点越多"
            value={config.filterSpeckle}
            min={0}
            max={10}
            onChange={(v) => update({ filterSpeckle: v })}
          />

          <SliderParam
            label="颜色精度"
            description="控制颜色量化的精度，值越大，颜色越丰富"
            value={config.colorPrecision}
            min={1}
            max={8}
            onChange={(v) => update({ colorPrecision: v })}
          />

          <SliderParam
            label="图层差异"
            description="控制图层分离的阈值，值越大，图层分离越明显"
            value={config.layerDifference}
            min={0}
            max={100}
            onChange={(v) => update({ layerDifference: v })}
          />

          <SliderParam
            label="路径精度"
            description="控制SVG路径的精度，值越大，路径越精确"
            value={config.pathPrecision}
            min={1}
            max={10}
            onChange={(v) => update({ pathPrecision: v })}
          />

          <SliderParam
            label="最大迭代次数"
            description="控制路径优化的最大迭代次数，值越大，优化效果越好"
            value={config.maxIterations}
            min={1}
            max={20}
            onChange={(v) => update({ maxIterations: v })}
          />
        </Flex>
      </ScrollArea>

      <Flex justify="end" style={{ marginTop: 16 }}>
        <Button onClick={onConvert}>确定并转换</Button>
      </Flex>
    </Card>
  );
};
