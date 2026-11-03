import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir, totalmem, platform, release, arch } from 'node:os';
import { join } from 'node:path';

const model = 'qwen3.5:0.8b', base = 'http://127.0.0.1:11434';
const report = {version:2, checked_at:new Date().toISOString(),
  system:{os:platform(), release:release(), arch:arch(), ram_gib:+(totalmem()/2**30).toFixed(1)}, checks:[]};
function record(name, ok, detail) {
  report.checks.push({name,ok,detail}); console.log(`${ok?'OK':'НУЖНА ПОМОЩЬ'} · ${name}: ${detail}`); return ok;
}
async function check(name, fn) {
  try {return record(name,true,await fn());} catch(error) {return record(name,false,error.message);}
}
async function api(path, request) {
  const response = await fetch(base+path,{signal:AbortSignal.timeout(request?120000:5000),
    ...(request?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)}:{})});
  const data=await response.json(); if(!response.ok)throw new Error(`HTTP ${response.status}: ${data.error||response.statusText}`); return data;
}
const run=(name,args,input)=>execFileSync(name,args,{encoding:'utf8',input,timeout:15000,windowsHide:true}).trim();
console.log(`Innoforce · Проверка перед занятием\n${report.system.os} ${report.system.arch} · ОЗУ ${report.system.ram_gib} ГиБ`);
await check('Node.js',async()=>{
  if(+process.versions.node.split('.')[0]<24)throw new Error(`Установлен ${process.version}. Для курса нужен Node.js 24 LTS или новее.`);
  return process.version;
});
await check('Ollama CLI',async()=>run('ollama',['--version']));
await check('curl',async()=>{
  const command=platform()==='win32'?'curl.exe':'curl';
  const version=run(command,['--version']).split(/\r?\n/)[0];
  const response=JSON.parse(run(command,['--fail','--max-time','5','-sS',base+'/api/version']));
  return `${version}; HTTP-сервер отвечает, Ollama ${response.version}`;
});
await check('jq',async()=>{
  const version=run('jq',['--version']);
  if(run('jq',['-r','.ready'],'{"ready":true}')!=='true')throw new Error('jq не разобрал проверочный JSON.');
  return version+'; JSON разобран';
});
const downloaded=await check('Модель на диске',async()=>{
  const found=(await api('/api/tags')).models.find(m=>m.name===model);
  if(!found)throw new Error(`Выполните ollama pull ${model}, затем повторите проверку.`);
  report.model={name:found.name,digest:found.digest,bytes:found.size}; return `${model}; ${(found.size/10**9).toFixed(2)} ГБ`;
});
if(downloaded){
  const answered=await check('Короткий ответ на CPU',async()=>{
    const started=performance.now();
    const data=await api('/api/chat',{model,messages:[{role:'user',content:'Ответь одним словом: столица Казахстана?'}],stream:false,think:false,keep_alive:'1m',options:{num_gpu:0,num_ctx:2048,num_predict:24,temperature:0}});
    const content=data.message?.content?.trim();
    if(!content||data.done!==true||data.done_reason==='length')throw new Error('Не получен законченный текстовый ответ. Покажите эту строку помощнику.');
    report.response={content,seconds:+((performance.now()-started)/1000).toFixed(2),done_reason:data.done_reason};
    return `${JSON.stringify(content)}; ${report.response.seconds} с`;
  });
  if(answered)await check('Размещение модели',async()=>{
    const loaded=(await api('/api/ps')).models.find(m=>m.name===model);
    if(!loaded||loaded.size_vram!==0)throw new Error('Запрос выполнен, но CPU не подтверждён. Помощнику нужно проверить ollama ps.');
    report.loaded={context_length:loaded.context_length,size_vram:loaded.size_vram};
    return `CPU подтверждён; окно ${loaded.context_length} токенов`;
  });
}
report.ready=report.checks.every(c=>c.ok)&&report.checks.some(c=>c.name==='Размещение модели'&&c.ok);
const folder=join(tmpdir(),'tfw','innoforce-preflight'); await mkdir(folder,{recursive:true});
const filename=join(folder,`readiness-${Date.now()}.json`); await writeFile(filename,JSON.stringify(report,null,2),'utf8');
console.log(`\n${report.ready?'ГОТОВО К ПРАКТИКЕ':'ПРОВЕРКА НЕ ЗАВЕРШЕНА — нужна помощь'}\nОтчёт: ${filename}`);
console.log('Передайте Жансултану итог, ОС, ОЗУ и время ответа. Работа модели на этой машине проверена; скорость на других ноутбуках может отличаться.');
process.exitCode=report.ready?0:1;
