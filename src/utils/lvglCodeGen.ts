import { LVGLWidget, ProjectData, LVGLVersion, WidgetEvent } from '../types/lvgl';
import { MCU_LIST, LCD_LIST, PORT_LIST, generatePartitionsCsv } from './hardwareConfig';

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function hexToLvColor(hex: string): string {
  const clean = hex.replace('#', '');
  return `0x${clean.toUpperCase()}`;
}

export function generateUiH(project: ProjectData): string {
  const { screens, widgets, display } = project;
  const version = display.lvglVersion;
  const mcu = MCU_LIST.find((m) => m.id === display.mcu) || MCU_LIST[0];
  const lcd = LCD_LIST.find((l) => l.id === display.lcdType) || LCD_LIST[0];
  const port = PORT_LIST.find((p) => p.id === display.port) || PORT_LIST[0];
  const flash = display.flashConfig;

  const widgetDeclarations = widgets
    .map((w) => `    lv_obj_t *${sanitizeName(w.name)};`)
    .join('\n');

  const screenDeclarations = screens
    .map((s) => `    lv_obj_t *${sanitizeName(s.name)};`)
    .join('\n');

  // Collect unique event handlers
  const eventHandlers = new Set<string>();
  widgets.forEach((w) => {
    w.events.forEach((ev) => {
      if (ev.handlerName) {
        eventHandlers.add(ev.handlerName);
      }
    });
  });

  const handlerPrototypes = Array.from(eventHandlers)
    .map((h) => `void ${h}(lv_event_t *e);`)
    .join('\n');

  const screenPrototypes = screens
    .map((s) => `void setup_scr_${sanitizeName(s.name)}(lv_ui *ui);`)
    .join('\n');

  return `/**
 * @file ui.h
 * @brief LVGL ${version.toUpperCase()} UI Interface Definition for ${project.name}
 * Generated automatically by LVGL GUI Generator for Embedded Systems
 * 
 * Hardware Target:
 *  - Microcontroller:  ${mcu.name} (${mcu.vendor} - ${mcu.core} @ ${mcu.clockSpeed})
 *  - LCD Controller:   ${lcd.name} (${lcd.driverMacro})
 *  - Port/Interface:   ${port.name}
 *  - Display Geometry: ${display.width}x${display.height} (${display.colorDepth}-bit RGB)
 *  - Flash Size:       ${flash.flashSize} (${flash.flashMode.toUpperCase()} @ ${flash.flashSpeed})
 *  - PSRAM:            ${flash.psram === 'none' ? 'Disabled (Internal SRAM only)' : flash.psram.toUpperCase()}
 *  - Partition Scheme: ${flash.partitionScheme}
 */

#ifndef LV_UI_H
#define LV_UI_H

#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"

typedef struct {
    /* Screen objects */
${screenDeclarations || '    lv_obj_t *screen_main;'}

    /* Widget objects */
${widgetDeclarations || '    /* No widgets added */'}
} lv_ui;

extern lv_ui guider_ui;

/* UI Initialization Entry Point */
void setup_ui(lv_ui *ui);

/* Screen Setup Functions */
${screenPrototypes}

/* Event Handler Callbacks */
${handlerPrototypes || '/* No custom event handlers configured */'}

#ifdef __cplusplus
}
#endif

#endif /* LV_UI_H */
`;
}

