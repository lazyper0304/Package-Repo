import styles from "./index.module.less";
import { TextField } from "@radix-ui/themes";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <TextField.Root
        placeholder="搜索工具..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="3"
        className={styles.input}
      >
        <TextField.Slot>
          <Search size={18} />
        </TextField.Slot>
      </TextField.Root>
    </div>
  );
}
