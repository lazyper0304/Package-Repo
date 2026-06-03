import React from 'react';
import { Card, Flex, Text, Button } from '@radix-ui/themes';
import copy from 'copy-to-clipboard';
import { downloadSvg } from '../utils/vectorize';
import styles from './ResultView.module.less';

type Props = {
  svgContent: string;
  svgUrl: string;
  originalUrl: string;
  fileName: string;
  onBack: () => void;
};

export const ResultView: React.FC<Props> = ({
  svgContent,
  svgUrl,
  originalUrl,
  fileName,
  onBack,
}) => {
  return (
    <div className={styles.container}>
      <Flex justify="between" align="center" style={{ marginBottom: 16 }}>
        <Text size="5" weight="bold">
          处理结果
        </Text>
        <Flex gap="2">
          <Button size="2" color="gray" variant="soft" onClick={onBack}>
            修改参数
          </Button>
          <Button
            size="2"
            color="green"
            onClick={() => {
              copy(svgContent);
              alert('SVG内容已复制到剪贴板');
            }}
          >
            复制到剪贴板
          </Button>
          <Button size="2" onClick={() => downloadSvg(svgContent, fileName)}>
            下载SVG
          </Button>
        </Flex>
      </Flex>

      <Flex gap="4" className={styles.previewGrid}>
        <Card className={styles.previewCard}>
          <Text size="3" weight="bold" style={{ marginBottom: 12 }}>
            原图片
          </Text>
          <div className={styles.imageWrapper}>
            <img src={originalUrl} alt="原图" />
          </div>
        </Card>
        <Card className={styles.previewCard}>
          <Text size="3" weight="bold" style={{ marginBottom: 12 }}>
            矢量化结果
          </Text>
          <div className={styles.imageWrapper}>
            <img src={svgUrl} alt="SVG结果" />
          </div>
        </Card>
      </Flex>
    </div>
  );
};
