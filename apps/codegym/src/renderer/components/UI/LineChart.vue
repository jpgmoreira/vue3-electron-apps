<script lang="ts" setup>
  /**
   * [12/Sep/2025]
   * Line chart component.
   * Supports plotting several series, panning and zooming.
   * Worked reasonably well with 10k points.
   * I didn't test changing the props on the parent component to see what happens.
   */
  import { useTemplateRef, onMounted, onBeforeUnmount, ref, reactive, computed, watch } from 'vue';
  import { throttle, randomId } from '@common/utils/utils';
  // --- Props: ---
  export type LineChartProps = {
    // "allXValues" and "allXLabels":
    // - The indexes must match.
    // - Must have the same number of elements.
    // - Not required to be sorted though.
    allXValues: number[];
    allXLabels: string[];
    data: {
      // Series come here.
      id: string;
      title: string;
      color: string;
      // "x" and "y":
      // - The indexes must match.
      // - Must have the same number of elements
      // - "x" must be sorted in increasing order.
      x: number[];
      y: number[];
    }[];
  };
  type ContextPoint = {
    id: string;
    label: string;
    color: string;
    value: number;
    active: boolean;
  };
  type ContextState = {
    label: string | null;
    contexts: ContextPoint[];
    visible: boolean;
    x: number;
    y: number;
  };
  const props = defineProps<LineChartProps>();
  // --- Canvas: ---
  const mainCanvasRef = useTemplateRef('main-canvas-ref');
  const hoverCanvasRef = useTemplateRef('hover-canvas-ref');
  let mainCtx: CanvasRenderingContext2D | null = null;
  let hoverCtx: CanvasRenderingContext2D | null = null;
  // --- Plot lines: ---
  const LINE_WIDTH = 3;
  const LINE_CIRCLE_RADIUS = 6;
  // --- Global state: ---
  let scaleX = 1;
  let scaleY = 1;
  let offsetX = 0;
  let offsetY = 0;
  const isDragging = ref(false);
  let isPressingCtrl = false;
  let needsRedraw = false;
  // Must be derived from the data:
  let maxYvalue = -Infinity;
  let maxYvalueInitial = -Infinity;
  // --- Limits: ---
  const initialXlabelsLimit = 30;
  const minYlabelDistance = 18;
  const minXlabelDistance = 20;
  // --- Auxiliary positions absolute to the camera: ---
  let yBottom = 0; // canvas.height - 150;
  let xRight = 0; // canvas.width - 30;
  const yTop = 60;
  const xLeft = 35;
  // --- Auxiliary structures: ---
  const xValueToLabel = new Map<number, string>();
  const xValueToXaxis = new Map<number, number>(); // Maps original X values to their converted values in the X axis.
  const xAxisToLabel = new Map<number, string>();
  const allYvalues = new Set<number>();
  const xAxisToContexts = new Map<number, ContextPoint[]>();
  let allYvaluesSorted: number[] = []; // Used to plot Y values in increasing order from bottom to top.
  let allXvaluesSorted: number[] = []; // Used to plot X values in decreasing order from right to left.
  const disabledSeries = ref<Record<string, boolean>>({});
  // --- Context menu state: ---
  const contextState = reactive<ContextState>({
    label: null,
    contexts: [],
    x: 0,
    y: 0,
    visible: false,
  });
  // --- Functions: ---
  function init() {
    const { allXValues, allXLabels, data } = props;
    xValueToLabel.clear();
    xValueToXaxis.clear();
    allYvalues.clear();
    xAxisToContexts.clear();
    resetContextState();
    allXvaluesSorted = [...allXValues].sort((a, b) => b - a);
    allYvaluesSorted = [];
    for (let i = 0; i < allXValues.length; i++) {
      xValueToLabel.set(allXValues[i], allXLabels[i]);
      xValueToXaxis.set(allXvaluesSorted[i], i);
    }
    for (const series of data) {
      const yLength = series.y.length;
      for (let i = 0; i < yLength; i++) {
        const value = series.y[i];
        if (i >= yLength - initialXlabelsLimit - 1) {
          maxYvalueInitial = Math.max(maxYvalueInitial, value);
        }
        if (allYvalues.has(value)) continue;
        allYvalues.add(value);
        allYvaluesSorted.push(value);
        maxYvalue = Math.max(maxYvalue, value);
      }
    }
    allYvalues.clear(); // Not needed anymore.
    allYvaluesSorted.sort((a, b) => a - b);
  }
  function resetContextState() {
    contextState.label = null;
    contextState.contexts = [];
    contextState.visible = false;
  }
  function requestDraw() {
    if (!needsRedraw) {
      needsRedraw = true;
      requestAnimationFrame(() => {
        draw();
        needsRedraw = false;
      });
    }
  }
  function fixCanvasSize() {
    const mainCanvas = mainCanvasRef.value;
    const hoverCanvas = hoverCanvasRef.value;
    if (!mainCanvas || !hoverCanvas) return;
    let x0 = _toCanvasCoordX(0, scaleX, offsetX),
      x1 = _toCanvasCoordX(1, scaleX, offsetX);
    let y0 = toCanvasCoordY(0, scaleY, offsetY),
      y1 = toCanvasCoordY(1, scaleY, offsetY);
    const xGapBefore = x0 - x1;
    const yGapBefore = y1 - y0;
    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
    yBottom = mainCanvas.height - 130;
    xRight = mainCanvas.width - 30;
    x0 = _toCanvasCoordX(0, scaleX, offsetX);
    x1 = _toCanvasCoordX(1, scaleX, offsetX);
    y0 = toCanvasCoordY(0, scaleY, offsetY);
    y1 = toCanvasCoordY(1, scaleY, offsetY);
    const xGapAfter = x0 - x1;
    const yGapAfter = y1 - y0;
    if (xGapBefore) offsetX *= xGapAfter / (xGapBefore || 1);
    if (yGapBefore) offsetY *= yGapAfter / (yGapBefore || 1);
    hoverCanvas.width = mainCanvas.width;
    hoverCanvas.height = mainCanvas.height;
    requestDraw();
  }
  // Converts a number in the Y axis to its corresponding Y coordinate in the canvas.
  function toCanvasCoordY(n: number, scale: number, offset: number) {
    const graphHeight = yBottom - yTop;
    const t = n / (maxYvalueInitial || 1);
    const screenY = yBottom - t * graphHeight;
    return screenY * scale + offset;
  }
  function _toCanvasCoordX(n: number, scale: number, offset: number) {
    const graphWidth = xRight - xLeft;
    const t = n / initialXlabelsLimit;
    const screenX = xRight - t * graphWidth;
    return screenX * scale + offset;
  }
  // Converts a number in the X axis to its corresponding X coordinate in the canvas.
  function toCanvasCoordX(n: number, scale: number, offset: number) {
    let x: number;
    if (allXvaluesSorted.length > initialXlabelsLimit) {
      x = _toCanvasCoordX(n, scale, offset);
    } else {
      const x0 = _toCanvasCoordX(0, scale, offset);
      const xMin = _toCanvasCoordX(initialXlabelsLimit, scale, offset);
      const diff = x0 - xMin;
      x = x0 - (n + 1) * (diff / (allXvaluesSorted.length + 1));
    }
    return x;
  }
  function clear(ctx: CanvasRenderingContext2D) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  function clearOverflow() {
    if (!mainCtx) return;
    const canvas = mainCtx.canvas;
    mainCtx.clearRect(0, yBottom, canvas.width, canvas.height);
    mainCtx.clearRect(xLeft - 100, 0, 100, canvas.height);
  }
  function draw() {
    if (!mainCtx) return;
    clear(mainCtx);
    drawGrid();
    drawLines();
    clearOverflow();
    drawAxis();
  }
  function canvasMouseDown() {
    isDragging.value = true;
  }
  function resetGraph() {
    offsetX = 0;
    offsetY = 0;
    scaleX = 1;
    scaleY = 1;
    requestDraw();
    resetContextState();
    if (hoverCtx) clear(hoverCtx);
  }
  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Control') isPressingCtrl = true;
    else if (e.key === 'Escape') resetGraph();
  }
  function windowKeyUp(e: KeyboardEvent) {
    if (e.key === 'Control') isPressingCtrl = false;
  }
  function windowMouseUp() {
    isDragging.value = false;
  }
  function windowMouseMove(e: MouseEvent) {
    if (!isDragging.value) return;
    offsetX += e.movementX;
    offsetY += e.movementY;
    requestDraw();
  }
  function pointDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
  }
  function canvasMouseMove(e: MouseEvent) {
    resetContextState();
    if (!mainCanvasRef.value || !hoverCtx) return;
    if (scaleX < 0.1) return;
    const minDistance = LINE_CIRCLE_RADIUS + 3;
    const canvas = mainCanvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const canvasScaleX = canvas.width / (rect.width || 1);
    const canvasScaleY = canvas.height / (rect.height || 1);
    const mouseX = Math.round((e.clientX - rect.left) * canvasScaleX);
    const mouseY = Math.round((e.clientY - rect.top) * canvasScaleY);
    clear(hoverCtx);
    for (let i = -minDistance; i <= minDistance; i++) {
      const xPos = mouseX + i;
      if (xAxisToContexts.has(xPos)) {
        const contexts = xAxisToContexts.get(xPos)!;
        for (const context of contexts) {
          const { value } = context;
          const yCoord = toCanvasCoordY(value, scaleY, offsetY);
          if (pointDistance(mouseX, mouseY, xPos, yCoord) <= minDistance) {
            context.active = true;
            if (hoverCtx) {
              drawCircle(hoverCtx, xPos, yCoord, LINE_CIRCLE_RADIUS + 4, context.color);
            }
          } else {
            context.active = false;
          }
        }
        if (contexts.some((c) => c.active)) {
          contextState.contexts = contexts;
          contextState.visible = true;
          contextState.label = xAxisToLabel.get(xPos)!;
          contextState.x = mouseX;
          contextState.y = mouseY;
        }
        break;
      }
    }
  }
  function drawGrid() {
    if (!mainCtx) return;
    mainCtx.save();
    mainCtx.lineWidth = 1;
    mainCtx.setLineDash([6, 2]);
    mainCtx.strokeStyle = '#aaa';
    // Horizontal lines:
    const x0 = _toCanvasCoordX(0, scaleX, offsetX);
    for (let i = 1; i <= maxYvalue; i++) {
      const y = toCanvasCoordY(i, scaleY, offsetY);
      if (y < 0) break;
      if (y > yBottom) continue;
      mainCtx.beginPath();
      mainCtx.moveTo(xLeft, y);
      mainCtx.lineTo(x0, y);
      mainCtx.stroke();
    }
    // Vertical lines:
    if (scaleX > 0.2) {
      const y0 = toCanvasCoordY(0, scaleY, offsetY);
      const yMax = toCanvasCoordY(maxYvalue, scaleY, offsetY);
      for (let i = 0; i < allXvaluesSorted.length; i++) {
        const x = toCanvasCoordX(i, scaleX, offsetX);
        if (x > xRight) continue;
        if (x < xLeft) break;
        mainCtx.beginPath();
        mainCtx.moveTo(x, y0);
        mainCtx.lineTo(x, yMax);
        mainCtx.stroke();
      }
      if (allXvaluesSorted.length <= initialXlabelsLimit) {
        const x0 = _toCanvasCoordX(0, scaleX, offsetX);
        mainCtx.beginPath();
        mainCtx.moveTo(x0, y0);
        mainCtx.lineTo(x0, yMax);
        mainCtx.stroke();
      }
    }
    mainCtx.restore();
  }
  function drawArrow(x: number, y: number) {
    if (!mainCtx) return;
    const headSize = 5;
    mainCtx.beginPath();
    mainCtx.moveTo(x - headSize, y + headSize * 2);
    mainCtx.lineTo(x + headSize, y + headSize * 2);
    mainCtx.lineTo(x, y);
    mainCtx.closePath();
    mainCtx.fill();
  }
  function drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
  function drawLines() {
    if (!mainCtx) return;
    xAxisToContexts.clear();
    xAxisToLabel.clear();
    for (const series of props.data) {
      if (disabledSeries.value[series.id]) continue;
      mainCtx.save();
      mainCtx.strokeStyle = series.color;
      mainCtx.fillStyle = series.color;
      mainCtx.lineWidth = LINE_WIDTH;
      let prevX = 0;
      let prevY = 0;
      let isLast = false;
      for (let i = 0; i < series.x.length; i++) {
        const xi = xValueToXaxis.get(series.x[i]);
        if (xi === undefined) continue;
        const xLabel = xValueToLabel.get(series.x[i])!;
        const yValue = series.y[i];
        const x = Math.round(toCanvasCoordX(xi, scaleX, offsetX));
        const y = Math.round(toCanvasCoordY(yValue, scaleY, offsetY));
        if (x < xLeft) {
          prevX = x;
          prevY = y;
          continue;
        }
        xAxisToLabel.set(x, xLabel);
        if (scaleX > 0.2) {
          drawCircle(mainCtx, x, y, LINE_CIRCLE_RADIUS, series.color);
        }
        if (i > 0) {
          mainCtx.beginPath();
          mainCtx.moveTo(prevX, prevY);
          mainCtx.lineTo(x, y);
          mainCtx.stroke();
        }
        if (!xAxisToContexts.has(x)) xAxisToContexts.set(x, []);
        const context = xAxisToContexts.get(x)!;
        context.push({
          id: randomId(),
          label: series.title,
          color: series.color,
          value: yValue,
          active: false,
        });
        prevX = x;
        prevY = y;
        if (isLast) break;
        if (x > xRight) isLast = true;
      }
      mainCtx.restore();
    }
  }
  function drawAxis() {
    if (!mainCtx) return;
    const y0 = toCanvasCoordY(0, scaleY, offsetY);
    const xAxisY = Math.min(y0, yBottom);
    // - Draw Y axis line:
    mainCtx.save();
    mainCtx.lineWidth = 2;
    mainCtx.beginPath();
    mainCtx.moveTo(xLeft, yTop);
    mainCtx.lineTo(xLeft, xAxisY);
    mainCtx.stroke();
    drawArrow(xLeft, yTop);
    // - Draw X axis line:
    mainCtx.beginPath();
    mainCtx.moveTo(xLeft, xAxisY);
    mainCtx.lineTo(xRight, xAxisY);
    mainCtx.stroke();
    mainCtx.translate(xRight, xAxisY);
    mainCtx.rotate(Math.PI / 2);
    drawArrow(0, 0);
    mainCtx.restore();
    // - Draw Y axis labels:
    mainCtx.save();
    mainCtx.font = '14px Verdana';
    mainCtx.textBaseline = 'middle';
    mainCtx.textAlign = 'right';
    mainCtx.beginPath();
    let lastY = 0;
    for (const value of allYvaluesSorted) {
      const y = toCanvasCoordY(value, scaleY, offsetY);
      if (y < 0) break;
      if (y > yBottom) continue;
      if (Math.abs(y - lastY) < minYlabelDistance) continue;
      lastY = y;
      // Draw tick:
      mainCtx.moveTo(xLeft - 5, y);
      mainCtx.lineTo(xLeft + 5, y);
      // Draw label:
      mainCtx.fillText(value.toString(), xLeft - 8, y);
    }
    mainCtx.stroke();
    mainCtx.restore();
    // - Draw X axis labels:
    mainCtx.save();
    mainCtx.font = '11.5px Verdana';
    mainCtx.textAlign = 'right';
    mainCtx.textBaseline = 'middle';
    mainCtx.beginPath();
    let lastX = Infinity;
    for (let i = 0; i < allXvaluesSorted.length; i++) {
      // Here we count from right (0 is the most recent) to left.
      const x = toCanvasCoordX(i, scaleX, offsetX);
      if (x > xRight) continue;
      if (x < xLeft) break;
      if (lastX - x < minXlabelDistance) continue;
      lastX = x;
      const label = xValueToLabel.get(allXvaluesSorted[i]) || '';
      // Draw tick:
      mainCtx.moveTo(x, xAxisY - 10);
      mainCtx.lineTo(x, xAxisY + 10);
      // Draw label:
      mainCtx.save();
      mainCtx.translate(x, xAxisY + 13);
      mainCtx.rotate(-Math.PI / 3.3);
      mainCtx.fillText(label, 0, 0);
      mainCtx.restore();
    }
    mainCtx.stroke();
    mainCtx.restore();
  }
  function canvasWheel(e: WheelEvent) {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    const zoom = 1 - e.deltaY * 0.001;
    scaleX *= zoom;
    offsetX = (offsetX - mouseX) * zoom + mouseX;
    if (!isPressingCtrl) {
      scaleY *= zoom;
      offsetY = (offsetY - mouseY) * zoom + mouseY;
    }
    if (hoverCtx) clear(hoverCtx);
    resetContextState();
    requestDraw();
  }
  function legendItemClick(seriesId: string) {
    disabledSeries.value[seriesId] = !disabledSeries.value[seriesId];
  }
  const throttleWindowResize = throttle(fixCanvasSize, 50);
  const contextMenuStyle = computed(() => {
    const result: Record<string, string> = {};
    const canvas = mainCanvasRef.value;
    if (!canvas) return result;
    const menuWidth = 200; // Estimate of max size.
    const menuHeight = 400;
    let x = contextState.x;
    let y = contextState.y;
    const canvasRect = canvas.getBoundingClientRect();
    const maxX = canvasRect.width;
    const maxY = canvasRect.height;
    let translateX = 0;
    let translateY = 0;
    if (x + menuWidth > maxX) translateX = 100;
    if (y + menuHeight > maxY) translateY = 100;
    result.left = `${x}px`;
    result.top = `${y}px`;
    result.transform = `translate(-${translateX}%, -${translateY}%)`;
    return result;
  });
  watch(disabledSeries, requestDraw, { deep: true });
  onMounted(() => {
    const mainCanvas = mainCanvasRef.value;
    const hoverCanvas = hoverCanvasRef.value;
    if (!mainCanvas || !hoverCanvas) return;
    mainCtx = mainCanvas.getContext('2d');
    hoverCtx = hoverCanvas.getContext('2d');
    window.addEventListener('resize', throttleWindowResize);
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
    window.addEventListener('keydown', windowKeyDown);
    window.addEventListener('keyup', windowKeyUp);
    init();
    fixCanvasSize();
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
    window.removeEventListener('resize', throttleWindowResize);
    window.removeEventListener('keydown', windowKeyDown);
    window.removeEventListener('keyup', windowKeyUp);
  });
