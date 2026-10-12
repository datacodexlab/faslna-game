import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newRound, answerRound, advanceRound, revealHint, completeStage, stageUnlocked, totalStars, budgetForBand, selectionHistory } from '../site/scripts/game.js';
import { createStore, freshState } from '../site/scripts/storage.js';

const { cards } = JSON.parse(await readFile(new URL('../site/locales/ar-content.json', import.meta.url), 'utf8'));

test('all 27 real-content rounds complete, unlock correctly and do not inflate replay awards', () => {
  for (const band of ['young', 'middle', 'older']) {
    for (const subject of ['math', 'arabic', 'science']) {
      let progress = {};
      for (const stage of [1, 2, 3]) {
        assert.ok(stageUnlocked(progress, subject, band, stage));
        let round = newRound(cards, subject, band, stage);
        assert.equal(new Set(round.cardIds).size, 6);
        while (round.index < 6) {
          const card = cards.find(item => item.id === round.cardIds[round.index]);
          round = advanceRound(answerRound(round, card, card.answerId));
        }
        assert.equal(round.score, 12);
        progress = completeStage(progress, round);
        const awards = totalStars(progress);
        progress = completeStage(progress, round);
        assert.equal(totalStars(progress), awards);
      }
      assert.equal(totalStars(progress), 36);
    }
  }
});

test('band-specific hints earn rewards while further hints remain unavailable in real rounds', () => {
  for (const band of ['young', 'middle', 'older']) {
    for (const subject of ['math', 'arabic', 'science']) {
      let round = newRound(cards, subject, band, 1);
      while (round.index < 6) {
        const card = cards.find(item => item.id === round.cardIds[round.index]);
        round = advanceRound(answerRound(revealHint(round), card, card.answerId));
      }
      assert.equal(round.score, 12 - budgetForBand(band).maxHints);
      assert.equal(round.hintsLeft, 0);
    }
  }
});

test('each replay draws fresh academic and social cards without changing a saved draw', () => {
  for (const band of ['young', 'middle', 'older']) {
    for (const subject of ['math', 'arabic', 'science']) {
      for (const stage of [1, 2, 3]) {
        const first = newRound(cards, subject, band, stage, {}, () => 0.4);
        const second = newRound(cards, subject, band, stage, selectionHistory(first), () => 0.4);
        assert.equal(second.cardIds.filter(id => first.cardIds.includes(id)).length, 0);
        const restored = JSON.parse(JSON.stringify(second));
        assert.deepEqual(restored.cardIds, second.cardIds);
        assert.equal(restored.maxLives, budgetForBand(band).maxLives);
      }
    }
  }
});

test('saved players keep separate progress and teachers cannot alter another subject result', () => {
  const data = new Map();
  const backing = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const store = createStore(backing);
  const common = { name: 'Test', age: 11, avatar: 'sun', difficulty: 'auto', round: null };
  store.save({ ...freshState(), profiles: [
    { ...common, id: 'one', progress: { 'math:middle:1': { completed: true, best: 8 } } },
    { ...common, id: 'two', progress: {} }
  ], activeProfileId: 'two', activeTeacherId: 'teacher-science' });
  const saved = createStore(backing).get();
  assert.deepEqual(saved.profiles[1].progress, {});
  assert.equal(saved.profiles[0].progress['math:middle:1'].best, 8);
  assert.equal(stageUnlocked(saved.profiles[0].progress, 'science', 'middle', 2), false);
  assert.equal(saved.activeProfileId, 'two');
});
