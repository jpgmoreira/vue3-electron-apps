export type UISettings = {
  page: string;
};

export function getEmptyUISettings(): UISettings {
  return {
    page: '/cards',
  };
}