export function generateUiC(project: ProjectData): string {
  const { screens, widgets, display } = project;
  const version = display.lvglVersion;
  const mcu = MCU_LIST.find((m) => m.id === display.mcu) || MCU_LIST[0];
  const lcd = LCD_LIST.find((l) => l.id === display.lcdType) || LCD_LIST[0];

  let code = `/**
 * @file ui.c
 * @brief LVGL ${version.toUpperCase()} UI Implementation
 * Generated for ${mcu.name} + ${lcd.name}
 */

#include "ui.h"
#include <stdio.h>

lv_ui guider_ui;

`;

  // Screen setup functions
  screens.forEach((screen) => {
    const scrName = sanitizeName(screen.name);
    const screenWidgets = widgets.filter((w) => w.parent === screen.id);

    code += `void setup_scr_${scrName}(lv_ui *ui) {\n`;
    code += `    // Screen: ${screen.name}\n`;
    code += `    ui->${scrName} = lv_obj_create(NULL);\n`;
    code += `    lv_obj_set_size(ui->${scrName}, ${display.width}, ${display.height});\n`;
    code += `    lv_obj_set_style_bg_color(ui->${scrName}, lv_color_hex(${hexToLvColor(screen.bgColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
    code += `    lv_obj_set_style_bg_opa(ui->${scrName}, LV_OPA_COVER, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
    code += `    lv_obj_clear_flag(ui->${scrName}, LV_OBJ_FLAG_SCROLLABLE);\n\n`;

    screenWidgets.forEach((w) => {
      const wName = sanitizeName(w.name);
      const parentRef = `ui->${scrName}`;

      code += `    // --- Widget: ${w.name} (${w.type.toUpperCase()}) ---\n`;

      switch (w.type) {
        case 'btn':
          code += `    ui->${wName} = lv_btn_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.bgColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          code += `    lv_obj_set_style_radius(ui->${wName}, ${w.styles.radius}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          if (w.styles.borderWidth > 0) {
            code += `    lv_obj_set_style_border_width(ui->${wName}, ${w.styles.borderWidth}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
            code += `    lv_obj_set_style_border_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.borderColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          }
          if (w.props.text) {
            code += `    lv_obj_t *${wName}_lbl = lv_label_create(ui->${wName});\n`;
            code += `    lv_label_set_text(${wName}_lbl, "${w.props.text}");\n`;
            code += `    lv_obj_set_style_text_color(${wName}_lbl, lv_color_hex(${hexToLvColor(w.styles.textColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
            code += `    lv_obj_set_style_text_font(${wName}_lbl, &lv_font_montserrat_${w.styles.fontSize}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
            code += `    lv_obj_center(${wName}_lbl);\n`;
          }
          break;

        case 'label':
          code += `    ui->${wName} = lv_label_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_label_set_text(ui->${wName}, "${w.props.text || 'Label'}");\n`;
          code += `    lv_obj_set_style_text_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.textColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          code += `    lv_obj_set_style_text_font(ui->${wName}, &lv_font_montserrat_${w.styles.fontSize}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          break;

        case 'slider':
          code += `    ui->${wName} = lv_slider_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_slider_set_range(ui->${wName}, ${w.props.min ?? 0}, ${w.props.max ?? 100});\n`;
          code += `    lv_slider_set_value(ui->${wName}, ${w.props.value ?? 50}, LV_ANIM_OFF);\n`;
          code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.bgColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          if (w.props.indicatorColor) {
            code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.props.indicatorColor)}), LV_PART_INDICATOR | LV_STATE_DEFAULT);\n`;
          }
          code += `    lv_obj_set_style_radius(ui->${wName}, ${w.styles.radius}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          break;

        case 'switch':
          code += `    ui->${wName} = lv_switch_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          if (w.props.checked) {
            code += `    lv_obj_add_state(ui->${wName}, LV_STATE_CHECKED);\n`;
          }
          if (w.props.activeColor) {
            code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.props.activeColor)}), LV_PART_INDICATOR | LV_STATE_CHECKED);\n`;
          }
          break;

        case 'arc':
          code += `    ui->${wName} = lv_arc_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_arc_set_rotation(ui->${wName}, 0);\n`;
          code += `    lv_arc_set_bg_angles(ui->${wName}, ${w.props.startAngle ?? 135}, ${w.props.endAngle ?? 45});\n`;
          code += `    lv_arc_set_range(ui->${wName}, ${w.props.min ?? 0}, ${w.props.max ?? 100});\n`;
          code += `    lv_arc_set_value(ui->${wName}, ${w.props.value ?? 60});\n`;
          code += `    lv_obj_set_style_arc_width(ui->${wName}, ${w.props.arcWidth ?? 10}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          code += `    lv_obj_set_style_arc_width(ui->${wName}, ${w.props.arcWidth ?? 10}, LV_PART_INDICATOR | LV_STATE_DEFAULT);\n`;
          if (w.props.arcColor) {
            code += `    lv_obj_set_style_arc_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.props.arcColor)}), LV_PART_INDICATOR | LV_STATE_DEFAULT);\n`;
          }
          break;

        case 'bar':
          code += `    ui->${wName} = lv_bar_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_bar_set_range(ui->${wName}, ${w.props.min ?? 0}, ${w.props.max ?? 100});\n`;
          code += `    lv_bar_set_value(ui->${wName}, ${w.props.value ?? 40}, LV_ANIM_OFF);\n`;
          code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.bgColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          if (w.props.indicatorColor) {
            code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.props.indicatorColor)}), LV_PART_INDICATOR | LV_STATE_DEFAULT);\n`;
          }
          code += `    lv_obj_set_style_radius(ui->${wName}, ${w.styles.radius}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          break;

        case 'meter':
          if (version === 'v9') {
            code += `    // LVGL v9 Scale/Gauge\n`;
            code += `    ui->${wName} = lv_scale_create(${parentRef});\n`;
            code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
            code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
            code += `    lv_scale_set_mode(ui->${wName}, LV_SCALE_MODE_ROUND_INNER);\n`;
            code += `    lv_scale_set_range(ui->${wName}, ${w.props.min ?? 0}, ${w.props.max ?? 100});\n`;
            code += `    lv_scale_set_total_tick_count(ui->${wName}, ${w.props.ticks ?? 11});\n`;
            code += `    lv_scale_set_major_tick_every(ui->${wName}, 2);\n`;
          } else {
            code += `    // LVGL v8 Meter\n`;
            code += `    ui->${wName} = lv_meter_create(${parentRef});\n`;
            code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
            code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
            code += `    lv_meter_scale_t *scale_${wName} = lv_meter_add_scale(ui->${wName});\n`;
            code += `    lv_meter_set_scale_ticks(ui->${wName}, scale_${wName}, ${w.props.ticks ?? 11}, 2, 10, lv_color_hex(0x64748B));\n`;
            code += `    lv_meter_set_scale_range(ui->${wName}, scale_${wName}, ${w.props.min ?? 0}, ${w.props.max ?? 100}, 270, 135);\n`;
            code += `    lv_meter_indicator_t *needle_${wName} = lv_meter_add_needle_line(ui->${wName}, scale_${wName}, 3, lv_color_hex(${hexToLvColor(w.props.needleColor || '#38BDF8')}));\n`;
            code += `    lv_meter_set_indicator_value(ui->${wName}, needle_${wName}, ${w.props.value ?? 50});\n`;
          }
          break;

        case 'chart':
          code += `    ui->${wName} = lv_chart_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_chart_set_type(ui->${wName}, ${w.props.chartType === 'bar' ? 'LV_CHART_TYPE_BAR' : 'LV_CHART_TYPE_LINE'});\n`;
          code += `    lv_chart_set_point_count(ui->${wName}, ${w.props.pointCount || 8});\n`;
          code += `    lv_chart_set_range(ui->${wName}, LV_CHART_AXIS_PRIMARY_Y, 0, 100);\n`;
          code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.bgColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          code += `    lv_chart_series_t *ser_${wName} = lv_chart_add_series(ui->${wName}, lv_color_hex(${hexToLvColor(w.props.chartColor || '#0284C7')}), LV_CHART_AXIS_PRIMARY_Y);\n`;
          const pts = w.props.points && w.props.points.length > 0 ? w.props.points : [20, 45, 60, 35, 75, 90, 65, 80];
          pts.forEach((p, idx) => {
            code += `    lv_chart_set_value_by_id(ui->${wName}, ser_${wName}, ${idx}, ${p});\n`;
          });
          code += `    lv_chart_refresh(ui->${wName});\n`;
          break;

        case 'checkbox':
          code += `    ui->${wName} = lv_checkbox_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_checkbox_set_text(ui->${wName}, "${w.props.text || 'Enable'}");\n`;
          if (w.props.checkedState) {
            code += `    lv_obj_add_state(ui->${wName}, LV_STATE_CHECKED);\n`;
          }
          code += `    lv_obj_set_style_text_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.textColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          break;

        case 'dropdown':
          code += `    ui->${wName} = lv_dropdown_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          const opts = (w.props.options || ['Option 1', 'Option 2', 'Option 3']).join('\\n');
          code += `    lv_dropdown_set_options(ui->${wName}, "${opts}");\n`;
          code += `    lv_dropdown_set_selected(ui->${wName}, ${w.props.selectedIndex || 0});\n`;
          break;

        case 'led':
          code += `    ui->${wName} = lv_led_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_led_set_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.props.ledColor || '#22C55E')}));\n`;
          code += `    lv_led_set_brightness(ui->${wName}, ${w.props.brightness ?? 255});\n`;
          if (w.props.ledOn !== false) {
            code += `    lv_led_on(ui->${wName});\n`;
          } else {
            code += `    lv_led_off(ui->${wName});\n`;
          }
          break;

        case 'spinner':
          code += `    ui->${wName} = lv_spinner_create(${parentRef}, ${w.props.spinDuration || 1000}, 60);\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          if (w.props.spinColor) {
            code += `    lv_obj_set_style_arc_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.props.spinColor)}), LV_PART_INDICATOR | LV_STATE_DEFAULT);\n`;
          }
          break;

        case 'container':
          code += `    ui->${wName} = lv_obj_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          code += `    lv_obj_set_style_bg_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.bgColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          code += `    lv_obj_set_style_radius(ui->${wName}, ${w.styles.radius}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          if (w.styles.borderWidth > 0) {
            code += `    lv_obj_set_style_border_width(ui->${wName}, ${w.styles.borderWidth}, LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
            code += `    lv_obj_set_style_border_color(ui->${wName}, lv_color_hex(${hexToLvColor(w.styles.borderColor)}), LV_PART_MAIN | LV_STATE_DEFAULT);\n`;
          }
          break;

        default:
          code += `    ui->${wName} = lv_obj_create(${parentRef});\n`;
          code += `    lv_obj_set_pos(ui->${wName}, ${w.x}, ${w.y});\n`;
          code += `    lv_obj_set_size(ui->${wName}, ${w.w}, ${w.h});\n`;
          break;
      }

      // Attach event callbacks
      if (w.events && w.events.length > 0) {
        w.events.forEach((ev) => {
          if (ev.handlerName) {
            code += `    lv_obj_add_event_cb(ui->${wName}, ${ev.handlerName}, ${ev.event}, ui);\n`;
          }
        });
      }

      code += `\n`;
    });

    code += `}\n\n`;
  });

  // Main entry function
  const firstScr = screens[0] ? sanitizeName(screens[0].name) : 'screen_main';
  code += `void setup_ui(lv_ui *ui) {\n`;
  screens.forEach((screen) => {
    code += `    setup_scr_${sanitizeName(screen.name)}(ui);\n`;
  });
  code += `    lv_scr_load(ui->${firstScr});\n`;
  code += `}\n`;

  return code;
}

export function generateEventCActionSnippet(
  ev: WidgetEvent,
  currentWidget: LVGLWidget,
  allWidgets: LVGLWidget[],
  screens: { id: string; name: string }[]
): string {
  if (ev.actionType === 'get_and_set') {
    const srcWidget =
      ev.sourceWidgetId && ev.sourceWidgetId !== 'self'
        ? allWidgets.find((w) => w.id === ev.sourceWidgetId) || currentWidget
        : currentWidget;
    const isSelf = srcWidget.id === currentWidget.id;
    const srcRef = isSelf ? 'target' : `ui->${sanitizeName(srcWidget.name)}`;
    const srcProp =
      ev.sourceProperty ||
      (srcWidget.type === 'switch' || srcWidget.type === 'checkbox'
        ? 'checked'
        : srcWidget.type === 'label'
        ? 'text'
        : 'value');

    const targetWidget = allWidgets.find((w) => w.id === ev.targetWidgetId);
    if (!targetWidget) {
      return `    // [GET & SET] Target widget not specified
    printf("[EVENT] Read ${srcWidget.name}.${srcProp}\\n");`;
    }

    const tgtRef = `ui->${sanitizeName(targetWidget.name)}`;
    const tgtProp =
      ev.targetProperty ||
      (targetWidget.type === 'label'
        ? 'text'
        : targetWidget.type === 'switch' || targetWidget.type === 'checkbox'
        ? 'checked'
        : 'value');

    let lines = `    // [GET & SET] Read ${srcWidget.name}.${srcProp} -> Write to ${targetWidget.name}.${tgtProp}\n`;

    if (srcProp === 'value') {
      if (srcWidget.type === 'arc') {
        lines += `    int32_t val = lv_arc_get_value(${srcRef});\n`;
      } else if (srcWidget.type === 'bar') {
        lines += `    int32_t val = lv_bar_get_value(${srcRef});\n`;
      } else {
        lines += `    int32_t val = lv_slider_get_value(${srcRef});\n`;
      }

      if (tgtProp === 'text') {
        lines += `    lv_label_set_text_fmt(${tgtRef}, "${ev.formatString || '%d'}", (int)val);\n`;
      } else if (tgtProp === 'value') {
        if (targetWidget.type === 'arc') {
          lines += `    lv_arc_set_value(${tgtRef}, val);\n`;
        } else if (targetWidget.type === 'bar') {
          lines += `    lv_bar_set_value(${tgtRef}, val, LV_ANIM_ON);\n`;
        } else {
          lines += `    lv_slider_set_value(${tgtRef}, val, LV_ANIM_ON);\n`;
        }
      } else if (tgtProp === 'checked') {
        lines += `    if (val > 0) lv_obj_add_state(${tgtRef}, LV_STATE_CHECKED); else lv_obj_clear_state(${tgtRef}, LV_STATE_CHECKED);\n`;
      } else if (tgtProp === 'hidden') {
        lines += `    if (val > 0) lv_obj_clear_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN); else lv_obj_add_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN);\n`;
      }
    } else if (srcProp === 'checked') {
      lines += `    bool is_checked = lv_obj_has_state(${srcRef}, LV_STATE_CHECKED);\n`;
      if (tgtProp === 'text') {
        lines += `    lv_label_set_text(${tgtRef}, is_checked ? "ON" : "OFF");\n`;
      } else if (tgtProp === 'hidden') {
        lines += `    if (is_checked) lv_obj_clear_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN); else lv_obj_add_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN);\n`;
      } else if (tgtProp === 'checked') {
        lines += `    if (is_checked) lv_obj_add_state(${tgtRef}, LV_STATE_CHECKED); else lv_obj_clear_state(${tgtRef}, LV_STATE_CHECKED);\n`;
      } else if (tgtProp === 'value') {
        lines += `    lv_slider_set_value(${tgtRef}, is_checked ? 100 : 0, LV_ANIM_ON);\n`;
      }
    } else {
      lines += `    const char *txt = lv_label_get_text(${srcRef});\n`;
      lines += `    lv_label_set_text_fmt(${tgtRef}, "${ev.formatString || '%s'}", txt);\n`;
    }
    return lines;
  }

  if (ev.actionType === 'set_property') {
    const targetWidget = ev.targetWidgetId
      ? allWidgets.find((w) => w.id === ev.targetWidgetId) || currentWidget
      : currentWidget;
    const tgtRef = targetWidget.id === currentWidget.id ? 'target' : `ui->${sanitizeName(targetWidget.name)}`;
    const tgtProp = ev.targetProperty || 'text';

    let lines = `    // [SET] Set ${targetWidget.name}.${tgtProp} to "${ev.setValue ?? ''}"\n`;
    if (tgtProp === 'text') {
      lines += `    lv_label_set_text(${tgtRef}, "${ev.setValue ?? ''}");\n`;
    } else if (tgtProp === 'value') {
      const num = Number(ev.setValue ?? 0);
      if (targetWidget.type === 'arc') {
        lines += `    lv_arc_set_value(${tgtRef}, ${num});\n`;
      } else if (targetWidget.type === 'bar') {
        lines += `    lv_bar_set_value(${tgtRef}, ${num}, LV_ANIM_ON);\n`;
      } else {
        lines += `    lv_slider_set_value(${tgtRef}, ${num}, LV_ANIM_ON);\n`;
      }
    } else if (tgtProp === 'checked') {
      lines += `    if (${Boolean(ev.setValue)}) lv_obj_add_state(${tgtRef}, LV_STATE_CHECKED); else lv_obj_clear_state(${tgtRef}, LV_STATE_CHECKED);\n`;
    } else if (tgtProp === 'hidden') {
      lines += `    if (${Boolean(ev.setValue)}) lv_obj_add_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN); else lv_obj_clear_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN);\n`;
    } else if (tgtProp === 'opacity') {
      lines += `    lv_obj_set_style_opa(${tgtRef}, ${Number(ev.setValue ?? 255)}, LV_PART_MAIN);\n`;
    } else if (tgtProp === 'bgColor') {
      lines += `    lv_obj_set_style_bg_color(${tgtRef}, lv_color_hex(${hexToLvColor(ev.setValue || '#0284C7')}), LV_PART_MAIN);\n`;
    } else if (tgtProp === 'textColor') {
      lines += `    lv_obj_set_style_text_color(${tgtRef}, lv_color_hex(${hexToLvColor(ev.setValue || '#FFFFFF')}), LV_PART_MAIN);\n`;
    }
    return lines;
  }

  if (ev.actionType === 'switch_screen') {
    const targetScreen = screens.find((s) => s.id === ev.targetScreenId) || screens[0];
    const anim = ev.screenAnim || 'NONE';
    return `    // [SCREEN] Switch screen to ${targetScreen.name}\n    lv_scr_load_anim(ui->${sanitizeName(targetScreen.name)}, LV_SCR_LOAD_ANIM_${anim}, 300, 0, false);\n`;
  }

  if (ev.actionType === 'toggle_widget') {
    const targetWidget = ev.targetWidgetId
      ? allWidgets.find((w) => w.id === ev.targetWidgetId) || currentWidget
      : currentWidget;
    const tgtRef = `ui->${sanitizeName(targetWidget.name)}`;
    return `    // [TOGGLE] Toggle visibility of ${targetWidget.name}
    if (lv_obj_has_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN)) {
        lv_obj_clear_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN);
    } else {
        lv_obj_add_flag(${tgtRef}, LV_OBJ_FLAG_HIDDEN);
    }\n`;
  }

  if (ev.actionType === 'call_hardware') {
    const pin = ev.gpioPin ?? 2;
    if (ev.hardwareAction === 'gpio_high') {
      return `    // [HARDWARE] Set GPIO ${pin} HIGH
    pinMode(${pin}, OUTPUT);
    digitalWrite(${pin}, HIGH);\n`;
    }
    if (ev.hardwareAction === 'gpio_low') {
      return `    // [HARDWARE] Set GPIO ${pin} LOW
    pinMode(${pin}, OUTPUT);
    digitalWrite(${pin}, LOW);\n`;
    }
    if (ev.hardwareAction === 'pwm_backlight') {
      return `    // [HARDWARE] Backlight PWM brightness on GPIO ${pin}
    analogWrite(${pin}, ${ev.pwmValue ?? 200});\n`;
    }
    if (ev.hardwareAction === 'buzzer_beep') {
      return `    // [HARDWARE] Buzzer Beep on GPIO ${pin}
    tone(${pin}, 2400, 100);\n`;
    }
    return `    // [HARDWARE] Toggle GPIO ${pin}
    pinMode(${pin}, OUTPUT);
    digitalWrite(${pin}, !digitalRead(${pin}));\n`;
  }

  // custom_c default
  return `    printf("[EVENT] Custom handler ${ev.handlerName} executed\\n");
    // TODO: Write custom embedded hardware logic here\n`;
}

