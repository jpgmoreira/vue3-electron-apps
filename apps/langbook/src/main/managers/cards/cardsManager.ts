import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { CardsDbManager } from './cardsDbManager';
import { Card, CardFrequency } from '@common/schemas/card';
import { FiltersManager } from '../filtersManager';
import { CardsMediaManager } from './media/cardsMediaManager';
import { ProfileManager } from '../profileManager';
import { SessionsManager } from '../sessionsManager';
import { TagsManager } from '../tagsManager';
import { GetCardsPageResponseDTO } from '@common/dto/getCardsPageResponseDTO';
import { CARDS_PAGE_SIZE } from '@common/constants';
import { Statistics } from '@common/schemas/statistics';
import { FlashcardsManager } from './flashcardsManager';

export class CardsManager {
  private dbManager: CardsDbManager;
  private flashcardsManager: FlashcardsManager;
  private mediaManager: CardsMediaManager;
  private filtersManager: FiltersManager;
  private profileManager: ProfileManager;
  private sessionsManager: SessionsManager;
  private tagsManager: TagsManager;
  private profileId: string | null = null;

  // Maps card ids to actual card objects:
  private cardsMap: Record<string, Card> = {};

  // All cards that satisfy the current filters:
  private filtered: Card[] = [];

  constructor(
    emitter: EventEmitter,
    dbManager: CardsDbManager,
    mediaManager: CardsMediaManager,
    filtersManager: FiltersManager,
    profileManager: ProfileManager,
    sessionsManager: SessionsManager,
    tagsManager: TagsManager,
    flashcardsManager: FlashcardsManager
  ) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear());
    this.dbManager = dbManager;
    this.filtersManager = filtersManager;
    this.mediaManager = mediaManager;
    this.profileManager = profileManager;
    this.sessionsManager = sessionsManager;
    this.tagsManager = tagsManager;
    this.flashcardsManager = flashcardsManager;
  }

  public async loadProfile(profileId: string) {
    this.profileId = profileId;
    await this.dbManager.loadProfile(profileId);
    const cards = await this.dbManager.loadAllCards();
    for (const card of cards) {
      this.cardsMap[card.id] = card;
    }
    this.filter();
  }

  public filter() {
    const cards = Object.values(this.cardsMap);
    this.filtered = cards
      .filter((c) => this.filtersManager.satisfyCurrentFilters(c))
      .sort((a, b) => a.createdAt - b.createdAt);
    let scrollTop = 0,
      position = 1;
    for (const card of this.filtered) {
      card.ui = { scrollTop, position };
      scrollTop += card.height;
      position++;
    }
    this.flashcardsManager.recomputeQueues(this.filtered);
  }

  public async createCard(card: Card) {
    if (!this.profileId) throw new Error('Profile not initialized!');
    await this.mediaManager.cardWasCreated(card, this.profileId);
    await this.dbManager.insertCard(card);
    this.profileManager.addCards(1);
    this.sessionsManager.cardWasCreated(card);
    this.tagsManager.cardWasCreated(card);
    this.cardsMap[card.id] = card;
    this.filter();
  }

  public getCardsPage(scrollTop: number): GetCardsPageResponseDTO {
    if (!this.profileId) throw new Error('Profile not initialized!');
    let anchor = 0;
    let totalHeight = 0;
    for (let i = 0; i < this.filtered.length; i++) {
      const card = this.filtered[i];
      totalHeight += card.height;
      if (!anchor && totalHeight >= scrollTop) {
        anchor = i;
      }
    }
    const first = Math.max(0, anchor - Math.floor(CARDS_PAGE_SIZE / 2));
    const page = this.filtered.slice(first, first + CARDS_PAGE_SIZE);
    for (const card of page) {
      this.mediaManager.preparePaths(card, this.profileId);
    }
    return {
      page,
      totalHeight,
    };
  }

  public async deleteCard(cardId: string) {
    if (!this.profileId) throw new Error('Profile id not initialized!');
    const card = this.cardsMap[cardId];
    if (!card) throw new Error('Card not found!');
    delete this.cardsMap[cardId];
    this.profileManager.addCards(-1);
    this.mediaManager.deleteMediaFolder(cardId, this.profileId);
    await this.dbManager.deleteCard(cardId);
    this.sessionsManager.cardWasDeleted(card);
    this.tagsManager.cardWasDeleted(card);
    // I do not call "this.filter" here because this method
    //   can potentially be called a very large number of times
    //   on a single explorer delete operation.
    // You should call it elsewhere whenever using this
    //   deleteCard operation.
  }

  public async updateCard(card: Card) {
    if (!this.profileId) throw new Error('Profile id not initialized!');
    const oldCard = this.cardsMap[card.id];
    if (!oldCard) throw new Error('Card not found!');
    await this.mediaManager.cardWasUpdated(card, this.profileId);
    await this.dbManager.updateCard(card);
    this.sessionsManager.cardWasUpdated(oldCard, card);
    this.tagsManager.cardWasUpdated(oldCard, card);
    this.cardsMap[card.id] = card;
    this.filter();
  }

  public async sessionWasDeleted(sessionId: string) {
    const allCards = Object.values(this.cardsMap);
    await this.dbManager.beginTransaction();
    try {
      for (const card of allCards) {
        if (!card.sessions.includes(sessionId)) {
          continue;
        }
        card.sessions = card.sessions.filter((s) => s !== sessionId);
        if (card.sessions.length === 0) {
          await this.deleteCard(card.id);
        } else {
          await this.dbManager.updateCard(card);
        }
      }
      this.dbManager.commit();
    } catch {
      this.dbManager.rollback();
    } finally {
      this.filter();
    }
  }

  public async clearFilteredBucket() {
    await this.dbManager.clearFilteredBucket(this.filtered);
    // "this.filtered" and "this.cardsMap" hold the same Card references.
    for (const card of this.filtered) {
      card.bucket = false;
    }
    this.filter();
  }

  public async clearFilteredFrequency(frequency: CardFrequency) {
    await this.dbManager.clearFilteredFrequency(this.filtered, frequency);
    for (const card of this.filtered) {
      if (card.frequency === frequency) {
        card.frequency = 'normal';
      }
    }
    this.filter();
  }

  public getStatistics(): Statistics {
    const allCards = Object.values(this.cardsMap);
    const totalCards = allCards.length;
    const totalBucket = allCards.filter((c) => c.bucket).length;
    const totalLow = allCards.filter((c) => c.frequency === 'low').length;
    const totalHigh = allCards.filter((c) => c.frequency === 'high').length;
    const totalNormal = allCards.filter((c) => c.frequency === 'normal').length;
    const filtered = this.filtered.length;
    const filteredBucket = this.filtered.filter((c) => c.bucket).length;
    const filteredLow = this.filtered.filter((c) => c.frequency === 'low').length;
    const filteredHigh = this.filtered.filter((c) => c.frequency === 'high').length;
    const filteredNormal = this.filtered.filter((c) => c.frequency === 'normal').length;
    return {
      totalCards,
      totalBucket,
      totalLow,
      totalHigh,
      totalNormal,
      filtered,
      filteredBucket,
      filteredLow,
      filteredHigh,
      filteredNormal,
    };
  }

  public async getFlashcard(id: string | null): Promise<Card | null> {
    if (id) return this.cardsMap[id];
    const card = this.flashcardsManager.getNextFlashcard();
    if (card) {
      card.lastReviewedAt = Date.now();
      await this.dbManager.updateCard(card);
    }
    return card;
  }

  public clear() {
    this.profileId = null;
    this.dbManager.clear();
    this.flashcardsManager.clear();
    this.cardsMap = {};
    this.filtered = [];
  }
}
