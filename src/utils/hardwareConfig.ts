import {
  McuType,
  LcdType,
  BusPort,
  HardwarePinout,
  ResolutionPreset,
  FlashSize,
  FlashMode,
  FlashSpeed,
  PsramType,
  PartitionScheme,
  FlashPartitionConfig,
  TouchType,
  TouchConfig,
} from '../types/lvgl';

export interface McuInfo {
  id: McuType;
  name: string;
  vendor: string;
  core: string;
  clockSpeed: string;
  sramKB: number;
  description: string;
  defaultPinout: HardwarePinout;
  defaultFlash: FlashPartitionConfig;
  defaultTouch: TouchConfig;
  pioSupport?: boolean;
}

export interface LcdInfo {
  id: LcdType;
  name: string;
  description: string;
  typicalRes: string;
  supportedPorts: BusPort[];
  driverMacro: string;
  defaultTouch?: TouchType;
}

export interface PortInfo {
  id: BusPort;
  name: string;
  pinCount: string;
  maxThroughput: string;
  description: string;
}

export interface TouchInfo {
  id: TouchType;
  name: string;
  tech: 'Capacitive' | 'Resistive' | 'None';
  bus: 'i2c' | 'spi';
  defaultI2cAddr: string;
  description: string;
}

export interface FlashSizeInfo {
  id: FlashSize;
  label: string;
  bytes: number;
  description: string;
}

export interface PsramOptionInfo {
  id: PsramType;
  label: string;
  sizeMB: number;
  bus: string;
  description: string;
}

export interface PartitionSchemeInfo {
  id: PartitionScheme;
  label: string;
  appSizeMB: number;
  fsSizeMB: number;
  otaSupported: boolean;
  targetMcu: 'esp32' | 'pico' | 'universal';
  description: string;
}

export const TOUCH_LIST: TouchInfo[] = [
  {
    id: 'axs15231b',
    name: 'AXS15231B (Integrated Touch)',
    tech: 'Capacitive',
    bus: 'i2c',
    defaultI2cAddr: '0x3B',
    description: 'Internal capacitive touch engine inside AXS15231B IC (Waveshare ESP32-S3-Touch-LCD-3.49). Communicates via I2C at 0x3B with fast gesture/multi-touch reporting.',
  },
  {
    id: 'cst816s',
    name: 'CST816S / CST816T',
    tech: 'Capacitive',
    bus: 'i2c',
    defaultI2cAddr: '0x15',
    description: 'Most popular ultra-low power capacitive touch controller for smartwatches and AMOLEDs (AXS15231B / GC9A01).',
  },
  {
    id: 'ft6236',
    name: 'FT6236 / FT6336U',
    tech: 'Capacitive',
    bus: 'i2c',
    defaultI2cAddr: '0x38',
    description: 'FocalTech capacitive touch controller widely used in 2.4", 2.8", and 3.5" embedded screens (M5Stack, CYD).',
  },
  {
    id: 'gt911',
    name: 'GT911 (Goodix Multi-Touch)',
    tech: 'Capacitive',
    bus: 'i2c',
    defaultI2cAddr: '0x5D',
    description: 'Industrial 5-point multi-touch controller for 4.3", 5.0", and 7.0" 800x480 HMI panels.',
  },
  {
    id: 'cst328',
    name: 'CST328',
    tech: 'Capacitive',
    bus: 'i2c',
    defaultI2cAddr: '0x1A',
    description: 'High-density multi-touch controller paired with rectangular AMOLED screens (e.g. 1.8" 368x448 AXS15231B).',
  },
  {
    id: 'xpt2046',
    name: 'XPT2046',
    tech: 'Resistive',
    bus: 'spi',
    defaultI2cAddr: 'N/A',
    description: 'Classic 4-wire SPI resistive touch controller (requires pen or firm finger pressure, CYD boards).',
  },
  {
    id: 'chsc5816',
    name: 'CHSC5816',
    tech: 'Capacitive',
    bus: 'i2c',
    defaultI2cAddr: '0x2E',
    description: 'Modern high-precision I2C capacitive touch IC for curved and AMOLED panels.',
  },
  {
    id: 'none',
    name: 'None (Non-Touch / Keypad)',
    tech: 'None',
    bus: 'i2c',
    defaultI2cAddr: 'N/A',
    description: 'Screen without touch digitizer. Navigated via rotary encoder, external buttons, or serial commands.',
  },
];

