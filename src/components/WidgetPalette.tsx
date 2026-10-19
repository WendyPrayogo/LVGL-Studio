import React, { useState } from 'react';
import { WidgetType } from '../types/lvgl';
import {
  Square,
  Type,
  SlidersHorizontal,
  ToggleLeft,
  CircleDot,
  Gauge,
  Activity,
  CheckSquare,
  ChevronDown,
  Sun,
  Loader2,
  LayoutGrid,
  Search,
} from 'lucide-react';

interface WidgetPaletteProps {
  onAddWidget: (type: WidgetType) => void;
}

interface PaletteItem {
  type: WidgetType;
  label: string;
  lvglFunc: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Containers' | 'Basic' | 'Controls' | 'Indicators' | 'Data';
  defaultW: number;
  defaultH: number;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Containers
  {
    type: 'container',
    label: 'Container / Panel',
    lvglFunc: 'lv_obj_create',
    icon: Square,
    category: 'Containers',
    defaultW: 160,
    defaultH: 100,
  },
  // Basic
  {
    type: 'btn',
    label: 'Button',
    lvglFunc: 'lv_btn_create',
    icon: Square,
    category: 'Basic',
    defaultW: 100,
    defaultH: 38,
  },
  {
    type: 'label',
    label: 'Text Label',
    lvglFunc: 'lv_label_create',
    icon: Type,
    category: 'Basic',
    defaultW: 100,
    defaultH: 24,
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    lvglFunc: 'lv_checkbox_create',
    icon: CheckSquare,
    category: 'Basic',
    defaultW: 110,
    defaultH: 24,
  },
  // Controls
  {
    type: 'slider',
    label: 'Slider',
    lvglFunc: 'lv_slider_create',
    icon: SlidersHorizontal,
    category: 'Controls',
    defaultW: 140,
    defaultH: 20,
  },
  {
    type: 'switch',
    label: 'Switch',
    lvglFunc: 'lv_switch_create',
    icon: ToggleLeft,
    category: 'Controls',
    defaultW: 50,
    defaultH: 26,
  },
  {
    type: 'arc',
    label: 'Arc Dial',
    lvglFunc: 'lv_arc_create',
    icon: CircleDot,
    category: 'Controls',
    defaultW: 110,
    defaultH: 110,
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    lvglFunc: 'lv_dropdown_create',
    icon: ChevronDown,
    category: 'Controls',
    defaultW: 120,
    defaultH: 34,
  },
  // Indicators
  {
    type: 'bar',
    label: 'Progress Bar',
    lvglFunc: 'lv_bar_create',
    icon: SlidersHorizontal,
    category: 'Indicators',
    defaultW: 140,
    defaultH: 16,
  },
  {
    type: 'meter',
    label: 'Gauge / Meter',
    lvglFunc: 'lv_meter_create',
    icon: Gauge,
    category: 'Indicators',
    defaultW: 130,
    defaultH: 130,
  },
  {
    type: 'led',
    label: 'LED Indicator',
    lvglFunc: 'lv_led_create',
    icon: Sun,
    category: 'Indicators',
    defaultW: 24,
    defaultH: 24,
  },
  {
    type: 'spinner',
    label: 'Spinner Loader',
    lvglFunc: 'lv_spinner_create',
    icon: Loader2,
    category: 'Indicators',
    defaultW: 40,
    defaultH: 40,
  },
  // Data
  {
    type: 'chart',
    label: 'Chart / Graph',
    lvglFunc: 'lv_chart_create',
    icon: Activity,
    category: 'Data',
    defaultW: 180,
    defaultH: 110,
  },
];

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({ onAddWidget }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Containers', 'Basic', 'Controls', 'Indicators', 'Data'];

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lvglFunc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData('application/lvgl-widget', item.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            LVGL Widgets
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            {PALETTE_ITEMS.length} types
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search widget (e.g. arc, btn)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
          />
        </div>

        {/* Filter categories tabs */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => onAddWidget(item.type)}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-800/50 cursor-grab active:cursor-grabbing transition-all group shadow-sm"
              title={`Drag to canvas or click to add ${item.label}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                    {item.lvglFunc}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-600 group-hover:text-cyan-400 shrink-0 ml-1">
                +ADD
              </span>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            No widgets match &quot;{searchTerm}&quot;
          </div>
        )}
      </div>

      {/* Hint footer */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400 text-center">
        Drag widget or click to place on display
      </div>
    </aside>
  );
};
