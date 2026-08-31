import { createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';

const srsRetentionKey = {
  vocab: 0.98,
  sentences: 0.97,
  topic: 0.95,
  media: 0.93,
};

const getEmptyCard = () => {
  const card = createEmptyCard() as any;
  card.ease = 2.5; // Default ease factor for a new card
  card.interval = 0; // Initial interval for a new card
  card.state = 'new'; // Set the card state
  return card;
};

const initFsrs = (retentionKey: number) => {
  const params = generatorParameters({
    maximum_interval: 1000,
    request_retention: retentionKey,
  });
  return fsrs(params);
};

const buildInitCard = (retentionKey: number) => {
  const card = getEmptyCard();
  const f = initFsrs(retentionKey);
  const hardCardData = f.repeat(card, new Date())['1'].card;

  return {
    ...hardCardData,
    due: hardCardData.due.toISOString(),
    last_review: hardCardData.last_review.toISOString(),
  };
};

export const getInitSentenceCard = () =>
  buildInitCard(srsRetentionKey.sentences);

export const getInitVocabCard = () => buildInitCard(srsRetentionKey.vocab);
