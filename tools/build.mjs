import fs from 'node:fs/promises';import path from 'node:path';
const data=JSON.parse(await fs.readFile('content.json','utf8'));
data.pages=data.pages.map(({route,source,title,photos,tables,tableTitles,period})=>({route,source,title,photos,tables,tableTitles,period}));
await fs.writeFile('content.json',JSON.stringify(data,null,2));
await fs.writeFile('docs/content.js','export const DATA = '+JSON.stringify(data)+';\n');
const template=await fs.readFile('template.html','utf8');
const routes=new Map([['/','Тихая Гавань — отдых на Волге'],['/gallery','Фотогалерея'],['/booking','Бронирование'],['/demo','О демонстрационной версии']]);
for(const p of data.pages)routes.set(p.route,p.title||({'/pravila':'Правила проживания','/politika-konfidenczialnosti':'Конфиденциальность'}[p.route])||'Тихая Гавань');
for(const c of data.catalog)routes.set(c.route,c.title);
for(const [route,title] of routes){const depth=route.split('/').filter(Boolean).length,prefix=depth?'../'.repeat(depth):'./';const dir=path.join('docs',route==='/'?'':route.slice(1));await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'index.html'),template.replaceAll('{{prefix}}',prefix).replaceAll('{{route}}',route).replaceAll('{{title}}',title.replace(/&/g,'&amp;').replace(/</g,'&lt;')));}
await fs.writeFile('docs/404.html',template.replaceAll('{{prefix}}','./').replaceAll('{{route}}','/404').replaceAll('{{title}}','Страница не найдена'));
await fs.writeFile('docs/.nojekyll','');await fs.writeFile('docs/robots.txt','User-agent: *\nDisallow: /\n');
console.log(`Built ${routes.size} pages, ${data.catalog.length} catalog entries`);
