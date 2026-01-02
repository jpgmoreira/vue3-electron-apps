import { performance, PerformanceObserver } from 'node:perf_hooks';

const ENABLE_PERFORMANCE_LOGS = process.env.ENABLE_PERFORMANCE_LOGS === 'true';

if (ENABLE_PERFORMANCE_LOGS) {
  const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      console.log(`> [performance] [${entry.name}]: ${entry.duration.toFixed(3)} ms`);
    });
  });
  obs.observe({ entryTypes: ['measure'] });
}

export function measure<T>(name: string, fn: () => T): T {
  if (!ENABLE_PERFORMANCE_LOGS) return fn();
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  performance.mark(startMark);
  const result = fn();
  performance.mark(endMark);
  performance.measure(name, startMark, endMark);
  return result;
}

// -- Usage example:
// ipcMain.handle(TreeChannels.toggleDirOpen, (_event, anchor, nodeId) => {
//   return measure('toggleDirOpen', () => {
//     TreeManager.instance.toggleDirOpen(nodeId);
//     return TreeManager.instance.buildResult(anchor);
//   });
// });