export const LCD_LIST: LcdInfo[] = [
  {
    id: 'axs15231b',
    name: 'AXS15231B (QSPI AMOLED / IPS)',
    description: 'High-speed QSPI AMOLED and IPS display controller for smartwatches, wearable dials, and curved panels.',
    typicalRes: '368×448 / 466×466 / 180×640',
    supportedPorts: ['qspi', 'spi_4wire'],
    driverMacro: 'AXS15231B_DRIVER',
    defaultTouch: 'cst816s',
  },
  {
    id: 'st7789',
    name: 'ST7789 / ST7789V',
    description: 'Most popular 240x240, 240x320, 240x135 IPS display controller with vivid colors.',
    typicalRes: '240×240 / 240×320',
    supportedPorts: ['spi_4wire', 'qspi', 'parallel_8080_8'],
    driverMacro: 'ST7789_DRIVER',
    defaultTouch: 'cst816s',
  },
  {
    id: 'ili9341',
    name: 'ILI9341',
    description: 'Standard 320x240 TFT LCD controller widely supported across Arduino & PlatformIO.',
    typicalRes: '320×240',
    supportedPorts: ['spi_4wire', 'parallel_8080_8', 'parallel_8080_16'],
    driverMacro: 'ILI9341_DRIVER',
    defaultTouch: 'xpt2046',
  },
  {
    id: 'gc9a01',
    name: 'GC9A01',
    description: 'Circular IPS LCD controller used in round dials, rotary encoders, and smartwatches.',
    typicalRes: '240×240 Round',
    supportedPorts: ['spi_4wire'],
    driverMacro: 'GC9A01_DRIVER',
    defaultTouch: 'cst816s',
  },
  {
    id: 'st7796',
    name: 'ST7796 / ST7796S',
    description: 'Mid-size 480x320 IPS display controller with high contrast for industrial HMIs.',
    typicalRes: '480×320',
    supportedPorts: ['spi_4wire', 'parallel_8080_8', 'parallel_8080_16'],
    driverMacro: 'ST7796_DRIVER',
    defaultTouch: 'ft6236',
  },
  {
    id: 'ili9488',
    name: 'ILI9488',
    description: '3.5" to 4.0" 480x320 display controller (often 18-bit or 16-bit parallel).',
    typicalRes: '480×320',
    supportedPorts: ['spi_4wire', 'parallel_8080_8', 'parallel_8080_16'],
    driverMacro: 'ILI9488_DRIVER',
    defaultTouch: 'ft6236',
  },
  {
    id: 'st7262',
    name: 'ST7262 / ST7701S',
    description: 'Wide 4.3" to 7.0" high-resolution panel controller for automotive and machinery dashboards.',
    typicalRes: '800×480 / 480×272',
    supportedPorts: ['rgb565', 'parallel_8080_16', 'qspi'],
    driverMacro: 'ST7262_DRIVER',
    defaultTouch: 'gt911',
  },
  {
    id: 'ssd1306',
    name: 'SSD1306 / SSD1309',
    description: 'Monochrome OLED display controller for low-power compact readouts.',
    typicalRes: '128×64',
    supportedPorts: ['i2c', 'spi_4wire'],
    driverMacro: 'SSD1306_DRIVER',
    defaultTouch: 'none',
  },
];

