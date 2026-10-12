export const SOUND_PRESETS = Object.freeze([
  {wave:"sine", notes:[523,659,784], duration:.12},
  {wave:"triangle", notes:[392,523,659,784], duration:.1},
  {wave:"sine", notes:[784,1047], duration:.16},
  {wave:"square", notes:[330,440,554], duration:.09},
  {wave:"triangle", notes:[587,740,880,1175], duration:.08},
  {wave:"sine", notes:[440,660,880], duration:.15},
  {wave:"triangle", notes:[659,523,784], duration:.13},
  {kind:"clap", pulses:[0]},
  {kind:"clap", pulses:[0,.14]},
  {kind:"clap", pulses:[0,.09,.18,.27]}
]);

export function nextSoundIndex(lastIndex, random = Math.random) {
  const count = SOUND_PRESETS.length;
  const draw = Math.min(count - 2, Math.max(0, Math.floor(random() * (count - 1))));
  return lastIndex < 0 || lastIndex >= count ? draw : draw >= lastIndex ? draw + 1 : draw;
}

let context;
let lastIndex = -1;

export async function playEncouragement(enabled) {
  if (!enabled) return false;
  try {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return false;
    context ??= new AudioContextClass();
    if (context.state === "suspended") await context.resume();
    lastIndex = nextSoundIndex(lastIndex);
    const preset = SOUND_PRESETS[lastIndex];
    const start = context.currentTime;
    if (preset.kind === "clap") {
      const length = Math.floor(context.sampleRate * .075);
      const buffer = context.createBuffer(1,length,context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index=0;index<length;index++) samples[index] = (Math.random()*2-1) * (1-index/length);
      preset.pulses.forEach(delay => {
        const source=context.createBufferSource();
        const filter=context.createBiquadFilter();
        const gain=context.createGain();
        source.buffer=buffer;filter.type="highpass";filter.frequency.value=850;
        gain.gain.value=.12;
        source.connect(filter).connect(gain).connect(context.destination);
        source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
        source.start(start+delay);source.stop(start+delay+.075);
      });
      return true;
    }
    preset.notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = start + index * preset.duration;
      oscillator.type = preset.wave;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(.12, noteStart + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, noteStart + preset.duration * .95);
      oscillator.connect(gain).connect(context.destination);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      oscillator.start(noteStart);
      oscillator.stop(noteStart + preset.duration);
    });
    return true;
  } catch { return false; }
}
