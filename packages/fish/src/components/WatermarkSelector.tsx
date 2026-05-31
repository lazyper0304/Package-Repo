import type { Watermark } from '../watermarks';

interface WatermarkSelectorProps {
  watermarks: Watermark[];
  selected: string;
  onSelect: (id: string) => void;
  styles: Record<string, string>;
}

export default function WatermarkSelector({ watermarks, selected, onSelect, styles }: WatermarkSelectorProps) {
  return (
    <div className={styles.watermarkOptions}>
      <h3 className={styles.sectionTitle}>选择水印样式</h3>
      <div className={styles.watermarksGrid}>
        {watermarks.map((w) => (
          <div
            key={w.id}
            className={`${styles.watermarkItem} ${selected === w.id ? styles.selected : ''}`}
            onClick={() => onSelect(w.id)}
          >
            <img
              className={styles.watermarkImg}
              src={`${import.meta.env.BASE_URL}watermarks/${w.id}.png`}
              alt={w.name}
            />
            <div className={styles.watermarkName}>{w.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
