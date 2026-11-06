export function enhanceInterface({ DATA, url, icon, openInquiry }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.header');
  const progress = document.createElement('div'); progress.className = 'reading-progress'; progress.setAttribute('aria-hidden','true');document.body.append(progress);
  let pending = false;
  function scrollState(){
    if(pending)return;pending=true;
    requestAnimationFrame(()=>{
      header.classList.toggle('is-scrolled',scrollY>35);
      const total=document.documentElement.scrollHeight-innerHeight;
      progress.style.transform=`scaleX(${total>0?Math.min(1,scrollY/total):0})`;
      pending=false;
    });
  }
  window.addEventListener('scroll',scrollState,{passive:true});scrollState();
  if(!reduced.matches && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.07,rootMargin:'0px 0px 30px 0px'});
    document.querySelectorAll('.section-heading,.intro>div,.experience-card,.celebration-grid>div,.contact-strip .wrap>div').forEach((element,i)=>{
      element.classList.add('reveal');element.style.setProperty('--reveal-delay',`${Math.min(i%4,2)*60}ms`);observer.observe(element);
    });
  }
  const object=DATA.catalog.find(c=>c.route===document.body.dataset.route);
  const bar=document.createElement('div');bar.className='mobile-booking-bar';
  bar.innerHTML=`<a href="tel:+79278925589" class="mobile-call" aria-label="Позвонить в Тихую Гавань">${icon('phone')}</a><button class="btn">${object?'Даты и стоимость':'Спланировать отдых'} ${icon('arrow')}</button>`;
  bar.querySelector('button').addEventListener('click',()=>openInquiry(object?.title||'Помогите подобрать отдых'));
  document.body.append(bar);
  const lightbox=document.querySelector('#lightbox');let start=null;
  lightbox.addEventListener('touchstart',event=>{if(event.touches.length===1)start={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
  lightbox.addEventListener('touchend',event=>{
    if(!start||!event.changedTouches.length)return;
    const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;start=null;
    if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)lightbox.querySelector(dx<0?'.lightbox-next':'.lightbox-prev').click();
  },{passive:true});
  document.querySelectorAll('dialog').forEach(modal=>{
    modal.addEventListener('close',()=>modal.classList.remove('is-open'));
    new MutationObserver(()=>modal.classList.toggle('is-open',modal.open)).observe(modal,{attributes:true,attributeFilter:['open']});
  });
  document.querySelectorAll('.faq details').forEach(item=>item.addEventListener('toggle',()=>{
    if(item.open)document.querySelectorAll('.faq details[open]').forEach(other=>{if(other!==item)other.open=false;});
  }));
  const player=document.createElement('dialog');player.className='video-dialog';player.setAttribute('aria-label','Видео о турбазе');document.body.append(player);
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('a[data-video]');if(!trigger)return;
    const id=trigger.dataset.video;if(!/^[\w-]{11}$/.test(id))return;
    event.preventDefault();
    player.innerHTML=`<div class="video-heading"><strong>Видео об объекте</strong><button class="icon-button" aria-label="Закрыть видео">${icon('close')}</button></div><div class="video-frame"></div><p>Если видео не загружается, <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">откройте его на YouTube</a>.</p>`;
    const frame=document.createElement('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;frame.title='Видео — '+(document.querySelector('h1')?.textContent||'Тихая Гавань');frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
    player.querySelector('.video-frame').append(frame);player.querySelector('button').addEventListener('click',()=>{stopVideo();player.close();});player.showModal();
  });
  function stopVideo(){player.querySelector('iframe')?.remove();}
  player.addEventListener('close',stopVideo);player.addEventListener('cancel',stopVideo);
  player.addEventListener('click',event=>{if(event.target===player){const r=player.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){stopVideo();player.close();}}});
}
