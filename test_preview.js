const fs = require('fs');
const vm = require('vm');
const save = JSON.parse(fs.readFileSync('/mnt/data/mode-atlas-save-2026-04-30(1).json','utf8'));
const store = new Map();
store.set('testModeResults', JSON.stringify([{id:'local1', mode:'reading', createdAt:'2026-01-01T00:00:00.000Z'}]));
store.set('testModeResultsUpdatedAt', String(Date.now()));
const ctx = {
  console,
  navigator:{onLine:true},
  location:{protocol:'http:', pathname:'/results/'},
  document:{readyState:'complete', addEventListener(){}, querySelectorAll(){return[];}},
  window:{ModeAtlasEnv:{canUseFirebase:false}, KANA_FIREBASE_CONFIG:null, addEventListener(){}, dispatchEvent(){}},
  localStorage:{
    getItem:k=>store.has(k)?store.get(k):null,
    setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k),
    key:i=>Array.from(store.keys())[i]||null,
    get length(){return store.size;}
  },
  CustomEvent:function(name,opts){ return {name, ...opts}; },
  setTimeout, clearTimeout, Promise
};
ctx.window.window=ctx.window; ctx.window.localStorage=ctx.localStorage; ctx.window.document=ctx.document; ctx.window.navigator=ctx.navigator; ctx.window.location=ctx.location;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('/mnt/data/import_modal_work/cloud-sync.js','utf8'), ctx);
const preview = ctx.window.KanaCloudSync.previewLocalBackup(save);
console.log(preview.sections.find(s=>s.name==='readingTests'));
ctx.window.KanaCloudSync.importLocalBackup(save).then(()=>{
  const arr = JSON.parse(store.get('testModeResults')||'[]');
  console.log('imported', arr.length);
}).catch(e=>{console.error(e); process.exit(1);});
