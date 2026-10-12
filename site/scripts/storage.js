export const STORAGE_KEY = "faslna-state-v1";
export const AVATARS = ["sun", "leaf", "star", "moon"];
export const DIFFICULTIES = ["auto", "easier", "harder"];
const SUBJECTS = ["math", "arabic", "science"];
const BANDS = ["young", "middle", "older"];
const PRESET_TEACHER_IDS = ["teacher-math", "teacher-arabic", "teacher-science", "teacher-ragab"];

export function freshState() {
  return {schemaVersion: 1, profiles: [], teachers: [], activeProfileId: null, activeTeacherId: null, settings: {reducedMotion: false, soundEnabled: true}};
}

function validHistory(history) {
  return history === undefined || (history && typeof history === "object" && !Array.isArray(history) && Object.entries(history).every(([key, value]) => /^(math|arabic|science):(young|middle|older):[123]$/.test(key) && value && [value.academic,value.social].every(list => Array.isArray(list) && list.every(id => typeof id === "string"))));
}

function validRound(round) {
  if (round && (!Number.isInteger(round.maxLives) || !Number.isInteger(round.maxHints) || round.maxLives < 2 || round.maxLives > 5 || round.maxHints < 1 || round.maxHints > 3 || !Number.isInteger(round.livesLeft) || round.livesLeft < 0 || round.livesLeft > round.maxLives || !Number.isInteger(round.hintsLeft) || round.hintsLeft < 0 || round.hintsLeft > round.maxHints)) return false;
  return round === null || (round && typeof round === "object" && SUBJECTS.includes(round.subject) && BANDS.includes(round.band) && [1,2,3].includes(round.stage) && (round.teacherId === undefined || typeof round.teacherId === "string") && Array.isArray(round.cardIds) && round.cardIds.length === 6 && round.cardIds.every(id => typeof id === "string") && Number.isInteger(round.index) && round.index >= 0 && round.index <= 6 && Number.isInteger(round.score) && round.score >= 0 && round.score <= 12 && Array.isArray(round.wrongIds) && round.wrongIds.every(id => typeof id === "string") && typeof round.hintUsed === "boolean" && typeof round.resolved === "boolean" && (round.selectedId === null || typeof round.selectedId === "string"));
}

function validProgress(progress) {
  return progress && typeof progress === "object" && !Array.isArray(progress) && Object.entries(progress).every(([key, value]) => /^(math|arabic|science):(young|middle|older):[123]$/.test(key) && value && typeof value.completed === "boolean" && Number.isInteger(value.best) && value.best >= 0 && value.best <= 12);
}

export function validateState(state) {
  if (!state || state.schemaVersion !== 1 || !Array.isArray(state.profiles) || !Array.isArray(state.teachers) || !state.settings || typeof state.settings.reducedMotion !== "boolean" || typeof state.settings.soundEnabled !== "boolean") return false;
  if (state.profiles.length > 50 || state.teachers.length > 50) return false;
  if (!state.profiles.every(p => p && typeof p.id === "string" && typeof p.name === "string" && p.name.length > 0 && p.name.length <= 30 && Number.isInteger(p.age) && p.age >= 6 && p.age <= 14 && AVATARS.includes(p.avatar) && DIFFICULTIES.includes(p.difficulty) && validProgress(p.progress) && validHistory(p.history) && validRound(p.round ?? null))) return false;
  if (!state.teachers.every(t => t && typeof t.id === "string" && typeof t.name === "string" && t.name.length > 0 && t.name.length <= 30 && SUBJECTS.includes(t.subject))) return false;
  if (state.activeProfileId !== null && !state.profiles.some(p => p.id === state.activeProfileId)) return false;
  if (state.activeTeacherId !== null && !PRESET_TEACHER_IDS.includes(state.activeTeacherId) && !state.teachers.some(t => t.id === state.activeTeacherId)) return false;
  return true;
}

export function createStore(storage) {
  let state = freshState();
  let persistent = true;
  try {
    storage ??= globalThis.localStorage;
    const saved = storage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.schemaVersion === 1 && Array.isArray(parsed.profiles)) {
        parsed.settings = {...parsed.settings, soundEnabled: parsed.settings?.soundEnabled ?? true};
        parsed.profiles = parsed.profiles.map(profile => {
          if (!profile?.round) return profile;
          const round = profile.round;
          return {...profile, round: {...round, maxLives: round.maxLives ?? 3, maxHints: round.maxHints ?? 2, livesLeft: round.livesLeft ?? Math.max(0, 3 - (round.wrongIds?.length || 0)), hintsLeft: round.hintsLeft ?? (round.hintUsed ? 1 : 2)}};
        });
      }
      if (validateState(parsed)) state = parsed;
      else persistent = false;
    }
  } catch { persistent = false; }
  return {
    get: () => state,
    persistent: () => persistent,
    save(next) {
      if (!validateState(next)) throw new Error("Invalid state");
      state = next;
      try { storage ??= globalThis.localStorage; storage.setItem(STORAGE_KEY, JSON.stringify(state)); persistent = true; }
      catch { persistent = false; }
      return state;
    },
    reset() {
      state = freshState();
      try { storage ??= globalThis.localStorage; storage.removeItem(STORAGE_KEY); persistent = true; }
      catch { persistent = false; }
      return state;
    }
  };
}