export function generateUiEventsC(project: ProjectData): string {
  const { widgets, screens } = project;
  const processedHandlers = new Set<string>();

  let code = `/**
 * @file ui_events.c
 * @brief User event callbacks and embedded hardware interaction hooks
 * Place your hardware drivers, GPIO writes, sensor readings, or state machines here!
 */

#include "ui.h"
#include <stdio.h>

`;

  let eventCount = 0;

  widgets.forEach((w) => {
    (w.events || []).forEach((ev) => {
      if (!ev.handlerName || processedHandlers.has(ev.handlerName)) return;
      processedHandlers.add(ev.handlerName);
      eventCount++;

      const snippet = generateEventCActionSnippet(ev, w, widgets, screens);

      code += `/**
 * @brief Event Callback for ${w.name}
 * Listener: ${ev.event}
 * Action:   ${ev.actionType.toUpperCase()}
 */
void ${ev.handlerName}(lv_event_t *e) {
    lv_event_code_t code = lv_event_get_code(e);
    lv_obj_t *target = lv_event_get_target(e);
    lv_ui *ui = (lv_ui *)lv_event_get_user_data(e);

    if (code == ${ev.event}) {
        printf("[EVENT] ${ev.handlerName} triggered on ${w.name}\\n");
${snippet}    }
}

`;
    });
  });

  if (eventCount === 0) {
    code += `// Default example callback
void on_generic_action(lv_event_t *e) {
    lv_event_code_t code = lv_event_get_code(e);
    lv_obj_t *obj = lv_event_get_target(e);
    lv_ui *ui = (lv_ui *)lv_event_get_user_data(e);

    if (code == LV_EVENT_CLICKED) {
        printf("Action triggered!\\n");
        // Example: toggle an external GPIO pin or write PWM
    }
}
`;
  }

  return code;
}