export const PORT_LIST: PortInfo[] = [
  {
    id: 'qspi',
    name: 'Quad SPI (QSPI - 4 Bit)',
    pinCount: '6 pins (SCK, CS, D0-D3)',
    maxThroughput: '80–120 MHz quad line (4x throughput of SPI, required for AXS15231B)',
    description: 'High-speed 4-bit bus supported natively by RP2350 PIO and ESP32-S3.',
  },
  {
    id: 'spi_4wire',
    name: '4-Wire SPI (Standard)',
    pinCount: '4–6 pins (SCK, MOSI, CS, DC, RST, BL)',
    maxThroughput: '40–80 MHz clock (~15–30 FPS with DMA)',
    description: 'Simplest connection requiring minimal microcontroller GPIO pins. Ideal for ESP32, RP2040, and RP2350.',
  },
  {
    id: 'parallel_8080_8',
    name: '8080 Parallel 8-Bit (Intel Bus)',
    pinCount: '12 pins (WR, RD, CS, DC, D0-D7, RST)',
    maxThroughput: '20–30 MHz byte clock (Fast UI updates)',
    description: 'Great for responsive 320x240 and 480x320 displays using RP2040/RP2350 PIO or ESP32 LCD peripheral.',
  },
  {
    id: 'parallel_8080_16',
    name: '8080 Parallel 16-Bit',
    pinCount: '20 pins (WR, RD, CS, DC, D0-D15, RST)',
    maxThroughput: 'Full 16-bit RGB565 per clock cycle (60 FPS)',
    description: 'Ultra-fast direct DMA bus for high frame rate embedded gaming or telemetry.',
  },
  {
    id: 'rgb565',
    name: 'RGB 16-bit Parallel (DPI)',
    pinCount: '16–20 pins (PCLK, DE, HSYNC, VSYNC, R0-R4, G0-G5, B0-B4)',
    maxThroughput: 'Zero tearing continuous dot clock (60 FPS)',
    description: 'Direct RGB parallel bus for large 800x480 panels (ideal with ESP32-S3 with PSRAM).',
  },
  {
    id: 'i2c',
    name: 'I2C Bus (2-Wire)',
    pinCount: '2 pins (SDA, SCL)',
    maxThroughput: '400 kHz – 1 MHz (Low speed)',
    description: 'Minimalist 2-wire bus for low-resolution displays like SSD1306.',
  },
];

export const FLASH_SIZES: FlashSizeInfo[] = [
  { id: '2MB', label: '2 MB Flash', bytes: 2 * 1024 * 1024, description: 'Basic RP2040 or compact ESP32 modules.' },
  { id: '4MB', label: '4 MB Flash (Standard)', bytes: 4 * 1024 * 1024, description: 'Default standard flash on ESP32 and Raspberry Pi Pico.' },
  { id: '8MB', label: '8 MB Flash', bytes: 8 * 1024 * 1024, description: 'High-density modules with ample room for LVGL fonts and assets.' },
  { id: '16MB', label: '16 MB Flash', bytes: 16 * 1024 * 1024, description: 'Ideal for industrial HMIs, video playback, and massive font packs.' },
  { id: '32MB', label: '32 MB Flash', bytes: 32 * 1024 * 1024, description: 'Maximum flash storage capacity.' },
];

export const PSRAM_OPTIONS: PsramOptionInfo[] = [
  { id: 'none', label: 'None (Internal SRAM Only)', sizeMB: 0, bus: 'Internal', description: 'Draw buffers and heap allocated entirely in on-chip SRAM.' },
  { id: 'qspi_2mb', label: '2 MB Quad PSRAM', sizeMB: 2, bus: 'QSPI 80MHz', description: 'External QSPI memory for ESP32 and RP2350.' },
  { id: 'qspi_4mb', label: '4 MB Quad PSRAM', sizeMB: 4, bus: 'QSPI 80MHz', description: 'Standard on ESP32-WROVER modules.' },
  { id: 'qspi_8mb', label: '8 MB Quad PSRAM', sizeMB: 8, bus: 'QSPI 80/120MHz', description: 'Large framebuffers for RP2350 or ESP32-S3.' },
  { id: 'opi_8mb', label: '8 MB Octal PSRAM (OPI)', sizeMB: 8, bus: 'OPI Octal 120MHz', description: 'Ultra-fast 8-bit bus on ESP32-S3 for 60 FPS 800x480 panels.' },
  { id: 'opi_16mb', label: '16 MB Octal PSRAM (OPI)', sizeMB: 16, bus: 'OPI Octal 120MHz', description: 'Maximum RAM for high-resolution graphics and video.' },
];

