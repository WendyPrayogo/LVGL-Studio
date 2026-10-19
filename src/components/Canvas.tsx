import React, { useRef, useState, useEffect } from 'react';
import { LVGLWidget, DisplayConfig } from '../types/lvgl';
import { WidgetRenderer } from './WidgetRenderer';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pencil,
  Copy,
  Trash2,
  Move,
  Layers,
  Sparkles,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
} from 'lucide-react';

interface CanvasProps {
  widgets: LVGLWidget[];
  activeScreenId: string;
  screenBgColor: string;
  display: DisplayConfig;
  selectedWidgetId: string | null;
  isSimulating: boolean;
  gridSnap: number;
  onSelectWidget: (id: string | null) => void;
  onUpdateWidget: (updated: LVGLWidget) => void;
  onUpdateProp: (id: string, propKey: string, value: any) => void;
  onDeleteWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onToggleSimulating: () => void;
  onTriggerEvent?: (widget: LVGLWidget, eventName: string, detail: any) => void;
  onDropNewWidget: (type: string, x: number, y: number) => void;
}

type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const Canvas: React.FC<CanvasProps> = ({
  widgets,
  activeScreenId,
  screenBgColor,
  display,
  selectedWidgetId,
  isSimulating,
  gridSnap,
  onSelectWidget,
  onUpdateWidget,
  onUpdateProp,
  onDeleteWidget,
  onDuplicateWidget,
  onBringToFront,
  onSendToBack,
  onToggleSimulating,
  onTriggerEvent,
  onDropNewWidget,
}) => {
  const [zoom, setZoom] = useState<number>(1.25);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging & Resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [resizingDir, setResizingDir] = useState<ResizeDirection | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialWidgetGeo, setInitialWidgetGeo] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const activeWidgets = widgets.filter((w) => w.parent === activeScreenId);
  const selectedWidget = activeWidgets.find((w) => w.id === selectedWidgetId) || null;

  // Snapping helper
  const snap = (val: number, step: number): number => {
    if (step <= 1) return Math.round(val);
    return Math.round(val / step) * step;
  };

  // Drag widget start
  const handleWidgetMouseDown = (e: React.MouseEvent, widget: LVGLWidget) => {
    if (isSimulating) return;
    e.stopPropagation();
    onSelectWidget(widget.id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialWidgetGeo({ x: widget.x, y: widget.y, w: widget.w, h: widget.h });
  };

  // Resize handle start
  const handleResizeMouseDown = (e: React.MouseEvent, dir: ResizeDirection) => {
    if (isSimulating || !selectedWidget) return;
    e.stopPropagation();
    setResizingDir(dir);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialWidgetGeo({
      x: selectedWidget.x,
      y: selectedWidget.y,
      w: selectedWidget.w,
      h: selectedWidget.h,
    });
  };

  // Global mouse move and up for dragging/resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!initialWidgetGeo || !selectedWidget) return;

      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;

      if (isDragging) {
        const rawX = initialWidgetGeo.x + deltaX;
        const rawY = initialWidgetGeo.y + deltaY;
        const newX = Math.max(0, Math.min(display.width - selectedWidget.w, snap(rawX, gridSnap)));
        const newY = Math.max(0, Math.min(display.height - selectedWidget.h, snap(rawY, gridSnap)));

        if (newX !== selectedWidget.x || newY !== selectedWidget.y) {
          onUpdateWidget({
            ...selectedWidget,
            x: newX,
            y: newY,
          });
        }
      } else if (resizingDir) {
        let newX = initialWidgetGeo.x;
        let newY = initialWidgetGeo.y;
        let newW = initialWidgetGeo.w;
        let newH = initialWidgetGeo.h;

        if (resizingDir.includes('e')) {
          newW = Math.max(16, snap(initialWidgetGeo.w + deltaX, gridSnap));
        }
        if (resizingDir.includes('s')) {
          newH = Math.max(16, snap(initialWidgetGeo.h + deltaY, gridSnap));
        }
        if (resizingDir.includes('w')) {
          const snappedDeltaX = snap(deltaX, gridSnap);
          const computedW = initialWidgetGeo.w - snappedDeltaX;
          if (computedW >= 16) {
            newX = initialWidgetGeo.x + snappedDeltaX;
            newW = computedW;
          }
        }
        if (resizingDir.includes('n')) {
          const snappedDeltaY = snap(deltaY, gridSnap);
          const computedH = initialWidgetGeo.h - snappedDeltaY;
          if (computedH >= 16) {
            newY = initialWidgetGeo.y + snappedDeltaY;
            newH = computedH;
          }
        }

        onUpdateWidget({
          ...selectedWidget,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          w: newW,
          h: newH,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizingDir(null);
      setInitialWidgetGeo(null);
    };

    if (isDragging || resizingDir) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizingDir, dragStart, initialWidgetGeo, zoom, selectedWidget, gridSnap, display, onUpdateWidget]);

  // Drag and drop from palette onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('application/lvgl-widget');
    if (!widgetType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const rawX = clientX / zoom;
    const rawY = clientY / zoom;

    const x = Math.max(0, Math.min(display.width - 60, snap(rawX, gridSnap)));
    const y = Math.max(0, Math.min(display.height - 30, snap(rawY, gridSnap)));

    onDropNewWidget(widgetType, x, y);
  };

  // Alignment helpers
  const handleCenterHorizontal = () => {
    if (!selectedWidget) return;
    const newX = snap(Math.round((display.width - selectedWidget.w) / 2), gridSnap);
    onUpdateWidget({ ...selectedWidget, x: newX });
  };

  const handleCenterVertical = () => {
    if (!selectedWidget) return;
    const newY = snap(Math.round((display.height - selectedWidget.h) / 2), gridSnap);
    onUpdateWidget({ ...selectedWidget, y: newY });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070A11] relative overflow-hidden select-none">
      {/* Top Canvas Toolbar */}
      <div className="h-11 px-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm flex items-center justify-between z-20 shrink-0">
        {/* Left: Mode toggle & Resolution Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onToggleSimulating()}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !isSimulating
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Design and position widgets with drag handles"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Design Mode</span>
            </button>
            <button
              onClick={() => onToggleSimulating()}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isSimulating
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Simulate touch/click inputs on embedded controls"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Interactive Sim</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span className="font-mono text-slate-300 font-semibold">
              {display.width}×{display.height}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400 font-mono font-semibold uppercase">{display.mcu}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-200 font-mono font-bold uppercase">{display.lcdType}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-[11px] font-mono">{display.port.split('_')[0].toUpperCase()}</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {display.touchConfig?.type !== 'none' ? `Touch: ${display.touchConfig?.type.toUpperCase()}` : 'No Touch'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400 font-mono text-[11px]">
              {display.flashConfig.flashSize}
            </span>
            {display.isRound && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 text-[11px]">Round</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Context actions if widget selected */}
        {selectedWidget && !isSimulating && (
          <div className="hidden md:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-cyan-400 mr-2 font-medium">
              {selectedWidget.name}
            </span>
            <button
              onClick={handleCenterHorizontal}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Center Horizontally"
            >
              <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCenterVertical}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Center Vertically"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onBringToFront(selectedWidget.id)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-[10px] font-mono px-1.5"
              title="Bring to Front"
            >
              TOP
            </button>
            <button
              onClick={() => onDuplicateWidget(selectedWidget.id)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteWidget(selectedWidget.id)}
              className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
              title="Delete (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Zoom & Grid Snap controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium px-2 text-slate-300 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.25) * 100) / 100))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport Area */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-8 relative cursor-default"
        onClick={() => onSelectWidget(null)}
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Physical Embedded Display Chassis Mockup */}
        <div
          className={`relative transition-all duration-200 select-none ${
            display.isRound ? 'rounded-full p-6' : 'rounded-2xl p-5'
          } shadow-2xl border border-slate-700/80`}
          style={{
            backgroundColor: '#1E2430',
            boxShadow:
              '0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.8)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chassis Hardware Screws in corners */}
          {!display.isRound && (
            <>
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-600/80 border border-slate-900 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-0.5 bg-slate-900 rotate-45" />
              </div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-600/80 border border-slate-900 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-0.5 bg-slate-900 rotate-12" />
              </div>
              <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-600/80 border border-slate-900 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-0.5 bg-slate-900 rotate-90" />
              </div>
              <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-600/80 border border-slate-900 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-0.5 bg-slate-900 -rotate-45" />
              </div>
            </>
          )}

          {/* Embedded Display Active Glass Area */}
          <div
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative overflow-hidden ${
              display.isRound ? 'rounded-full' : 'rounded-sm'
            }`}
            style={{
              width: `${display.width * zoom}px`,
              height: `${display.height * zoom}px`,
              backgroundColor: screenBgColor,
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.8)',
            }}
          >
            {/* Grid Dots / Lines overlay in design mode */}
            {!isSimulating && gridSnap > 2 && (
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.4) 1px, transparent 0)`,
                  backgroundSize: `${gridSnap * zoom}px ${gridSnap * zoom}px`,
                }}
              />
            )}

            {/* Render Widgets */}
            {activeWidgets.map((widget) => {
              const isSelected = widget.id === selectedWidgetId && !isSimulating;
              const isHidden = Boolean(widget.props.hidden);
              if (isSimulating && isHidden) return null;

              return (
                <div
                  key={widget.id}
                  style={{
                    position: 'absolute',
                    left: `${widget.x * zoom}px`,
                    top: `${widget.y * zoom}px`,
                    width: `${widget.w * zoom}px`,
                    height: `${widget.h * zoom}px`,
                    zIndex: isSelected ? 30 : 10,
                    opacity: !isSimulating && isHidden ? 0.45 : 1,
                  }}
                  onMouseDown={(e) => handleWidgetMouseDown(e, widget)}
                  className={`group ${
                    isSimulating
                      ? ''
                      : 'cursor-move hover:outline hover:outline-1 hover:outline-cyan-500/50'
                  } ${
                    isSelected
                      ? 'outline-2 outline-cyan-400 outline-offset-1 shadow-lg'
                      : ''
                  } ${
                    !isSimulating && isHidden
                      ? 'border border-dashed border-amber-500/60'
                      : ''
                  }`}
                >
                  <WidgetRenderer
                    widget={widget}
                    isSelected={isSelected}
                    isSimulating={isSimulating}
                    onUpdateProp={onUpdateProp}
                    onTriggerEvent={onTriggerEvent}
                  />

                  {/* Design Mode: Selection Handles & Coordinates Badge */}
                  {isSelected && (
                    <>
                      {/* Geometry Tooltip */}
                      <div className="absolute -top-7 left-0 bg-slate-900 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap pointer-events-none flex items-center gap-1.5 z-40">
                        <span>
                          {widget.x},{widget.y}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span>
                          {widget.w}×{widget.h}
                        </span>
                      </div>

                      {/* 8 Resize Handles */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-nw-resize z-40 hover:scale-125"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-n-resize z-40 hover:scale-125"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-ne-resize z-40 hover:scale-125"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                        className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-e-resize z-40 hover:scale-125"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-se-resize z-40 hover:scale-125"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-s-resize z-40 hover:scale-125"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-sw-resize z-40 hover:scale-125"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                        className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border border-cyan-600 rounded-sm cursor-w-resize z-40 hover:scale-125"
                      />
                    </>
                  )}
                </div>
              );
            })}

            {/* Empty Screen Help */}
            {activeWidgets.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                  <Move className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">Canvas is empty</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Drag widgets from the palette on the left or select a pre-built template from the top bar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
