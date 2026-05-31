import type { Watermark } from '../watermarks';

interface WatermarkSelectorProps {
  watermarks: Watermark[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function WatermarkSelector({ watermarks, selected, onSelect }: WatermarkSelectorProps) {
  return (
    <div className="watermark-options">
      <h3 className="watermark-title">选择水印样式</h3>
      <div className="watermarks-grid">
        {watermarks.map((w) => (
          <div
            key={w.id}
            className={`watermark-item ${selected === w.id ? 'selected' : ''}`}
            onClick={() => onSelect(w.id)}
          >
            <img
              className="watermark-img"
              src={`${import.meta.env.BASE_URL}watermarks/${w.id}.png`}
              alt={w.name}
            />
            <div className="watermark-name">{w.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
