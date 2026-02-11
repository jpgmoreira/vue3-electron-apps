export type Tab = {
  id: string;
  preview: boolean;
  active: boolean;
  noteId: string;
};

export type TabGroup = {
  id: string;
  width: number; // percentage, 0 - 1.
  active: boolean;
  tabs: Tab[];
};

export function getEmptyTabGroup(id: string): TabGroup {
  return {
    id,
    width: 1,
    active: false,
    tabs: [],
  };
}
