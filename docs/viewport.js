// iOS webviews can move their visible viewport independently of document scroll.
export function fitVisibleViewport() {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  const mobile = matchMedia('(max-width: 700px)');
  const header = document.querySelector('.header');
  const app = document.querySelector('#app');
  const anchor = document.createComment('header position on wide screens');
  header.before(anchor);
  let frame = 0;
  const previous = new Map();
  function set(name, value) {
    if (previous.get(name) === value) return;
    previous.set(name, value);
    root.style.setProperty(name, value);
  }
  function update() {
    frame = 0;
    // Leave native pinch zoom alone; keep page controls inside the visual viewport
    // while the host browser expands/collapses its own controls at normal scale.
    const normalScale = !viewport || Math.abs(viewport.scale - 1) < .02;
    const top = normalScale ? Math.max(0, viewport?.offsetTop || 0) : 0;
    const left = normalScale ? Math.max(0, viewport?.offsetLeft || 0) : 0;
    const height = normalScale ? viewport?.height || innerHeight : innerHeight;
    const width = normalScale ? viewport?.width || innerWidth : innerWidth;
    set('--visible-top', `${top}px`);
    set('--visible-left', `${left}px`);
    set('--visible-height', `${height}px`);
    set('--visible-width', `${width}px`);
    if (mobile.matches) set('--mobile-header-height', `${header.getBoundingClientRect().height}px`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function placeHeader() {
    if (mobile.matches) app.before(header);
    else anchor.after(header);
    update();
  }
  mobile.addEventListener('change', placeHeader);
  viewport?.addEventListener('resize', schedule, { passive: true });
  viewport?.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  new ResizeObserver(schedule).observe(header);
  placeHeader();
}
