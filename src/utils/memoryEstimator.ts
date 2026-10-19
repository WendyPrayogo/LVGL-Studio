import { DisplayConfig } from '../types/lvgl';
import { MCU_LIST, PSRAM_OPTIONS, PARTITION_SCHEMES, FLASH_SIZES } from './hardwareConfig';

export interface MemoryStats {
  bytesPerPixel: number;
  singleFrameBytes: number;
  drawBufferBytes: number;
  drawBufferKB: number;
  widgetHeapBytes: number;
  widgetHeapKB: number;
  totalRamRequiredKB: number;
  mcuSramKB: number;
  sramUsagePercent: number;
  flashEstimateKB: number;
  flashTotalMB: number;
  flashAppPartitionMB: number;
  flashAppUsagePercent: number;
  psramMB: number;
  psramKB: number;
  psramEnabled: boolean;
  effectiveRamKB: number;
  sramSavedByPsramKB: number;
  psramRecommended: boolean;
  busRecommendation: string;
  mcuSuitability: 'excellent' | 'tight' | 'exceeds_sram';
}

export function calculateMemory(display: DisplayConfig, widgetCount: number): MemoryStats {
  const bytesPerPixel = display.colorDepth === 16 ? 2 : display.colorDepth === 24 ? 3 : 4;
  const singleFrameBytes = display.width * display.height * bytesPerPixel;

  // Draw buffer size (e.g. 1/10th of screen, 1/5th, or full buffer)
  const bufferLines = Math.max(1, Math.floor(display.height / display.bufferFraction));
  const oneBufferBytes = display.width * bufferLines * bytesPerPixel;
  const drawBufferBytes = display.doubleBuffer ? oneBufferBytes * 2 : oneBufferBytes;
  const drawBufferKB = Math.round((drawBufferBytes / 1024) * 10) / 10;

  // LVGL object memory overhead: ~160 bytes per lv_obj + styles
  const baseLvglHeap = 1024 * 16; // 16KB base heap
  const widgetHeapBytes = baseLvglHeap + widgetCount * 180;
  const widgetHeapKB = Math.round((widgetHeapBytes / 1024) * 10) / 10;

  const totalRamRequiredKB = Math.round((drawBufferKB + widgetHeapKB) * 10) / 10;

  // Flash code estimate: ~50KB LVGL base library + ~1.2KB per widget definition
  const flashEstimateKB = Math.round(55 + widgetCount * 1.2);

  // MCU SRAM
  const mcuInfo = MCU_LIST.find((m) => m.id === display.mcu) || MCU_LIST[0];
  const mcuSramKB = mcuInfo.sramKB;

  // PSRAM stats
  const psramOpt = PSRAM_OPTIONS.find((p) => p.id === display.flashConfig?.psram) || PSRAM_OPTIONS[0];
  const psramMB = psramOpt.sizeMB;
  const psramKB = psramMB * 1024;
  const psramEnabled = psramMB > 0;
  const effectiveRamKB = mcuSramKB + psramKB;

  // If PSRAM is enabled, the draw buffer can be allocated in PSRAM, saving internal SRAM
  const sramSavedByPsramKB = psramEnabled ? drawBufferKB : 0;
  const actualSramUsedKB = psramEnabled ? widgetHeapKB : totalRamRequiredKB;
  const sramUsagePercent = Math.min(100, Math.round((actualSramUsedKB / mcuSramKB) * 100));

  // Partition & Flash stats
  const flashOpt = FLASH_SIZES.find((f) => f.id === display.flashConfig?.flashSize) || FLASH_SIZES[1];
  const flashTotalMB = parseInt(flashOpt.id.replace('MB', ''), 10) || 4;

  const partOpt = PARTITION_SCHEMES.find((p) => p.id === display.flashConfig?.partitionScheme) || PARTITION_SCHEMES[0];
  const flashAppPartitionMB = partOpt.appSizeMB;
  const flashAppUsagePercent = Math.min(100, Math.round((flashEstimateKB / (flashAppPartitionMB * 1024)) * 100));

  let mcuSuitability: 'excellent' | 'tight' | 'exceeds_sram' = 'excellent';
  if (!psramEnabled && totalRamRequiredKB > mcuSramKB * 0.75) {
    mcuSuitability = 'exceeds_sram';
  } else if (!psramEnabled && totalRamRequiredKB > mcuSramKB * 0.45) {
    mcuSuitability = 'tight';
  }

  // Is external PSRAM recommended?
  const psramRecommended =
    !psramEnabled &&
    (totalRamRequiredKB > 150 ||
      (display.width * display.height >= 480 * 320 && display.bufferFraction <= 2));

  let busRecommendation = '4-Wire SPI @ 40MHz';
  if (display.port === 'qspi') {
    busRecommendation = 'QSPI @ 80MHz (High Bandwidth)';
  } else if (display.port === 'parallel_8080_16') {
    busRecommendation = '8080 16-Bit Parallel (60 FPS capable)';
  } else if (display.port === 'parallel_8080_8') {
    busRecommendation = '8080 8-Bit Parallel @ 25MHz';
  } else if (display.port === 'rgb565') {
    busRecommendation = 'Direct RGB565 Parallel @ 16-24MHz';
  } else if (display.port === 'i2c') {
    busRecommendation = 'I2C @ 400kHz–1MHz';
  }

  return {
    bytesPerPixel,
    singleFrameBytes,
    drawBufferBytes,
    drawBufferKB,
    widgetHeapBytes,
    widgetHeapKB,
    totalRamRequiredKB,
    mcuSramKB,
    sramUsagePercent,
    flashEstimateKB,
    flashTotalMB,
    flashAppPartitionMB,
    flashAppUsagePercent,
    psramMB,
    psramKB,
    psramEnabled,
    effectiveRamKB,
    sramSavedByPsramKB,
    psramRecommended,
    busRecommendation,
    mcuSuitability,
  };
}
