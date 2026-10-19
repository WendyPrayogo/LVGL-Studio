export type WidgetType =
  | 'btn'
  | 'label'
  | 'slider'
  | 'switch'
  | 'arc'
  | 'bar'
  | 'meter'
  | 'chart'
  | 'checkbox'
  | 'dropdown'
  | 'roller'
  | 'led'
  | 'spinner'
  | 'container'
  | 'line';

export type LVGLVersion = 'v8' | 'v9';

export type McuType = 'esp32' | 'rp2040' | 'rp2350' | 'esp32_s3' | 'esp32_c5' | 'stm32';

export type LcdType =
  | 'axs15231b'
  | 'st7789'
  | 'ili9341'
  | 'gc9a01'
  | 'st7796'
  | 'ili9488'
  | 'st7262'
  | 'st7701s'
  | 'ssd1306';

export type BusPort =
  | 'spi_4wire'
  | 'qspi'
  | 'parallel_8080_8'
  | 'parallel_8080_16'
  | 'rgb565'
  | 'i2c';

export type FlashSize = '2MB' | '4MB' | '8MB' | '16MB' | '32MB';

export type FlashMode = 'qio' | 'dio' | 'qout' | 'dout';

export type FlashSpeed = '40MHz' | '80MHz' | '120MHz';

export type PsramType =
  | 'none'
  | 'qspi_2mb'
  | 'qspi_4mb'
  | 'qspi_8mb'
  | 'opi_8mb'
  | 'opi_16mb';

export type PartitionScheme =
  | 'default'
  | 'huge_app'
  | 'min_spiffs'
  | 'no_ota'
  | '8m_spiffs'
  | '16m_fat'
  | 'pico_fs_1m'
  | 'pico_fs_2m'
  | 'custom_csv';

export type TouchType =
  | 'none'
  | 'axs15231b'
  | 'cst816s'
  | 'ft6236'
  | 'gt911'
  | 'cst328'
  | 'xpt2046'
  | 'chsc5816';

export interface TouchConfig {
  type: TouchType;
  bus: 'i2c' | 'spi';
  i2cAddr: string;
  sda: number;
  scl: number;
  intPin: number;
  rstPin: number;
  csPin?: number; // for SPI touch like XPT2046
  swapXY: boolean;
  invertX: boolean;
  invertY: boolean;
}

export type LVGLAlign =
  | 'LV_ALIGN_DEFAULT'
  | 'LV_ALIGN_TOP_LEFT'
  | 'LV_ALIGN_TOP_MID'
  | 'LV_ALIGN_TOP_RIGHT'
  | 'LV_ALIGN_BOTTOM_LEFT'
  | 'LV_ALIGN_BOTTOM_MID'
  | 'LV_ALIGN_BOTTOM_RIGHT'
  | 'LV_ALIGN_LEFT_MID'
  | 'LV_ALIGN_RIGHT_MID'
  | 'LV_ALIGN_CENTER';

export type LVGLEventType =
  | 'LV_EVENT_CLICKED'
  | 'LV_EVENT_VALUE_CHANGED'
  | 'LV_EVENT_PRESSED'
  | 'LV_EVENT_RELEASED'
  | 'LV_EVENT_LONG_PRESSED'
  | 'LV_EVENT_FOCUSED'
  | 'LV_EVENT_DEFOCUSED';

export type ActionType =
  | 'get_and_set'
  | 'set_property'
  | 'switch_screen'
  | 'toggle_widget'
  | 'custom_c'
  | 'call_hardware';

export type TargetProperty =
  | 'text'
  | 'value'
  | 'checked'
  | 'hidden'
  | 'opacity'
  | 'bgColor'
  | 'textColor';

export type SourceProperty =
  | 'value'
  | 'text'
  | 'checked';

