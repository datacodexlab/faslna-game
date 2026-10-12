export const BANDS = ["young", "middle", "older"];
export const SUBJECTS = ["math", "arabic", "science"];
export const ROUND_LIVES = 3;
export const ROUND_HINTS = 2;
export const BAND_BUDGETS = Object.freeze({young: {maxLives: 5, maxHints: 3}, middle: {maxLives: 3, maxHints: 2}, older: {maxLives: 2, maxHints: 1}});
export function budgetForBand(band) { if (!BAND_BUDGETS[band]) throw new Error("Invalid band"); return {...BAND_BUDGETS[band]}; }

export function ageBand(age) {
  if (!Number.isInteger(age) || age < 6 || age > 14) throw new Error("Invalid age");
  return age <= 8 ? "young" : age <= 11 ? "middle" : "older";
}

export function effectiveBand(age, difficulty = "auto") {
  const index = BANDS.indexOf(ageBand(age));
  const shift = difficulty === "easier" ? -1 : difficulty === "harder" ? 1 : 0;
  return BANDS[Math.max(0, Math.min(2, index + shift))];
}

export function progressKey(subject, band, stage) {
  if (!SUBJECTS.includes(subject) || !BANDS.includes(band) || ![1, 2, 3].includes(stage)) throw new Error("Invalid progress key");
  return `${subject}:${band}:${stage}`;
}

export function stageUnlocked(progress, subject, band, stage) {
  if (stage === 1) return true;
  return progress?.[progressKey(subject, band, stage - 1)]?.completed === true;
}

function sampleCards(pool, count, excluded, random) {
  const available = pool.filter(card => !excluded.includes(card.id));
  const preferred = available.length >= count ? available : pool;
  const shuffled = [...preferred];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const draw = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [shuffled[index], shuffled[draw]] = [shuffled[draw], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

export function roundCards(cards, subject, band, stage, recent = {}, random = Math.random) {
  const academic = cards.filter(card => card.kind === "academic" && card.subject === subject && card.band === band && card.stage === stage);
  const social = cards.filter(card => card.kind === "social" && card.subject === "social" && card.band === band && card.stage === stage);
  if (academic.length < 4 || social.length < 2) throw new Error("Incomplete round content");
  const chosenAcademic = sampleCards(academic, 4, recent.academic || [], random);
  const chosenSocial = sampleCards(social, 2, recent.social || [], random);
  return [chosenAcademic[0], chosenAcademic[1], chosenSocial[0], chosenAcademic[2], chosenAcademic[3], chosenSocial[1]];
}

export function newRound(cards, subject, band, stage, recent = {}, random = Math.random) {
  const budget = budgetForBand(band);
  return {subject, band, stage, cardIds: roundCards(cards, subject, band, stage, recent, random).map(card => card.id), index: 0, score: 0, wrongIds: [], hintUsed: false, hintsLeft: budget.maxHints, livesLeft: budget.maxLives, ...budget, resolved: false, selectedId: null};
}

export function selectionHistory(round) { return {academic: [round.cardIds[0],round.cardIds[1],round.cardIds[3],round.cardIds[4]], social: [round.cardIds[2],round.cardIds[5]]}; }

export function revealHint(round) {
  return round.resolved || round.hintUsed || round.hintsLeft <= 0 || round.livesLeft <= 0 ? round : {...round, hintUsed: true, hintsLeft: round.hintsLeft - 1};
}

export function answerRound(round, card, optionId) {
  if (round.resolved || round.livesLeft <= 0 || round.wrongIds.includes(optionId) || !card.options.some(option => option.id === optionId)) return round;
  if (card.answerId === optionId) {
    return {...round, resolved: true, selectedId: optionId, score: round.score + (round.hintUsed || round.wrongIds.length ? 1 : 2)};
  }
  return {...round, selectedId: optionId, livesLeft: round.livesLeft - 1, wrongIds: [...round.wrongIds, optionId]};
}

export function advanceRound(round) {
  if (!round.resolved || round.livesLeft <= 0) return round;
  return {...round, index: round.index + 1, wrongIds: [], hintUsed: false, resolved: false, selectedId: null};
}

export function completeStage(progress, round) {
  if (round.index !== 6 || round.livesLeft <= 0) throw new Error("Round not complete");
  const key = progressKey(round.subject, round.band, round.stage);
  const previous = progress[key] || {completed: false, best: 0};
  return {...progress, [key]: {completed: true, best: Math.max(previous.best, round.score)}};
}

export function totalStars(progress) {
  return Object.values(progress || {}).reduce((sum, item) => sum + (item.completed ? item.best : 0), 0);
}

export function savedRoundMatchesContent(round, cards) {
  if (!round) return true;
  if (!BAND_BUDGETS[round.band]) return false;
  const actual = budgetForBand(round.band);
  if (!((round.maxLives === actual.maxLives && round.maxHints === actual.maxHints) || (round.maxLives === ROUND_LIVES && round.maxHints === ROUND_HINTS))) return false;
  if (!Number.isInteger(round.livesLeft) || round.livesLeft < 0 || round.livesLeft > round.maxLives || !Number.isInteger(round.hintsLeft) || round.hintsLeft < 0 || round.hintsLeft > round.maxHints || (round.hintUsed && round.hintsLeft === round.maxHints)) return false;
  const pool = cards.filter(card => card.band === round.band && card.stage === round.stage && ((card.kind === "academic" && card.subject === round.subject) || (card.kind === "social" && card.subject === "social")));
  if (!Array.isArray(round.cardIds) || round.cardIds.length !== 6 || new Set(round.cardIds).size !== 6) return false;
  const expected = round.cardIds.map(id => pool.find(card => card.id === id));
  if (expected.some(card => !card) || expected.filter(card => card.kind === "academic").length !== 4 || expected.filter(card => card.kind === "social").length !== 2) return false;
  if (!Number.isInteger(round.index) || round.index < 0 || round.index > 6 || !Number.isInteger(round.score) || round.score < 0 || round.score > round.index * 2 + (round.resolved ? 2 : 0)) return false;
  if (round.index === 6) return !round.resolved && round.wrongIds.length === 0 && round.selectedId === null && !round.hintUsed;
  const card = expected[round.index];
  const optionIds = card.options.map(option => option.id);
  if (!Array.isArray(round.wrongIds) || new Set(round.wrongIds).size !== round.wrongIds.length || !round.wrongIds.every(id => optionIds.includes(id) && id !== card.answerId)) return false;
  if (round.wrongIds.length > round.maxLives - round.livesLeft || (round.livesLeft === 0 && round.resolved)) return false;
  if (round.resolved) return round.selectedId === card.answerId;
  return round.selectedId === null || round.wrongIds.includes(round.selectedId);
}

export function recoverSavedRounds(state, cards) {
  let recovered = false;
  const profiles = state.profiles.map(profile => {
    if (!profile.round || savedRoundMatchesContent(profile.round, cards)) return profile;
    recovered = true;
    return {...profile, round: null};
  });
  return {state: recovered ? {...state, profiles} : state, recovered};
}