export function generateArduinoMain(project: ProjectData): string {
  const { display } = project;
  const bufferFraction = display.bufferFraction;
  const lines = Math.floor(display.height / bufferFraction);
  const mcu = MCU_LIST.find((m) => m.id === display.mcu) || MCU_LIST[0];
  const lcd = LCD_LIST.find((l) => l.id === display.lcdType) || LCD_LIST[0];
  const pin = display.pinout;
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
  const hasPsram = flash.psram !== 'none';
  const isAxs15231b = display.lcdType === 'axs15231b';
  const isQspi = display.port === 'qspi';

  const arduinoBoardName =
    display.mcu === 'rp2040'
      ? 'Raspberry Pi Pico / RP2040 (Earle Philhower core)'
      : display.mcu === 'rp2350'
      ? 'Raspberry Pi Pico 2 / RP2350'
      : display.mcu === 'esp32_s3'
      ? 'ESP32S3 Dev Module'
      : display.mcu === 'esp32_c5'
      ? 'ESP32C5 Dev Module (RISC-V Wi-Fi 6)'
      : display.mcu === 'stm32'
      ? 'Generic STM32F4 series'
      : 'ESP32 Dev Module';

  return `/**
 * @file sketch.ino
 * @brief LVGL ${display.lvglVersion.toUpperCase()} Embedded Firmware for ${project.name}
 * 
 * ============================================================================
 *  ARDUINO IDE CONFIGURATION (Tools Menu Settings):
 * ============================================================================
 *  - Board:              "${arduinoBoardName}"
 *  - Flash Size:         "${flash.flashSize}"
 *  - Flash Mode:         "${flash.flashMode.toUpperCase()}"
 *  - Flash Frequency:    "${flash.flashSpeed}"
 *  - PSRAM:              "${hasPsram ? flash.psram.toUpperCase() : 'Disabled'}"
 *  - Partition Scheme:   "${flash.partitionScheme}"
 *  - Core Debug Level:   "None"
 * ----------------------------------------------------------------------------
 *  PERIPHERALS:
 *  - Display:            ${lcd.name} (${display.width}x${display.height} ${display.colorDepth}-bit)
 *  - Port Bus:           ${display.port.toUpperCase()}
 *  - Touch Controller:   ${touch.type !== 'none' ? `${touch.type.toUpperCase()} (${touch.bus.toUpperCase()} addr: ${touch.i2cAddr})` : 'None'}
 * ============================================================================
 */

#include <Arduino.h>
#include <lvgl.h>
${touch.type !== 'none' && touch.bus === 'i2c' ? '#include <Wire.h>' : ''}
${touch.type !== 'none' && touch.bus === 'spi' ? '#include <SPI.h>' : ''}
#include "ui.h"

/* --- DISPLAY PIN DEFINITIONS --- */
#define SCREEN_WIDTH  ${display.width}
#define SCREEN_HEIGHT ${display.height}
#define BUF_LINES     ${lines}

#define TFT_SCLK      ${pin.sclk}
#define TFT_MOSI      ${pin.mosi}
#define TFT_MISO      ${pin.miso}
#define TFT_CS        ${pin.cs}
#define TFT_DC        ${pin.dc}
#define TFT_RST       ${pin.rst}
#define TFT_BL        ${pin.bl}
${
  isAxs15231b || isQspi
    ? `// AXS15231B Quad SPI lines
#define TFT_QSPI_D0   ${pin.mosi}
#define TFT_QSPI_D1   ${pin.miso}
#define TFT_QSPI_D2   ${pin.d2 ?? 41}
#define TFT_QSPI_D3   ${pin.d3 ?? 42}
#define TFT_QSPI_TE   ${pin.te ?? 18}
`
    : ''
}${
  display.port === 'parallel_8080_8' || display.port === 'parallel_8080_16'
    ? `// 8080 Parallel Intel Bus lines
#define TFT_WR        ${pin.wr || 12}
#define TFT_RD        ${pin.rd || 13}
#define TFT_D0        ${pin.d0 ?? 0}
#define TFT_D1        ${pin.d1 ?? 1}
#define TFT_D2        ${pin.d2 ?? 2}
#define TFT_D3        ${pin.d3 ?? 3}
#define TFT_D4        ${pin.d4 ?? 4}
#define TFT_D5        ${pin.d5 ?? 5}
#define TFT_D6        ${pin.d6 ?? 6}
#define TFT_D7        ${pin.d7 ?? 7}
`
    : ''
}
/* --- TOUCH CONTROLLER CONFIGURATION --- */
#define TOUCH_TYPE    "${touch.type}"
#define TOUCH_SDA     ${touch.sda}
#define TOUCH_SCL     ${touch.scl}
#define TOUCH_INT     ${touch.intPin}
#define TOUCH_RST     ${touch.rstPin}
#define TOUCH_ADDR    ${touch.i2cAddr !== 'N/A' ? touch.i2cAddr : '0x15'}

static lv_disp_draw_buf_t draw_buf;
${
  hasPsram
    ? `// Framebuffers allocated dynamically in external PSRAM (${flash.psram})
static lv_color_t *buf_1 = NULL;
${display.doubleBuffer ? `static lv_color_t *buf_2 = NULL;` : ''}`
    : `// Framebuffers statically allocated in internal SRAM
static lv_color_t buf_1[SCREEN_WIDTH * BUF_LINES];
${display.doubleBuffer ? `static lv_color_t buf_2[SCREEN_WIDTH * BUF_LINES];` : ''}`
}

/* ============================================================================
 *  TOUCH READING DRIVER (${touch.type.toUpperCase()})
 * ============================================================================ */
bool read_hardware_touch(uint16_t *x, uint16_t *y) {
${
  touch.type === 'axs15231b'
    ? `    // Read AXS15231B integrated capacitive touch engine (I2C addr: 0x3B or 0x40)
    // As featured on Waveshare ESP32-S3-Touch-LCD-3.49 and QSPI AMOLEDs
    Wire.beginTransmission(TOUCH_ADDR);
    Wire.write(0x02); // Point 1 status & coordinate register
    if (Wire.endTransmission() != 0) return false;

    if (Wire.requestFrom((uint8_t)TOUCH_ADDR, (uint8_t)6) < 5) return false;
    uint8_t touch_cnt = Wire.read();
    if (touch_cnt == 0) return false;

    uint8_t x_high = Wire.read() & 0x0F;
    uint8_t x_low  = Wire.read();
    uint8_t y_high = Wire.read() & 0x0F;
    uint8_t y_low  = Wire.read();

    uint16_t raw_x = (x_high << 8) | x_low;
    uint16_t raw_y = (y_high << 8) | y_low;

    ${touch.swapXY ? 'uint16_t temp = raw_x; raw_x = raw_y; raw_y = temp;' : ''}
    ${touch.invertX ? 'raw_x = (raw_x < SCREEN_WIDTH) ? (SCREEN_WIDTH - raw_x) : 0;' : ''}
    ${touch.invertY ? 'raw_y = (raw_y < SCREEN_HEIGHT) ? (SCREEN_HEIGHT - raw_y) : 0;' : ''}

    *x = raw_x;
    *y = raw_y;
    return true;`
    : touch.type === 'cst816s' || touch.type === 'cst328'
    ? `    // Read capacitive touch via I2C (CST816S / CST328)
    Wire.beginTransmission(TOUCH_ADDR);
    Wire.write(0x02); // Touch state & coordinate register
    if (Wire.endTransmission() != 0) return false;

    if (Wire.requestFrom((uint8_t)TOUCH_ADDR, (uint8_t)5) != 5) return false;
    uint8_t finger_num = Wire.read();
    if (finger_num == 0) return false;

    uint8_t x_high = Wire.read() & 0x0F;
    uint8_t x_low  = Wire.read();
    uint8_t y_high = Wire.read() & 0x0F;
    uint8_t y_low  = Wire.read();

    uint16_t raw_x = (x_high << 8) | x_low;
    uint16_t raw_y = (y_high << 8) | y_low;

    ${touch.swapXY ? 'uint16_t temp = raw_x; raw_x = raw_y; raw_y = temp;' : ''}
    ${touch.invertX ? 'raw_x = (raw_x < SCREEN_WIDTH) ? (SCREEN_WIDTH - raw_x) : 0;' : ''}
    ${touch.invertY ? 'raw_y = (raw_y < SCREEN_HEIGHT) ? (SCREEN_HEIGHT - raw_y) : 0;' : ''}

    *x = raw_x;
    *y = raw_y;
    return true;`
    : touch.type === 'ft6236'
    ? `    // Read FocalTech capacitive touch (FT6236 / FT6336U)
    Wire.beginTransmission(TOUCH_ADDR);
    Wire.write(0x02); // TD_STATUS register
    if (Wire.endTransmission() != 0) return false;

    if (Wire.requestFrom((uint8_t)TOUCH_ADDR, (uint8_t)5) != 5) return false;
    uint8_t touches = Wire.read();
    if (touches == 0 || touches > 2) return false;

    uint8_t x_hi = Wire.read() & 0x0F;
    uint8_t x_lo = Wire.read();
    uint8_t y_hi = Wire.read() & 0x0F;
    uint8_t y_lo = Wire.read();

    uint16_t raw_x = (x_hi << 8) | x_lo;
    uint16_t raw_y = (y_hi << 8) | y_lo;

    ${touch.swapXY ? 'uint16_t temp = raw_x; raw_x = raw_y; raw_y = temp;' : ''}
    ${touch.invertX ? 'raw_x = (raw_x < SCREEN_WIDTH) ? (SCREEN_WIDTH - raw_x) : 0;' : ''}
    ${touch.invertY ? 'raw_y = (raw_y < SCREEN_HEIGHT) ? (SCREEN_HEIGHT - raw_y) : 0;' : ''}

    *x = raw_x;
    *y = raw_y;
    return true;`
    : touch.type === 'gt911'
    ? `    // Read Goodix capacitive multi-touch (GT911)
    Wire.beginTransmission(TOUCH_ADDR);
    Wire.write(0x81);
    Wire.write(0x4E); // Point register
    if (Wire.endTransmission() != 0) return false;

    if (Wire.requestFrom((uint8_t)TOUCH_ADDR, (uint8_t)7) != 7) return false;
    uint8_t status = Wire.read();
    if ((status & 0x80) == 0 || (status & 0x0F) == 0) {
        // Clear buffer flag
        Wire.beginTransmission(TOUCH_ADDR);
        Wire.write(0x81);
        Wire.write(0x4E);
        Wire.write(0x00);
        Wire.endTransmission();
        return false;
    }

    uint8_t track_id = Wire.read();
    uint8_t x_l = Wire.read();
    uint8_t x_h = Wire.read();
    uint8_t y_l = Wire.read();
    uint8_t y_h = Wire.read();

    // Clear buffer flag
    Wire.beginTransmission(TOUCH_ADDR);
    Wire.write(0x81);
    Wire.write(0x4E);
    Wire.write(0x00);
    Wire.endTransmission();

    uint16_t raw_x = x_l | (x_h << 8);
    uint16_t raw_y = y_l | (y_h << 8);

    ${touch.swapXY ? 'uint16_t temp = raw_x; raw_x = raw_y; raw_y = temp;' : ''}
    ${touch.invertX ? 'raw_x = (raw_x < SCREEN_WIDTH) ? (SCREEN_WIDTH - raw_x) : 0;' : ''}
    ${touch.invertY ? 'raw_y = (raw_y < SCREEN_HEIGHT) ? (SCREEN_HEIGHT - raw_y) : 0;' : ''}

    *x = raw_x;
    *y = raw_y;
    return true;`
    : touch.type === 'xpt2046'
    ? `    // Read 4-wire SPI Resistive Touch (XPT2046)
    // Query X and Y with 12-bit ADC reading
    digitalWrite(TFT_CS, HIGH); // Deselect display
    // SPI touch read implementation
    return false;`
    : `    // Non-touch display (Rotary encoder or GPIO buttons)
    return false;`
}
}

/* Touch input reading callback registered to LVGL */
void my_touchpad_read(lv_indev_drv_t *indev_drv, lv_indev_data_t *data) {
    uint16_t touchX = 0, touchY = 0;
    bool touched = read_hardware_touch(&touchX, &touchY);

    if (touched) {
        data->state = LV_INDEV_STATE_PR;
        data->point.x = touchX;
        data->point.y = touchY;
    } else {
        data->state = LV_INDEV_STATE_REL;
    }
}

/* Display flushing callback called by LVGL to push pixels to hardware */
void my_disp_flush(lv_disp_drv_t *disp_drv, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

${
  isAxs15231b
    ? `    /* AXS15231B Quad SPI Framebuffer Transfer */
    // Send window command: CASET (0x2A), RASET (0x2B), RAMWR (0x2C)
    // Using DMA QSPI high-speed mode (80MHz):
    // axs15231b_push_colors(area->x1, area->y1, w, h, (uint16_t *)color_p);`
    : `    /* Push pixel buffer via ${display.port} to ${lcd.name} */
    // Example using TFT_eSPI or Arduino_GFX:
    // tft.startWrite();
    // tft.setAddrWindow(area->x1, area->y1, w, h);
    // tft.pushColors((uint16_t *)&color_p->full, w * h, true);
    // tft.endWrite();`
}

    lv_disp_flush_ready(disp_drv);
}

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\\n=======================================================");
    Serial.println("  ${project.name} - LVGL ${display.lvglVersion.toUpperCase()}");
    Serial.printf("  MCU: %s | LCD: %s (%dx%d)\\n", "${mcu.name}", "${lcd.name}", SCREEN_WIDTH, SCREEN_HEIGHT);
    Serial.printf("  Flash: %s | PSRAM: %s | Touch: %s\\n", "${flash.flashSize}", "${flash.psram}", "${touch.type}");
    Serial.println("=======================================================\\n");

    // Backlight initialization
    pinMode(TFT_BL, OUTPUT);
    digitalWrite(TFT_BL, HIGH);

    // Initialize Touch Hardware Bus