export const PARTITION_SCHEMES: PartitionSchemeInfo[] = [
  {
    id: 'huge_app',
    label: 'Huge APP (3MB No OTA / 1MB FS)',
    appSizeMB: 3.1,
    fsSizeMB: 1.0,
    otaSupported: false,
    targetMcu: 'esp32',
    description: 'Recommended for LVGL GUIs! Gives maximum code flash space for fonts and graphics.',
  },
  {
    id: 'default',
    label: 'Default 4MB (1.2MB App / 1.5MB SPIFFS)',
    appSizeMB: 1.25,
    fsSizeMB: 1.5,
    otaSupported: true,
    targetMcu: 'esp32',
    description: 'Standard Arduino IDE partition with dual OTA slots.',
  },
  {
    id: 'min_spiffs',
    label: 'Minimal SPIFFS (1.9MB App / 190KB FS)',
    appSizeMB: 1.9,
    fsSizeMB: 0.19,
    otaSupported: true,
    targetMcu: 'esp32',
    description: 'Large App partition while still retaining OTA firmware update support.',
  },
  {
    id: 'no_ota',
    label: 'No OTA (2MB App / 2MB FS)',
    appSizeMB: 2.0,
    fsSizeMB: 2.0,
    otaSupported: false,
    targetMcu: 'esp32',
    description: 'Balanced split between firmware binary and filesystem.',
  },
  {
    id: '8m_spiffs',
    label: '8MB Flash (3.2MB App / 4.5MB FS)',
    appSizeMB: 3.2,
    fsSizeMB: 4.5,
    otaSupported: true,
    targetMcu: 'esp32',
    description: 'Dedicated partition for 8MB flash chips.',
  },
  {
    id: '16m_fat',
    label: '16MB Flash (6.5MB App / 9MB FS)',
    appSizeMB: 6.5,
    fsSizeMB: 9.0,
    otaSupported: true,
    targetMcu: 'esp32',
    description: 'Enormous filesystem for storing LVGL raw images and assets.',
  },
  {
    id: 'pico_fs_1m',
    label: 'RP2040/RP2350 (1MB LittleFS)',
    appSizeMB: 1.0,
    fsSizeMB: 1.0,
    otaSupported: false,
    targetMcu: 'pico',
    description: 'Earle Philhower Arduino-Pico core 1MB LittleFS split.',
  },
  {
    id: 'pico_fs_2m',
    label: 'RP2040/RP2350 (2MB LittleFS)',
    appSizeMB: 2.0,
    fsSizeMB: 2.0,
    otaSupported: false,
    targetMcu: 'pico',
    description: '2MB LittleFS for storing UI icons, sound clips, and config.',
  },
  {
    id: 'custom_csv',
    label: 'Custom partitions.csv Table',
    appSizeMB: 3.0,
    fsSizeMB: 1.0,
    otaSupported: false,
    targetMcu: 'universal',
    description: 'User-defined custom CSV partition table.',
  },
];

