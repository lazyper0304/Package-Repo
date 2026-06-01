import styles from "./index.module.less";
import { ExternalLink } from "lucide-react";
import { Badge, Card, Text } from "@radix-ui/themes";
import type { Tool } from "../../data/tools";

interface ToolCardProps {
  tool: Tool;
  index: number;
}

export function ToolCard({ tool, index }: ToolCardProps) {
  return (
    <a
      href={tool.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", color: "inherit", display: "block", animationDelay: `${index * 0.06}s` }}
      className={styles.card}
    >
      <Card className={styles.cardInner}>
        <div className={styles.iconWrap}>
          <img src={tool.icon} alt={tool.name} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "var(--radius-md)" }} />
        </div>
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h3 className={styles.title} style={{ fontSize: "17px", fontWeight: 600 }}>
              {tool.name}
            </h3>
            <ExternalLink size={14} className={styles.externalIcon} />
          </div>
          <Text size="2" className={styles.desc}>
            {tool.description}
          </Text>
          {tool.tags.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              {tool.tags.map((tag) => (
                <Badge key={tag} variant="soft" size="1">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </a>
  );
}