</script>

<template>
  <div class="canvas-container">
    <div class="legend-container">
      <div
        v-for="series of data"
        :key="series.id"
        class="legend-item"
        :class="{ disabled: disabledSeries[series.id] }"
        @click="legendItemClick(series.id)"
      >
        <div class="legend-item-content">
          <div class="legend-square" :style="{ backgroundColor: series.color }"></div>
          {{ series.title }}
        </div>
      </div>
    </div>
    <div v-show="contextState.visible" class="context-menu" :style="contextMenuStyle">
      <div class="context-menu-header">{{ contextState.label }}</div>
      <div class="context-menu-body">
        <div
          v-for="context in contextState.contexts"
          :key="context.id"
          class="context-menu-item"
          :class="{ active: context.active }"
        >
          <span :style="{ color: context.color }">{{ context.label }}:{{ ' ' }}</span>
          <span :style="{ color: context.color }">{{ context.value }}</span>
        </div>
      </div>
    </div>
    <canvas ref="hover-canvas-ref" class="hover-canvas"></canvas>
    <canvas
      ref="main-canvas-ref"
      class="main-canvas"
      :class="{ dragging: isDragging }"
      @wheel="canvasWheel"
      @mousedown="canvasMouseDown"
      @mousemove="canvasMouseMove"
      @mouseleave="resetContextState"
    ></canvas>
  </div>
