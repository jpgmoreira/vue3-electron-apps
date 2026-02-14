export type UISettings = {
  explorerWidth: number;
  explorerScrollTop: number;
};

export function getEmptyUISettings(): UISettings {
  return {
    explorerWidth: 200,
    explorerScrollTop: 0,
  };
}
