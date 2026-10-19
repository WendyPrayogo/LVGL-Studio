import React, { useState, useEffect, useCallback } from 'react';
import { ProjectData, LVGLWidget, WidgetType, DisplayConfig, McuType, LcdType, BusPort, TouchType } from './types/lvgl';
import { TEMPLATES } from './utils/templates';
import { MCU_LIST, LCD_LIST, PORT_LIST, RESOLUTION_PRESETS, getDefaultTouchForMcuAndType } from './utils/hardwareConfig';
import { TopBar } from './components/TopBar';
import { WidgetPalette } from './components/WidgetPalette';
import { Canvas } from './components/Canvas';
import { PropertyInspector } from './components/PropertyInspector';
import { ScreenManager } from './components/ScreenManager';
import { LiveEventLog, EventLogItem } from './components/LiveEventLog';
import { HardwareMemoryModal } from './components/HardwareMemoryModal';
import { TemplatesModal } from './components/TemplatesModal';
import { CodeExportModal } from './components/CodeExportModal';
import { ReadmeModal } from './components/ReadmeModal';
import { Undo2, Redo2, Grid, RotateCcw, Monitor, Sparkles, Cpu, Tv, Cable, Database, Fingerprint } from 'lucide-react';

export default function App() {
  // Start with rich, functional Thermostat template by default
  const [project, setProject] = useState<ProjectData>(() => TEMPLATES.thermostat);
  const [history, setHistory] = useState<ProjectData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [gridSnap, setGridSnap] = useState<number>(4);

  // Modal states
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isHardwareOpen, setIsHardwareOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);

  // Live simulation event logs
  const [eventLogs, setEventLogs] = useState<EventLogItem[]>([]);

  // Push to history for undo/redo
  const pushHistory = useCallback(
    (newProject: ProjectData) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, newProject];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Set project with undo capability
  const updateProject = useCallback(
    (updater: (prev: ProjectData) => ProjectData) => {
      setProject((prev) => {
        const next = updater(prev);
        pushHistory(next);
        return next;
      });
    },
    [pushHistory]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setProject(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setProject(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const activeScreen = project.screens.find((s) => s.id === project.activeScreenId) || project.screens[0];

  // Add new widget from palette or drop
  const handleAddWidget = useCallback(
    (type: WidgetType, customX?: number, customY?: number) => {
      const activeScrId = project.activeScreenId;
      const widgetCount = project.widgets.filter((w) => w.type === type).length + 1;
      const newName = `${type}_${widgetCount}`;

      let defaultW = 100;
      let defaultH = 38;
      let text = type === 'btn' ? 'Button' : type === 'label' ? 'New Label' : undefined;

      if (type === 'slider') {
        defaultW = 140;
        defaultH = 18;
      } else if (type === 'switch') {
        defaultW = 50;
        defaultH = 26;
      } else if (type === 'arc' || type === 'meter') {
        defaultW = 120;
        defaultH = 120;
      } else if (type === 'bar') {
        defaultW = 140;
        defaultH = 16;
      } else if (type === 'chart') {
        defaultW = 180;
        defaultH = 110;
      } else if (type === 'led') {
        defaultW = 20;
        defaultH = 20;
      } else if (type === 'container') {
        defaultW = 160;
        defaultH = 100;
      }

      const x = customX !== undefined ? customX : Math.max(10, Math.floor((project.display.width - defaultW) / 2));
      const y = customY !== undefined ? customY : Math.max(10, Math.floor((project.display.height - defaultH) / 2));

      const newWidget: LVGLWidget = {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newName,
        type,
        x,
        y,
        w: defaultW,
        h: defaultH,
        parent: activeScrId,
        styles: {
          bgColor: type === 'btn' ? '#0284C7' : type === 'container' ? '#1E293B' : '#334155',
          textColor: '#FFFFFF',
          borderColor: '#475569',
          borderWidth: type === 'btn' || type === 'container' ? 1 : 0,
          radius: type === 'btn' ? 6 : type === 'container' ? 8 : 4,
          opacity: 255,
          fontSize: '14',
        },
        props: {
          text,
          min: 0,
          max: 100,
          value: 50,
          indicatorColor: '#0284C7',
          activeColor: '#0284C7',
          checked: false,
          ledOn: true,
          ledColor: '#22C55E',
          arcWidth: 10,
          arcColor: '#0284C7',
          chartType: 'line',
          pointCount: 8,
          points: [20, 35, 50, 40, 70, 85, 60, 75],
          options: ['Option 1', 'Option 2', 'Option 3'],
        },
        events: [
          {
            id: `ev_${Date.now()}`,
            event: type === 'btn' ? 'LV_EVENT_CLICKED' : 'LV_EVENT_VALUE_CHANGED',
            handlerName: `on_${newName}_action`,
            actionType: 'custom_c',
            description: `Handle ${newName} event`,
          },
        ],
      };

      updateProject((prev) => ({
        ...prev,
        widgets: [...prev.widgets, newWidget],
      }));
      setSelectedWidgetId(newWidget.id);
    },
    [project.activeScreenId, project.widgets, project.display.width, project.display.height, updateProject]
  );

  // Update an existing widget
  const handleUpdateWidget = useCallback(
    (updated: LVGLWidget) => {
      setProject((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) => (w.id === updated.id ? updated : w)),
      }));
    },
    []
  );

  // Update a single property
  const handleUpdateProp = useCallback(
    (id: string, propKey: string, value: any) => {
      setProject((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) =>
          w.id === id ? { ...w, props: { ...w.props, [propKey]: value } } : w
        ),
      }));
    },
    []
  );

  // Delete widget
  const handleDeleteWidget = useCallback(
    (id: string) => {
      updateProject((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== id),
      }));
      if (selectedWidgetId === id) {
        setSelectedWidgetId(null);
      }
    },
    [selectedWidgetId, updateProject]
  );

  // Duplicate widget
  const handleDuplicateWidget = useCallback(
    (id: string) => {
      const target = project.widgets.find((w) => w.id === id);
      if (!target) return;

      const dup: LVGLWidget = {
        ...target,
        id: `w_${Date.now()}_dup`,
        name: `${target.name}_copy`,
        x: Math.min(project.display.width - target.w, target.x + 15),
        y: Math.min(project.display.height - target.h, target.y + 15),
      };

      updateProject((prev) => ({
        ...prev,
        widgets: [...prev.widgets, dup],
      }));
      setSelectedWidgetId(dup.id);
    },
    [project.widgets, project.display.width, project.display.height, updateProject]
  );

  // Z-index reordering
  const handleBringToFront = useCallback(
    (id: string) => {
      updateProject((prev) => {
        const item = prev.widgets.find((w) => w.id === id);
        if (!item) return prev;
        const rest = prev.widgets.filter((w) => w.id !== id);
        return {
          ...prev,
          widgets: [...rest, item],
        };
      });
    },
    [updateProject]
  );

  const handleSendToBack = useCallback(
    (id: string) => {
      updateProject((prev) => {
        const item = prev.widgets.find((w) => w.id === id);
        if (!item) return prev;
        const rest = prev.widgets.filter((w) => w.id !== id);
        return {
          ...prev,
          widgets: [item, ...rest],
        };
      });
    },
    [updateProject]
  );

  // Screen operations
  const handleSelectScreen = (id: string) => {
    setProject((prev) => ({ ...prev, activeScreenId: id }));
    setSelectedWidgetId(null);
  };

  const handleAddScreen = (name: string) => {
    const newScrId = `scr_${Date.now()}`;
    updateProject((prev) => ({
      ...prev,
      screens: [...prev.screens, { id: newScrId, name, bgColor: '#0F172A' }],
      activeScreenId: newScrId,
    }));
    setSelectedWidgetId(null);
  };

  const handleDeleteScreen = (id: string) => {
    if (project.screens.length <= 1) return;
    updateProject((prev) => {
      const remaining = prev.screens.filter((s) => s.id !== id);
      return {
        ...prev,
        screens: remaining,
        activeScreenId: remaining[0].id,
        widgets: prev.widgets.filter((w) => w.parent !== id),
      };
    });
    setSelectedWidgetId(null);
  };

  const handleUpdateScreenColor = (id: string, color: string) => {
    setProject((prev) => ({
      ...prev,
      screens: prev.screens.map((s) => (s.id === id ? { ...s, bgColor: color } : s)),
    }));
  };

  const handleRenameScreen = (id: string, name: string) => {
    setProject((prev) => ({
      ...prev,
      screens: prev.screens.map((s) => (s.id === id ? { ...s, name } : s)),
    }));
  };

  // Trigger simulated event, execute action (Set & Get, Set Property, Switch Screen, Toggle), and log it
  const handleTriggerEvent = (widget: LVGLWidget, eventName: string, detail: any) => {
    const matchingEvents = (widget.events || []).filter((e) => e.event === eventName);
    const now = new Date();
    const timeStr =
      now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    if (matchingEvents.length === 0) {
      const fallbackName = `on_${widget.name}_${eventName.toLowerCase()}`;
      setEventLogs((prev) => [
        {
          id: `log_${Date.now()}_${Math.random()}`,
          timestamp: timeStr,
          widgetName: widget.name,
          eventType: eventName,
          handlerName: fallbackName,
          detail,
        },
        ...prev.slice(0, 49),
      ]);
      return;
    }

    matchingEvents.forEach((ev) => {
      let actionLogDesc = '';

      if (ev.actionType === 'get_and_set') {
        const srcWidget =
          ev.sourceWidgetId && ev.sourceWidgetId !== 'self'
            ? project.widgets.find((w) => w.id === ev.sourceWidgetId) || widget
            : widget;

        const srcProp =
          ev.sourceProperty ||
          (srcWidget.type === 'switch' || srcWidget.type === 'checkbox'
            ? 'checked'
            : srcWidget.type === 'label'
            ? 'text'
            : 'value');

        let rawVal: any;
        if (srcProp === 'value') {
          rawVal =
            srcWidget.id === widget.id && detail?.value !== undefined
              ? detail.value
              : srcWidget.props.value ?? 0;
        } else if (srcProp === 'checked') {
          rawVal =
            srcWidget.id === widget.id && detail?.checked !== undefined
              ? detail.checked
              : Boolean(srcWidget.props.checked);
        } else {
          rawVal =
            srcWidget.id === widget.id && detail?.text !== undefined
              ? detail.text
              : srcWidget.props.text ?? '';
        }

        const targetWidget = project.widgets.find((w) => w.id === ev.targetWidgetId);
        if (targetWidget) {
          const tgtProp =
            ev.targetProperty ||
            (targetWidget.type === 'label'
              ? 'text'
              : targetWidget.type === 'switch' || targetWidget.type === 'checkbox'
              ? 'checked'
              : 'value');

          let formattedVal: any = rawVal;
          if (tgtProp === 'text') {
            if (ev.formatString) {
              formattedVal = ev.formatString
                .replace(/%d/g, String(Math.round(rawVal)))
                .replace(/%s/g, String(rawVal));
            } else {
              formattedVal = String(rawVal);
            }
          }

          setProject((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) => {
              if (w.id !== targetWidget.id) return w;
              if (tgtProp === 'text')
                return { ...w, props: { ...w.props, text: String(formattedVal) } };
              if (tgtProp === 'value')
                return { ...w, props: { ...w.props, value: Number(formattedVal) } };
              if (tgtProp === 'checked')
                return {
                  ...w,
                  props: {
                    ...w.props,
                    checked: Boolean(formattedVal),
                    checkedState: Boolean(formattedVal),
                  },
                };
              if (tgtProp === 'hidden')
                return { ...w, props: { ...w.props, hidden: Boolean(formattedVal) } };
              return w;
            }),
          }));

          actionLogDesc = `[GET & SET] Read ${srcWidget.name}.${srcProp} (${rawVal}) ➔ Wrote to ${targetWidget.name}.${tgtProp} ("${formattedVal}")`;
        }
      } else if (ev.actionType === 'set_property') {
        const targetWidget = ev.targetWidgetId
          ? project.widgets.find((w) => w.id === ev.targetWidgetId) || widget
          : widget;
        const tgtProp = ev.targetProperty || 'text';

        setProject((prev) => ({
          ...prev,
          widgets: prev.widgets.map((w) => {
            if (w.id !== targetWidget.id) return w;
            if (tgtProp === 'text')
              return { ...w, props: { ...w.props, text: String(ev.setValue ?? '') } };
            if (tgtProp === 'value')
              return { ...w, props: { ...w.props, value: Number(ev.setValue ?? 0) } };
            if (tgtProp === 'checked')
              return {
                ...w,
                props: {
                  ...w.props,
                  checked: Boolean(ev.setValue),
                  checkedState: Boolean(ev.setValue),
                },
              };
            if (tgtProp === 'hidden')
              return { ...w, props: { ...w.props, hidden: Boolean(ev.setValue) } };
            if (tgtProp === 'opacity')
              return { ...w, styles: { ...w.styles, opacity: Number(ev.setValue ?? 255) } };
            if (tgtProp === 'bgColor')
              return { ...w, styles: { ...w.styles, bgColor: String(ev.setValue) } };
            if (tgtProp === 'textColor')
              return { ...w, styles: { ...w.styles, textColor: String(ev.setValue) } };
            return w;
          }),
        }));

        actionLogDesc = `[SET] Set ${targetWidget.name}.${tgtProp} = ${JSON.stringify(ev.setValue)}`;
      } else if (ev.actionType === 'switch_screen') {
        if (ev.targetScreenId) {
          const targetScreen = project.screens.find((s) => s.id === ev.targetScreenId);
          setProject((prev) => ({ ...prev, activeScreenId: ev.targetScreenId! }));
          actionLogDesc = `[SCREEN] Switched to ${targetScreen?.name || ev.targetScreenId} (${ev.screenAnim || 'NONE'})`;
        }
      } else if (ev.actionType === 'toggle_widget') {
        const targetWidget = ev.targetWidgetId
          ? project.widgets.find((w) => w.id === ev.targetWidgetId) || widget
          : widget;
        setProject((prev) => ({
          ...prev,
          widgets: prev.widgets.map((w) => {
            if (w.id !== targetWidget.id) return w;
            if (targetWidget.type === 'switch' || targetWidget.type === 'checkbox') {
              const nextChecked = !w.props.checked;
              return {
                ...w,
                props: { ...w.props, checked: nextChecked, checkedState: nextChecked },
              };
            }
            return { ...w, props: { ...w.props, hidden: !w.props.hidden } };
          }),
        }));
        actionLogDesc = `[TOGGLE] Toggled ${targetWidget.name}`;
      } else if (ev.actionType === 'call_hardware') {
        actionLogDesc = `[HARDWARE] GPIO${ev.gpioPin ?? 2} ➔ ${ev.hardwareAction ?? 'toggle'}`;
      } else {
        actionLogDesc = `[CUSTOM C] Executed ${ev.handlerName}()`;
      }

      setEventLogs((prev) => [
        {
          id: `log_${Date.now()}_${Math.random()}`,
          timestamp: timeStr,
          widgetName: widget.name,
          eventType: ev.event,
          handlerName: ev.handlerName,
          detail: actionLogDesc ? { action: actionLogDesc, ...detail } : detail,
        },
        ...prev.slice(0, 49),
      ]);
    });
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWidgetId && !isSimulating) {
        e.preventDefault();
        handleDeleteWidget(selectedWidgetId);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedWidgetId) {
        e.preventDefault();
        handleDuplicateWidget(selectedWidgetId);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedWidgetId(null);
        setIsTemplatesOpen(false);
        setIsHardwareOpen(false);
        setIsCodeExportOpen(false);
        setIsReadmeOpen(false);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedWidgetId) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setProject((prev) => {
          const w = prev.widgets.find((item) => item.id === selectedWidgetId);
          if (!w) return prev;
          let newX = w.x;
          let newY = w.y;
          if (e.key === 'ArrowLeft') newX = Math.max(0, w.x - step);
          if (e.key === 'ArrowRight') newX = Math.min(prev.display.width - w.w, w.x + step);
          if (e.key === 'ArrowUp') newY = Math.max(0, w.y - step);
          if (e.key === 'ArrowDown') newY = Math.min(prev.display.height - w.h, w.y + step);
          return {
            ...prev,
            widgets: prev.widgets.map((item) => (item.id === selectedWidgetId ? { ...item, x: newX, y: newY } : item)),
          };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgetId, isSimulating, handleDeleteWidget, handleDuplicateWidget, handleUndo, handleRedo]);

  const selectedWidget = project.widgets.find((w) => w.id === selectedWidgetId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070A11] text-slate-100 font-sans">
      {/* Strict 3-Zone Top Bar */}
      <TopBar
        activeView={
          isReadmeOpen
            ? 'readme'
            : isTemplatesOpen
            ? 'templates'
            : isHardwareOpen
            ? 'hardware'
            : isCodeExportOpen
            ? 'code'
            : 'designer'
        }
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenHardware={() => setIsHardwareOpen(true)}
        onOpenCodeExport={() => setIsCodeExportOpen(true)}
        onOpenReadme={() => setIsReadmeOpen(true)}
      />

      {/* Sub-header Workspace Control Strip with direct MCU, LCD Type, and Port selectors */}
      <div className="h-10 px-4 border-b border-slate-800 bg-[#0E1322] flex items-center justify-between text-xs shrink-0 select-none overflow-x-auto">
        {/* Left: Direct MCU, LCD, Port, and Resolution config */}
        <div className="flex items-center gap-2">
          {/* Microcontroller Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-mono">MCU:</span>
            <select
              value={project.display.mcu}
              onChange={(e) => {
                const newMcu = e.target.value as McuType;
                const mcuData = MCU_LIST.find((m) => m.id === newMcu) || MCU_LIST[0];
                updateProject((prev) => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    mcu: newMcu,
                    pinout: { ...mcuData.defaultPinout },
                  },
                }));
              }}
              className="bg-transparent text-cyan-300 font-mono text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="esp32" className="bg-slate-900 text-slate-100">ESP32 (520KB)</option>
              <option value="rp2040" className="bg-slate-900 text-slate-100">RP2040 (264KB)</option>
              <option value="rp2350" className="bg-slate-900 text-slate-100">RP2350 (520KB)</option>
              <option value="esp32_s3" className="bg-slate-900 text-slate-100">ESP32-S3 (512KB)</option>
              <option value="esp32_c5" className="bg-slate-900 text-slate-100">ESP32-C5 RISC-V (384KB)</option>
              <option value="stm32" className="bg-slate-900 text-slate-100">STM32 (384KB)</option>
            </select>
          </div>

          {/* LCD Controller Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Tv className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-mono">LCD:</span>
            <select
              value={project.display.lcdType}
              onChange={(e) => {
                const newLcd = e.target.value as LcdType;
                const isRound = newLcd === 'gc9a01' || (newLcd === 'axs15231b' && project.display.isRound);
                const lcdInfo = LCD_LIST.find((l) => l.id === newLcd);
                const newPort = newLcd === 'axs15231b' ? 'qspi' : (lcdInfo?.supportedPorts.includes(project.display.port) ? project.display.port : lcdInfo?.supportedPorts[0] || project.display.port);
                const newTouchType = lcdInfo?.defaultTouch || project.display.touchConfig?.type || 'cst816s';
                const newTouch = getDefaultTouchForMcuAndType(newTouchType, project.display.mcu);

                updateProject((prev) => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    lcdType: newLcd,
                    isRound,
                    port: newPort,
                    touchConfig: newTouch,
                  },
                }));
              }}
              className="bg-transparent text-slate-200 font-mono text-xs font-semibold focus:outline-none cursor-pointer uppercase"
            >
              <option value="axs15231b" className="bg-slate-900 text-cyan-300 font-bold">AXS15231B (AMOLED)</option>
              <option value="st7789" className="bg-slate-900 text-slate-100">ST7789 (IPS)</option>
              <option value="ili9341" className="bg-slate-900 text-slate-100">ILI9341 (TFT)</option>
              <option value="gc9a01" className="bg-slate-900 text-slate-100">GC9A01 (Round)</option>
              <option value="st7796" className="bg-slate-900 text-slate-100">ST7796 (3.5"-4")</option>
              <option value="ili9488" className="bg-slate-900 text-slate-100">ILI9488</option>
              <option value="st7262" className="bg-slate-900 text-slate-100">ST7262 (RGB HMI)</option>
              <option value="ssd1306" className="bg-slate-900 text-slate-100">SSD1306 (OLED)</option>
            </select>
          </div>

          {/* Touch Screen Controller Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Fingerprint className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-mono">Touch:</span>
            <select
              value={project.display.touchConfig?.type || 'cst816s'}
              onChange={(e) => {
                const newTouchType = e.target.value as TouchType;
                const newTouch = getDefaultTouchForMcuAndType(newTouchType, project.display.mcu);
                updateProject((prev) => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    touchConfig: newTouch,
                  },
                }));
              }}
              className="bg-transparent text-emerald-300 font-mono text-xs font-semibold focus:outline-none cursor-pointer uppercase"
            >
              <option value="axs15231b" className="bg-slate-900 text-cyan-300 font-bold">AXS15231B (Integrated Touch)</option>
              <option value="cst816s" className="bg-slate-900 text-emerald-300">CST816S (AMOLED/Dial)</option>
              <option value="ft6236" className="bg-slate-900 text-slate-100">FT6236 (TFT)</option>
              <option value="gt911" className="bg-slate-900 text-slate-100">GT911 (Multi-Touch)</option>
              <option value="cst328" className="bg-slate-900 text-slate-100">CST328</option>
              <option value="xpt2046" className="bg-slate-900 text-slate-100">XPT2046 (Resistive)</option>
              <option value="chsc5816" className="bg-slate-900 text-slate-100">CHSC5816</option>
              <option value="none" className="bg-slate-900 text-slate-400">None (No Touch)</option>
            </select>
          </div>

          {/* Port Interface Selector */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Cable className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-mono">Port:</span>
            <select
              value={project.display.port}
              onChange={(e) => {
                const newPort = e.target.value as BusPort;
                updateProject((prev) => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    port: newPort,
                  },
                }));
              }}
              className="bg-transparent text-amber-300 font-mono text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="qspi" className="bg-slate-900 text-cyan-300 font-bold">Quad SPI (QSPI)</option>
              <option value="spi_4wire" className="bg-slate-900 text-slate-100">4-Wire SPI</option>
              <option value="parallel_8080_8" className="bg-slate-900 text-slate-100">8080 8-Bit</option>
              <option value="parallel_8080_16" className="bg-slate-900 text-slate-100">8080 16-Bit</option>
              <option value="rgb565" className="bg-slate-900 text-slate-100">RGB 16-Bit</option>
              <option value="i2c" className="bg-slate-900 text-slate-100">I2C (2-Wire)</option>
            </select>
          </div>

          {/* Resolution Selector */}
          <select
            value={project.display.presetId}
            onChange={(e) => {
              const res = RESOLUTION_PRESETS.find((p) => p.id === e.target.value);
              if (res) {
                updateProject((prev) => ({
                  ...prev,
                  display: {
                    ...prev.display,
                    presetId: res.id,
                    name: res.name,
                    width: res.width,
                    height: res.height,
                    isRound: res.isRound,
                    lcdType: res.defaultLcd,
                    port: res.defaultPort,
                  },
                }));
              }
            }}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-xs focus:outline-none"
            title="Display Resolution"
          >
            {RESOLUTION_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                {p.width}×{p.height} {p.isRound ? '(Round)' : ''}
              </option>
            ))}
          </select>

          {/* Flash, PSRAM & Partition Summary Badge */}
          <button
            onClick={() => setIsHardwareOpen(true)}
            className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Configure Flash size, PSRAM, and Partitions"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-200">{project.display.flashConfig.flashSize}</span>
            <span className="text-slate-600">·</span>
            <span className={project.display.flashConfig.psram !== 'none' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
              {project.display.flashConfig.psram === 'none' ? 'No PSRAM' : project.display.flashConfig.psram.toUpperCase().split('_')[0]}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400">{project.display.flashConfig.partitionScheme}</span>
          </button>
        </div>

        {/* Center/Right: Undo / Redo & Snap */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:text-slate-400"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:text-slate-400"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <Grid className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={gridSnap}
              onChange={(e) => setGridSnap(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-400 font-mono text-[11px]"
            >
              <option value="1">Snap: Off (1px)</option>
              <option value="2">Snap: 2px</option>
              <option value="4">Snap: 4px</option>
              <option value="8">Snap: 8px</option>
              <option value="16">Snap: 16px</option>
            </select>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTemplatesOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Load Template</span>
          </button>
        </div>
      </div>

      {/* Main Studio Center Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: LVGL Widget Palette */}
        <WidgetPalette onAddWidget={(type) => handleAddWidget(type)} />

        {/* Center: Embedded Display Simulator Canvas & Bottom Managers */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Canvas
            widgets={project.widgets}
            activeScreenId={project.activeScreenId}
            screenBgColor={activeScreen.bgColor}
            display={project.display}
            selectedWidgetId={selectedWidgetId}
            isSimulating={isSimulating}
            gridSnap={gridSnap}
            onSelectWidget={setSelectedWidgetId}
            onUpdateWidget={handleUpdateWidget}
            onUpdateProp={handleUpdateProp}
            onDeleteWidget={handleDeleteWidget}
            onDuplicateWidget={handleDuplicateWidget}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onToggleSimulating={() => {
              setIsSimulating(!isSimulating);
              setSelectedWidgetId(null);
            }}
            onTriggerEvent={handleTriggerEvent}
            onDropNewWidget={(type, x, y) => handleAddWidget(type as WidgetType, x, y)}
          />

          {/* Screen Manager Bar */}
          <ScreenManager
            screens={project.screens}
            activeScreenId={project.activeScreenId}
            onSelectScreen={handleSelectScreen}
            onAddScreen={handleAddScreen}
            onDeleteScreen={handleDeleteScreen}
            onUpdateScreenColor={handleUpdateScreenColor}
            onRenameScreen={handleRenameScreen}
          />

          {/* Collapsible Live Event Log in Simulation Mode */}
          {isSimulating && (
            <LiveEventLog
              logs={eventLogs}
              onClearLogs={() => setEventLogs([])}
            />
          )}
        </div>

        {/* Right: Property Inspector */}
        <PropertyInspector
          widget={selectedWidget}
          allWidgets={project.widgets}
          screens={project.screens}
          onUpdateWidget={handleUpdateWidget}
          onDeleteWidget={handleDeleteWidget}
          onDuplicateWidget={handleDuplicateWidget}
        />
      </div>

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={(tpl) => {
          updateProject(() => tpl);
          setSelectedWidgetId(null);
        }}
      />

      <HardwareMemoryModal
        isOpen={isHardwareOpen}
        onClose={() => setIsHardwareOpen(false)}
        display={project.display}
        widgetCount={project.widgets.length}
        onUpdateDisplay={(updated) =>
          updateProject((prev) => ({
            ...prev,
            display: updated,
          }))
        }
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        project={project}
        onUpdateLvglVersion={(ver) =>
          updateProject((prev) => ({
            ...prev,
            display: {
              ...prev.display,
              lvglVersion: ver,
            },
          }))
        }
      />

      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
      />
    </div>
  );
}
