import { Text, Select } from '@radix-ui/themes';
import { positions, type PositionValue, type OptionsChange } from '../watermarks';

interface OptionsPanelProps {
  position: PositionValue;
  opacity: number;
  size: number;
  overlayOpacity: number;
  tiled: boolean;
  onChange: (changes: OptionsChange) => void;
  styles: Record<string, string>;
}

export default function OptionsPanel({ position, opacity, size, overlayOpacity, tiled, onChange, styles }: OptionsPanelProps) {
  return (
    <div className={styles.optionsRow}>
      <div className={styles.optionGroup}>
        <Text size="2" weight="medium" color="gray" as="label" className={styles.optionLabel}>水印位置</Text>
        <Select.Root value={position} onValueChange={(val) => onChange({ position: val as PositionValue })} disabled={tiled}>
          <Select.Trigger className={styles.optionInput} />
          <Select.Content>
            {positions.map((p) => (
              <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
      <div className={styles.optionGroup}>
        <Text size="2" weight="medium" color="gray" as="label" className={styles.optionLabel}>水印透明度 ({opacity}%)</Text>
        <input
          type="range"
          className={styles.optionInput}
          min="10"
          max="100"
          value={opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </div>
      <div className={styles.optionGroup}>
        <Text size="2" weight="medium" color="gray" as="label" className={styles.optionLabel}>水印大小 ({size}%)</Text>
        <input
          type="range"
          className={styles.optionInput}
          min="10"
          max="100"
          value={size}
          onChange={(e) => onChange({ size: Number(e.target.value) })}
        />
      </div>
      <div className={styles.optionGroup}>
        <Text size="2" weight="medium" color="gray" as="label" className={styles.optionLabel}>背景遮罩 ({overlayOpacity}%)</Text>
        <input
          type="range"
          className={styles.optionInput}
          min="0"
          max="100"
          value={overlayOpacity}
          onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })}
        />
      </div>
      <div className={styles.optionGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={tiled}
            onChange={(e) => onChange({ tiled: e.target.checked })}
          />
          平铺水印
        </label>
      </div>
    </div>
  );
}
