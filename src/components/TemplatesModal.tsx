import React from 'react';
import { TEMPLATES } from '../utils/templates';
import { ProjectData } from '../types/lvgl';
import { LayoutTemplate, X, Check, Thermometer, Factory, Watch, BatteryCharging, Smartphone } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: ProjectData) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  if (!isOpen) return null;

  const templateList = [
    {
      key: 'waveshare_esp32_s3_349',
      data: TEMPLATES.waveshare_esp32_s3_349,
      icon: Smartphone,
      tag: 'Waveshare · ESP32-S3 (172×640 QSPI + AXS15231B Touch)',
      description: '3.49" IPS bar display with integrated AXS15231B QSPI display & capacitive touch (I2C 0x3B). Smart home pod with temperature dial, dimmer, music player, and scene controls.',
      docUrl: 'https://docs.waveshare.com/ESP32-S3-Touch-LCD-3.49',
    },
    {
      key: 'waveshare_esp32_c5_273',
      data: TEMPLATES.waveshare_esp32_c5_273,
      icon: Factory,
      tag: 'Waveshare · ESP32-C5 RISC-V (320×320)',
      description: '2.73" square display (ILI9488 SPI) on ESP32-C5 dual-band Wi-Fi 6 RISC-V with SHTC3 climate sensors, telemetry chart, and 3 keys.',
      docUrl: 'https://docs.waveshare.com/ESP32-C5-LCD-2.73',
    },
    {
      key: 'axs15231b_amoled',
      data: TEMPLATES.axs15231b_amoled,
      icon: Smartphone,
      tag: 'ESP32-S3 · AXS15231B AMOLED (QSPI + CST816S)',
      description: '1.8" AMOLED wearable dial with CST816S capacitive touch, real-time heart rate, battery arc, and workout triggers.',
    },
    {
      key: 'thermostat',
      data: TEMPLATES.thermostat,
      icon: Thermometer,
      tag: 'ESP32 · ILI9341 (SPI + XPT2046)',
      description: 'Climate control HMI with temperature arc dial, room modes, fan speed slider, and relay switch.',
    },
    {
      key: 'industrial',
      data: TEMPLATES.industrial,
      icon: Factory,
      tag: 'RP2350 · ST7796 (8080-16)',
      description: 'CNC spindle monitor with live vibration chart, RPM gauge, motor load bar, and emergency stop.',
    },
    {
      key: 'watch',
      data: TEMPLATES.watch,
      icon: Watch,
      tag: 'RP2040 · GC9A01 (Round SPI + CST816S)',
      description: 'Circular smartwatch dial with battery arc, digital clock, step progress, and heart rate indicator.',
    },
    {
      key: 'ev_charger',
      data: TEMPLATES.ev_charger,
      icon: BatteryCharging,
      tag: 'RP2350 · ST7262 (800x480 + GT911)',
      description: 'Commercial EV fast-charging interface with SOC percentage bar, charging power meter, and stop button.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pre-Built Embedded UI Templates</h3>
              <p className="text-xs text-slate-400">
                Jumpstart your rapid prototyping with industry-standard LVGL layouts.
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

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[70vh]">
          {templateList.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.key}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {tpl.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white">
                      {tpl.data.name}
                    </h4>
                    {tpl.docUrl && (
                      <a
                        href={tpl.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Waveshare Wiki ↗
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-500">
                    {tpl.data.widgets.length} LVGL widgets
                  </span>
                  <button
                    onClick={() => {
                      onLoadTemplate(tpl.data);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Load Template
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Loading a template replaces the current canvas layout.</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
