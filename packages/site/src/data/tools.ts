export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  externalUrl: string;
  tags: string[];
}

const isDev = import.meta.env.DEV;

export const tools: Tool[] = [
  {
    id: "package-repo",
    name: "Package Repo",
    description: "查询 Android 和 HarmonyOS 应用元数据",
    icon: `${import.meta.env.BASE_URL}repo-logo.png`,
    externalUrl: isDev ? "http://localhost:3003/repo/" : "/repo/",
    tags: ["开发辅助"],
  },
  {
    id: "fish-watermark",
    name: "闲鱼水印工具",
    description: "生成闲鱼搞怪图片",
    icon: `${import.meta.env.BASE_URL}fish-logo.png`,
    externalUrl: isDev ? "http://localhost:3004/fish/" : "/fish/",
    tags: ["图像处理"],
  },
  {
    id: "tier-list",
    name: "从夯到拉排名生成器",
    description: "拖拽素材生成等级排名图，支持文字、图片和自定义配置",
    icon: `${import.meta.env.BASE_URL}tier-logo.png`,
    externalUrl: isDev ? "http://localhost:3005/tier/" : "/tier/",
    tags: ["休闲娱乐"],
  },
  {
    id: "vectorizer",
    name: "图片矢量化工具",
    description: "将位图转换为 SVG 矢量图形，支持多种参数配置",
    icon: `${import.meta.env.BASE_URL}vectorizer.png`,
    externalUrl: isDev ? "http://localhost:3006/vectorizer/" : "/vectorizer/",
    tags: ["图像处理"],
  },
  {
    id: "imgtool",
    name: "图片尺寸格式工具",
    description: "调整图片尺寸、转换图片格式，支持锁定比例",
    icon: `${import.meta.env.BASE_URL}imgtool.png`,
    externalUrl: isDev ? "http://localhost:3007/imgtool/" : "/imgtool/",
    tags: ["图像处理"],
  },
  {
    id: "game2048",
    name: "2048",
    description: "经典2048游戏，3D版本",
    icon: `${import.meta.env.BASE_URL}game2048.png`,
    externalUrl: isDev ? "http://localhost:3008/game2048/" : "/game2048/",
    tags: ["休闲娱乐"],
  },
];

export const allTags = ["开发辅助", "图像处理", "办公效率", "设计创作", "休闲娱乐"];
