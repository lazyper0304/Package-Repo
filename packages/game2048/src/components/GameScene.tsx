import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GRID_SIZE } from '../utils/gameLogic';
import { getTileColor } from '../utils/tileColors';

type Props = {
  grid: number[][];
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
};

const TILE_SIZE = 0.9;
const GAP = 0.1;
const BOARD_SIZE = GRID_SIZE * (TILE_SIZE + GAP) + GAP;

// 创建数字纹理
function createTextTexture(value: number, textColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${value >= 1000 ? 80 : value >= 100 ? 100 : 120}px Arial`;
  ctx.fillText(value.toString(), 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 创建带数字的方块
function createTile(value: number): THREE.Group {
  const colors = getTileColor(value);
  const group = new THREE.Group();

  // 方块本体
  const boxGeometry = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE * 0.3, TILE_SIZE);
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(colors.bg),
    emissive: new THREE.Color(colors.bg),
    emissiveIntensity: 0.1,
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  group.add(box);

  // 数字标签 - 正面
  const textTexture = createTextTexture(value, colors.text);
  const planeGeometry = new THREE.PlaneGeometry(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
  const planeMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
  });

  const frontPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  frontPlane.position.y = TILE_SIZE * 0.15 + 0.01;
  frontPlane.rotation.x = -Math.PI / 2;
  group.add(frontPlane);

  // 数字标签 - 背面
  const backPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  backPlane.position.y = TILE_SIZE * 0.15 + 0.01;
  backPlane.rotation.x = -Math.PI / 2;
  backPlane.rotation.z = Math.PI;
  group.add(backPlane);

  return group;
}

export const GameScene: React.FC<Props> = ({ grid, onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tilesRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);
  const mouseRef = useRef<{ startX: number; startY: number } | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaf8ef);
    sceneRef.current = scene;

    // 相机
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // 底盘
    const boardGeometry = new THREE.BoxGeometry(BOARD_SIZE + 0.2, 0.2, BOARD_SIZE + 0.2);
    const boardMaterial = new THREE.MeshPhongMaterial({ color: 0xbbada0 });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = -0.1;
    scene.add(board);

    // 网格背景
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cellGeometry = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
        const cellMaterial = new THREE.MeshPhongMaterial({ color: 0xcdc1b4 });
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.set(
          c * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2,
          0.025,
          r * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2
        );
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
      if (child instanceof THREE.Group) {
        child.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
    }

    // 创建新方块
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const value = grid[r][c];
        if (value === 0) continue;

        const tile = createTile(value);
        tile.position.set(
          c * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2,
          0.2,
          r * (TILE_SIZE + GAP) - BOARD_SIZE / 2 + GAP + TILE_SIZE / 2
        );
        tilesRef.current.add(tile);
      }
    }
  }, [grid]);

  // 鼠标/触摸控制
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    mouseRef.current = { startX: e.clientX, startY: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!mouseRef.current) return;

    const diffX = e.clientX - mouseRef.current.startX;
    const diffY = e.clientY - mouseRef.current.startY;
    const threshold = 50;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > threshold) {
        onMove(diffX > 0 ? 'right' : 'left');
      }
    } else {
      if (Math.abs(diffY) > threshold) {
        onMove(diffY > 0 ? 'down' : 'up');
      }
    }

    mouseRef.current = null;
  }, [onMove]);

  useEffect(() => {
    initScene();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
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

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );
};
