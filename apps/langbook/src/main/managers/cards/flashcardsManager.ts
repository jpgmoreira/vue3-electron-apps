import { Card, CardFrequency } from '@common/schemas/card';
import { cloneDeep, deepFreeze } from '@interapp/utils/utils';

const EMPTY_QUEUES = deepFreeze({
  normal: [],
  low: [],
  high: [],
});

export class FlashcardsManager {
  private queues: Record<CardFrequency, Card[]> = cloneDeep(EMPTY_QUEUES);

  private compare(a: Card, b: Card) {
    const aLast = a.lastReviewedAt;
    const bLast = b.lastReviewedAt;
    if (aLast !== null && bLast !== null) return aLast - bLast;
    if (aLast === null && bLast !== null) return 1;
    if (aLast !== null && bLast === null) return -1;
    return a.createdAt - b.createdAt;
  }

  public recomputeQueues(filtered: Card[]) {
    this.queues = cloneDeep(EMPTY_QUEUES);
    this.queues.high = filtered.filter((c) => c.frequency === 'high').sort(this.compare);
    this.queues.normal = filtered.filter((c) => c.frequency === 'normal').sort(this.compare);
    this.queues.low = filtered.filter((c) => c.frequency === 'low').sort(this.compare);
  }

  private clear() {
    this.queues = cloneDeep(EMPTY_QUEUES);
  }
}
