// #5427: a short, synthesized "ding" played when a checklist item is checked
// off, gated on the per-user 'profile.checklistDingSound' preference (off by
// default - see models/users.js hasChecklistDingSound() / toggleChecklistDingSound()).
//
// The sound is synthesized with the Web Audio API rather than bundled as an
// audio file on purpose: the issue thread rejected a bundled file (a Pixabay
// download) because its license was not copyfree/MIT/BSD-compatible for
// WeKan to ship. A synthesized tone has no such licensing question at all.
//
// Two short notes (a quick major-third-ish chime) with a fast attack and an
// exponential fade-out, so it reads as a "ding" rather than a raw beep.

let sharedAudioContext;

function getAudioContextClass() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.AudioContext || window.webkitAudioContext;
}

function getSharedAudioContext() {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) {
    return undefined;
  }
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
}

// Plays one short oscillator note with a quick attack and exponential decay.
function playNote(audioContext, frequency, startTime, duration) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Fast attack, then an exponential fade-out toward (but not reaching, per
  // the Web Audio API) silence - exponentialRampToValueAtTime cannot target 0.
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.2, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// Synthesizes and plays the checklist "ding". Never throws: a failure here
// (no AudioContext, a browser that blocks audio before user interaction,
// etc.) must never break the checklist toggle it is called from.
export function playChecklistDingSound() {
  try {
    if (typeof window === 'undefined' || !getAudioContextClass()) {
      return;
    }
    const audioContext = getSharedAudioContext();
    if (!audioContext) {
      return;
    }
    if (audioContext.state === 'suspended' && typeof audioContext.resume === 'function') {
      // Fire-and-forget: if resume() is rejected (no user gesture yet, etc.)
      // the catch below still protects the caller.
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    // A quick two-note chime, ~200ms total: a lower note immediately followed
    // by a higher one a fifth or so above it.
    playNote(audioContext, 880, now, 0.11);
    playNote(audioContext, 1108.73, now + 0.08, 0.13);
  } catch (error) {
    // Playing a UI ding must never throw into the caller.
  }
}

export default playChecklistDingSound;
