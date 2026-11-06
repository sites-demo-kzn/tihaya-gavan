export function setupComparison({ DATA, url, esc, icon, image, openInquiry, toast }) {
  const stays = DATA.catalog.filter(c => ['cottage', 'room'].includes(c.type));
  let selected = [];
  try { const value = JSON.parse(localStorage.getItem('gavan:comparison') || '[]'); if (Array.isArray(value)) selected = [...new Set(value)].filter(id => stays.some(c => c.route === id)).slice(0, 3); } catch {}
  const tray = document.createElement('aside'); tray.className = 'compare-tray'; tray.setAttribute('aria-label', 'Сравнение проживания');
  const modal = document.createElement('dialog'); modal.className = 'comparison-dialog'; modal.id = 'comparison-dialog'; modal.setAttribute('aria-labelledby', 'comparison-title');
  document.body.append(tray, modal);
  function sync() {
    try { localStorage.setItem('gavan:comparison', JSON.stringify(selected)); } catch {}
    document.querySelectorAll('[data-compare]').forEach(button => {
      const active = selected.includes(button.dataset.compare);
      button.classList.toggle('is-compared', active); button.setAttribute('aria-pressed', String(active));
      const label = active ? 'В сравнении' : 'Сравнить вариант';
      if (button.textContent.trim() !== label) button.textContent = label;
    });
    tray.hidden = !selected.length;
    tray.innerHTML = `<div><strong>${selected.length === 1 ? 'Один вариант выбран' : `Выбрано вариантов: ${selected.length}`}</strong><span>${selected.length === 1 ? 'Добавьте ещё один дом или номер' : 'Вместимость, цены и удобства рядом'}</span></div><button class="btn btn-small" data-open-comparison ${selected.length < 2 ? 'disabled' : ''}>Сравнить ${icon('arrow')}</button><button class="icon-button" data-clear-comparison aria-label="Очистить сравнение">${icon('close')}</button>`;
  }
  const service = (c, term) => c.services?.find(text => term.test(text))?.replace(/[,;]+$/, '') || 'Уточните у администратора';
  function open() {
    const items = selected.map(id => stays.find(c => c.route === id));
    if (items.length < 2) return;
    const rows = [
      ['Размещение', c => c.type === 'cottage' ? 'Коттедж' : 'Гостиничный номер'],
      ['Вместимость', c => c.capacity ? `До ${c.capacity} гостей` : 'Уточните'],
      ['Стоимость', c => c.price || 'По запросу'],
      ['Питание', c => service(c, /питани/i)],
      ['Кухня', c => service(c, /кухн/i)],
      ['Парковка', c => service(c, /парков/i)],
      ['Мангал', c => service(c, /мангал/i)]
    ];
    modal.innerHTML = `<div class="comparison-heading"><div><span class="eyebrow">ДОМА И НОМЕРА</span><h2 id="comparison-title">Сравните <em>варианты.</em></h2></div><button class="icon-button" data-close-comparison aria-label="Закрыть сравнение">${icon('close')}</button></div><p class="muted">Вместимость, стоимость и удобства. Цену на ваши даты подтвердит администратор.</p><p class="comparison-mobile-hint">Сравниваем ${items.length} варианта. Листайте таблицу влево, чтобы увидеть каждый.</p><div class="comparison-scroll" tabindex="0" aria-label="Таблица сравнения, на телефоне можно прокрутить в сторону"><table class="comparison-table"><thead><tr><th scope="col"><span>Ваши варианты</span></th>${items.map(c => `<th scope="col">${image(c.cover, c.title)}<a href="${url(c.route + '/')}">${esc(c.title)}</a></th>`).join('')}</tr></thead><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th>${items.map(c => `<td>${esc(value(c))}</td>`).join('')}</tr>`).join('')}<tr class="comparison-actions"><th scope="row">Ваша поездка</th>${items.map(c => `<td><button class="btn btn-small" data-compare-inquire="${esc(c.title)}">Уточнить даты ${icon('arrow')}</button></td>`).join('')}</tr></tbody></table></div>`;
    modal.showModal();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.matches('[data-compare]')) {
      const id = button.dataset.compare;
      if (selected.includes(id)) selected = selected.filter(value => value !== id);
      else if (selected.length < 3) selected.push(id);
      else { toast('В сравнении уже три варианта. Уберите один, чтобы добавить другой.'); return; }
      sync();
    }
    if (button.matches('[data-open-comparison]')) open();
    if (button.matches('[data-close-comparison]')) modal.close();
    if (button.matches('[data-clear-comparison]')) { selected = []; sync(); }
    if (button.matches('[data-compare-inquire]')) { modal.close(); openInquiry(button.dataset.compareInquire); }
  });
  modal.addEventListener('click', event => { if (event.target === modal) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close(); } });
  const observer = new MutationObserver(() => sync());
  document.querySelectorAll('.card-grid').forEach(grid => observer.observe(grid, { childList: true, subtree: true }));
  sync();
}
