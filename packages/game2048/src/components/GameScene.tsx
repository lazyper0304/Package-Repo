import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GRID_SIZE } from '../utils/gameLogic';
import { getTileColor } from '../utils/tileColors';

type Props = {
  grid: number[][];
};

const TILE_SIZE = 1.2;
const GAP = 0.15;
const BOARD_SIZE = GRID_SIZE * (TILE_SIZE + GAP) + GAP;

// 创建带有数字的纹理
function createTextTexture(value: number, bgColor: string, textColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 128, 128);

  // 文字
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${value >= 1000 ? 36 : value >= 100 ? 42 : 48}px Arial`;
  ctx.fillText(value.toString(), 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const GameScene: React.FC<Props> = ({ grid }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tilesRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaf8ef);
    sceneRef.current = scene;

    // 相机 - 正俯视角
    const camera = new THREE.OrthographicCamera(
      -BOARD_SIZE / 2, BOARD_SIZE / 2,
      BOARD_SIZE / 2, -BOARD_SIZE / 2,
      0.1, 100
    );
    camera.position.set(0, 10, 0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 15, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 底板
    const boardGeometry = new THREE.BoxGeometry(BOARD_SIZE, 0.2, BOARD_SIZE);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0xbbada0,
      roughness: 0.8,
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = -0.1;
    board.receiveShadow = true;
    scene.add(board);

    // 格子背景
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cellGeometry = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
        const cellMaterial = new THREE.MeshStandardMaterial({
          color: 0xcdc1b4,
          roughness: 0.6,
        });
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.set(
          c * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2,
          0.025,
          r * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2
        );
        cell.receiveShadow = true;
        scene.add(cell);
      }
    }

    // 方块组
    const tiles = new THREE.Group();
    scene.add(tiles);
    tilesRef.current = tiles;

    // 动画循环
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  }, []);

  const updateTiles = useCallback(() => {
    if (!tilesRef.current) return;

    // 清除旧方块
    while (tilesRef.current.children.length > 0) {
      const child = tilesRef.current.children[0];
      tilesRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    // 创建新方块
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const value = grid[r][c];
        if (value === 0) continue;

        const colors = getTileColor(value);

        // 创建方块几何体
        const tileGeometry = new THREE.BoxGeometry(TILE_SIZE * 0.9, 0.3, TILE_SIZE * 0.9);

        // 创建带数字的纹理（用于顶面）
        const textTexture = createTextTexture(value, colors.bg, colors.text);

        // 材质：顶面带数字，其他面纯色
        const topMaterial = new THREE.MeshStandardMaterial({
          map: textTexture,
          roughness: 0.3,
          metalness: 0.1,
        });
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colors.bg),
          roughness: 0.4,
          metalness: 0.1,
        });

        const materials = [
          sideMaterial, // 右
          sideMaterial, // 左
          topMaterial,  // 顶
          sideMaterial, // 底
          sideMaterial, // 前
          sideMaterial, // 后
        ];

        const tile = new THREE.Mesh(tileGeometry, materials);
        tile.position.set(
          c * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2,
          0.25,
          r * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2
        );
        tile.castShadow = true;
        tile.receiveShadow = true;
        tilesRef.current.add(tile);
      }
    }
  }, [grid]);

  useEffect(() => {
    initScene();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // 更新正交相机
      if (cameraRef.current instanceof THREE.OrthographicCamera) {
        const aspect = width / height;
        const halfSize = BOARD_SIZE / 2;
        cameraRef.current.left = -halfSize * aspect;
        cameraRef.current.right = halfSize * aspect;
        cameraRef.current.top = halfSize;
        cameraRef.current.bottom = -halfSize;
        cameraRef.current.updateProjectionMatrix();
      }

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [initScene]);

  useEffect(() => {
    updateTiles();
  }, [updateTiles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
