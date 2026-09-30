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
const MEASURE = JSON.parse(readFileSync(new URL('./baseline/sfx-measure.json', import.meta.url), 'utf8'));

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

/* AU. His words, 2026-09-30: "They sound very tinny and hollow. I want deeper
   more rumbly sounds", and then: "I don't want higher tones to be removed
   completely, just less often or less pronounced." The first AS takes centred
   at 2 to 5 kHz. The centroid is measured by tools/sfx.py on every rendered
   take; the ceiling holds the highs quiet without asking for silence up there. */
test('every rendered take is deep: its spectral centroid sits under 1.5 kHz', () => {
  const c = MEASURE.centroid_hz;
  for (const [sound, n] of Object.entries(MAN)) {
    for (let i = 0; i < n; i++) {
      const hz = c[sound + '-' + i];
      assert.ok(typeof hz === 'number', sound + '-' + i + ' was never measured');
      assert.ok(hz < 1500, sound + '-' + i + ' centres at ' + hz + ' Hz: too bright, that is the tinny he heard');
    }
  }
});

test('the drill has a recorded motor bed to loop under its synthesized chatter', () => {
  assert.equal(MAN.drill, 1);
  assert.ok(SRC.includes("BANK.drill"), 'digStart never uses the recorded bed');
});