${
  touch.type !== 'none' && touch.bus === 'i2c'
    ? `    Wire.begin(TOUCH_SDA, TOUCH_SCL);
    #if defined(TOUCH_RST) && TOUCH_RST >= 0
    pinMode(TOUCH_RST, OUTPUT);
    digitalWrite(TOUCH_RST, LOW);
    delay(20);
    digitalWrite(TOUCH_RST, HIGH);
    delay(50);
    #endif
    Serial.println("[TOUCH] Initialized I2C bus at SDA=" + String(TOUCH_SDA) + ", SCL=" + String(TOUCH_SCL));`
    : ''
}
${
  hasPsram
    ? `
    // --- PSRAM Memory Allocation (${flash.psram}) ---
    #if defined(ESP32)
    if (psramInit()) {
        Serial.printf("[PSRAM] Detected! Total: %d KB, Free: %d KB\\n", 
            ESP.getPsramSize() / 1024, ESP.getFreePsram() / 1024);
        
        // Allocate LVGL draw buffers in external PSRAM to keep internal SRAM completely free
        buf_1 = (lv_color_t *)heap_caps_malloc(SCREEN_WIDTH * BUF_LINES * sizeof(lv_color_t), MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
        ${display.doubleBuffer ? `buf_2 = (lv_color_t *)heap_caps_malloc(SCREEN_WIDTH * BUF_LINES * sizeof(lv_color_t), MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);` : ''}
    } else {
        Serial.println("[PSRAM] Not available, falling back to internal SRAM!");
        buf_1 = (lv_color_t *)malloc(SCREEN_WIDTH * BUF_LINES * sizeof(lv_color_t));
        ${display.doubleBuffer ? `buf_2 = (lv_color_t *)malloc(SCREEN_WIDTH * BUF_LINES * sizeof(lv_color_t));` : ''}
    }
    #elif defined(ARDUINO_ARCH_RP2040) || defined(ARDUINO_ARCH_RP2350)
    // RP2350 PSRAM allocation via Pico SDK
    buf_1 = (lv_color_t *)malloc(SCREEN_WIDTH * BUF_LINES * sizeof(lv_color_t));
    ${display.doubleBuffer ? `buf_2 = (lv_color_t *)malloc(SCREEN_WIDTH * BUF_LINES * sizeof(lv_color_t));` : ''}
    #endif
`
    : ''
}
    // Initialize LVGL Core
    lv_init();

    // Setup draw buffers (${display.bufferFraction === 10 ? '1/10th buffer' : 'custom height'})
    ${
      display.doubleBuffer
        ? `lv_disp_draw_buf_init(&draw_buf, buf_1, buf_2, SCREEN_WIDTH * BUF_LINES);`
        : `lv_disp_draw_buf_init(&draw_buf, buf_1, NULL, SCREEN_WIDTH * BUF_LINES);`
    }

    // Register Display Driver to LVGL
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = SCREEN_WIDTH;
    disp_drv.ver_res = SCREEN_HEIGHT;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    // Register Touch Input Driver to LVGL
    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;
    lv_indev_drv_register(&indev_drv);

    // Setup UI generated by LVGL GUI Generator
    setup_ui(&guider_ui);

    Serial.println("[LVGL] UI Initialized successfully.");
}