export const MCU_LIST: McuInfo[] = [
  {
    id: 'esp32',
    name: 'ESP32',
    vendor: 'Espressif',
    core: 'Xtensa Dual-Core 32-bit LX6',
    clockSpeed: '240 MHz',
    sramKB: 520,
    description: 'Classic dual-core IoT processor with hardware SPI / I2S / 8080 DMA support.',
    defaultPinout: {
      sclk: 18,
      mosi: 23,
      miso: 19,
      cs: 5,
      dc: 2,
      rst: 4,
      bl: 15,
      wr: 12,
      rd: 13,
      d0: 16,
      d1: 17,
      d2: 18,
      d3: 19,
      d4: 21,
      d5: 22,
      d6: 23,
      d7: 25,
    },
    defaultFlash: {
      flashSize: '4MB',
      flashMode: 'dio',
      flashSpeed: '80MHz',
      psram: 'none',
      partitionScheme: 'huge_app',
    },
    defaultTouch: {
      type: 'ft6236',
      bus: 'i2c',
      i2cAddr: '0x38',
      sda: 21,
      scl: 22,
      intPin: 34,
      rstPin: 33,
      swapXY: false,
      invertX: false,
      invertY: false,
    },
  },
  {
    id: 'rp2040',
    name: 'RP2040',
    vendor: 'Raspberry Pi',
    core: 'Dual ARM Cortex-M0+',
    clockSpeed: '133 MHz',
    sramKB: 264,
    description: 'High flexibility with Dual Programmable I/O (PIO) state machines for custom 8080 or high-speed SPI.',
    pioSupport: true,
    defaultPinout: {
      sclk: 18,
      mosi: 19,
      miso: 16,
      cs: 17,
      dc: 20,
      rst: 21,
      bl: 22,
      wr: 10,
      rd: 11,
      d0: 0,
      d1: 1,
      d2: 2,
      d3: 3,
      d4: 4,
      d5: 5,
      d6: 6,
      d7: 7,
    },
    defaultFlash: {
      flashSize: '2MB',
      flashMode: 'qio',
      flashSpeed: '120MHz',
      psram: 'none',
      partitionScheme: 'pico_fs_1m',
    },
    defaultTouch: {
      type: 'cst816s',
      bus: 'i2c',
      i2cAddr: '0x15',
      sda: 4,
      scl: 5,
      intPin: 6,
      rstPin: 7,
      swapXY: false,
      invertX: false,
      invertY: false,
    },
  },
  {
    id: 'rp2350',
    name: 'RP2350',
    vendor: 'Raspberry Pi 2',
    core: 'Dual ARM Cortex-M33 / Hazard3 RISC-V',
    clockSpeed: '150 MHz',
    sramKB: 520,
    description: 'Next-gen high-performance MCU with 520KB SRAM, hardware security, floating point, and PIO v2 for high-speed LVGL rendering.',
    pioSupport: true,
    defaultPinout: {
      sclk: 18,
      mosi: 19,
      miso: 16,
      cs: 17,
      dc: 20,
      rst: 21,
      bl: 22,
      wr: 10,
      rd: 11,
      d0: 0,
      d1: 1,
      d2: 2,
      d3: 3,
      d4: 4,
      d5: 5,
      d6: 6,
      d7: 7,
    },
    defaultFlash: {
      flashSize: '4MB',
      flashMode: 'qio',
      flashSpeed: '120MHz',
      psram: 'qspi_8mb',
      partitionScheme: 'pico_fs_2m',
    },
    defaultTouch: {
      type: 'cst816s',
      bus: 'i2c',
      i2cAddr: '0x15',
      sda: 4,
      scl: 5,
      intPin: 6,
      rstPin: 7,
      swapXY: false,
      invertX: false,
      invertY: false,
    },
  },
  {
    id: 'esp32_s3',
    name: 'ESP32-S3',
    vendor: 'Espressif',
    core: 'Xtensa Dual-Core LX7 + Vector AI',
    clockSpeed: '240 MHz',
    sramKB: 512,
    description: 'High-speed QSPI & RGB and Octal PSRAM interface for large 800x480 and AXS15231B AMOLED panels.',
    defaultPinout: {
      sclk: 12,
      mosi: 11,
      miso: 13,
      cs: 10,
      dc: 9,
      rst: 8,
      bl: 14,
      wr: 7,
      rd: 6,
      d0: 39,
      d1: 40,
      d2: 41,
      d3: 42,
      d4: 45,
      d5: 46,
      d6: 47,
      d7: 48,
    },
    defaultFlash: {
      flashSize: '16MB',
      flashMode: 'qio',
      flashSpeed: '80MHz',
      psram: 'opi_8mb',
      partitionScheme: '16m_fat',
    },
    defaultTouch: {
      type: 'cst816s',
      bus: 'i2c',
      i2cAddr: '0x15',
      sda: 3,
      scl: 2,
      intPin: 4,
      rstPin: 5,
      swapXY: false,
      invertX: false,
      invertY: false,
    },
  },
  {
    id: 'esp32_c5',
    name: 'ESP32-C5 (RISC-V)',
    vendor: 'Espressif',
    core: '32-bit RISC-V @ 240 MHz (Dual-Band Wi-Fi 6)',
    clockSpeed: '240 MHz',
    sramKB: 384,
    description: 'Espressif 32-bit RISC-V microcontroller with dual-band 2.4/5GHz Wi-Fi 6, Bluetooth 5 (LE), 8MB PSRAM, and 32MB Flash.',
    defaultPinout: {
      sclk: 6,
      mosi: 7,
      miso: 5,
      cs: 8,
      dc: 4,
      rst: 3,
      bl: 2,
    },
    defaultFlash: {
      flashSize: '32MB',
      flashMode: 'qio',
      flashSpeed: '80MHz',
      psram: 'qspi_8mb',
      partitionScheme: 'huge_app',
    },
    defaultTouch: {
      type: 'none',
      bus: 'i2c',
      i2cAddr: 'N/A',
      sda: 10,
      scl: 11,
      intPin: 12,
      rstPin: 13,
      swapXY: false,
      invertX: false,
      invertY: false,
    },
  },
  {
    id: 'stm32',
    name: 'STM32 (Cortex-M4/M7)',
    vendor: 'STMicroelectronics',
    core: 'ARM Cortex-M4/M7 with Chrom-ART',
    clockSpeed: '180–480 MHz',
    sramKB: 384,
    description: 'Hardware 2D graphics accelerator (Chrom-ART / DMA2D) for effortless rendering.',
    defaultPinout: {
      sclk: 5,
      mosi: 7,
      miso: 6,
      cs: 4,
      dc: 2,
      rst: 1,
      bl: 0,
      wr: 8,
      rd: 9,
    },
    defaultFlash: {
      flashSize: '2MB',
      flashMode: 'qio',
      flashSpeed: '80MHz',
      psram: 'none',
      partitionScheme: 'default',
    },
    defaultTouch: {
      type: 'xpt2046',
      bus: 'spi',
      i2cAddr: 'N/A',
      sda: 7,
      scl: 5,
      intPin: 3,
      rstPin: 2,
      csPin: 8,
      swapXY: false,
      invertX: false,
      invertY: false,
    },
  },
];

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: 'res_172x640_waveshare_349',
    name: '172×640 (Waveshare ESP32-S3-Touch-LCD-3.49)',
    width: 172,
    height: 640,
    isRound: false,
    defaultLcd: 'axs15231b',
    defaultPort: 'qspi',
    defaultTouch: 'cst816s',
    description: 'Waveshare 3.49" IPS bar display with AXS15231B QSPI, capacitive touch, ES8311 audio, and QMI8658 6-axis IMU.',
  },
  {
    id: 'res_320x320_waveshare_c5_273',
    name: '320×320 (Waveshare ESP32-C5-LCD-2.73)',
    width: 320,
    height: 320,
    isRound: false,
    defaultLcd: 'ili9488',
    defaultPort: 'spi_4wire',
    defaultTouch: 'none',
    description: 'Waveshare 2.73" 320x320 square display on ESP32-C5 RISC-V with SHTC3 environmental sensors and 3 keys.',
  },
  {
    id: 'res_368x448_amoled',
    name: '368×448 (1.8" AMOLED AXS15231B)',
    width: 368,
    height: 448,
    isRound: false,
    defaultLcd: 'axs15231b',
    defaultPort: 'qspi',
    defaultTouch: 'cst816s',
    description: 'Vibrant 1.8" rectangular AMOLED display with QSPI and CST816S capacitive touch.',
  },
  {
    id: 'res_466x466_round',
    name: '466×466 (1.43" Round AMOLED AXS15231B)',
    width: 466,
    height: 466,
    isRound: true,
    defaultLcd: 'axs15231b',
    defaultPort: 'qspi',
    defaultTouch: 'cst816s',
    description: 'High-res circular smartwatch AMOLED dial with 466px diameter and QSPI interface.',
  },
  {
    id: 'res_320x240',
    name: '320×240 (QVGA Standard)',
    width: 320,
    height: 240,
    isRound: false,
    defaultLcd: 'ili9341',
    defaultPort: 'spi_4wire',
    defaultTouch: 'xpt2046',
    description: 'The golden standard for embedded graphics (2.4"–3.2" TFT LCD).',
  },
  {
    id: 'res_240x240_round',
    name: '240×240 Round Dial',
    width: 240,
    height: 240,
    isRound: true,
    defaultLcd: 'gc9a01',
    defaultPort: 'spi_4wire',
    defaultTouch: 'cst816s',
    description: '1.28" Circular dial for smart rotary encoders, dials, and smartwatches.',
  },
  {
    id: 'res_480x320',
    name: '480×320 (HVGA Widescreen)',
    width: 480,
    height: 320,
    isRound: false,
    defaultLcd: 'st7796',
    defaultPort: 'spi_4wire',
    defaultTouch: 'ft6236',
    description: '3.5" to 4.0" widescreen for CNC machines and industrial controls.',
  },
  {
    id: 'res_480x272',
    name: '480×272 (4.3" Automotive)',
    width: 480,
    height: 272,
    isRound: false,
    defaultLcd: 'st7262',
    defaultPort: 'parallel_8080_16',
    defaultTouch: 'gt911',
    description: '4.3" automotive & HVAC control panel resolution.',
  },
  {
    id: 'res_800x480',
    name: '800×480 (WVGA Large HMI)',
    width: 800,
    height: 480,
    isRound: false,
    defaultLcd: 'st7262',
    defaultPort: 'rgb565',
    defaultTouch: 'gt911',
    description: '5.0" to 7.0" high-resolution widescreen interface.',
  },
  {
    id: 'res_240x135',
    name: '240×135 (Compact Stick)',
    width: 240,
    height: 135,
    isRound: false,
    defaultLcd: 'st7789',
    defaultPort: 'spi_4wire',
    defaultTouch: 'none',
    description: 'Ultra-compact wearable or portable sensor screen.',
  },
];

