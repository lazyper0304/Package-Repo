import { Text, Select } from '@radix-ui/themes';
import { positions, type PositionValue, type OptionsChange } from '../watermarks';

interface OptionsPanelProps {
  position: PositionValue;
  opacity: number;
  size: number;
  overlayOpacity: number;
  tiled: boolean;
  onChange: (changes: OptionsChange) => void;
}

export default function OptionsPanel({ position, opacity, size, overlayOpacity, tiled, onChange }: OptionsPanelProps) {
  return (
    <div className="options-row">
      <div className="option-group">
        <Text size="2" weight="medium" color="gray" as="label" className="option-label">水印位置</Text>
        <Select.Root value={position} onValueChange={(val) => onChange({ position: val as PositionValue })} disabled={tiled}>
          <Select.Trigger className="option-input" />
          <Select.Content>
            {positions.map((p) => (
              <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
      <div className="option-group">
        <Text size="2" weight="medium" color="gray" as="label" className="option-label">水印透明度 ({opacity}%)</Text>
        <input
          type="range"
          className="option-input"
          min="10"
          max="100"
          value={opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </div>
      <div className="option-group">
        <Text size="2" weight="medium" color="gray" as="label" className="option-label">水印大小 ({size}%)</Text>
        <input
          type="range"
          className="option-input"
          min="10"
          max="100"
          value={size}
          onChange={(e) => onChange({ size: Number(e.target.value) })}
        />
      </div>
      <div className="option-group">
        <Text size="2" weight="medium" color="gray" as="label" className="option-label">背景遮罩 ({overlayOpacity}%)</Text>
        <input
          type="range"
          className="option-input"
          min="0"
          max="100"
          value={overlayOpacity}
          onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })}
        />
      </div>
      <div className="option-group">
        <label className="toggle-label">
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