void loop() {
    // Process LVGL tasks, animations, and touch events
    lv_timer_handler();
    delay(5);
}
`;
}

export function generatePlatformIoIni(project: ProjectData): string {
  const { display } = project;
  const lcd = LCD_LIST.find((l) => l.id === display.lcdType) || LCD_LIST[0];
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
  const hasPsram = flash.psram !== 'none';
  const isAxs15231b = display.lcdType === 'axs15231b';

  let platform = 'espressif32';
  let board = 'esp32dev';
  let extraLibs = 'bodmer/TFT_eSPI@^2.5.43';

  if (display.mcu === 'rp2040') {
    platform = 'raspberrypi';
    board = 'pico';
    extraLibs = 'bodmer/TFT_eSPI@^2.5.43';
  } else if (display.mcu === 'rp2350') {
    platform = 'https://github.com/maxgerhardt/platform-raspberrypi.git';
    board = 'rpi_pico2';
    extraLibs = 'bodmer/TFT_eSPI@^2.5.43';
  } else if (display.mcu === 'esp32_s3') {
    platform = 'espressif32';
    board = 'esp32-s3-devkitc-1';
    extraLibs = isAxs15231b
      ? 'moononournation/GFX Library for Arduino@^1.4.9'
      : 'bodmer/TFT_eSPI@^2.5.43';
  } else if (display.mcu === 'esp32_c5') {
    platform = 'https://github.com/pioarduino/platform-espressif32/releases/download/stable/platform-espressif32.zip';
    board = 'esp32-c5-devkitm-1';
    extraLibs = 'bodmer/TFT_eSPI@^2.5.43';
  } else if (display.mcu === 'stm32') {
    platform = 'ststm32';
    board = 'disco_f429zi';
  }

  // Touch library dependency
  let touchLib = '';
  if (touch.type === 'axs15231b') {
    touchLib = '; AXS15231B Integrated Touch operates over standard Wire.h I2C (addr: 0x3B)';
  } else if (touch.type === 'cst816s') {
    touchLib = 'fbiego/CST816S@^1.1.1';
  } else if (touch.type === 'ft6236') {
    touchLib = 'dustinwatts/FT6236@^1.0.2';
  } else if (touch.type === 'gt911') {
    touchLib = 'TAMC_GT911@^1.0.2';
  } else if (touch.type === 'xpt2046') {
    touchLib = 'paulstoffregen/XPT2046_Touchscreen@0.0.0-alpha+sha.26b691b2c8';
  }

  // PSRAM memory type flags
  let psramFlags = '';
  if (hasPsram && (display.mcu === 'esp32' || display.mcu === 'esp32_s3' || display.mcu === 'esp32_c5')) {
    const memType = flash.psram.startsWith('opi') ? 'opi_opi' : 'qio_qspi';
    psramFlags = `
