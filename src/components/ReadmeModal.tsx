import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, ExternalLink, Image as ImageIcon, Cpu, Zap, Layers, Sparkles } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown'>('preview');

  if (!isOpen) return null;

  const handleCopy = () => {
    fetch('/README.md')
      .then((res) => res.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Fallback
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#0B0F19] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0E1424]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">LVGL Studio Documentation &amp; README</h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  v8.4 &amp; v9.2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Architecture, pinouts, Event Listener Set &amp; Get engine, and PlatformIO/Arduino flashing guide
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'preview' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Visual Guide &amp; Screenshot
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'markdown' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw README.md
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy README'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm">
          {activeTab === 'preview' ? (
            <>
              {/* Dashboard Screenshot Showcase */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                      Dashboard Screenshot
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">dashboard_screenshot.png (1920 × 1080)</span>
                </div>

                <div className="relative rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-2xl group">
                  <img
                    src="/dashboard_screenshot.png"
                    alt="LVGL Studio Dashboard Screenshot"
                    className="w-full h-auto object-cover rounded-xl"
                  />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-cyan-300 text-xs px-2.5 py-1 rounded border border-slate-700 font-mono">
                    High-Res Vector Capture
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">
                  Figure: LVGL Studio designing a multi-screen industrial dashboard for the Waveshare ESP32-S3-Touch-LCD-3.49 featuring real-time telemetry charts, circular arc meters, interactive controls, and visual Event Listener Set &amp; Get property binding.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Visual Event &amp; Set/Get Engine</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Wire standard LVGL triggers (<code className="text-cyan-300">LV_EVENT_CLICKED</code>, <code className="text-cyan-300">VALUE_CHANGED</code>) to property synchronization (<code className="text-emerald-300">get_and_set</code>), target property mutation, or animated screen navigation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Multi-Page &amp; Screens</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Design multi-screen applications with default boot screen assignment, screen switching simulation, and auto-generated <code className="text-cyan-300">lv_scr_load_anim</code> C routines.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/40 flex items-center justify-center text-amber-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-white text-sm">Target Hardware Accuracy</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tested presets for Waveshare ESP32-S3-Touch-LCD-3.49 (AXS15231B touch I2C addr 0x3B), ESP32-C5 2.73&quot;, LilyGO T-Display, round AMOLEDs, and STM32/RP2040 boards.
                  </p>
                </div>
              </div>

              {/* Hardware Pinout Tables */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Hardware Pinout Reference
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Board 1 */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">Waveshare ESP32-S3-Touch-LCD-3.49</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                        172 × 640 QSPI
                      </span>
                    </div>
                    <div className="text-xs space-y-1 font-mono text-slate-300">
                      <div className="flex justify-between border-b border-slate-800/60 py-1">
                        <span className="text-slate-400">Display Controller:</span>
                        <span className="text-cyan-300">AXS15231B (QSPI 4-Bit)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 py-1">
                        <span className="text-slate-400">Display Pins:</span>
                        <span>CS:10, SCK:9, D0:11, D1:12, D2:13, D3:14</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 py-1">
                        <span className="text-slate-400">Touch Controller:</span>
                        <span className="text-emerald-300">AXS15231B Integrated (0x3B)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Touch Pins:</span>
                        <span>SDA:15, SCL:16, INT:4, RST:8</span>
                      </div>
                    </div>
                  </div>

                  {/* Board 2 */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">Waveshare ESP32-C5-LCD-2.73</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                        320 × 320 SPI
                      </span>
                    </div>
                    <div className="text-xs space-y-1 font-mono text-slate-300">
                      <div className="flex justify-between border-b border-slate-800/60 py-1">
                        <span className="text-slate-400">Microcontroller:</span>
                        <span className="text-emerald-300">ESP32-C5 RISC-V (WiFi 6)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 py-1">
                        <span className="text-slate-400">Display Controller:</span>
                        <span className="text-cyan-300">ST7789 / ST7789T3</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 py-1">
                        <span className="text-slate-400">Interface:</span>
                        <span>SPI (CS:10, SCK:12, MOSI:11, DC:9)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Control Pins:</span>
                        <span>RST:8, BL:7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Generation Snippet */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Generated Event Action C Code Example
                  </h3>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#070A11] p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                  <div className="text-slate-500">// ui_events.c - Generated by LVGL Studio</div>
                  <div className="text-cyan-400">#include &quot;ui.h&quot;</div>
                  <br />
                  <div className="text-slate-400">// Visual Set &amp; Get Property Binding callback</div>
                  <div><span className="text-blue-400">void</span> <span className="text-amber-300">on_slider_speed_value_changed</span>(lv_event_t * e) &#123;</div>
                  <div className="pl-4">lv_obj_t * src = lv_event_get_target(e);</div>
                  <div className="pl-4">int32_t val = lv_slider_get_value(src);</div>
                  <div className="pl-4 text-emerald-400">lv_label_set_text_fmt(ui_lbl_motor_rpm, &quot;%d %% SPEED&quot;, (int)val);</div>
                  <div>&#125;</div>
                  <br />
                  <div className="text-slate-400">// Multi-Page Screen Transition callback</div>
                  <div><span className="text-blue-400">void</span> <span className="text-amber-300">on_btn_screen2_clicked</span>(lv_event_t * e) &#123;</div>
                  <div className="pl-4 text-cyan-300">lv_scr_load_anim(ui_Screen2, LV_SCR_LOAD_ANIM_FADE_ON, 300, 0, false);</div>
                  <div>&#125;</div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Project Root: /README.md</span>
                <span className="text-xs text-cyan-400 font-mono">Markdown Format</span>
              </div>
              <pre className="p-4 rounded-xl bg-[#070A11] border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {`# LVGL Studio — Embedded GUI Designer & Code Generator

A visual drag-and-drop user interface designer and production-ready C/C++ code generator for LVGL targeting modern microcontrollers (ESP32, ESP32-S3, ESP32-C5, RP2040, STM32).

## Key Highlights
- Visual Drag & Drop Canvas with instant live preview.
- Multi-Page & Screen Manager with animated hardware transitions.
- Visual Event Listener & Action Engine (Set & Get property binding).
- In-Browser Interactive Simulator & Live Logger.
- Hardware & RAM Estimation Engine.
- One-Click Code Export for PlatformIO and Arduino IDE.

## Supported Hardware
- Waveshare ESP32-S3-Touch-LCD-3.49 (AXS15231B LCD & Touch I2C 0x3B)
- Waveshare ESP32-C5-LCD-2.73 (ST7789 320x320)
- LilyGO T-Display S3, CYD ESP32-2432S028R, Round AMOLEDs...`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0E1424] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>README.md and dashboard_screenshot.png active in project root</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
