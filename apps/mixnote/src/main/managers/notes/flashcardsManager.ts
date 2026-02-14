import { NoteFrequency } from '@common/schemas/notes';
import { cloneDeep, deepFreeze } from '@interapp/utils/utils';
import { SettingsManager } from '../settingsManager';
import { FrequencyMap, TimestampMap } from '@common/schemas/maps';

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

  private lastReviewedAt: TimestampMap | null = null;
  private frequencies: FrequencyMap | null = null;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  private compare(a: string, b: string) {
    if (!this.lastReviewedAt) {
      throw new Error('compare(): lastReviewedAt map not set!');
    }
    const aLast = this.lastReviewedAt[a];
    const bLast = this.lastReviewedAt[b];
    if (!aLast || !bLast) {
      throw new Error('compare(): Note lastReviewedAt not set!');
    }
    return aLast - bLast;
  }

  public recomputeQueues(filtered: string[]) {
    if (!this.frequencies) {
      throw new Error('frequencies not set!');
    }
    const frequencies = this.frequencies;
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.queues.high = filtered
      .filter((s) => frequencies[s] === 'high')
      .sort((a, b) => this.compare(a, b));
    this.queues.normal = filtered
      .filter((s) => frequencies[s] === 'normal')
      .sort((a, b) => this.compare(a, b));
    this.queues.low = filtered
      .filter((s) => frequencies[s] === 'low')
      .sort((a, b) => this.compare(a, b));
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

  public setMaps(lastReviewedAt: TimestampMap, frequencies: FrequencyMap) {
    this.lastReviewedAt = lastReviewedAt;
    this.frequencies = frequencies;
  }

  public clear() {
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.highCounter = 0;
    this.lowCounter = 0;
    this.lastReviewedAt = null;
    this.frequencies = null;
  }
}
