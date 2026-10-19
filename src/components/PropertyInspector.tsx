import React, { useState } from 'react';
import {
  LVGLWidget,
  LVGLEventType,
  ActionType,
  TargetProperty,
  SourceProperty,
  WidgetEvent,
} from '../types/lvgl';
import { generateEventCActionSnippet } from '../utils/lvglCodeGen';
import {
  Sliders,
  Palette,
  Maximize2,
  Zap,
  Trash2,
  Copy,
  Plus,
  Type,
  FileCode,
  ArrowRight,
  Eye,
  EyeOff,
  RotateCw,
  RefreshCw,
  Cpu,
  Monitor,
  Code,
  Sparkles,
  ToggleLeft,
} from 'lucide-react';

interface PropertyInspectorProps {
  widget: LVGLWidget | null;
  allWidgets: LVGLWidget[];
  screens: { id: string; name: string }[];
  onUpdateWidget: (updated: LVGLWidget) => void;
  onDeleteWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  widget,
  allWidgets,
  screens,
  onUpdateWidget,
  onDeleteWidget,
  onDuplicateWidget,
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'style' | 'props' | 'events'>('props');

  if (!widget) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 select-none p-6 items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-3">
          <Sliders className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-xs font-semibold text-slate-300 mb-1">No widget selected</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Select an embedded widget on the canvas to configure its LVGL styles, geometry, event listeners, and Get/Set actions.
        </p>
      </aside>
    );
  }

  const updateProp = (key: string, value: any) => {
    onUpdateWidget({
      ...widget,
      props: {
        ...widget.props,
        [key]: value,
      },
    });
  };

  const updateStyle = (key: string, value: any) => {
    onUpdateWidget({
      ...widget,
      styles: {
        ...widget.styles,
        [key]: value,
      },
    });
  };

  const addEvent = () => {
    const isSliderOrArc = widget.type === 'slider' || widget.type === 'arc' || widget.type === 'bar';
    const isSwitchOrCheck = widget.type === 'switch' || widget.type === 'checkbox';
    const defaultEv: LVGLEventType =
      widget.type === 'btn' ? 'LV_EVENT_CLICKED' : 'LV_EVENT_VALUE_CHANGED';
    const defaultAction: ActionType = isSliderOrArc || isSwitchOrCheck ? 'get_and_set' : 'set_property';
    const defaultHandler = `on_${widget.name}_${widget.type === 'btn' ? 'click' : 'value_changed'}`;

    // Find candidate target widget (e.g. a label or arc)
    const otherWidgets = allWidgets.filter((w) => w.id !== widget.id);
    const candidateLabel = otherWidgets.find((w) => w.type === 'label') || otherWidgets[0];

    const newEv: WidgetEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event: defaultEv,
      handlerName: defaultHandler,
      actionType: defaultAction,
      description: `Handle ${widget.name} ${defaultEv}`,
      sourceWidgetId: 'self',
      sourceProperty: isSwitchOrCheck ? 'checked' : 'value',
      targetWidgetId: candidateLabel ? candidateLabel.id : undefined,
      targetProperty: candidateLabel?.type === 'label' ? 'text' : 'value',
      formatString: '%d',
      setValue: widget.type === 'btn' ? 'Clicked!' : 100,
      screenAnim: 'NONE',
      targetScreenId: screens[0]?.id,
      hardwareAction: 'gpio_toggle',
      gpioPin: 2,
    };

    onUpdateWidget({
      ...widget,
      events: [...(widget.events || []), newEv],
    });
  };

  const updateEvent = (evId: string, updates: Partial<WidgetEvent>) => {
    const updated = (widget.events || []).map((e) =>
      e.id === evId ? { ...e, ...updates } : e
    );
    onUpdateWidget({ ...widget, events: updated });
  };

  const removeEvent = (evId: string) => {
    onUpdateWidget({
      ...widget,
      events: (widget.events || []).filter((e) => e.id !== evId),
    });
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 select-none">
      {/* Header with Widget Identity */}
      <div className="p-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
              lv_{widget.type}
            </span>
            {widget.props.hidden && (
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded flex items-center gap-1">
                <EyeOff className="w-2.5 h-2.5" />
                Hidden
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicateWidget(widget.id)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteWidget(widget.id)}
              className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Identifier / C Variable Name */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Widget C Name</label>
          <input
            type="text"
            value={widget.name}
            onChange={(e) =>
              onUpdateWidget({
                ...widget,
                name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'),
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 mt-3 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveTab('props')}
            className={`py-1 text-center rounded transition-colors ${
              activeTab === 'props'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Props
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`py-1 text-center rounded transition-colors ${
              activeTab === 'layout'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Layout
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`py-1 text-center rounded transition-colors ${
              activeTab === 'style'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`py-1 text-center rounded transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'events'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Events</span>
            {widget.events && widget.events.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* --- PROPS TAB --- */}
        {activeTab === 'props' && (
          <div className="space-y-3">
            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-300">Hidden (LV_OBJ_FLAG_HIDDEN)</span>
              <button
                type="button"
                onClick={() => updateProp('hidden', !widget.props.hidden)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors ${
                  widget.props.hidden
                    ? 'bg-amber-950/60 border border-amber-800 text-amber-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {widget.props.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{widget.props.hidden ? 'Hidden' : 'Visible'}</span>
              </button>
            </div>

            {/* Text input for Button, Label, Checkbox */}
            {(widget.type === 'btn' || widget.type === 'label' || widget.type === 'checkbox') && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Text Content
                </label>
                <input
                  type="text"
                  value={widget.props.text || ''}
                  onChange={(e) => updateProp('text', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Slider / Bar numeric values */}
            {(widget.type === 'slider' || widget.type === 'bar' || widget.type === 'arc' || widget.type === 'meter') && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Min Range</label>
                    <input
                      type="number"
                      value={widget.props.min ?? 0}
                      onChange={(e) => updateProp('min', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Max Range</label>
                    <input
                      type="number"
                      value={widget.props.max ?? 100}
                      onChange={(e) => updateProp('max', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Initial Value</span>
                    <span className="font-mono text-cyan-400">{widget.props.value ?? 50}</span>
                  </div>
                  <input
                    type="range"
                    min={widget.props.min ?? 0}
                    max={widget.props.max ?? 100}
                    value={widget.props.value ?? 50}
                    onChange={(e) => updateProp('value', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Switch Toggle */}
            {widget.type === 'switch' && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-300">Checked State</span>
                <button
                  type="button"
                  onClick={() => updateProp('checked', !widget.props.checked)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    widget.props.checked
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {widget.props.checked ? 'ON' : 'OFF'}
                </button>
              </div>
            )}

            {/* Checkbox State */}
            {widget.type === 'checkbox' && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-300">Checked</span>
                <button
                  type="button"
                  onClick={() => updateProp('checkedState', !widget.props.checkedState)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    widget.props.checkedState
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {widget.props.checkedState ? 'CHECKED' : 'UNCHECKED'}
                </button>
              </div>
            )}

            {/* Dropdown Options */}
            {widget.type === 'dropdown' && (
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">
                  Options (One per line)
                </label>
                <textarea
                  rows={4}
                  value={(widget.props.options || []).join('\n')}
                  onChange={(e) =>
                    updateProp(
                      'options',
                      e.target.value.split('\n').filter((l) => l.trim().length > 0)
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>
        )}

        {/* --- LAYOUT TAB --- */}
        {activeTab === 'layout' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-0.5">X Position</label>
                <input
                  type="number"
                  value={widget.x}
                  onChange={(e) => onUpdateWidget({ ...widget, x: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Y Position</label>
                <input
                  type="number"
                  value={widget.y}
                  onChange={(e) => onUpdateWidget({ ...widget, y: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Width (px)</label>
                <input
                  type="number"
                  value={widget.w}
                  onChange={(e) => onUpdateWidget({ ...widget, w: Math.max(16, Number(e.target.value)) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Height (px)</label>
                <input
                  type="number"
                  value={widget.h}
                  onChange={(e) => onUpdateWidget({ ...widget, h: Math.max(16, Number(e.target.value)) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Corner Radius</span>
                <span className="font-mono text-slate-400">{widget.styles.radius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.min(50, Math.floor(widget.h / 2))}
                value={widget.styles.radius}
                onChange={(e) => updateStyle('radius', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- STYLE TAB --- */}
        {activeTab === 'style' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={widget.styles.bgColor === 'transparent' ? '#0F172A' : widget.styles.bgColor}
                  onChange={(e) => updateStyle('bgColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={widget.styles.bgColor}
                  onChange={(e) => updateStyle('bgColor', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={widget.styles.textColor}
                  onChange={(e) => updateStyle('textColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={widget.styles.textColor}
                  onChange={(e) => updateStyle('textColor', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Font Size</label>
              <select
                value={widget.styles.fontSize}
                onChange={(e) => updateStyle('fontSize', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="12">Montserrat 12px (Small)</option>
                <option value="14">Montserrat 14px (Body)</option>
                <option value="16">Montserrat 16px (Regular)</option>
                <option value="20">Montserrat 20px (Medium)</option>
                <option value="24">Montserrat 24px (Large)</option>
                <option value="28">Montserrat 28px (Title)</option>
                <option value="36">Montserrat 36px (Display Hero)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Opacity</span>
                <span className="font-mono text-slate-400">
                  {Math.round((widget.styles.opacity / 255) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={widget.styles.opacity}
                onChange={(e) => updateStyle('opacity', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- EVENTS & ACTIONS TAB (EVENT LISTENER, ACTION, SET & GET) --- */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-200 block">
                  Event Listeners & Actions
                </span>
                <span className="text-[10px] text-slate-400">
                  Set & Get values across widgets
                </span>
              </div>
              <button
                onClick={addEvent}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 px-2.5 py-1 rounded-md border border-cyan-800/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            {(!widget.events || widget.events.length === 0) ? (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-300">No events configured</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Attach an event listener to trigger screen switches, set properties, or read & update other widgets.
                </p>
                <button
                  onClick={addEvent}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 px-3 py-1.5 rounded-lg border border-cyan-800/60 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Action</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {widget.events.map((ev, idx) => {
                  const cSnippet = generateEventCActionSnippet(ev, widget, allWidgets, screens);
                  const otherWidgets = allWidgets.filter((w) => w.id !== widget.id);

                  return (
                    <div
                      key={ev.id || idx}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3 relative group/card hover:border-slate-700 transition-colors"
                    >
                      {/* Event Listener (Trigger) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3 text-cyan-400" />
                            <span>1. Event Listener</span>
                          </label>
                          <button
                            onClick={() => removeEvent(ev.id)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                            title="Remove Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <select
                          value={ev.event}
                          onChange={(e) =>
                            updateEvent(ev.id, { event: e.target.value as LVGLEventType })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
                        >
                          <option value="LV_EVENT_CLICKED">LV_EVENT_CLICKED (Click / Tap)</option>
                          <option value="LV_EVENT_VALUE_CHANGED">LV_EVENT_VALUE_CHANGED (Value Drag / Toggle)</option>
                          <option value="LV_EVENT_PRESSED">LV_EVENT_PRESSED (Finger Pressed)</option>
                          <option value="LV_EVENT_RELEASED">LV_EVENT_RELEASED (Finger Released)</option>
                          <option value="LV_EVENT_LONG_PRESSED">LV_EVENT_LONG_PRESSED (Long Press)</option>
                          <option value="LV_EVENT_FOCUSED">LV_EVENT_FOCUSED (Focused)</option>
                          <option value="LV_EVENT_DEFOCUSED">LV_EVENT_DEFOCUSED (Lost Focus)</option>
                        </select>
                      </div>

                      {/* Action Type */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                          <span>2. Action</span>
                        </label>
                        <select
                          value={ev.actionType}
                          onChange={(e) =>
                            updateEvent(ev.id, { actionType: e.target.value as ActionType })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="get_and_set">🔄 Get & Set (Read Value ➔ Write to Target)</option>
                          <option value="set_property">✏️ Set Property (Direct Constant Value)</option>
                          <option value="switch_screen">🖥️ Switch Screen (Screen Navigation)</option>
                          <option value="toggle_widget">👁️ Toggle Widget (Hide / Show)</option>
                          <option value="call_hardware">⚡ Hardware Pin (GPIO / PWM / Buzzer)</option>
                          <option value="custom_c">💻 Custom C Callback</option>
                        </select>
                      </div>

                      {/* Contextual Action Settings */}

                      {/* A: GET & SET */}
                      {ev.actionType === 'get_and_set' && (
                        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2.5">
                          {/* Source GET */}
                          <div className="border-b border-slate-800/60 pb-2">
                            <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
                              GET (Read Source)
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">Source Widget</label>
                                <select
                                  value={ev.sourceWidgetId || 'self'}
                                  onChange={(e) =>
                                    updateEvent(ev.id, { sourceWidgetId: e.target.value })
                                  }
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200"
                                >
                                  <option value="self">This Widget ({widget.name})</option>
                                  {otherWidgets.map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name} ({w.type})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">Source Property</label>
                                <select
                                  value={ev.sourceProperty || 'value'}
                                  onChange={(e) =>
                                    updateEvent(ev.id, { sourceProperty: e.target.value as SourceProperty })
                                  }
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-cyan-300"
                                >
                                  <option value="value">Value (Numeric)</option>
                                  <option value="checked">Checked (Boolean)</option>
                                  <option value="text">Text (String)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Target SET */}
                          <div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                              SET (Write to Target)
                            </span>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">Target Widget</label>
                                <select
                                  value={ev.targetWidgetId || ''}
                                  onChange={(e) =>
                                    updateEvent(ev.id, { targetWidgetId: e.target.value })
                                  }
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200"
                                >
                                  <option value="">Select target...</option>
                                  {allWidgets.map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name} ({w.type})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">Target Property</label>
                                <select
                                  value={ev.targetProperty || 'text'}
                                  onChange={(e) =>
                                    updateEvent(ev.id, { targetProperty: e.target.value as TargetProperty })
                                  }
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-emerald-300"
                                >
                                  <option value="text">text (Label / Text)</option>
                                  <option value="value">value (Slider / Arc / Bar)</option>
                                  <option value="checked">checked (Switch / Checkbox)</option>
                                  <option value="hidden">hidden (Hide / Show)</option>
                                </select>
                              </div>
                            </div>

                            {/* Format String if setting text */}
                            {(!ev.targetProperty || ev.targetProperty === 'text') && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[9px] text-slate-400">
                                    Display Format Template (<code className="text-cyan-400">%d</code> = number, <code className="text-cyan-400">%s</code> = text)
                                  </label>
                                </div>
                                <input
                                  type="text"
                                  value={ev.formatString ?? '%d'}
                                  onChange={(e) =>
                                    updateEvent(ev.id, { formatString: e.target.value })
                                  }
                                  placeholder="%d °C"
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300 mb-1.5"
                                />
                                <div className="flex flex-wrap gap-1">
                                  {['%d °C', '%d%%', '%d RPM', 'Val: %d', '%s'].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => updateEvent(ev.id, { formatString: preset })}
                                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* B: SET PROPERTY */}
                      {ev.actionType === 'set_property' && (
                        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">Target Widget</label>
                              <select
                                value={ev.targetWidgetId || widget.id}
                                onChange={(e) =>
                                  updateEvent(ev.id, { targetWidgetId: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200"
                              >
                                <option value={widget.id}>This Widget ({widget.name})</option>
                                {otherWidgets.map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.name} ({w.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">Property to Set</label>
                              <select
                                value={ev.targetProperty || 'text'}
                                onChange={(e) =>
                                  updateEvent(ev.id, { targetProperty: e.target.value as TargetProperty })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-emerald-300"
                              >
                                <option value="text">text</option>
                                <option value="value">value</option>
                                <option value="checked">checked (ON/OFF)</option>
                                <option value="hidden">hidden (Hide/Show)</option>
                                <option value="opacity">opacity (0-255)</option>
                                <option value="bgColor">bgColor</option>
                                <option value="textColor">textColor</option>
                              </select>
                            </div>
                          </div>

                          {/* Value input tailored to property */}
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">New Value</label>
                            {ev.targetProperty === 'checked' || ev.targetProperty === 'hidden' ? (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateEvent(ev.id, { setValue: true })}
                                  className={`py-1 text-xs font-mono rounded border transition-colors ${
                                    Boolean(ev.setValue)
                                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                                      : 'bg-slate-950 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  TRUE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateEvent(ev.id, { setValue: false })}
                                  className={`py-1 text-xs font-mono rounded border transition-colors ${
                                    !Boolean(ev.setValue)
                                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                                      : 'bg-slate-950 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  FALSE
                                </button>
                              </div>
                            ) : ev.targetProperty === 'bgColor' || ev.targetProperty === 'textColor' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={ev.setValue || '#0284C7'}
                                  onChange={(e) => updateEvent(ev.id, { setValue: e.target.value })}
                                  className="w-7 h-7 rounded border border-slate-800 bg-transparent cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={ev.setValue || '#0284C7'}
                                  onChange={(e) => updateEvent(ev.id, { setValue: e.target.value })}
                                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                                />
                              </div>
                            ) : ev.targetProperty === 'value' || ev.targetProperty === 'opacity' ? (
                              <input
                                type="number"
                                value={ev.setValue ?? (ev.targetProperty === 'opacity' ? 255 : 50)}
                                onChange={(e) => updateEvent(ev.id, { setValue: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300"
                              />
                            ) : (
                              <input
                                type="text"
                                value={ev.setValue ?? ''}
                                onChange={(e) => updateEvent(ev.id, { setValue: e.target.value })}
                                placeholder="Enter string text..."
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* C: SWITCH SCREEN */}
                      {ev.actionType === 'switch_screen' && (
                        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">Target Screen</label>
                            <select
                              value={ev.targetScreenId || screens[0]?.id}
                              onChange={(e) =>
                                updateEvent(ev.id, { targetScreenId: e.target.value })
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                            >
                              {screens.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">Transition Animation</label>
                            <select
                              value={ev.screenAnim || 'NONE'}
                              onChange={(e) =>
                                updateEvent(ev.id, { screenAnim: e.target.value as any })
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300"
                            >
                              <option value="NONE">NONE (Instant)</option>
                              <option value="OVER_LEFT">OVER_LEFT (Slide Left)</option>
                              <option value="OVER_RIGHT">OVER_RIGHT (Slide Right)</option>
                              <option value="FADE_ON">FADE_ON (Cross-Fade)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* D: TOGGLE WIDGET */}
                      {ev.actionType === 'toggle_widget' && (
                        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">Widget to Toggle</label>
                            <select
                              value={ev.targetWidgetId || widget.id}
                              onChange={(e) =>
                                updateEvent(ev.id, { targetWidgetId: e.target.value })
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                            >
                              <option value={widget.id}>This Widget ({widget.name})</option>
                              {otherWidgets.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({w.type})
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Toggles <code className="text-cyan-400">LV_OBJ_FLAG_HIDDEN</code> (or checked state if switch/checkbox).
                          </p>
                        </div>
                      )}

                      {/* E: HARDWARE PIN */}
                      {ev.actionType === 'call_hardware' && (
                        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">Hardware Action</label>
                              <select
                                value={ev.hardwareAction || 'gpio_toggle'}
                                onChange={(e) =>
                                  updateEvent(ev.id, { hardwareAction: e.target.value as any })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200"
                              >
                                <option value="gpio_toggle">Toggle GPIO</option>
                                <option value="gpio_high">Set HIGH</option>
                                <option value="gpio_low">Set LOW</option>
                                <option value="pwm_backlight">Backlight PWM</option>
                                <option value="buzzer_beep">Buzzer Beep</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">GPIO Pin Number</label>
                              <input
                                type="number"
                                value={ev.gpioPin ?? 2}
                                onChange={(e) =>
                                  updateEvent(ev.id, { gpioPin: Number(e.target.value) })
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300"
                              />
                            </div>
                          </div>
                          {ev.hardwareAction === 'pwm_backlight' && (
                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">PWM Duty (0-255)</label>
                              <input
                                type="range"
                                min={0}
                                max={255}
                                value={ev.pwmValue ?? 200}
                                onChange={(e) =>
                                  updateEvent(ev.id, { pwmValue: Number(e.target.value) })
                                }
                                className="w-full accent-cyan-400 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Handler Function Name */}
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">
                          C Callback Function Name (<code className="text-cyan-400">ui_events.c</code>)
                        </label>
                        <input
                          type="text"
                          value={ev.handlerName}
                          onChange={(e) =>
                            updateEvent(ev.id, {
                              handlerName: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'),
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-300"
                        />
                      </div>

                      {/* Real-Time LVGL C Code Preview */}
                      <div className="pt-1 border-t border-slate-850">
                        <div className="flex items-center justify-between mb-1 text-[9px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Code className="w-3 h-3 text-cyan-400" />
                            Generated LVGL C Action
                          </span>
                          <span className="text-emerald-400">ui_events.c</span>
                        </div>
                        <pre className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-cyan-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                          {cSnippet.trim()}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
              <strong className="text-cyan-400 font-semibold block mb-0.5">Live Interactive Simulation:</strong>
              Click or drag widgets in <span className="text-white font-medium">Live Simulator Mode</span> to see your Set & Get actions update the display in real-time.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
