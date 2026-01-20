export type UISettings = {
  page: string;
  explorerWidth: number;
  explorerScrollTop: number;
};

export function getEmptyUISettings(): UISettings {
  return {
    page: '/cards',
    explorerWidth: 200,
    explorerScrollTop: 0,
  };
}
