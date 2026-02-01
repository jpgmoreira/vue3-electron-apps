import { EventEmitter } from '@interapp/events/eventEmitter';
import { CommonEvents } from '@interapp/events/commonEvents';
import { CardsDbManager } from './cardsDbManager';
import { Card } from '@common/schemas/card';
import { FiltersManager } from '../filtersManager';
import { CardsMediaManager } from './cardsMediaManager';
import { ProfileManager } from '../profileManager';
import { SessionsManager } from '../sessionsManager';
import { TagsManager } from '../tagsManager';
import { GetCardsPageResponseDTO } from '@common/dto/getCardsPageResponseDTO';
import { CARDS_PAGE_SIZE } from '@common/constants';

export class CardsManager {
  private dbManager: CardsDbManager;
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
    tagsManager: TagsManager
  ) {
    emitter.on(CommonEvents.clearProfileData, () => this.clear);
    this.dbManager = dbManager;
    this.filtersManager = filtersManager;
    this.mediaManager = mediaManager;
    this.profileManager = profileManager;
    this.sessionsManager = sessionsManager;
    this.tagsManager = tagsManager;
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
  }

  public async createCard(card: Card) {
    if (!this.profileId) throw new Error('Profile not initialized!');
    this.mediaManager.processCardMedia(card, this.profileId);
    await this.dbManager.insertCard(card);
    this.profileManager.addCards(1);
    this.sessionsManager.cardWasCreated(card);
    this.tagsManager.cardWasCreated(card);
    this.cardsMap[card.id] = card;
    this.filter();
  }

  public getCardsPage(scrollTop: number): GetCardsPageResponseDTO {
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
    this.filter();
  }

  public async sessionWasDeleted(sessionId: string) {
    const allCards = Object.values(this.cardsMap);
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
  }

  public clear() {
    this.profileId = null;
    this.dbManager.clear();
    this.cardsMap = {};
    this.filtered = [];
  }
}
