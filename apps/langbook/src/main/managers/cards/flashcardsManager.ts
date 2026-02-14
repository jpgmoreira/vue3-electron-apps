import { Card, CardFrequency } from '@common/schemas/card';
import { cloneDeep, deepFreeze } from '@interapp/utils/utils';
import { SettingsManager } from '../settingsManager';

const EMPTY_QUEUES = deepFreeze({
  normal: [],
  low: [],
  high: [],
});

export class FlashcardsManager {
  private queues: Record<CardFrequency, Card[]> = cloneDeep(EMPTY_QUEUES);
  private lowCounter = 0;
  private highCounter = 0;
  private settingsManager: SettingsManager;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  private compare(a: Card, b: Card) {
    const aLast = a.lastReviewedAt;
    const bLast = b.lastReviewedAt;
    if (!aLast || !bLast) {
      throw new Error('compare(): Card lastReviewedAt not set!');
    }
    return aLast - bLast;
  }

  public recomputeQueues(filtered: Card[]) {
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.queues.high = filtered.filter((c) => c.frequency === 'high').sort(this.compare);
    this.queues.normal = filtered.filter((c) => c.frequency === 'normal').sort(this.compare);
    this.queues.low = filtered.filter((c) => c.frequency === 'low').sort(this.compare);
  }

  private chooseQueue(): CardFrequency | null {
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

  public getNextFlashcard(): Card | null {
    const queue = this.chooseQueue();
    if (!queue) return null;
    const card = this.queues[queue].shift();
    if (!card) throw new Error('Invalid card!');
    this.queues[queue].push(card);
    return card;
  }

  public clear() {
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.highCounter = 0;
    this.lowCounter = 0;
  }
}
