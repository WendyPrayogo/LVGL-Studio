import React, { useState } from 'react';
import {
  DisplayConfig,
  McuType,
  LcdType,
  BusPort,
  FlashSize,
  FlashMode,
  FlashSpeed,
  PsramType,
  PartitionScheme,
  TouchType,
} from '../types/lvgl';
import {
  MCU_LIST,
  LCD_LIST,
  PORT_LIST,
  RESOLUTION_PRESETS,
  FLASH_SIZES,
  PSRAM_OPTIONS,
  PARTITION_SCHEMES,
  TOUCH_LIST,
  getDefaultTouchForMcuAndType,
  generatePartitionsCsv,
} from '../utils/hardwareConfig';
import { calculateMemory } from '../utils/memoryEstimator';
import {
  Cpu,
  X,
  HardDrive,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings2,
  Tv,
  Cable,
  Database,
  Sliders,
  FileSpreadsheet,
  Fingerprint,
  RotateCw,
  Sparkles,
  Info,
} from 'lucide-react';

interface HardwareMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  display: DisplayConfig;
  widgetCount: number;
  onUpdateDisplay: (updated: DisplayConfig) => void;
}

export const HardwareMemoryModal: React.FC<HardwareMemoryModalProps> = ({
  isOpen,
  onClose,
  display,
  widgetCount,
  onUpdateDisplay,
}) => {
  const [tab, setTab] = useState<'hardware' | 'touch' | 'flash_psram' | 'pins' | 'memory'>('hardware');
  const [testTouchPoint, setTestTouchPoint] = useState<{ rawX: number; rawY: number; transformedX: number; transformedY: number } | null>(null);

  if (!isOpen) return null;

  const memStats = calculateMemory(display, widgetCount);
  const selectedMcu = MCU_LIST.find((m) => m.id === display.mcu) || MCU_LIST[0];
  const selectedLcd = LCD_LIST.find((l) => l.id === display.lcdType) || LCD_LIST[0];
  const selectedPort = PORT_LIST.find((p) => p.id === display.port) || PORT_LIST[0];
  const flash = display.flashConfig;
  const touch = display.touchConfig || {
    type: 'cst816s',
    bus: 'i2c',
    i2cAddr: '0x15',
    sda: 21,
    scl: 22,
    intPin: 34,
    rstPin: 33,
    swapXY: false,
    invertX: false,
    invertY: false,
  };
  const selectedTouch = TOUCH_LIST.find((t) => t.id === touch.type) || TOUCH_LIST[0];

  const selectedPartition =
    PARTITION_SCHEMES.find((p) => p.id === flash.partitionScheme) || PARTITION_SCHEMES[0];

  const handleMcuChange = (mcuId: McuType) => {
    const mcuData = MCU_LIST.find((m) => m.id === mcuId) || MCU_LIST[0];
    const newTouch = getDefaultTouchForMcuAndType(touch.type, mcuId);
    onUpdateDisplay({
      ...display,
      mcu: mcuId,
      pinout: {
        ...mcuData.defaultPinout,
      },
      flashConfig: {
        ...mcuData.defaultFlash,
      },
      touchConfig: newTouch,
    });
  };

  const handleLcdChange = (lcdId: LcdType) => {
    const lcdData = LCD_LIST.find((l) => l.id === lcdId) || LCD_LIST[0];
    const isRound = lcdId === 'gc9a01' || (lcdId === 'axs15231b' && display.isRound);
    const newPort = lcdData.supportedPorts.includes(display.port) ? display.port : lcdData.supportedPorts[0];
    
    // Auto-pair recommended touch if available
    const newTouchType = lcdData.defaultTouch || touch.type;
    const newTouch = getDefaultTouchForMcuAndType(newTouchType, display.mcu);

    onUpdateDisplay({
      ...display,
      lcdType: lcdId,
      isRound,
      port: newPort,
      touchConfig: newTouch,
    });
  };

  const handlePortChange = (portId: BusPort) => {
    onUpdateDisplay({
      ...display,
      port: portId,
    });
  };

  const handleResolutionPreset = (presetId: string) => {
    const preset = RESOLUTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const defaultTouchType = preset.defaultTouch || 'cst816s';
    const newTouch = getDefaultTouchForMcuAndType(defaultTouchType, display.mcu);

    onUpdateDisplay({
      ...display,
      presetId: preset.id,
      name: preset.name,
      width: preset.width,
      height: preset.height,
      isRound: preset.isRound,
      lcdType: preset.defaultLcd,
      port: preset.defaultPort,
      touchConfig: newTouch,
    });
  };

  const updateFlashConfig = (key: string, value: any) => {
    onUpdateDisplay({
      ...display,
      flashConfig: {
        ...display.flashConfig,
        [key]: value,
      },
    });
  };

  const handleTouchChange = (touchId: TouchType) => {
    const newTouch = getDefaultTouchForMcuAndType(touchId, display.mcu);
    onUpdateDisplay({
      ...display,
      touchConfig: newTouch,
    });
  };

  const updateTouchConfig = (key: string, value: any) => {
    onUpdateDisplay({
      ...display,
      touchConfig: {
        ...touch,
        [key]: value,
      },
    });
  };

  const handleTouchTestClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = Math.round(((e.clientX - rect.left) / rect.width) * display.width);
    const rawY = Math.round(((e.clientY - rect.top) / rect.height) * display.height);

    let tx = rawX;
    let ty = rawY;

    if (touch.swapXY) {
      const temp = tx;
      tx = ty;
      ty = temp;
    }
    if (touch.invertX) {
      tx = display.width - tx;
    }
    if (touch.invertY) {
      ty = display.height - ty;
    }

    setTestTouchPoint({ rawX, rawY, transformedX: tx, transformedY: ty });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Embedded Target, Display & Peripheral Configuration</h3>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  {selectedMcu.name} · {selectedLcd.id.toUpperCase()} · {touch.type !== 'none' ? selectedTouch.name.split(' ')[0] : 'No Touch'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure microcontroller, AXS15231B/IPS LCD, bus port, touch controller, flash, PSRAM, and Arduino/PlatformIO partition parameters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-2 pb-0 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setTab('hardware')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'hardware'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MCU, LCD & Port</span>
          </button>
          <button
            onClick={() => setTab('touch')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'touch'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Touch Screen Controller</span>
          </button>
          <button
            onClick={() => setTab('flash_psram')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'flash_psram'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Flash, PSRAM & Partitions</span>
          </button>
          <button
            onClick={() => setTab('pins')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'pins'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cable className="w-3.5 h-3.5" />
            <span>GPIO Pinout Mapping</span>
          </button>
          <button
            onClick={() => setTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'memory'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>SRAM & Performance</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* TAB 1: MCU, LCD & Port */}
          {tab === 'hardware' && (
            <div className="space-y-6">
              {/* Microcontroller Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. Microcontroller Type (MCU)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MCU_LIST.map((mcu) => {
                    const isSelected = display.mcu === mcu.id;
                    return (
                      <div
                        key={mcu.id}
                        onClick={() => handleMcuChange(mcu.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-white">
                            {mcu.name}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                            {mcu.sramKB} KB SRAM
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mb-1.5">
                          {mcu.core} · {mcu.clockSpeed}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {mcu.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LCD Controller Type */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. LCD / Display Controller Type</span>
                  </label>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    Includes AXS15231B AMOLED & standard IPS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {LCD_LIST.map((lcd) => {
                    const isSelected = display.lcdType === lcd.id;
                    const isAxs = lcd.id === 'axs15231b';
                    return (
                      <div
                        key={lcd.id}
                        onClick={() => handleLcdChange(lcd.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                            : isAxs
                            ? 'bg-slate-950/80 border-cyan-900/60 hover:border-cyan-700 hover:bg-slate-800/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-200">
                            {lcd.name.split(' ')[0]}
                          </span>
                          {isAxs && (
                            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1 rounded border border-cyan-800">
                              AMOLED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400 mb-1">
                          {lcd.typicalRes}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">
                          {lcd.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Port / Bus Interface */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                  <Cable className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3. Hardware Port / Bus Interface</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PORT_LIST.map((port) => {
                    const isSelected = display.port === port.id;
                    const isSupported = selectedLcd.supportedPorts.includes(port.id);

                    return (
                      <div
                        key={port.id}
                        onClick={() => handlePortChange(port.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                            : isSupported
                            ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                            : 'bg-slate-950/30 border-slate-800/40 opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-200">
                            {port.name}
                          </span>
                          {!isSupported && (
                            <span className="text-[9px] text-amber-400 border border-amber-800/60 px-1 rounded">
                              Non-standard
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mb-1">
                          {port.pinCount}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {port.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution & Geometry */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    4. Display Resolution & Color Depth
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Quick Standard:</span>
                    <select
                      value={display.presetId}
                      onChange={(e) => handleResolutionPreset(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs font-mono text-cyan-300"
                    >
                      {RESOLUTION_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={display.width}
                      onChange={(e) =>
                        onUpdateDisplay({ ...display, width: Number(e.target.value), presetId: 'custom' })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={display.height}
                      onChange={(e) =>
                        onUpdateDisplay({ ...display, height: Number(e.target.value), presetId: 'custom' })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Color Depth</label>
                    <select
                      value={display.colorDepth}
                      onChange={(e) =>
                        onUpdateDisplay({ ...display, colorDepth: Number(e.target.value) as any })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100"
                    >
                      <option value="16">16-bit (RGB565 - Standard)</option>
                      <option value="24">24-bit (RGB888)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Display Shape</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="chk_round"
                        checked={display.isRound}
                        onChange={(e) => onUpdateDisplay({ ...display, isRound: e.target.checked })}
                        className="rounded bg-slate-950 border-slate-800 text-cyan-500 accent-cyan-500"
                      />
                      <label htmlFor="chk_round" className="text-xs text-slate-300">
                        Circular / Round Dial
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Touch Screen Controller (NEW dedicated tab) */}
          {tab === 'touch' && (
            <div className="space-y-6">
              {/* Touch IC Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                    <span>1. Touch Screen Controller IC</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Currently selected: <strong className="text-cyan-400 font-mono">{selectedTouch.name}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {TOUCH_LIST.map((t) => {
                    const isSelected = touch.type === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleTouchChange(t.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-100">{t.name}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            t.tech === 'Capacitive'
                              ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60'
                              : t.tech === 'Resistive'
                              ? 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                              : 'text-slate-500 bg-slate-900 border-slate-800'
                          }`}>
                            {t.tech}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mb-1">
                          {t.bus.toUpperCase()} {t.defaultI2cAddr !== 'N/A' ? `· Address: ${t.defaultI2cAddr}` : ''}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{t.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {touch.type !== 'none' && (
                <>
                  {/* Touch Bus & I2C Address */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                      <Cable className="w-3.5 h-3.5 text-cyan-400" />
                      <span>2. Touch Bus & Address Configuration</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Interface Bus</label>
                        <select
                          value={touch.bus}
                          onChange={(e) => updateTouchConfig('bus', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                        >
                          <option value="i2c">I2C (Standard 2-Wire)</option>
                          <option value="spi">SPI (4-Wire, for XPT2046)</option>
                        </select>
                      </div>

                      {touch.bus === 'i2c' && (
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            I2C Slave Address (HEX)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={touch.i2cAddr}
                              onChange={(e) => updateTouchConfig('i2cAddr', e.target.value)}
                              placeholder="0x15"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-300 font-bold"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateTouchConfig('i2cAddr', '0x3B')}
                                className="px-1.5 py-1 text-[10px] font-mono bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 rounded text-cyan-300 font-bold cursor-pointer"
                                title="AXS15231B Integrated Touch"
                              >
                                0x3B
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTouchConfig('i2cAddr', '0x15')}
                                className="px-1.5 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                                title="CST816S"
                              >
                                0x15
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTouchConfig('i2cAddr', '0x38')}
                                className="px-1.5 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                                title="FT6236"
                              >
                                0x38
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTouchConfig('i2cAddr', '0x5D')}
                                className="px-1.5 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                                title="GT911"
                              >
                                0x5D
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col justify-end">
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                          Driver: <code className="text-cyan-400">{touch.type.toUpperCase()}_DRIVER</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Touch Orientation Transformation */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>3. Coordinate Orientation & Axis Calibration</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Fixes rotated touch coordinates matching LCD orientation
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={touch.swapXY}
                          onChange={(e) => updateTouchConfig('swapXY', e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 accent-cyan-500 w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Swap X / Y Axes</div>
                          <div className="text-[10px] text-slate-400">Transposes coordinates (Portrait ↔ Landscape)</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={touch.invertX}
                          onChange={(e) => updateTouchConfig('invertX', e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 accent-cyan-500 w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Invert X Axis</div>
                          <div className="text-[10px] text-slate-400">Flips horizontal direction (Width - X)</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={touch.invertY}
                          onChange={(e) => updateTouchConfig('invertY', e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 accent-cyan-500 w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Invert Y Axis</div>
                          <div className="text-[10px] text-slate-400">Flips vertical direction (Height - Y)</div>
                        </div>
                      </label>
                    </div>

                    {/* Interactive Touch Test Pad */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Interactive Touch Calibration Simulator</span>
                        </span>
                        <span className="text-[11px] font-mono text-cyan-400">
                          {testTouchPoint
                            ? `Raw: (${testTouchPoint.rawX}, ${testTouchPoint.rawY}) → LVGL: (${testTouchPoint.transformedX}, ${testTouchPoint.transformedY})`
                            : 'Click anywhere inside box to test coordinate transformation'}
                        </span>
                      </div>

                      <div
                        onClick={handleTouchTestClick}
                        className="w-full h-24 bg-slate-900/80 border border-dashed border-slate-700 rounded-lg relative flex items-center justify-center cursor-crosshair select-none overflow-hidden"
                      >
                        <span className="text-[11px] text-slate-500 pointer-events-none">
                          Display Area: {display.width} × {display.height} px
                        </span>

                        {testTouchPoint && (
                          <div
                            className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-cyan-400 bg-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.8)] pointer-events-none transition-all flex items-center justify-center"
                            style={{
                              left: `${(testTouchPoint.rawX / display.width) * 100}%`,
                              top: `${(testTouchPoint.rawY / display.height) * 100}%`,
                            }}
                          >
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: Flash Size, PSRAM & Partitions (Arduino IDE & PlatformIO params) */}
          {tab === 'flash_psram' && (
            <div className="space-y-6">
              {/* Flash Size & Mode */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. On-Board Flash Size & SPI Bus Mode</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
                  {FLASH_SIZES.map((f) => {
                    const isSelected = flash.flashSize === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => updateFlashConfig('flashSize', f.id)}
                        className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="text-sm font-bold text-white mb-0.5">{f.id}</div>
                        <div className="text-[10px] text-slate-400 truncate">{f.label.split(' ')[0]}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Flash SPI Mode (<code className="text-cyan-400">board_build.flash_mode</code>)
                    </label>
                    <select
                      value={flash.flashMode}
                      onChange={(e) => updateFlashConfig('flashMode', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    >
                      <option value="qio">QIO (Quad I/O - 4 data lines, fast)</option>
                      <option value="dio">DIO (Dual I/O - 2 data lines, universal)</option>
                      <option value="qout">QOUT (Quad Output)</option>
                      <option value="dout">DOUT (Dual Output)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Flash Clock Speed (<code className="text-cyan-400">board_build.f_flash</code>)
                    </label>
                    <select
                      value={flash.flashSpeed}
                      onChange={(e) => updateFlashConfig('flashSpeed', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    >
                      <option value="80MHz">80 MHz (Standard High Performance)</option>
                      <option value="40MHz">40 MHz (Safe / High Reliability)</option>
                      <option value="120MHz">120 MHz (RP2350 / ESP32-S3 QSPI)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PSRAM (Pseudo-Static External RAM) */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. External PSRAM (SPIRAM)</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Allocates LVGL framebuffers outside internal SRAM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PSRAM_OPTIONS.map((p) => {
                    const isSelected = flash.psram === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => updateFlashConfig('psram', p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-200">{p.label}</span>
                          <span className="text-[10px] font-mono text-cyan-400">{p.bus}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{p.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Partition Scheme */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>3. Flash Partition Scheme (Arduino IDE / PlatformIO)</span>
                  </label>
                  <span className="text-[11px] font-mono text-cyan-400">
                    <code className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
                      board_build.partitions = {flash.partitionScheme}.csv
                    </code>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {PARTITION_SCHEMES.map((part) => {
                    const isSelected = flash.partitionScheme === part.id;
                    return (
                      <div
                        key={part.id}
                        onClick={() => updateFlashConfig('partitionScheme', part.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-200">{part.label}</span>
                          {part.otaSupported && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                              OTA Supported
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{part.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Partition visual storage split */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Partition Distribution ({selectedPartition.label})
                    </span>
                    <span className="font-mono text-cyan-400">
                      App Partition: {selectedPartition.appSizeMB} MB | FileSystem: {selectedPartition.fsSizeMB} MB
                    </span>
                  </div>

                  <div className="w-full h-4 rounded-md bg-slate-900 border border-slate-800 flex overflow-hidden text-[10px] font-mono font-bold">
                    <div
                      className="bg-cyan-500 text-slate-950 flex items-center justify-center transition-all"
                      style={{ width: `${(selectedPartition.appSizeMB / (selectedPartition.appSizeMB + selectedPartition.fsSizeMB + 0.1)) * 100}%` }}
                    >
                      APP ({selectedPartition.appSizeMB} MB)
                    </div>
                    <div
                      className="bg-amber-500 text-slate-950 flex items-center justify-center transition-all"
                      style={{ width: `${(selectedPartition.fsSizeMB / (selectedPartition.appSizeMB + selectedPartition.fsSizeMB + 0.1)) * 100}%` }}
                    >
                      FS ({selectedPartition.fsSizeMB} MB)
                    </div>
                    <div className="bg-slate-700 text-slate-300 px-1 flex items-center justify-center">
                      NVS
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1">
                    Your estimated LVGL firmware size is <strong className="text-slate-200 font-mono">~{memStats.flashEstimateKB} KB</strong>. It occupies only <strong className="text-emerald-400 font-mono">{memStats.flashAppUsagePercent}%</strong> of the available App partition, leaving extensive space for fonts and graphics assets.
                  </p>
                </div>
              </div>

              {/* 4. Arduino IDE Tools Menu Equivalent (User requested exact Arduino IDE param view!) */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>4. Arduino IDE Tools Menu Equivalent Settings</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Select these options in Arduino IDE</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Tools → Board:</span>
                    <span className="text-white font-bold">{selectedMcu.id === 'rp2040' ? 'Raspberry Pi Pico' : selectedMcu.id === 'rp2350' ? 'Raspberry Pi Pico 2' : selectedMcu.id === 'esp32_s3' ? 'ESP32S3 Dev Module' : selectedMcu.id === 'esp32_c5' ? 'ESP32C5 Dev Module' : 'ESP32 Dev Module'}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Tools → Flash Size:</span>
                    <span className="text-cyan-300 font-bold">{flash.flashSize}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Tools → Flash Mode:</span>
                    <span className="text-cyan-300 font-bold">{flash.flashMode.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Tools → Flash Frequency:</span>
                    <span className="text-cyan-300 font-bold">{flash.flashSpeed}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Tools → PSRAM:</span>
                    <span className={flash.psram !== 'none' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {flash.psram === 'none' ? 'Disabled' : flash.psram.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-slate-400">Tools → Partition Scheme:</span>
                    <span className="text-amber-300 font-bold">{selectedPartition.label}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GPIO Pinout Mapping */}
          {tab === 'pins' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    GPIO Pin Mapping for {selectedMcu.name} + {selectedLcd.name.split(' ')[0]}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Adjust the hardware pin assignments to match your specific breadboard or PCB layout.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onUpdateDisplay({
                      ...display,
                      pinout: { ...selectedMcu.defaultPinout },
                      touchConfig: getDefaultTouchForMcuAndType(touch.type, display.mcu),
                    });
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 cursor-pointer"
                >
                  Reset to {selectedMcu.name} Defaults
                </button>
              </div>

              {/* Display SPI / QSPI pins */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-semibold text-cyan-400 block">
                  Display SPI / QSPI Lines
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      TFT_SCLK (Clock)
                    </label>
                    <input
                      type="number"
                      value={display.pinout.sclk}
                      onChange={(e) =>
                        onUpdateDisplay({
                          ...display,
                          pinout: { ...display.pinout, sclk: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      TFT_MOSI / D0 (Data 0)
                    </label>
                    <input
                      type="number"
                      value={display.pinout.mosi}
                      onChange={(e) =>
                        onUpdateDisplay({
                          ...display,
                          pinout: { ...display.pinout, mosi: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      TFT_MISO / D1 (Data 1)
                    </label>
                    <input
                      type="number"
                      value={display.pinout.miso}
                      onChange={(e) =>
                        onUpdateDisplay({
                          ...display,
                          pinout: { ...display.pinout, miso: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      TFT_CS (Chip Select)
                    </label>
                    <input
                      type="number"
                      value={display.pinout.cs}
                      onChange={(e) =>
                        onUpdateDisplay({
                          ...display,
                          pinout: { ...display.pinout, cs: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* QSPI specific lines for AXS15231B */}
              {display.port === 'qspi' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-mono font-semibold text-cyan-400 block">
                    AXS15231B Quad SPI Extra Lines
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        TFT_QSPI_D2 (Data 2)
                      </label>
                      <input
                        type="number"
                        value={display.pinout.d2 ?? 41}
                        onChange={(e) =>
                          onUpdateDisplay({
                            ...display,
                            pinout: { ...display.pinout, d2: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        TFT_QSPI_D3 (Data 3)
                      </label>
                      <input
                        type="number"
                        value={display.pinout.d3 ?? 42}
                        onChange={(e) =>
                          onUpdateDisplay({
                            ...display,
                            pinout: { ...display.pinout, d3: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        TFT_TE (Tearing Effect)
                      </label>
                      <input
                        type="number"
                        value={display.pinout.te ?? 18}
                        onChange={(e) =>
                          onUpdateDisplay({
                            ...display,
                            pinout: { ...display.pinout, te: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Control pins */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-mono font-semibold text-slate-300 block">
                  Display Control Lines
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      TFT_DC (Command/Data)
                    </label>
                    <input
                      type="number"
                      value={display.pinout.dc}
                      onChange={(e) =>
                        onUpdateDisplay({
                          ...display,
                          pinout: { ...display.pinout, dc: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      TFT_RST (Reset)
                    </label>
                    <input
                      type="number"
                      value={display.pinout.rst}
                      onChange={(e) =>
                        onUpdateDisplay({
                          ...display,
                          pinout: { ...display.pinout, rst: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      TFT_BL (Backlight)
                    </label>
                    <input
                      type="number"
                      value={display.pinout.bl}
                      onChange={(e) =>
                        onUpdateDisplay({
                          ...display,
                          pinout: { ...display.pinout, bl: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Touch Controller Pins */}
              {touch.type !== 'none' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-mono font-semibold text-emerald-400 block">
                    Touch Controller Lines ({selectedTouch.name})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        TOUCH_SDA / MOSI
                      </label>
                      <input
                        type="number"
                        value={touch.sda}
                        onChange={(e) => updateTouchConfig('sda', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-emerald-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        TOUCH_SCL / SCLK
                      </label>
                      <input
                        type="number"
                        value={touch.scl}
                        onChange={(e) => updateTouchConfig('scl', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-emerald-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        TOUCH_INT (Interrupt)
                      </label>
                      <input
                        type="number"
                        value={touch.intPin}
                        onChange={(e) => updateTouchConfig('intPin', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-emerald-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        TOUCH_RST (Reset)
                      </label>
                      <input
                        type="number"
                        value={touch.rstPin}
                        onChange={(e) => updateTouchConfig('rstPin', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-emerald-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SRAM, Heap & Performance */}
          {tab === 'memory' && (
            <div className="space-y-5">
              {/* Buffer configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Draw Buffer Height</label>
                  <select
                    value={display.bufferFraction}
                    onChange={(e) =>
                      onUpdateDisplay({ ...display, bufferFraction: Number(e.target.value) as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-100"
                  >
                    <option value="10">1/10th Screen Height (Low SRAM)</option>
                    <option value="5">1/5th Screen Height (Balanced)</option>
                    <option value="2">1/2 Screen Height (High Speed)</option>
                    <option value="1">Full Screen Buffer (Direct DMA)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Double Buffering</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="chk_double_buf"
                      checked={display.doubleBuffer}
                      onChange={(e) => onUpdateDisplay({ ...display, doubleBuffer: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 accent-cyan-500"
                    />
                    <label htmlFor="chk_double_buf" className="text-xs text-slate-300">
                      DMA Ping-Pong (Zero Tearing)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">LVGL Library Target</label>
                  <select
                    value={display.lvglVersion}
                    onChange={(e) =>
                      onUpdateDisplay({ ...display, lvglVersion: e.target.value as 'v8' | 'v9' })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-cyan-300"
                  >
                    <option value="v8">LVGL v8.3 (LTS Production)</option>
                    <option value="v9">LVGL v9.1 (Latest)</option>
                  </select>
                </div>
              </div>

              {/* Memory Usage Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {selectedMcu.name} SRAM Utilization
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {memStats.totalRamRequiredKB} KB / {memStats.mcuSramKB} KB ({memStats.sramUsagePercent}%)
                    </span>
                  </div>
                  {memStats.psramEnabled && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      PSRAM: +{memStats.psramMB} MB Active
                    </span>
                  )}
                </div>

                {/* Progress bar of SRAM */}
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      memStats.sramUsagePercent > 80
                        ? 'bg-rose-500'
                        : memStats.sramUsagePercent > 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, memStats.sramUsagePercent)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 mb-0.5">Draw Buffer RAM</div>
                    <div className="text-base font-bold font-mono text-cyan-400">
                      {memStats.drawBufferKB} KB
                    </div>
                    {memStats.psramEnabled && (
                      <span className="text-[9px] text-emerald-400">Offloaded to PSRAM</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 mb-0.5">Widget Heap RAM</div>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {memStats.widgetHeapKB} KB
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 mb-0.5">Total Heap RAM</div>
                    <div className="text-base font-bold font-mono text-amber-400">
                      {memStats.totalRamRequiredKB} KB
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 mb-0.5">Flash ROM Size</div>
                    <div className="text-base font-bold font-mono text-purple-400">
                      ~{memStats.flashEstimateKB} KB
                    </div>
                  </div>
                </div>

                {/* MCU Specific Advice */}
                <div className="text-xs pt-2">
                  {display.mcu === 'rp2040' && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed">
                      💡 <strong className="text-cyan-400">RP2040 Note:</strong> Total internal SRAM is 264KB. Keep draw buffer at 1/10th or 1/5th to leave adequate stack and heap space for your application.
                    </div>
                  )}
                  {display.mcu === 'rp2350' && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed">
                      🚀 <strong className="text-cyan-400">RP2350 Note:</strong> With 520KB SRAM and 150MHz Cortex-M33, you can easily run 1/5th or 1/2 double buffers with PIO hardware state machines for 60 FPS graphics.
                    </div>
                  )}
                  {display.mcu === 'esp32' && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed">
                      ⚡ <strong className="text-cyan-400">ESP32 Note:</strong> Dual-core 240MHz handles LVGL DMA transfers on Core 0 while running your user tasks on Core 1.
                    </div>
                  )}
                  {display.mcu === 'esp32_s3' && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed">
                      🌟 <strong className="text-cyan-400">ESP32-S3 Note:</strong> Ideal for AXS15231B AMOLED or 800x480 RGB panels (e.g. Waveshare 3.49" 172x640) with Octal OPI PSRAM and DMA high-throughput graphics.
                    </div>
                  )}
                  {display.mcu === 'esp32_c5' && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed">
                      📡 <strong className="text-cyan-400">ESP32-C5 Note:</strong> 32-bit RISC-V with dual-band 2.4/5GHz Wi-Fi 6, BLE 5, and 8MB PSRAM. Powers 320x320 panels (like Waveshare 2.73) with abundant flash for sensor stations and IoT controllers.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Current: <span className="text-cyan-400 font-mono font-bold">{selectedMcu.name}</span> · <span className="text-slate-200 font-mono">{selectedLcd.name.split(' ')[0]}</span> · <span className="text-emerald-400 font-mono">{touch.type !== 'none' ? selectedTouch.name.split(' ')[0] : 'No Touch'}</span> · <span className="text-slate-300 font-mono">{flash.flashSize}</span> · <span className="text-amber-400 font-mono">{flash.psram === 'none' ? 'No PSRAM' : flash.psram.toUpperCase()}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
          >
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
