import type { RuntimeArt } from '../render/renderer.ts';
import { MOSES_PARTS, MOSES_ENDING, type StorySlide } from '../../../../packages/campaign/src/moses.ts';

/** Modal comic player. All textures and optional system speech stay offline. */
export function mosesCinematic(
  art: RuntimeArt,
  part: number,
  ending: boolean,
  reduced: boolean,
  done: () => void,
  cancel: () => void,
) {
  const chapter = MOSES_PARTS[part];
  const slides: readonly StorySlide[] = ending ? MOSES_ENDING : chapter.slides;
  const dialog = document.createElement('dialog');
  dialog.className = 'moses-cinematic';
  dialog.setAttribute('aria-label', ending ? 'Moses chapter ending' : chapter.title);
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 600;
  canvas.setAttribute('aria-hidden', 'true');
  const stage = document.createElement('div');
  stage.className = 'moses-comic-stage';
  const bubble = document.createElement('div');
  const caption = document.createElement('div');
  caption.className = 'moses-caption';
  const progress = document.createElement('small');
  const speaker = document.createElement('strong');
  const text = document.createElement('p');
  text.setAttribute('aria-live', 'polite');
  const actions = document.createElement('div');
  actions.className = 'moses-cinema-actions';
  const button = (label: string, action: () => void) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = action;
    actions.append(b);
    return b;
  };
  let index = 0,
    raf = 0,
    closed = false,
    spoken = false;
  const image = art.images['moses-' + chapter.art];
  const sheep = part === 0 ? art.images['moses-sheep'] : undefined;
  const previousFocus = document.activeElement as HTMLElement;
  const finish = (complete: boolean) => {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(raf);
    if (spoken) window.speechSynthesis?.cancel();
    dialog.close();
    dialog.remove();
    previousFocus?.focus();
    (complete ? done : cancel)();
  };
  const back = button('Previous', () => {
    index = Math.max(0, index - 1);
    update();
  });
  const next = button('Next', () => {
    if (index === slides.length - 1) finish(true);
    else {
      index++;
      update();
    }
  });
  next.className = 'primary';
  const voice = button('Read aloud', () => {
    const synth = window.speechSynthesis;
    const local = synth?.getVoices().find(v => v.localService && v.lang.startsWith('en'));
    if (!local) {
      voice.textContent = 'Local voice unavailable';
      return;
    }
    spoken = true;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(slides[index].text);
    u.voice = local;
    u.rate = 0.88;
    u.pitch = slides[index].speaker?.includes('bush') ? 0.75 : 1;
    synth.speak(u);
  });
  button(ending ? 'Continue to results' : 'Skip intro', () => finish(true));
  if (!ending) button('Back to chapters', () => finish(false));
  function update() {
    if (spoken) window.speechSynthesis?.cancel();
    progress.textContent = `${ending ? 'CHAPTER COMPLETE' : 'PART ' + String(part + 1).padStart(3, '0')} · ${chapter.title} · ${index + 1} / ${slides.length}`;
    bubble.className = slides[index].speaker ? 'comic-bubble' : 'comic-narration';
    bubble.classList.toggle('comic-splash', slides[index].text === 'THE FINAL CONFRONTATION');
    bubble.dataset.voice = slides[index].speaker?.includes('bush') ? 'divine' : 'human';
    speaker.textContent = slides[index].speaker ?? (ending ? 'Victory' : 'Narration');
    text.textContent = slides[index].text;
    back.disabled = index === 0;
    next.textContent = index === slides.length - 1 ? (ending ? 'Chapter complete →' : 'Enter battle →') : 'Next →';
  }
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    finish(ending);
  });
  dialog.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next.click();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      back.click();
    }
  });
  bubble.append(speaker, text);
  stage.append(canvas, bubble);
  caption.append(progress, actions);
  dialog.append(stage, caption);
  document.body.append(dialog);
  dialog.showModal();
  update();
  next.focus();
  const c = canvas.getContext('2d')!;
  const start = performance.now();
  function paint(now: number) {
    if (closed) return;
    const time = reduced ? 0 : (now - start) / 1000;
    c.fillStyle = '#07161e';
    c.fillRect(0, 0, 1280, 600);
    if (image?.complete && image.naturalWidth) {
      const cw = image.naturalWidth / chapter.columns,
        ch = image.naturalHeight / chapter.rows,
        scene = slides[index].scene,
        sx = (scene % chapter.columns) * cw,
        sy = Math.floor(scene / chapter.columns) * ch;

      const k = Math.min(1280 / cw, 600 / ch) * (reduced ? 1 : 1 + 0.012 * Math.sin(time * 0.25) ** 2),
        w = cw * k,
        h = ch * k;
      c.drawImage(image, sx + 2, sy + 2, cw - 4, ch - 4, (1280 - w) / 2, (600 - h) / 2, w, h);
      if (part === 0 && index === 0 && sheep?.complete && sheep.naturalWidth) {
        const frame = Math.floor(time * 8) % 6;
        for (let i = 0; i < 2; i++)
          c.drawImage(
            sheep,
            ((frame % 3) * sheep.naturalWidth) / 3,
            (Math.floor(frame / 3) * sheep.naturalHeight) / 2,
            sheep.naturalWidth / 3,
            sheep.naturalHeight / 2,
            120 + i * 170 + Math.sin(time * 0.12) * 65,
            420 + i * 12,
            90,
            90,
          );
      }
      if (part === 0 && index >= 2 && index <= 7) {
        c.save();
        for (let i = 0; i < 24; i++) {
          c.globalAlpha = 0.25 + 0.25 * Math.sin(i + time);
          c.fillStyle = '#ffe3a0';
          c.beginPath();
          c.arc(
            (i * 137 + Math.sin(time + i) * 15) % 1280,
            600 - ((i * 29 + time * 22) % 600),
            1.5 + (i % 3),
            0,
            Math.PI * 2,
          );
          c.fill();
        }
        c.restore();
      }
    } else {
      c.fillStyle = '#f2d18c';
      c.font = '22px system-ui';
      c.fillText('Preparing the story…', 480, 300);
    }
    raf = requestAnimationFrame(paint);
  }
  raf = requestAnimationFrame(paint);
}