</template>

<style scoped>
  .legend-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 6px 8px;
    border: 1px solid #aaa;
    border-radius: 10px;
    background-color: rgba(239, 239, 239, 0.95);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    font-size: 0.9rem;
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 3;
    user-select: none;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    position: relative;
    padding: 2px 4px;
    transition:
      background 0.2s,
      opacity 0.2s;
    border-radius: 5px;
  }

  .legend-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .legend-square {
    width: 17px;
    height: 17px;
    border: 1px solid #222;
    flex-shrink: 0;
    margin-right: 2px;
  }

  .legend-item-content {
    display: flex;
    align-items: center;
    line-height: 1;
    color: #222;
  }

  .legend-item.disabled .legend-item-content {
    opacity: 0.3;
  }

  .legend-item.disabled::after {
    content: '';
    position: absolute;
    top: 50%;
    left: -3px;
    right: -3px;
    height: 2px;
    background-color: #000;
    transform: translateY(-50%);
  }

  .context-menu {
    position: absolute;
    min-width: 180px;
    max-width: 250px;
    border-radius: 10px;
    background-color: rgba(239, 239, 239, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    font-size: 0.9rem;
    font-weight: 500;
    color: #222;
    line-height: 1.3rem;
    padding: 8px 10px;
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
    z-index: 4;
    backdrop-filter: blur(4px);
  }

  .context-menu-header {
    font-weight: 700;
    padding-bottom: 4px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    color: #111;
  }

  .context-menu-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .context-menu-item {
    padding: 4px 6px;
    border-radius: 6px;
    transition: background-color 0.15s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .context-menu-item.active {
    background-color: rgba(0, 0, 0, 0.12);
    outline: 1px solid rgba(0, 0, 0, 0.15);
  }

  .canvas-container {
    position: relative;
    overflow: hidden;
    height: 100%;
    background-color: #efefef;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .main-canvas {
    cursor: grab;
    z-index: 1;
  }

  .main-canvas.dragging {
    cursor: grabbing;
  }

  .hover-canvas {
    pointer-events: none;
    z-index: 2;
  }
</style>
