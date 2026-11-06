// Content motion is independent of navigation and never delays an action.
export function setupMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const seen = new WeakSet();
  const running = new Set();
  const selectors = [
    '.search-panel', '.intro > div', '.section-heading', '.page-heading',
    '.detail-title', '.detail-gallery > .gallery-open', '.detail-description',
    '.conditions', '.booking-card', '.card-grid > *', '.experience-card',
    '.celebration-grid > *', '.mosaic > *', '.photo-grid > *', '.review-card',
    '.faq-grid > div:first-child', '.faq details', '.editorial-grid > *',
    '.contacts-grid > *', '.contact-strip .wrap > *', '.restaurant-visual',
    '.offer-list > *', '.menu-layout > *', '.prose article', '.notice',
    '.archive-section', '.price-table-wrap', '.footer-top > *', '.footer-columns > *'
  ].join(',');

  function play(element, frames, duration = 650, delay = 0) {
    if (reduced.matches || !element.animate) return;
    const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
    return animation;
  }

  function reveal(element) {
    element.classList.remove('motion-pending');
    const siblings = [...element.parentElement.children].filter(child => child.matches(selectors));
    const delay = Math.min(Math.max(0, siblings.indexOf(element)), 3) * 55;
    play(element, [
      { opacity: 0, transform: `translate3d(0,${innerWidth < 700 ? 14 : 22}px,0)` },
      { opacity: 1, transform: 'translate3d(0,0,0)' }
    ], innerWidth < 700 ? 600 : 760, delay);
  }

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
        observer.unobserve(entry.target);
        if (entry.isIntersecting) reveal(entry.target);
        else entry.target.classList.remove('motion-pending');
      }
    }
  }, { threshold: 0, rootMargin: '0px 0px -20px 0px' }) : null;

  // Start nearby photos before their transparent entrance reaches the viewport.
  const photos = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.loading = 'eager';
      photos.unobserve(entry.target);
    }
  }, { rootMargin: '600px 0px' }) : null;

  function prepare(root) {
    if (photos) {
      const images = [...(root.matches?.('img[loading="lazy"]') ? [root] : []), ...root.querySelectorAll('img[loading="lazy"]')];
      images.forEach(image => photos.observe(image));
    }
    const elements = [...(root.matches?.(selectors) ? [root] : []), ...root.querySelectorAll(selectors)];
    for (const element of elements) {
      if (seen.has(element) || element.closest('.header,.hero,dialog') || element.parentElement.closest('.motion-item')) continue;
      seen.add(element);
      element.classList.add('motion-item');
      if (reduced.matches || !observer) continue;
      // Content reached through keyboard navigation must never stay hidden.
      element.classList.add('motion-pending');
      observer.observe(element);
    }
  }
  prepare(document);

  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType === 1 && !node.closest('dialog,.header,.hero')) prepare(node);
    }
  }).observe(document.querySelector('#app'), { childList: true, subtree: true });

  document.addEventListener('focusin', event => {
    const item = event.target.closest('.motion-pending');
    if (item) { observer?.unobserve(item); item.classList.remove('motion-pending'); }
  });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    observer?.disconnect();
    document.querySelectorAll('.motion-pending').forEach(element => element.classList.remove('motion-pending'));
    running.forEach(animation => animation.finish());
  });

  // Animate native details without replacing their keyboard semantics.
  const detailsState = new WeakMap();
  function expand(item, open) {
    const previous = detailsState.get(item);
    const start = item.getBoundingClientRect().height;
    previous?.animation?.cancel();
    if (reduced.matches || !item.animate) { item.open = open; item.style.removeProperty('overflow'); return; }
    const summary = item.querySelector('summary');
    item.open = true;
    const border = parseFloat(getComputedStyle(item).borderBottomWidth) + parseFloat(getComputedStyle(item).borderTopWidth);
    const end = open ? item.scrollHeight + border : summary.getBoundingClientRect().height + border;
    item.style.overflow = 'hidden';
    const animation = play(item, [{ height: `${start}px` }, { height: `${end}px` }], open ? 430 : 320);
    const state = { animation, open };
    detailsState.set(item, state);
    animation.finished.then(() => {
      if (detailsState.get(item) !== state) return;
      item.open = open;
      item.style.removeProperty('overflow');
      detailsState.delete(item);
    }).catch(() => {});
  }
  document.addEventListener('click', event => {
    const summary = event.target.closest('.faq summary,.review-details summary,.tariffs summary');
    if (!summary) return;
    event.preventDefault();
    const item = summary.parentElement;
    const open = !(detailsState.get(item)?.open ?? item.open);
    if (open && item.closest('.faq')) item.closest('.faq').querySelectorAll('details[open]').forEach(other => { if (other !== item) expand(other, false); });
    expand(item, open);
  });

  // Photo navigation and dynamically inserted enquiry forms use the same rhythm.
  const lightbox = document.querySelector('#lightbox');
  lightbox.querySelector('img').addEventListener('load', event => {
    if (lightbox.open) play(event.target, [{ opacity: .25, transform: 'scale(.985)' }, { opacity: 1, transform: 'scale(1)' }], 380);
  });
  const inquiry = document.querySelector('#inquiry-content');
  new MutationObserver(() => {
    if (inquiry.closest('dialog').open) play(inquiry, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], 300);
  }).observe(inquiry, { childList: true });
}