export interface WidgetEvent {
  id: string;
  event: LVGLEventType;
  handlerName: string;
  actionType: ActionType;
  description?: string;
  // Screen Switch
  targetScreenId?: string;
  screenAnim?: 'NONE' | 'OVER_LEFT' | 'OVER_RIGHT' | 'FADE_ON';
  // Target Widget & Property
  targetWidgetId?: string;
  targetProperty?: TargetProperty;
  setValue?: any; // For set_property (constant string, number, or boolean)
  // Get & Set (Read value from source and apply to target)
  sourceWidgetId?: string; // 'self' or specific widget ID
  sourceProperty?: SourceProperty;
  formatString?: string; // e.g. "%d °C", "%d%%", "Speed: %d RPM", "%s"
  // Hardware Action
  hardwareAction?: 'gpio_toggle' | 'gpio_high' | 'gpio_low' | 'pwm_backlight' | 'buzzer_beep';
  gpioPin?: number;
  pwmValue?: number;
}

export interface WidgetStyles {
  bgColor: string;
  bgGradColor?: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  radius: number;
  opacity: number; // 0-255
  shadowWidth?: number;
  fontSize: '12' | '14' | '16' | '20' | '24' | '28' | '36';
}

export interface WidgetProps {
  // Common
  text?: string;
  hidden?: boolean;
  // Slider / Bar
  min?: number;
  max?: number;
  value?: number;
  indicatorColor?: string;
  // Switch
  checked?: boolean;
  knobColor?: string;
  activeColor?: string;
  // Arc
  startAngle?: number;
  endAngle?: number;
  arcWidth?: number;
  arcColor?: string;
  // Meter / Gauge
  needleColor?: string;
  ticks?: number;
  unit?: string;
  // Chart
  chartType?: 'line' | 'bar';
  points?: number[];
  pointCount?: number;
  chartColor?: string;
  chartColor2?: string;
  points2?: number[];
  // Checkbox
  checkedState?: boolean;
  // Dropdown / Roller
  options?: string[];
  selectedIndex?: number;
  // LED
  ledOn?: boolean;
  brightness?: number; // 0-255
  ledColor?: string;
  // Spinner
  spinDuration?: number; // ms
  spinColor?: string;
  // Container
  layout?: 'none' | 'flex_row' | 'flex_col';
  pad?: number;
}

export interface LVGLWidget {
  id: string;
  name: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  parent: string; // screen ID or container ID
  align?: LVGLAlign;
  styles: WidgetStyles;
  props: WidgetProps;
  events: WidgetEvent[];
}

export interface Screen {
  id: string;
  name: string;
  bgColor: string;
}

export interface HardwarePinout {
  sclk: number;
  mosi: number;
  miso: number;
  cs: number;
  dc: number;
  rst: number;
  bl: number;
  wr?: number;
  rd?: number;
  d0?: number;
  d1?: number;
  d2?: number;
  d3?: number;
  d4?: number;
  d5?: number;
  d6?: number;
  d7?: number;
  te?: number; // Tearing Effect pin for AMOLED (AXS15231B)
}

export interface FlashPartitionConfig {
  flashSize: FlashSize;
  flashMode: FlashMode;
  flashSpeed: FlashSpeed;
  psram: PsramType;
  partitionScheme: PartitionScheme;
  customPartitionCsv?: string;
}

export interface ResolutionPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  isRound: boolean;
  defaultLcd: LcdType;
  defaultPort: BusPort;
  defaultTouch?: TouchType;
  description: string;
}

export interface DisplayConfig {
  presetId: string;
  name: string;
  width: number;
  height: number;
  colorDepth: 16 | 24 | 32;
  isRound: boolean;
  mcu: McuType;
  lcdType: LcdType;
  port: BusPort;
  pinout: HardwarePinout;
  flashConfig: FlashPartitionConfig;
  touchConfig: TouchConfig;
  bufferFraction: 10 | 5 | 2 | 1; // 1/10th buffer, 1/5th, 1/2, or full frame
  doubleBuffer: boolean;
  lvglVersion: LVGLVersion;
}

export interface ProjectData {
  id: string;
  name: string;
  screens: Screen[];
  activeScreenId: string;
  widgets: LVGLWidget[];
  display: DisplayConfig;
}
