export type UISettings = {
  page: string;
  explorerWidth: number;
  explorerScrollTop: number;
};

export function getEmptyUISettings(): UISettings {
  return {
    page: '/notes',
    explorerWidth: 200,
    explorerScrollTop: 0,
  };
}
