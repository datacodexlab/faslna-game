import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const content = JSON.parse(await readFile(path.join(projectRoot, 'site/locales/ar-content.json'), 'utf8'));
const bands = ['young', 'middle', 'older'];
const subjects = ['math', 'arabic', 'science'];

test('release bank contains exactly 270 academic and 45 social cards', () => {
  assert.equal(content.schemaVersion, 1);
  assert.equal(content.cards.length, 315);
  assert.equal(content.cards.filter(card => card.kind === 'academic').length, 270);
  assert.equal(content.cards.filter(card => card.kind === 'social').length, 45);
});

test('every band, subject and stage can serve its complete round', () => {
  for (const band of bands) {
    for (const stage of [1, 2, 3]) {
      const social = content.cards.filter(card => card.kind === 'social' && card.band === band && card.stage === stage);
      assert.equal(social.length, 5, `${band}/${stage}: social`);
      for (const subject of subjects) {
        const academic = content.cards.filter(card => card.kind === 'academic' && card.band === band && card.stage === stage && card.subject === subject);
        assert.equal(academic.length, 10, `${band}/${subject}/${stage}`);
      }
    }
  }
});

test('cards have stable unique IDs, valid choices, hints and explanations', () => {
  const identifiers = new Set();
  const prompts = new Set();
  const positions = { a: 0, b: 0, c: 0 };
  for (const card of content.cards) {
    assert.match(card.id, /^[a-z0-9-]+$/);
    assert.ok(!identifiers.has(card.id), `duplicate id: ${card.id}`);
    identifiers.add(card.id);
    assert.ok(!prompts.has(card.prompt.trim()), `duplicate prompt: ${card.id}`);
    prompts.add(card.prompt.trim());
    assert.ok(bands.includes(card.band), card.id);
    assert.ok([1, 2, 3].includes(card.stage), card.id);
    assert.ok(['academic', 'social'].includes(card.kind), card.id);
    assert.ok(card.kind === 'social' ? card.subject === 'social' : subjects.includes(card.subject), card.id);
    for (const field of ['prompt', 'hint', 'explanation']) {
      assert.equal(typeof card[field], 'string', `${card.id}/${field}`);
      assert.ok(card[field].trim().length >= 8, `${card.id}/${field}`);
    }
    assert.equal(card.options.length, 3, card.id);
    assert.deepEqual(card.options.map(option => option.id).sort(), ['a', 'b', 'c'], card.id);
    assert.equal(new Set(card.options.map(option => option.text.trim())).size, 3, card.id);
    for (const option of card.options) assert.ok(typeof option.text === 'string' && option.text.trim(), card.id);
    assert.ok(card.options.some(option => option.id === card.answerId), card.id);
    positions[card.answerId] += 1;
  }
  for (const count of Object.values(positions)) assert.ok(count >= 25, 'correct answers must not always use one position');
});

test('academic diversity cannot be manufactured by stage labels or changed numbers', () => {
  for (const band of bands) {
    for (const subject of subjects) {
      const matching = content.cards.filter(card => card.kind === 'academic' && card.band === band && card.subject === subject);
      const normalized = matching.map(card => card.prompt.replace(/[0-9\u0660-\u0669]+/gu, '#').replace(/\s+/g, ' ').trim());
      assert.ok(new Set(normalized).size >= 24, `${band}/${subject} must contain genuinely varied prompts`);
    }
  }
});

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

test('all Arabic source text is confined to localization JSON', async () => {
  const files = await listFiles(path.join(projectRoot, 'site'));
  for (const file of files) {
    if (path.extname(file) === '.json' && file.includes(`${path.sep}locales${path.sep}`)) continue;
    if (!['.html', '.js', '.css', '.svg'].includes(path.extname(file))) continue;
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u, path.relative(projectRoot, file));
    assert.doesNotMatch(source, /\bTODO\b/, path.relative(projectRoot, file));
  }
});
