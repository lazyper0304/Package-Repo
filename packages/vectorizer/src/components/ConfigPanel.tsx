import React from 'react';
import { Flex, Text, ScrollArea, Button } from '@radix-ui/themes';
import type { VectorizeConfig } from '../utils/vectorize';
import styles from './ConfigPanel.module.less';

type Props = {
  config: VectorizeConfig;
  onChange: (config: VectorizeConfig) => void;
  onConvert: () => void;
  disabled?: boolean;
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
  disabled,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
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
        disabled={disabled}
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
  disabled,
}: {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
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
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={`${styles.modeBtn} ${value === opt.value ? styles.modeBtnActive : ''} ${disabled ? styles.modeBtnDisabled : ''}`}
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
  disabled,
}) => {
  const update = (partial: Partial<VectorizeConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <div className={styles.panel}>
      <Flex justify="between" align="center" style={{ marginBottom: 16 }}>
        <Text size="4" weight="bold">参数配置</Text>
        <Button onClick={onConvert} disabled={disabled}>
          开始转换
        </Button>
      </Flex>

      <ScrollArea style={{ flex: 1 }}>
        <Flex gap="4" direction="column">
          <ButtonGroup
            label="模式"
            description="路径简化模式"
            value={config.mode}
            options={MODE_OPTIONS}
            onChange={(v) => update({ mode: v })}
            disabled={disabled}
          />

          <ButtonGroup
            label="聚类模式"
            description="颜色聚类模式"
            value={config.clusteringMode}
            options={CLUSTERING_OPTIONS}
            onChange={(v) => update({ clusteringMode: v })}
            disabled={disabled}
          />

          <ButtonGroup
            label="层次模式"
            description="图层层次模式"
            value={config.hierarchical}
            options={HIERARCHICAL_OPTIONS}
            onChange={(v) => update({ hierarchical: v })}
            disabled={disabled}
          />

          <SliderParam
            label="角度阈值"
            description="角点检测敏感度"
            value={config.cornerThreshold}
            min={0}
            max={180}
            unit="°"
            onChange={(v) => update({ cornerThreshold: v })}
            disabled={disabled}
          />

          <SliderParam
            label="长度阈值"
            description="路径点简化程度"
            value={config.lengthThreshold}
            min={1}
            max={10}
            step={0.1}
            onChange={(v) => update({ lengthThreshold: v })}
            disabled={disabled}
          />

          <SliderParam
            label="拼接阈值"
            description="路径拼接角度"
            value={config.spliceThreshold}
            min={0}
            max={90}
            unit="°"
            onChange={(v) => update({ spliceThreshold: v })}
            disabled={disabled}
          />

          <SliderParam
            label="噪点过滤"
            description="噪点过滤阈值"
            value={config.filterSpeckle}
            min={0}
            max={10}
            onChange={(v) => update({ filterSpeckle: v })}
            disabled={disabled}
          />

          <SliderParam
            label="颜色精度"
            description="颜色量化精度"
            value={config.colorPrecision}
            min={1}
            max={8}
            onChange={(v) => update({ colorPrecision: v })}
            disabled={disabled}
          />

          <SliderParam
            label="图层差异"
            description="图层分离阈值"
            value={config.layerDifference}
            min={0}
            max={100}
            onChange={(v) => update({ layerDifference: v })}
            disabled={disabled}
          />

          <SliderParam
            label="路径精度"
            description="SVG路径精度"
            value={config.pathPrecision}
            min={1}
            max={10}
            onChange={(v) => update({ pathPrecision: v })}
            disabled={disabled}
          />

          <SliderParam
            label="最大迭代次数"
            description="路径优化迭代次数"
            value={config.maxIterations}
            min={1}
            max={20}
            onChange={(v) => update({ maxIterations: v })}
            disabled={disabled}
          />
        </Flex>
      </ScrollArea>
    </div>
  );
};
