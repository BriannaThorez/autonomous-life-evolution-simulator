import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Vector2 } from '../types';
import { SimulationEngine } from '../src/core/SimulationEngine';

interface Props {
  worker: Worker;
  onHover: (entityId: string | null) => void;
  onSelect: (entityId: string | null) => void;
  selectedId: string | null;
  hoveredId: string | null;
  targetFocus?: Vector2 | null;
  showVision: boolean;
  showGrid: boolean;
  showHearing: boolean;
  showCommunication: boolean;
  engine: SimulationEngine; // Keep for hit-testing/search (local copy)
}

const SimulationCanvas: React.FC<Props> = ({ worker, engine, onHover, onSelect, selectedId, hoveredId, targetFocus, showVision, showGrid, showHearing, showCommunication }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitialized = useRef(false);

  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState<Vector2>({ x: 0, y: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Vector2>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Vector2>({ x: 0, y: 0 });

  // Effect to handle external focus requests
  useEffect(() => {
    if (targetFocus) {
      setZoom(1.5);
      setOffset({
        x: (window.innerWidth / 2) - (targetFocus.x * 1.5),
        y: (window.innerHeight / 2) - (targetFocus.y * 1.5)
      });
      setIsFollowing(false);
    }
  }, [targetFocus]);

  // Sync Camera Sync from Worker (for Follow mode)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'CAMERA_SYNC') {
        setOffset({ x: e.data.data.offset[0], y: e.data.data.offset[1] });
      } else if (e.data.type === 'HIT_RESULT') {
        const { data, originalEvent } = e.data;
        if (originalEvent === 'hover') onHover(data);
        else if (originalEvent === 'select') onSelectFromWorker(data);
      }
    };
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [worker, onHover]);

  const onSelectFromWorker = useCallback((id: string | null) => {
    onSelect(id);
    if (id === selectedId && id !== null) {
      setIsFollowing(prev => !prev);
    } else {
      setIsFollowing(false);
    }
  }, [onSelect, selectedId]);

  // Transfer OffscreenCanvas on mount
  useEffect(() => {
    if (canvasRef.current && !isInitialized.current) {
      try {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth * dpr;
        const height = window.innerHeight * dpr;

        const offscreen = canvasRef.current.transferControlToOffscreen();

        worker.postMessage({
          type: 'INIT',
          data: {
            canvas: offscreen,
            worldSize: engine.state.worldSize,
            initialState: engine.state,
            resolution: [width, height],
            dpr: dpr
          }
        }, [offscreen]);

        isInitialized.current = true;
      } catch (e) {
        console.warn("[SimulationCanvas] Canvas already transferred or failed:", e);
        isInitialized.current = true; // Still mark as initialized to stop retry loops
      }
    }
  }, [worker, engine.state.worldSize]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      worker.postMessage({
        type: 'RESIZE',
        data: {
          width: window.innerWidth * dpr,
          height: window.innerHeight * dpr
        }
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [worker]);

  // Sync Camera & Visual Settings to Worker
  useEffect(() => {
    worker.postMessage({
      type: 'UPDATE_CAMERA',
      data: {
        cameraOffset: [offset.x, offset.y],
        zoom,
        selectedId,
        hoveredId,
        isFollowing,
        showVision,
        showGrid,
        showHearing,
        showCommunication,
        dpr: window.devicePixelRatio || 1
      }
    });
  }, [worker, offset, zoom, selectedId, hoveredId, isFollowing, showVision, showGrid, showHearing, showCommunication]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isDragging) {
      const sensitivity = 1.0;
      const dx = (e.clientX - lastMousePos.x) * sensitivity;
      const dy = (e.clientY - lastMousePos.y) * sensitivity;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        setIsFollowing(false);
      }
    }

    const mx = (e.clientX - rect.left - offset.x) / zoom;
    const my = (e.clientY - rect.top - offset.y) / zoom;
    worker.postMessage({ type: 'HIT_TEST', data: { x: mx, y: my, originalEvent: 'hover' } });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    const dist = Math.sqrt((e.clientX - dragStartPos.x) ** 2 + (e.clientY - dragStartPos.y) ** 2);
    if (dist < 5) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = (e.clientX - rect.left - offset.x) / zoom;
      const my = (e.clientY - rect.top - offset.y) / zoom;
      worker.postMessage({ type: 'HIT_TEST', data: { x: mx, y: my, originalEvent: 'select' } });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const zoomIntensity = 0.0015;
      const zoomFactor = Math.exp(-e.deltaY * zoomIntensity);
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 10);

      if (isFollowing) {
        // In follow-mode, only change zoom — worker recomputes offset via CAMERA_SYNC
        setZoom(newZoom);
      } else {
        // Free-camera: zoom toward mouse cursor
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldX = (mx - offset.x) / zoom;
        const worldY = (my - offset.y) / zoom;
        const newOffsetX = mx - worldX * newZoom;
        const newOffsetY = my - worldY * newZoom;
        setZoom(newZoom);
        setOffset({ x: newOffsetX, y: newOffsetY });
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth * (window.devicePixelRatio || 1)}
      height={window.innerHeight * (window.devicePixelRatio || 1)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 0
      }}
    />
  );
};

export default SimulationCanvas;