; PSRAM Configuration (${flash.psram})
board_build.arduino.memory_type = ${memType}
build_flags_psram = 
    -D BOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue`;
  } else if (hasPsram && display.mcu === 'rp2350') {
    psramFlags = `
; RP2350 PSRAM Configuration
build_flags_psram = 
    -D PICO_RP2350_PSRAM_CS_PIN=17
    -D HAS_EXTERNAL_PSRAM=1`;
  }

  // Partition scheme flag
  const partitionFlag =
    flash.partitionScheme === 'custom_csv'
      ? 'board_build.partitions = partitions.csv'
      : `board_build.partitions = ${flash.partitionScheme}.csv`;

  return `; ============================================================================
;  PLATFORMIO PROJECT CONFIGURATION
; ============================================================================
;  Target MCU:        ${display.mcu.toUpperCase()}
;  Display:           ${lcd.name} (${lcd.driverMacro})
;  Bus Interface:     ${display.port.toUpperCase()}
;  Touch Controller:  ${touch.type.toUpperCase()}
;  Flash Memory:      ${flash.flashSize} (${flash.flashMode} @ ${flash.flashSpeed})
;  External PSRAM:    ${flash.psram}
;  Partition Scheme:  ${flash.partitionScheme}
; ============================================================================

[env:${display.mcu}]
platform = ${platform}
board = ${board}
framework = arduino
monitor_speed = 115200

