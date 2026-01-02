import { ref, onBeforeUnmount, watch, Ref } from 'vue';

/**
 * A Vue 3 composable that repeatedly executes a callback at a given interval
 * while the target element is visible in the viewport.
 *
 * This uses the IntersectionObserver API to detect visibility changes and
 * starts/stops a `setInterval` accordingly. The callback will be executed
 * at most `maxCalls` times before automatically stopping.
 *
 * @param elementRef - A Vue ref pointing to the target HTML element to observe.
 * @param callback - Function to be executed at the specified interval when the element is visible.
 * @param ms - Interval in milliseconds between executions of the callback (default: 100).
 * @param maxCalls - Maximum number of times the callback should be executed
 *                   while the element is visible (default: 10).
 * @param threshold - Intersection ratio at which the element is considered visible,
 *                    between 0 and 1 (default: 0).
 * @returns An object containing:
 *  - `isVisible`: A reactive boolean that reflects whether the element is currently visible.
 */
export function useVisibleInterval(
  elementRef: Ref<HTMLElement | null>,
  callback: () => void,
  ms = 100,
  maxCalls = 10,
  threshold = 0
) {
  const isVisible = ref(false);
  let calls = 0;
  let intervalId: number | null = null;
  const start = () => {
    if (intervalId === null) {
      intervalId = window.setInterval(() => {
        calls++;
        callback();
        if (calls >= maxCalls) {
          stop();
        }
      }, ms);
    }
  };
  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      calls = 0;
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isVisible.value = entry.isIntersecting;
      if (isVisible.value) start();
      else stop();
    },
    { threshold }
  );
  watch(
    elementRef,
    (newEl, oldEl) => {
      stop();
      if (oldEl) observer.unobserve(oldEl);
      if (newEl) observer.observe(newEl);
    },
    { immediate: true }
  );
  onBeforeUnmount(() => {
    stop();
    if (elementRef.value) observer.unobserve(elementRef.value);
  });
  return { isVisible };
}
