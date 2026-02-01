import { Card } from '@common/schemas/card';

export class CardsMediaManager {
  public cardWasCreated(card: Card, profileId: string) {}

  public deleteMediaFolder(cardId: string, profileId: string) {}

  public cardWasUpdated(oldCard: Card, newCard: Card, profileId: string) {}
}
