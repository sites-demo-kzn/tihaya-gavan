import fs from 'node:fs/promises';import path from 'node:path';
import { createHash } from 'node:crypto';
import { MEDIA } from '../docs/media.js';
const data=JSON.parse(await fs.readFile('content.json','utf8'));
await fs.writeFile('docs/content.js','export const DATA = '+JSON.stringify(data)+';\n');
const modules=['app.js','inquiry.js','enhancements.js','motion.js','viewport.js','comparison.js','content.js','media.js'];
const normalized=await Promise.all(modules.map(async name=>[name,(await fs.readFile('docs/'+name,'utf8')).replace(/\.js\?v=[a-f0-9]+/g,'.js')]));
const assetVersion=createHash('sha256').update(normalized.map(([name,code])=>name+'\n'+code).join('\n')).update(await fs.readFile('docs/style.css')).update(await fs.readFile('docs/motion.css')).digest('hex').slice(0,12);
for(const [name,code]of normalized)await fs.writeFile('docs/'+name,code.replace(/from (['"])(\.\/[^'"\n]+\.js)\1/g,(_,quote,file)=>'from '+quote+file+'?v='+assetVersion+quote));
const template=await fs.readFile('template.html','utf8');
const siteUrl=new URL(process.env.SITE_URL||'https://sites-demo-kzn.github.io/tihaya-gavan/');if(!siteUrl.pathname.endsWith('/'))siteUrl.pathname+='/';
const routes=new Map([['/','Отдых на Волге — Тихая Гавань'],['/gallery','Фотогалерея'],['/booking','Бронирование'],['/demo','О базе'],['/o-baze','О базе'],['/prajs-listy','Цены и условия']]);
for(const p of data.pages)routes.set(p.route,p.title||({'/pravila':'Правила проживания','/politika-konfidenczialnosti':'Конфиденциальность'}[p.route])||'Тихая Гавань');
for(const c of data.catalog)routes.set(c.route,c.title);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(route,title,prefix){
 const object=data.catalog.find(c=>c.route===route),fullTitle=title.includes('Тихая Гавань')?title:title+' — Тихая Гавань';
 const description=object?`${object.title}${object.capacity?': до '+object.capacity+' гостей':''} на турбазе «Тихая Гавань». Фотографии, условия отдыха и заявка на выбранные даты.`:'Турбаза «Тихая Гавань» на полуострове Копылово в Тольятти. Коттеджи, номера, бани и мероприятия на берегу Волги. Выберите отдых и напишите администратору.';
 const cover=object?.cover||data.images.hero,variants=MEDIA[cover]?.variants||[],socialImage=variants.find(v=>v.width>=1280)?.src||variants.at(-1)?.src||cover;
 const values={prefix,route,title:fullTitle,description,assetVersion,canonical:new URL(route==='/'?'':route.replace(/^\//,'')+'/',siteUrl).href,socialImage:new URL(socialImage,siteUrl).href};
 return template.replace(/\{\{(prefix|route|title|description|canonical|socialImage|assetVersion)\}\}/g,(_,key)=>escape(values[key]));
}
for(const [route,title] of routes){const depth=route.split('/').filter(Boolean).length,prefix=depth?'../'.repeat(depth):'./';const dir=path.join('docs',route==='/'?'':route.slice(1));await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'index.html'),render(route,title,prefix));}
await fs.writeFile('docs/404.html',render('/404','Страница не найдена','./').replace('<head>','<head>\n<base href="'+escape(siteUrl.pathname)+'">'));
await fs.writeFile('docs/.nojekyll','');await fs.writeFile('docs/robots.txt','User-agent: *\nDisallow: /\n');
console.log(`Built ${routes.size} pages, ${data.catalog.length} catalog entries`);
