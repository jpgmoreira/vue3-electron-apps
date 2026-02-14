import { NoteFrequency } from '@common/schemas/notes';
import { cloneDeep, deepFreeze } from '@interapp/utils/utils';
import { SettingsManager } from '../settingsManager';

const EMPTY_QUEUES = deepFreeze({
  normal: [],
  low: [],
  high: [],
});

export class FlashcardsManager {
  private queues: Record<NoteFrequency, string[]> = cloneDeep(EMPTY_QUEUES);
  private lowCounter = 0;
  private highCounter = 0;
  private settingsManager: SettingsManager;
  private lastModified: Record<string, number> | null = null;
  private createdAt: Record<string, number> | null = null;
  private frequencies: Record<string, NoteFrequency> | null = null;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  private compare(a: string, b: string) {
    if (!this.lastModified || !this.createdAt) {
      throw new Error('compare() error!');
    }
    const aLast = this.lastModified[a];
    const bLast = this.lastModified[b];
    const aCreated = this.createdAt[a];
    const bCreated = this.createdAt[b];
    if (aLast !== null && bLast !== null) return aLast - bLast;
    if (aLast === null && bLast !== null) return -1;
    if (aLast !== null && bLast === null) return 1;
    return aCreated - bCreated;
  }

  public recomputeQueues(filtered: string[]) {
    if (!this.frequencies) {
      throw new Error('frequencies not set!');
    }
    const frequencies = this.frequencies;
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.queues.high = filtered.filter((s) => frequencies[s] === 'high').sort(this.compare);
    this.queues.normal = filtered.filter((s) => frequencies[s] === 'normal').sort(this.compare);
    this.queues.low = filtered.filter((s) => frequencies[s] === 'low').sort(this.compare);
  }

  private chooseQueue(): NoteFrequency | null {
    this.lowCounter++;
    this.highCounter++;
    const { high, low, normal } = this.queues;
    const { highInterval, lowInterval } = this.settingsManager.getSettings();
    const hMatch = Boolean(this.highCounter >= highInterval);
    const lMatch = Boolean(this.lowCounter >= lowInterval);
    if (high.length && hMatch) {
      this.highCounter = 0;
      return 'high';
    }
    if (low.length && lMatch) {
      this.lowCounter = 0;
      return 'low';
    }
    if (normal.length) return 'normal';
    // Fallback:
    if (high.length) return 'high';
    if (low.length) return 'low';
    return null;
  }

  public getNextFlashcard(): string | null {
    const queue = this.chooseQueue();
    if (!queue) return null;
    const noteId = this.queues[queue].shift();
    if (!noteId) throw new Error('Invalid note!');
    this.queues[queue].push(noteId);
    return noteId;
  }

  public clear() {
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.highCounter = 0;
    this.lowCounter = 0;
  }
}
