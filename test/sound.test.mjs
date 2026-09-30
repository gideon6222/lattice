/* Round eighteen: the sounds stop being cartoony.

   His words, 2026-09-29: "Can you improve the sounds in the game. They seem too
   cartoony." What made them so was every reward being an oscillator playing a
   musical interval. The one-shots are now rendered offline by tools/sfx.py and
   played from buffers, and this holds both halves: every one-shot tries its
   rendered sound first, and every rendered sound it names is really shipped. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const SRC = readFileSync(new URL('../src/audio.ts', import.meta.url), 'utf8');
const MAN = JSON.parse(readFileSync(new URL('../public/sfx/sfx.json', import.meta.url), 'utf8'));

/* each one-shot and the rendered sound it plays */
const ONE_SHOTS = {
  collect: 'ore', key: 'key', relic: 'discovery', cache: 'cache', record: 'record',
  sell: 'sell', buy: 'fit', supply: 'supply', chip: 'chip', crack: 'crack', drop: 'drop',
  ui: 'ui', alarm: 'alarm', thrust: 'thrust', laser: 'laser', gas: 'gas'
};

function body(name) {
  const at = SRC.indexOf(String.fromCharCode(10) + '  ' + name + '(');
  assert.ok(at >= 0, 'sfx.' + name + ' is gone');
  return SRC.slice(at, SRC.indexOf('\n  },', at));
}

test('every one-shot plays its rendered sound before any oscillator', () => {
  for (const [fn, sound] of Object.entries(ONE_SHOTS)) {
    const b = body(fn);
    const played = b.indexOf("play('" + sound + "'");
    assert.ok(played >= 0, 'sfx.' + fn + ' never plays ' + sound);
    for (const synth of ['blip(', 'createOscillator(', 'noiseBurst(']) {
      const i = b.indexOf(synth);
      assert.ok(i < 0 || i > played, 'sfx.' + fn + ' reaches ' + synth + ' before its rendered sound');
    }
  }
});

test('every rendered sound a one-shot names is shipped, with all its takes', () => {
  for (const sound of Object.values(ONE_SHOTS)) {
    assert.ok(MAN[sound] >= 1, sound + ' is not in public/sfx/sfx.json');
    for (let i = 0; i < MAN[sound]; i++) {
      assert.ok(existsSync(new URL('../public/sfx/' + sound + '-' + i + '.ogg', import.meta.url)),
        sound + '-' + i + '.ogg is listed but missing');
    }
  }
});

test('a sound fired often has several takes, so no two plays are alike', () => {
  for (const sound of ['ore', 'chip', 'crack', 'ui', 'fit']) {
    assert.ok(MAN[sound] >= 3, sound + ' has only ' + MAN[sound] + ' takes');
  }
});
