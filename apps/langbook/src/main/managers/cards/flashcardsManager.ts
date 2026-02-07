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
  private counter = 0;
  private settingsManager: SettingsManager;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  private compare(a: Card, b: Card) {
    const aLast = a.lastReviewedAt;
    const bLast = b.lastReviewedAt;
    if (aLast !== null && bLast !== null) return aLast - bLast;
    if (aLast === null && bLast !== null) return -1;
    if (aLast !== null && bLast === null) return 1;
    return a.createdAt - b.createdAt;
  }

  public recomputeQueues(filtered: Card[]) {
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.queues.high = filtered.filter((c) => c.frequency === 'high').sort(this.compare);
    this.queues.normal = filtered.filter((c) => c.frequency === 'normal').sort(this.compare);
    this.queues.low = filtered.filter((c) => c.frequency === 'low').sort(this.compare);
  }

  private chooseQueue(): CardFrequency | null {
    const h = this.queues.high.length;
    const l = this.queues.low.length;
    const n = this.queues.normal.length;
    const { highInterval, lowInterval } = this.settingsManager.getSettings();
    const hMatch = Boolean(highInterval && this.counter % highInterval === 0);
    const lMatch = Boolean(lowInterval && this.counter % lowInterval === 0);
    this.counter++;
    if (h && hMatch) return 'high';
    if (l && lMatch) return 'low';
    if (n) return 'normal';
    if (h) return 'high';
    if (l) return 'low';
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
    this.counter = 0;
  }
}