; Flash Memory & Partition Configuration (Arduino IDE Equivalent)
board_build.flash_size = ${flash.flashSize.toLowerCase()}
board_build.flash_mode = ${flash.flashMode}
board_build.f_flash = ${flash.flashSpeed.replace('MHz', '000000L')}
${display.mcu.startsWith('esp32') ? partitionFlag : '; Partitions handled by Pico/RP2040 core'}
${psramFlags}

build_flags = 
    -D LV_CONF_INCLUDE_SIMPLE
    -D ${lcd.driverMacro}=1
    -D TFT_WIDTH=${display.width}
    -D TFT_HEIGHT=${display.height}
    -D TFT_MOSI=${display.pinout.mosi}
    -D TFT_SCLK=${display.pinout.sclk}
    -D TFT_CS=${display.pinout.cs}
    -D TFT_DC=${display.pinout.dc}
    -D TFT_RST=${display.pinout.rst}
    -D TFT_BL=${display.pinout.bl}
    ${display.port === 'qspi' ? `-D TFT_QSPI_D2=${display.pinout.d2 ?? 41}\n    -D TFT_QSPI_D3=${display.pinout.d3 ?? 42}` : ''}
    ${touch.type !== 'none' ? `-D TOUCH_TYPE=\\"${touch.type}\\"\n    -D TOUCH_SDA=${touch.sda}\n    -D TOUCH_SCL=${touch.scl}\n    -D TOUCH_INT=${touch.intPin}\n    -D TOUCH_RST=${touch.rstPin}\n    -D TOUCH_ADDR=${touch.i2cAddr}` : ''}
    ${hasPsram ? '-D BOARD_HAS_PSRAM' : ''}
    -I include
    -O3

lib_deps = 
    lvgl/lvgl@^8.3.11
    ${extraLibs}
    ${touchLib ? `${touchLib}` : ''}
`;
}

export function generatePartitionsCsvFile(project: ProjectData): string {
  const flash = project.display.flashConfig;
  return generatePartitionsCsv(flash.partitionScheme, flash.flashSize);
}

