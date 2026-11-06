import { MEDIA } from './media.js?v=8e2fccf584c7';
// No requests or personal data are sent by this module. The visitor opens their chosen messenger.
export function createInquiry({ DATA, url, esc, icon, link, ext, toast, setupDates, datesValid, dialog }) {
  let draft = {}, lastContext = '', lastReview = false;
  const date = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, '') : '';
  const guests = n => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'гость' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'гостя' : 'гостей'}`;
  function makeMessage(f, object, review, callback) {
    const name = String(f.get('name')).trim(), context = String(f.get('context')).trim();
    const a = date(f.get('arrival')), b = date(f.get('departure')), count = Number(f.get('guests'));
    const phone = String(f.get('phone') || '').trim(), wishes = String(f.get('message') || '').trim();
    if (review) return [`Здравствуйте! Меня зовут ${name}. Хочу поделиться впечатлениями об отдыхе в «Тихой Гавани».`, wishes, phone ? `Со мной можно связаться по телефону ${phone}.` : ''].filter(Boolean).join('\n\n');
    if (callback) return [`Здравствуйте! Меня зовут ${name}. Хочу обсудить отдых в «Тихой Гавани». Перезвоните, пожалуйста, по номеру ${phone}.`, wishes ? `Когда удобно и что хотелось бы обсудить: ${wishes}` : 'Буду ждать вашего ответа, чтобы договориться об удобном времени звонка.'].filter(Boolean).join('\n\n');
    const stay = object && ['room', 'cottage'].includes(object.type);
    let interest;
    if (stay) interest = `Нас заинтересовал ${object.type === 'room' ? 'номер' : 'коттедж'} «${object.title.replace(/^Коттедж\s+/i, '')}»${a && b ? ` с ${a} по ${b}` : a ? ` на ${a}` : ''}.`;
    else if (object) interest = `Хотим узнать подробнее: ${context}${a ? `. Планируем приехать ${a}` : ''}.`;
    else interest = `Хотим спланировать отдых в «Тихой Гавани»${a && b ? ` с ${a} по ${b}` : a ? ` на ${a}` : ''}. Интересует: ${context}.`;
    return [`Здравствуйте! Меня зовут ${name}. ${interest}`, `${count===1?'Будет 1 гость':'Нас '+guests(count)}.${a ? '' : ' С датой пока определяемся.'}`, wishes ? `Наши пожелания: ${wishes}` : '', stay ? 'Подскажите, пожалуйста, свободен ли этот вариант и сколько будет стоить отдых для нашей компании?' : 'Подскажите, пожалуйста, какие есть варианты и условия на нашу компанию?', phone ? `Мой телефон: ${phone}.` : ''].filter(Boolean).join('\n\n');
  }
  return function openInquiry(context, review = false, restore = false) {
    if (!restore || context !== lastContext || review !== lastReview) draft = {};
    lastContext = context; lastReview = review;
    const object = DATA.catalog.find(c => c.title === context);
    const callback = !review && /перезвонить|обратный звонок/i.test(context);
    const single = !review && (object && ['event', 'bath', 'veranda'].includes(object.type) || /Ресторан|банкет|меню|питание|акци/i.test(context));
    const query = new URLSearchParams(location.search);
    let trip = {};
    try { trip = JSON.parse(sessionStorage.getItem('gavan:trip') || '{}'); } catch {}
    const initial = name => draft[name] ?? query.get(name) ?? trip[name] ?? '';
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T12:00:00')) ? value : '';
    document.querySelector('#inquiry-content').innerHTML = `
      <span class="eyebrow">${review ? 'ПОСЛЕ ВАШЕЙ ПОЕЗДКИ' : 'ДО ВСТРЕЧИ В ТИХОЙ ГАВАНИ'}</span>
      <h2 id="inquiry-title">${review ? 'Ваши <em>впечатления.</em>' : callback ? 'Давайте <em>созвонимся.</em>' : 'Спланируем <em>ваш отдых.</em>'}</h2>
      <p class="muted">${review ? 'Расскажите, как прошёл отдых. Подготовим сообщение администратору.' : callback ? 'Укажите телефон и удобное время. Подготовим просьбу о звонке для администратора в WhatsApp.' : 'Расскажите о поездке — в WhatsApp останется только отправить готовое сообщение.'}</p>
      ${object ? `<div class="inquiry-object"><img src="${url(MEDIA[object.cover]?.variants[0]?.src||object.cover)}" alt="${esc(object.title)}"><div><strong>${esc(object.title)}</strong><span>${object.minGuests?`Аренда от ${object.minGuests} гостей`:object.capacity ? `${object.type==='bath'?'Для':'До'} ${object.capacity} гостей` : 'Обсудим детали вашей поездки'}</span></div></div>` : ''}
      <form id="inquiry-form" ${single ? 'data-single-date="true"' : ''}>
        ${object || callback ? `<input type="hidden" name="context" value="${esc(context)}">` : `<label>${review ? 'Тема' : 'Что вас интересует'}<input name="context" value="${esc(draft.context || context)}" required maxlength="150"></label>`}
        <div class="form-row"><label>Ваше имя<input name="name" value="${esc(draft.name || '')}" autocomplete="given-name" placeholder="Как вас зовут?" required maxlength="80"></label><label>Телефон${review ? ' (необязательно)' : ''}<input type="tel" name="phone" value="${esc(draft.phone || '')}" autocomplete="tel" inputmode="tel" placeholder="+7 999 123-45-67" ${review ? '' : 'required'} maxlength="30"></label></div>
        ${review || callback ? '' : `<div class="form-row"><label>${single ? 'Дата посещения' : 'Заезд'}<input type="date" name="arrival" value="${esc(validDate(initial('arrival')))}"></label><label ${single ? 'hidden' : ''}>Выезд<input type="date" name="departure" value="${single ? '' : esc(validDate(initial('departure')))}" ${single ? 'disabled' : ''}></label></div><label>Сколько вас будет?<input type="number" inputmode="numeric" name="guests" min="1" max="500" value="${esc(Math.min(500, Math.max(1, parseInt(initial('guests'), 10) || 2)))}" required></label>`}
        <label>${review ? 'Ваш отзыв' : callback ? 'Удобное время и тема звонка' : 'Пожелания (необязательно)'}<textarea name="message" rows="3" maxlength="2000" placeholder="${review ? 'Что запомнилось в поездке?' : callback ? 'Например, завтра после 12:00, хочу подобрать коттедж для семьи' : 'Например, приедем с детьми, нужен дом ближе к воде'}" ${review ? 'required' : ''}>${esc(draft.message || '')}</textarea></label>
        <label class="consent"><input type="checkbox" name="consent" required ${draft.consent ? 'checked' : ''}><span>Согласен передать данные для ответа на обращение. ${link('/politika-konfidenczialnosti/', 'О конфиденциальности')}</span></label>
        <p class="form-error" role="status" aria-live="polite"></p><button class="btn inquiry-submit">Подготовить сообщение ${icon('arrow')}</button>
        <p class="small muted">Наличие и итоговую стоимость подтвердит администратор.</p>
      </form>`;
    dialog.setAttribute('aria-labelledby', 'inquiry-title');
    const form = document.querySelector('#inquiry-form');
    if (!review && !callback) setupDates(form);
    form.addEventListener('input', () => { form.querySelector('.form-error').textContent = ''; });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity() || !datesValid(form)) return;
      const f = new FormData(form), phone = String(f.get('phone') || '');
      if ((phone || !review) && (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 10 || phone.replace(/\D/g, '').length > 15)) {
        form.querySelector('.form-error').textContent = 'Проверьте телефон: нужно от 10 до 15 цифр.';
        form.querySelector('[name="phone"]').focus(); return;
      }
      draft = Object.fromEntries(f);
      const message = makeMessage(f, object, review, callback);
      document.querySelector('#inquiry-content').innerHTML = `<span class="eyebrow">ОСТАЛСЯ ОДИН ШАГ</span><h2 id="inquiry-title">Напишем <em>администратору.</em></h2><p>Проверьте сообщение и откройте WhatsApp. Отправить его нужно будет в чате.</p><pre class="message-preview" tabindex="0">${esc(message)}</pre><div class="send-actions">${ext('https://wa.me/79272191586?text=' + encodeURIComponent(message), 'Открыть WhatsApp ' + icon('arrow'), 'btn')}<button class="btn btn-outline" type="button" data-copy-message>Скопировать текст</button><a class="text-link" href="mailto:turbaza63@yandex.ru?subject=${encodeURIComponent(review ? 'Отзыв о поездке' : 'Отдых: ' + f.get('context'))}&body=${encodeURIComponent(message)}">Написать по почте ${icon('mail')}</a></div><button class="text-button inquiry-edit" type="button">Вернуться к пожеланиям</button><p class="small muted">${review ? 'Администратор прочитает отзыв и ответит вам лично.' : 'Заявка ещё не отправлена. Бронирование подтверждается после ответа администратора.'}</p>`;
      document.querySelector('[data-copy-message]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(message); const button=document.querySelector('[data-copy-message]');button.textContent='Скопировано';button.setAttribute('aria-label','Сообщение скопировано');toast('Сообщение скопировано'); }
        catch { const preview = document.querySelector('.message-preview'); const range = document.createRange(); range.selectNodeContents(preview); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('Текст выделен — скопируйте его'); }
      });
      document.querySelector('.inquiry-edit').addEventListener('click', () => openInquiry(context, review, true));
      dialog.scrollTop = 0;
      document.querySelector('.send-actions a').focus();
    });
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  };
}
