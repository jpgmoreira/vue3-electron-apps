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
    this.sessionsManager.cardCreated(card);
    this.tagsManager.cardCreated(card);
    this.cardsMap[card.id] = card;
    this.filter();
  }

  public getCardsPage(scrollTop: number): GetCardsPageResponseDTO {
    const page: Card[] = [];
    let totalHeight = 0;
    for (const card of this.filtered) {
      totalHeight += card.height;
      if (card.ui.scrollTop >= scrollTop && page.length < CARDS_PAGE_SIZE) {
        page.push(card);
      }
    }
    return {
      page,
      totalHeight,
    };
  }

  public clear() {
    this.profileId = null;
    this.dbManager.clear();
    this.cardsMap = {};
    this.filtered = [];
  }
}