export function generatePartitionsCsv(scheme: PartitionScheme, flashSize: FlashSize): string {
  if (scheme === 'huge_app') {
    return `# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
otadata,  data, ota,     0xe000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x300000,
spiffs,   data, spiffs,  0x310000,0xF0000,
`;
  }

  if (scheme === 'min_spiffs') {
    return `# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
otadata,  data, ota,     0xe000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x1E0000,
app1,     app,  ota_1,   0x1F0000,0x1E0000,
spiffs,   data, spiffs,  0x3D0000,0x30000,
`;
  }

  if (scheme === 'no_ota') {
    return `# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
app0,     app,  factory, 0x10000, 0x200000,
spiffs,   data, spiffs,  0x210000,0x1F0000,
`;
  }

  if (scheme === '8m_spiffs') {
    return `# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
otadata,  data, ota,     0xe000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x330000,
app1,     app,  ota_1,   0x340000,0x330000,
spiffs,   data, spiffs,  0x670000,0x190000,
`;
  }

  if (scheme === '16m_fat') {
    return `# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
otadata,  data, ota,     0xe000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x680000,
app1,     app,  ota_1,   0x690000,0x680000,
ffat,     data, fat,     0xD10000,0x2F0000,
`;
  }

  // default 4MB dual OTA
  return `# ESP32 Default Partition Table (4MB)
# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
otadata,  data, ota,     0xe000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x140000,
app1,     app,  ota_1,   0x150000,0x140000,
spiffs,   data, spiffs,  0x290000,0x170000,
`;
}

export function getDefaultTouchForMcuAndType(touchId: TouchType, mcu: McuType): TouchConfig {
  const touchInfo = TOUCH_LIST.find((t) => t.id === touchId) || TOUCH_LIST[0];
  const isI2c = touchInfo.bus === 'i2c';

  if (mcu === 'rp2040' || mcu === 'rp2350') {
    return {
      type: touchId,
      bus: touchInfo.bus,
      i2cAddr: touchInfo.defaultI2cAddr === 'N/A' ? '0x15' : touchInfo.defaultI2cAddr,
      sda: isI2c ? 4 : 19,
      scl: isI2c ? 5 : 18,
      intPin: 6,
      rstPin: 7,
      csPin: 17,
      swapXY: false,
      invertX: false,
      invertY: false,
    };
  }

  if (mcu === 'esp32_s3') {
    if (touchId === 'axs15231b') {
      return {
        type: touchId,
        bus: 'i2c',
        i2cAddr: '0x3B',
        sda: 15,
        scl: 16,
        intPin: 4,
        rstPin: 8,
        csPin: 10,
        swapXY: false,
        invertX: false,
        invertY: false,
      };
    }
    return {
      type: touchId,
      bus: touchInfo.bus,
      i2cAddr: touchInfo.defaultI2cAddr === 'N/A' ? '0x15' : touchInfo.defaultI2cAddr,
      sda: isI2c ? 3 : 11,
      scl: isI2c ? 2 : 12,
      intPin: 4,
      rstPin: 5,
      csPin: 10,
      swapXY: false,
      invertX: false,
      invertY: false,
    };
  }

  if (mcu === 'esp32_c5') {
    return {
      type: touchId,
      bus: touchInfo.bus,
      i2cAddr: touchInfo.defaultI2cAddr === 'N/A' ? '0x15' : touchInfo.defaultI2cAddr,
      sda: isI2c ? 10 : 7,
      scl: isI2c ? 11 : 6,
      intPin: 12,
      rstPin: 13,
      csPin: 8,
      swapXY: false,
      invertX: false,
      invertY: false,
    };
  }

  // esp32 default
  return {
    type: touchId,
    bus: touchInfo.bus,
    i2cAddr: touchInfo.defaultI2cAddr === 'N/A' ? '0x15' : touchInfo.defaultI2cAddr,
    sda: isI2c ? 21 : 23,
    scl: isI2c ? 22 : 18,
    intPin: 34,
    rstPin: 33,
    csPin: 5,
    swapXY: false,
    invertX: false,
    invertY: false,
  };
}

