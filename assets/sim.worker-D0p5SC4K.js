(function(){"use strict";const p={dist:(l,t)=>Math.sqrt((l.x-t.x)**2+(l.y-t.y)**2),distSq:(l,t)=>(l.x-t.x)**2+(l.y-t.y)**2,normalize:l=>{const t=Math.sqrt(l.x*l.x+l.y*l.y);return t===0?{x:0,y:0}:{x:l.x/t,y:l.y/t}},dot:(l,t)=>l.x*t.x+l.y*t.y,angleBetween:(l,t)=>{const e=p.dot(p.normalize(l),p.normalize(t));return Math.acos(Math.max(-1,Math.min(1,e)))},sub:(l,t)=>({x:l.x-t.x,y:l.y-t.y}),add:(l,t)=>({x:l.x+t.x,y:l.y+t.y}),mul:(l,t)=>({x:l.x*t,y:l.y*t}),limit:(l,t)=>{const e=l.x*l.x+l.y*l.y;if(e>t*t){const i=Math.sqrt(e);return{x:l.x/i*t,y:l.y/i*t}}return l},seek:(l,t,e)=>{const i={x:t.x-l.x,y:t.y-l.y},s=Math.sqrt(i.x*i.x+i.y*i.y);if(s===0)return{x:0,y:0};const o={x:i.x/s,y:i.y/s};return{x:o.x*e,y:o.y*e}}},X={NAME_INHERITANCE_CHANCE:.05,FIRST_NAME_SYLLABLES_MIN:2,FIRST_NAME_SYLLABLES_RANGE:2,SURNAME_SYLLABLES_MIN:2,SURNAME_SYLLABLES_RANGE:2},Q={plosives:["p","t","k","b","d","g","pr","tr"],fricatives:["s","f","v","th","sh","z","h"],nasals:["m","n","gn","ny"],vowels:["a","e","i","o","u","y"]},gt=["ae","ou","ai","ea"],St=["m","n","t","k","l","sh","th"],nt={NOBILITY_MATING_THRESHOLD:10,NOBILITY_AGE_THRESHOLD_DAYS:1,PROLIFIC_MATING_THRESHOLD:5},F={PIXELS_PER_METER:20,CM_TO_M:.01},N={FPS:60,HOURS_PER_DAY:24,DAYS_PER_SEASON:20,SEASONS_PER_CYCLE:4,FRAMES_PER_DAY:1800,FRAMES_PER_HOUR:75,COMM_COOLDOWN_TICKS:300},At={isHourlyTick:l=>l%N.FRAMES_PER_HOUR===0},rt={DAYS_TO_REMEMBER:12,TEMPORARY_MEMORY_LIMIT:200,PERSISTENT_MEMORY_LIMIT:200},V={PERCEPTION_COOLDOWN_TICKS:60,FOOD_MEMORY_ENERGY_THRESHOLD:100,MEMORY_CONFIDENCE_PENALTY:.8,FOOD_DESIRABILITY_DISTANCE_WEIGHT:1,MEMORY_PRUNING_RADIUS_METERS:15},_t={MUTATION_STRENGTH:.12,PHYSICAL_LIMITS:{speed:[.1,5],size:[2,150],metabolism:[.1,5],sight_range:[2,100],sight_fov:[.1,Math.PI*2],lifespan:[100,1e3*(3600*24)],audible_range:[1,20],communicating_range:[.5,10]}},P={INITIAL_ORGANISMS:20,INITIAL_FLORA:110,BLOOM_COUNT_MIN:10,BLOOM_COUNT_MAX:20,BIRTH_COST_BASE:25e3,INITIAL_ENERGY:[7e3,8e3],MATING_ENERGY_THRESHOLD:2e4,MATING_BOND_DURATION_HOURS:2.5},$={TRAIT_SURCHARGE_SPEED_WEIGHT:150,TRAIT_SURCHARGE_SIZE_WEIGHT:5,TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT:20,TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT:1,TRAIT_SURCHARGE_LIFESPAN_WEIGHT:1e-4},W={speed:[1.2,1.5],size:[75,85],metabolism:[.4,.5],sight_range:[15,18],sight_fov:[85*Math.PI/180,95*Math.PI/180],lifespan:[72e3,108e3],audible_range:[3.5,4.5],communicating_range:[2.5,3.5]},C={mToPx:l=>l*F.PIXELS_PER_METER,pxToM:l=>l/F.PIXELS_PER_METER,cmToPx:l=>l*F.CM_TO_M*F.PIXELS_PER_METER,toInternalSpeed:l=>l*F.PIXELS_PER_METER/N.FPS,toDisplaySpeed:l=>l*N.FPS/F.PIXELS_PER_METER,toDegrees:l=>l*180/Math.PI,toRadians:l=>l*Math.PI/180,toDays:l=>l/1800},L={createRandomGenome:l=>{const t={},e=(l==null?void 0:l.traitRanges)||W;return Object.keys(e).forEach(i=>{if(!e[i])return;const s=e[i],o=Math.random()*(s[1]-s[0])+s[0],r=o;t[i]={v1:o,v2:r,d1:Math.random(),d2:Math.random()}}),{traits:t}},express:l=>{const t={};return Object.keys(l.traits).forEach(e=>{const i=l.traits[e];t[e]=i.d1>=i.d2?i.v1:i.v2}),t},mutate:(l,t)=>{const e={},i=(t==null?void 0:t.traitRanges)||W,s=_t.MUTATION_STRENGTH,o=_t.PHYSICAL_LIMITS;return Object.keys(l.traits).forEach(r=>{const n=l.traits[r],d=i[r],a=o[r],c=_=>{const y=d[1]-d[0],v=(Math.random()*2-1)*s*y;return Math.max(a[0],Math.min(a[1],_+v))},f=_=>{const y=(Math.random()*2-1)*s*.5;return Math.max(0,Math.min(1,_+y))};e[r]={v1:c(n.v1),v2:c(n.v2),d1:f(n.d1),d2:f(n.d2)}}),{traits:e}},recombine:(l,t)=>{const e={};return Object.keys(l.traits).forEach(i=>{const s=l.traits[i],o=t.traits[i];e[i]={v1:Math.random()>.5?s.v1:o.v1,v2:Math.random()>.5?s.v2:o.v2,d1:Math.random()>.5?s.d1:o.d1,d2:Math.random()>.5?s.d2:o.d2}}),{traits:e}},ensureIntegrity:l=>{const t=W;Object.keys(t).forEach(e=>{if(!l.traits[e]){const i=t[e],s=Math.random()*(i[1]-i[0])+i[0];l.traits[e]={v1:s,v2:s,d1:Math.random(),d2:Math.random()}}})}},lt={organisms:"o",Flora:"f",position:"p",velocity:"v",expressedStats:"es",genome:"g",traits:"tr",memories:"m",id:"i",timestamp:"t",energy:"e",age:"a",generation:"gn",matingCount:"mc",matingTimer:"mt",matingTargetId:"mti",firstName:"fn",surname:"sn",name:"n",color:"c",bending:"b",parentId:"pi",parentA_Id:"pa",parentB_Id:"pb",growthState:"gs",complexity:"cx",lifetime:"lt",biome:"bm",type:"tp",config:"cfg",initialPopulation:"ip",initialEnergy:"ie",traitRanges:"trr"},It=Object.fromEntries(Object.entries(lt).map(([l,t])=>[t,l])),Z={STATE:"ales_sim_state",SETTINGS:"ales_settings"};class xt{constructor(){this.organisms=new Map,this.documents=[],this.settingsCache=new Map,this.eventsCache=[],this.dirtyOrganisms=new Set,this.surnameIndex=new Map,this.familyCountIndex=new Map,this.SAVE_DEBOUNCE_MS=1e3,this.saveTimeout=null,this.DB_NAME="ales_persistence_v2",this.DB_STORES={ORGANISMS:"organisms",EVENTS:"events",SYSTEM:"system"},this.DB_VERSION=1,this.dbPromise=null,this.isReady=!1,this.lastSaveMs=0,this.lastLoadMs=0,this.lastSaveOrgCount=0,this.saveCount=0,this.initDocs()}async init(){if(this.isReady)return;const t=performance.now();try{console.log("[VDB] Opening Database...");const e=await this.openDB();console.log("[VDB] Database opened. Fetching stores...");const[i,s,o]=await Promise.all([this.getAllFromStore(this.DB_STORES.SYSTEM),this.getAllFromStore(this.DB_STORES.ORGANISMS),this.getAllFromStore(this.DB_STORES.EVENTS)]);console.log(`[VDB] Stores fetched: System(${i.length}), Organisms(${s.length}), Events(${o.length})`),i.forEach(({key:r,value:n})=>{r===Z.SETTINGS&&Object.entries(n).forEach(([d,a])=>this.settingsCache.set(d,a))}),console.log("[VDB] Detokenizing organisms..."),s.forEach(({key:r,value:n})=>{try{const d=this.detokenize(n);this.organisms.set(d.id,d)}catch(d){console.error(`[VDB] Hydration Error: Failed to detokenize organism ${r}`,d)}}),console.log("[VDB] Refreshing indices..."),this.refreshIndices(),console.log("[VDB] Detokenizing events..."),this.eventsCache=this.detokenize(o.map(r=>r.value)),console.log("[VDB] Hydration complete.")}catch(e){console.warn("[VDB] init() failed, check IndexedDB state",e)}this.isReady=!0,this.lastLoadMs=performance.now()-t,console.log(`[VDB] Init complete in ${this.lastLoadMs.toFixed(1)}ms (${this.organisms.size} records)`)}getSetting(t,e){const i=this.settingsCache.get(t);return i!==void 0?i:e}setSetting(t,e){this.settingsCache.set(t,e);const i=Object.fromEntries(this.settingsCache);this.idbPut(this.DB_STORES.SYSTEM,Z.SETTINGS,i).catch(()=>{})}saveSimState(t){const e=()=>{var r;const i=performance.now(),s=this.tokenizeAndPrune(t),o=((r=t.organisms)==null?void 0:r.length)||0;this.idbPut(this.DB_STORES.SYSTEM,Z.STATE,s).then(()=>{this.lastSaveMs=performance.now()-i,this.lastSaveOrgCount=o,this.saveCount++,t.organisms&&this.syncLiving(t.organisms)}).catch(()=>{})};typeof window<"u"&&"requestIdleCallback"in window?window.requestIdleCallback(()=>e(),{timeout:2e3}):setTimeout(e,0)}tokenizeAndPrune(t){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(i=>this.tokenizeAndPrune(i));const e={};for(const i in t){if(i==="expressedStats"||i==="events")continue;const s=lt[i]||i;let o=t[i];i==="memories"&&Array.isArray(o)&&o.length>rt.PERSISTENT_MEMORY_LIMIT&&(o=o.slice(-200)),e[s]=this.tokenizeAndPrune(o)}return e}async loadSimState(){try{const t=await this.idbGet(this.DB_STORES.SYSTEM,Z.STATE);if(t){const e=this.detokenize(t);return e.events=this.eventsCache,e}}catch{return null}return null}syncLiving(t){t.forEach(e=>{const i=this.organisms.get(e.id);i?this.organisms.set(e.id,{...i,age:e.age,energy:e.energy,matingCount:e.matingCount,isAlive:!0}):(this.organisms.set(e.id,{...e,isAlive:!0,memories:[]}),this.updateIndicesFor(e)),this.dirtyOrganisms.add(e.id)}),this.debounceSave()}pushToHistory(t,e){const i=this.organisms.get(t);if(!i)return;i.memories||(i.memories=[]);const s=i.memories[i.memories.length-1];if(s&&e.content.includes("Energy")&&s.content.includes("Energy")){const r=s.content.match(/Harvested (\d+)x Energy/),n=r?parseInt(r[1]):1;s.content=`Harvested ${n+1}x Energy`,s.timestamp=Date.now()}else i.memories.some(r=>r.id===e.id)||i.memories.push(e);i.memories.length>200&&i.memories.shift(),this.dirtyOrganisms.add(t),this.debounceSave()}markDeceased(t,e){const i=this.organisms.get(t);i&&(e?this.organisms.set(t,{...e,isAlive:!1}):i.isAlive=!1,this.dirtyOrganisms.add(t),this.debounceSave())}addHistory(t){this.organisms.set(t.id,{...t,isAlive:!0}),this.updateIndicesFor(t),this.dirtyOrganisms.add(t.id),this.debounceSave()}getHistory(){return Array.from(this.organisms.values()).sort((t,e)=>e.generation-t.generation)}getFamilyCount(t,e){return this.familyCountIndex.get(`${t}_${e}`)||0}getEvents(){return this.eventsCache}getAssets(){return this.documents}debounceSave(){this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>this.flushDirty(),this.SAVE_DEBOUNCE_MS)}async flushDirty(){if(this.dirtyOrganisms.size===0)return;const e=(await this.openDB()).transaction(this.DB_STORES.ORGANISMS,"readwrite"),i=e.objectStore(this.DB_STORES.ORGANISMS),s=Array.from(this.dirtyOrganisms);this.dirtyOrganisms.clear(),s.forEach(o=>{const r=this.organisms.get(o);if(r){const n=this.tokenize({...r,lastSaved:Date.now()});i.put(n,o)}}),e.oncomplete=()=>{console.log(`[VDB] Atomic flush complete: ${s.length} records persisted.`)}}async saveEventsBatch(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(this.DB_STORES.EVENTS,"readwrite"),r=o.objectStore(this.DB_STORES.EVENTS);r.clear(),t.forEach((n,d)=>r.put(this.tokenize(n),d)),o.oncomplete=()=>i(),o.onerror=()=>s(o.error)})}openDB(){return this.dbPromise?this.dbPromise:(this.dbPromise=new Promise((t,e)=>{if(typeof indexedDB>"u")return e("No IndexedDB");const i=setTimeout(()=>{console.error("[VDB] openDB timeout — IndexedDB may be blocked by another tab."),e(new Error("IndexedDB open timeout"))},3e3),s=indexedDB.open(this.DB_NAME,this.DB_VERSION);s.onupgradeneeded=()=>{const o=s.result;Object.values(this.DB_STORES).forEach(r=>{o.objectStoreNames.contains(r)||o.createObjectStore(r)})},s.onsuccess=()=>{clearTimeout(i),t(s.result)},s.onerror=()=>{clearTimeout(i),e(s.error)},s.onblocked=()=>{console.warn("[VDB] IndexedDB blocked — close other tabs using this app."),clearTimeout(i),e(new Error("IndexedDB blocked"))}}).catch(t=>{throw this.dbPromise=null,t}),this.dbPromise)}async idbPut(t,e,i){const s=await this.openDB();return new Promise((o,r)=>{const n=s.transaction(t,"readwrite");n.objectStore(t).put(i,e),n.oncomplete=()=>o(),n.onerror=()=>r(n.error)})}async idbGet(t,e){const i=await this.openDB();return new Promise((s,o)=>{const n=i.transaction(t,"readonly").objectStore(t).get(e);n.onsuccess=()=>s(n.result??null),n.onerror=()=>o(n.error)})}async getAllFromStore(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(t,"readonly"),r=o.objectStore(t),n=r.getAll(),d=r.getAllKeys();o.oncomplete=()=>{const a=n.result,c=d.result;i(a.map((f,_)=>({key:c[_],value:f})))},o.onerror=()=>s(o.error)})}hardReset(){this.openDB().then(t=>{const e=t.transaction(Object.values(this.DB_STORES),"readwrite");Object.values(this.DB_STORES).forEach(i=>e.objectStore(i).clear())}),this.organisms.clear(),this.settingsCache.clear(),this.eventsCache=[],this.refreshIndices()}tokenize(t){if(Array.isArray(t))return t.map(e=>this.tokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=lt[i]||i;e[s]=this.tokenize(t[i])}return e}return t}detokenize(t){if(Array.isArray(t))return t.map(e=>this.detokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=It[i]||i;e[s]=this.detokenize(t[i])}return e}return t}updateIndicesFor(t){const e=this.surnameIndex.get(t.surname)||new Set;e.add(t.id),this.surnameIndex.set(t.surname,e);const i=`${t.firstName}_${t.surname}`;this.familyCountIndex.set(i,(this.familyCountIndex.get(i)||0)+1)}refreshIndices(){this.surnameIndex.clear(),this.familyCountIndex.clear(),this.organisms.forEach(t=>this.updateIndicesFor(t))}initDocs(){this.documents.push({id:"doc_genetics",type:"SYSTEM_DOC",timestamp:Date.now(),data:{title:"Genetic Expression: Standardized Units",content:"Trait values are expressed in metric units where applicable."}})}}const Y=new xt,ft=class ft{static generateSyllable(t,e,i){const s=(i==null?void 0:i.simplify)??!1,o=s?.08:e.prosody==="Fluid"?.22:e.prosody==="Angry"?.14:.08;let r=Q[t][Math.floor(Math.random()*Q[t].length)];if(e.phonotacticFilter&&r.length>2&&Math.random()>(s?.05:.35))return this.generateSyllable(t,e,i);s&&r.length>1&&Math.random()<.55&&(r=r[0]);const n=Math.random()<o?gt[Math.floor(Math.random()*gt.length)]:Q.vowels[Math.floor(Math.random()*Q.vowels.length)],d=s?.12:.2,a=Math.random()<d?St[Math.floor(Math.random()*St.length)]:"";return r+n+a}static constructWord(t,e,i){let s="";for(let o=0;o<t;o++){const r=o===0?e:"vowels";s+=this.generateSyllable(r,i,{simplify:o>0})}return s.charAt(0).toUpperCase()+s.slice(1)}static generatePhoneticName(t){const e={prosody:"Fluid",phonotacticFilter:!0};return this.constructWord(t,"plosives",e)}static generateFirstName(){const t=Math.floor(Math.random()*X.FIRST_NAME_SYLLABLES_RANGE)+X.FIRST_NAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static generateSurname(){const t=Math.floor(Math.random()*X.SURNAME_SYLLABLES_RANGE)+X.SURNAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static romanize(t){const e={M:1e3,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};let i="",s=t;for(let o in e)for(;s>=e[o];)i+=o,s-=e[o];return i}static constructFullLinguisticProfile(t,e){let i=this.generateFirstName(),s=this.generateSurname(),o="First of their lineage, born of the primal void.",r,n=!1;if(t&&(e?(s=Math.random()>.5?t.surname:e.surname,o=`Inherited the ${s} name from the union of ${t.firstName} and ${e.firstName}.`,(t.houseName||e.houseName)&&(r=t.houseName||e.houseName,n=!0)):(s=t.surname,o=`A direct sprout from the ${s} legacy of ${t.firstName}.`,r=t.houseName,n=t.isNoble||!1),Math.random()<X.NAME_INHERITANCE_CHANCE)){i=t.firstName,s=t.surname;const a=Y.getFamilyCount(i,s)+1,c=a>1?` ${this.romanize(a)}`:"";return{firstName:i,surname:s,name:`${i} ${s}${c}`,lineageDescription:c?`Named after their progenitor, ${t.firstName} ${t.surname}, carrying the weight of ${this.romanize(a)} generations.`:`A fresh branch from the ${s} vine.`,isNoble:n||t.isNoble,houseName:r}}return{firstName:i,surname:s,name:`${i} ${s}`,lineageDescription:o,isNoble:n,houseName:r}}static getTitle(t,e){if(t.isNoble)return"The Noble";if(t.age>e.meanAge*2)return"The Elder";if(t.expressedStats.speed>e.speed95th)return"The Swift";if(t.matingCount>nt.PROLIFIC_MATING_THRESHOLD)return"The Prolific"}static generateLexiconEntry(t,e){let i=1,s="plosives",o="Primitive";switch(t){case"Items":i=1,s="plosives",o="Primitive";break;case"Grammar":i=1,s="vowels",o="Primitive";break;case"Species":i=2,s="nasals",o="Abstract";break;case"Entities":i=2,s="plosives",o="Abstract";break;case"Locations":i=3,s="fricatives",o="Navigational";break;case"Places":i=4,s="fricatives",o="Complex";break}const r=this.constructWord(i,s,e),n={id:crypto.randomUUID(),word:r,ipa:`/${r.toLowerCase()}/`,category:t,complexity:o,timestamp:Date.now()};return this.lexicon.push(n),n}static applySemanticDrift(){}static constructPhrase(t){}};ft.lexicon=[];let q=ft;class J{constructor(t,e,i=50){this.cells=new Map,this.width=t,this.height=e,this.cellSize=i}getCellKey(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize);return e<<16|i}update(t){this.cells.clear();for(let e=0;e<t.length;e++){const i=t[e],s=this.getCellKey(i.position);this.cells.has(s)||this.cells.set(s,[]),this.cells.get(s).push(i.id)}}getNeighbors(t,e){const i=[],s=Math.floor((t.x-e)/this.cellSize),o=Math.floor((t.x+e)/this.cellSize),r=Math.floor((t.y-e)/this.cellSize),n=Math.floor((t.y+e)/this.cellSize);for(let d=s;d<=o;d++)for(let a=r;a<=n;a++){const c=d<<16|a,f=this.cells.get(c);f&&i.push(...f)}return i}}class Mt{constructor(t=Math.random()){this.p=new Array(512),this.permutation=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];for(let e=0;e<256;e++)this.p[e]=this.permutation[e],this.p[256+e]=this.permutation[e]}fade(t){return t*t*t*(t*(t*6-15)+10)}lerp(t,e,i){return e+t*(i-e)}grad(t,e,i,s){const o=t&15,r=o<8?e:i,n=o<4?i:o===12||o===14?e:s;return((o&1)===0?r:-r)+((o&2)===0?n:-n)}noise(t,e,i=0){const s=Math.floor(t)&255,o=Math.floor(e)&255,r=Math.floor(i)&255;t-=Math.floor(t),e-=Math.floor(e),i-=Math.floor(i);const n=this.fade(t),d=this.fade(e),a=this.fade(i),c=this.p[s]+o,f=this.p[c]+r,_=this.p[c+1]+r,y=this.p[s+1]+o,v=this.p[y]+r,g=this.p[y+1]+r;return this.lerp(a,this.lerp(d,this.lerp(n,this.grad(this.p[f],t,e,i),this.grad(this.p[v],t-1,e,i)),this.lerp(n,this.grad(this.p[_],t,e-1,i),this.grad(this.p[g],t-1,e-1,i))),this.lerp(d,this.lerp(n,this.grad(this.p[f+1],t,e,i-1),this.grad(this.p[v+1],t-1,e,i-1)),this.lerp(n,this.grad(this.p[_+1],t,e-1,i-1),this.grad(this.p[g+1],t-1,e-1,i-1))))}fbm(t,e,i=4){let s=0,o=1,r=1,n=0;for(let d=0;d<i;d++)s+=this.noise(t*o,e*o)*r,n+=r,r*=.5,o*=2;return s/n}}class pt{constructor(t,e,i=Math.random()){this.biomeScale=.002,this.cliffScale=.005,this.fertilityScale=.01,this.cliffThreshold=.65,this.gridRes=512,this.noise=new Mt(i),this.width=t,this.height=e,this.collisionGrid=new Uint8Array(this.gridRes*this.gridRes),this.precomputeCollisionGrid()}clamp01(t){return Math.max(0,Math.min(1,t))}precomputeCollisionGrid(){for(let t=0;t<this.gridRes;t++)for(let e=0;e<this.gridRes;e++){const i=e/this.gridRes*this.width,s=t/this.gridRes*this.height,o=this.noise.fbm(i*this.cliffScale,s*this.cliffScale,2);this.collisionGrid[t*this.gridRes+e]=o>this.cliffThreshold?1:0}}getBiomeAt(t,e){const i=this.noise.fbm(t*this.biomeScale,e*this.biomeScale,3);return this.noise.fbm(t*this.cliffScale,e*this.cliffScale,2)>this.cliffThreshold?"CLIFF":i>0?"GRASS":"ARID"}getFertilityAt(t,e){const i=this.getBiomeAt(t,e);if(i==="CLIFF")return 0;const s=this.clamp01((this.noise.fbm(t*this.biomeScale,e*this.biomeScale,3)+1)*.5),o=this.clamp01((this.noise.noise(t*this.fertilityScale,e*this.fertilityScale)+1)*.5),r=this.clamp01(s*.72+o*.28);return i==="GRASS"?r:r*.38}isImpassable(t,e){if(t<0||t>this.width||e<0||e>this.height)return!0;const i=Math.floor(t/this.width*(this.gridRes-1)),s=Math.floor(e/this.height*(this.gridRes-1));return this.collisionGrid[s*this.gridRes+i]===1}getSafeSpawnPos(){let t,e,i=0;do t=Math.random()*this.width,e=Math.random()*this.height,i++;while(this.isImpassable(t,e)&&i<100);return{x:t,y:e}}getBiomeColor(t,e,i){const s=this.noise.noise(e*.1,i*.1)*10;switch(t){case"GRASS":return`hsl(${100+s}, 45%, ${25+s}%)`;case"ARID":return`hsl(${35+s}, 35%, ${30+s}%)`;case"CLIFF":return`hsl(0, 0%, ${15+s}%)`;default:return"#000"}}}const G={MATURATION_DAYS_ESTIMATE:3.8,TRAIT_RANGES:{growth_speed_ratio:[.76,1.08],complexity:[2,12],stem_thickness:[.5,3.5],leaf_size:[10,50],persistence:[3,9],hue:[90,150],clump_radius:[1,3]},ECOLOGY:{HOURLY_RANDOM_SPAWN_CHANCE:.72,BIOME_GRASS_GROWTH:.29,BIOME_ARID_GROWTH:.36,LOW_DENSITY_FACILITATION:.12,FERTILITY_FACILITATION_BONUS:.16,FERTILITY_MATURATION_DRAG:.48,IDEAL_DENSITY_NEIGHBORS:2,FERTILE_DENSITY_BONUS:3,CROWDING_STALL_STRENGTH:.46,BIOMASS_SATURATION_STRENGTH:.82,MIN_STALL_MULTIPLIER:.1,PROXIMITY_DENSITY_BONUS:1.08,CLUSTER_SEARCH_RADIUS_METERS:1.2,CLUSTER_MIN_NEIGHBORS:1,CLUSTER_MAX_NEIGHBORS:4,CLUSTER_GROWTH_RATE:.18,SPREAD_FERTILITY_BONUS:.6,SPREAD_BIOMASS_THRESHOLD:2.6,SPREAD_CROWDING_PENALTY:.16,CLUSTER_SPAWN_DISTANCE_MIN:.1,CLUSTER_SPAWN_DISTANCE_MAX:.5,GLOBAL_TARGET_FLORA_MULTIPLIER:1.15,GLOBAL_OVERGROWTH_PENALTY:.55},THERMODYNAMICS:{NUTRIENT_BASE_MIN:360,MASS_TO_ENERGY_SCALAR:460,GROWTH_MASS_PENALTY:.02},generateGenome:()=>{const l=(I,S)=>I+Math.random()*(S-I),t=G.TRAIT_RANGES,e=l(t.growth_speed_ratio[0],t.growth_speed_ratio[1]),i=l(t.complexity[0],t.complexity[1]),s=l(t.stem_thickness[0],t.stem_thickness[1]),o=l(t.leaf_size[0],t.leaf_size[1]),r=l(t.persistence[0],t.persistence[1]),n=l(t.hue[0],t.hue[1]),d=l(t.clump_radius[0],t.clump_radius[1]),a=s*o*(i/6),c=1+a*G.THERMODYNAMICS.GROWTH_MASS_PENALTY,f=e/c,_=G.MATURATION_DAYS_ESTIMATE*N.HOURS_PER_DAY,y=Math.max(.28,f),v=_/y,g=Math.max(22e-5,1/v),A=Math.max(G.THERMODYNAMICS.NUTRIENT_BASE_MIN,a*G.THERMODYNAMICS.MASS_TO_ENERGY_SCALAR);return{traits:{structure:{v1:g,v2:i,d1:Math.random(),d2:Math.random()},vitality:{v1:A,v2:r,d1:Math.random(),d2:Math.random()},morphology:{v1:o,v2:n,d1:Math.random(),d2:Math.random()},ecology:{v1:d,v2:s,d1:Math.random(),d2:Math.random()}}}}};class Et{static update(t,e,i={}){const s=t.biome||e.getBiomeAt(t.position.x,t.position.y),o=i.fertility??t.fertility??e.getFertilityAt(t.position.x,t.position.y),r=i.nearbyCount??t.nearbyFloraCount??0,n=i.nearbyBiomass??t.localBiomass??0,d=G.ECOLOGY,a=d.IDEAL_DENSITY_NEIGHBORS+Math.round(o*d.FERTILE_DENSITY_BONUS);let c=1;s==="GRASS"?c=d.BIOME_GRASS_GROWTH*(1-o*d.FERTILITY_MATURATION_DRAG):s==="ARID"&&(c=d.BIOME_ARID_GROWTH);const f=d.LOW_DENSITY_FACILITATION+o*d.FERTILITY_FACILITATION_BONUS,_=r<=a?1+r*f:d.PROXIMITY_DENSITY_BONUS,y=Math.max(0,r-a),v=Math.max(d.MIN_STALL_MULTIPLIER,1/(1+y*d.CROWDING_STALL_STRENGTH)),g=a+1.25+o*1.5,A=Math.max(0,n-g),I=Math.max(d.MIN_STALL_MULTIPLIER,1/(1+A*d.BIOMASS_SATURATION_STRENGTH)),S=Math.max(.16,1-Math.pow(t.growthState,1.6)),x=c*_*v*I*(.34+S),H=t.genome.traits.structure.v1*x;t.fertility=o,t.localBiomass=n,t.nearbyFloraCount=r,t.growthState<1&&(t.growthState=Math.min(1,t.growthState+H)),t.lifetime!==void 0&&(t.lifetime=Math.max(0,t.lifetime-N.FRAMES_PER_HOUR))}}class ct{constructor(t){this.data=t}static create(t,e,i,s,o,r,n){const d=n(),a=d.traits.structure.v2,c=d.traits.vitality.v1,_=d.traits.vitality.v2*N.FRAMES_PER_DAY;return new ct({id:t,name:r,color:`hsl(${d.traits.morphology.v2}, 70%, 50%)`,position:e,energyValue:c,complexity:a,type:o,lifetime:_,genome:d,growthState:.1,nearbyFloraCount:0,localBiomass:0,fertility:0})}update(t){Et.update(this.data,t)}isExpired(){return this.data.lifetime!==void 0&&this.data.lifetime<=0}getExpressedTraits(){const t=this.data.genome.traits.structure.v1*24,e=1-this.data.growthState,i=Math.max(1,Math.ceil(e/t));return{growthRate:(t*100).toFixed(2)+"% / day",maturation:i+" days",complexity:Math.floor(this.data.complexity),nutrients:Math.floor(this.data.energyValue),leafSize:this.data.genome.traits.morphology.v1.toFixed(1),stemThickness:this.data.genome.traits.ecology.v2.toFixed(1),clumpRadius:this.data.genome.traits.ecology.v1.toFixed(1),hue:Math.floor(this.data.genome.traits.morphology.v2)}}}const Tt={calculateEnergyLoss:(l,t=0)=>{const e=Math.max(.01,l.speed),s=Math.max(0,Math.min(t,e))/e,o=.18;return 1/Math.max(.1,l.metabolism)*e*l.size*(o+s*(1-o))/N.FRAMES_PER_HOUR}};class Ct{constructor(t){this.data=t}update(t,e,i,s){const o=C.toDisplaySpeed(Math.sqrt(this.data.velocity.x**2+this.data.velocity.y**2)),r=Tt.calculateEnergyLoss(this.data.expressedStats,o);this.data.energy-=r,this.data.age++;const n=p.add(this.data.position,this.data.velocity);i.isImpassable(n.x,n.y)&&((n.x<0||n.x>e.x)&&(this.data.velocity.x*=-1),(n.y<0||n.y>e.y)&&(this.data.velocity.y*=-1),i.getBiomeAt(n.x,n.y)==="CLIFF"&&(this.data.velocity.x*=-1,this.data.velocity.y*=-1)),this.data.matingTimer&&this.data.matingTimer>0&&this.data.matingTimer--,this.data.memories=this.data.memories.filter(c=>t-c.timestamp<c.duration),this.data.velocity.x**2+this.data.velocity.y**2>.01&&(this.data.heading=p.normalize(this.data.velocity));const a=C.toInternalSpeed(this.data.expressedStats.speed);this.data.velocity=p.limit(this.data.velocity,a),this.data.position=p.add(this.data.position,this.data.velocity),this.data.position.x=Math.max(0,Math.min(e.x,this.data.position.x)),this.data.position.y=Math.max(0,Math.min(e.y,this.data.position.y))}applySteering(t){const i=C.toInternalSpeed(this.data.expressedStats.speed)*.1,s=p.limit(t,i);this.data.velocity=p.add(this.data.velocity,s)}calculateBending(t){const e=Math.atan2(this.data.velocity.y,this.data.velocity.x),i=p.add(this.data.velocity,t);let o=Math.atan2(i.y,i.x)-e;o>Math.PI&&(o-=Math.PI*2),o<-Math.PI&&(o+=Math.PI*2);const d=(this.data.bending||0)*.85+o*3.5;this.data.bending=Math.max(-1.5,Math.min(1.5,d))}}class Nt{static scan(t,e){const i=t.expressedStats,s=t.position,o=t.heading,r=C.cmToPx(i.size)*.8,n=[],d=[],a=i.sight_range,c=i.sight_fov/2;for(const g of e.flora){const A=p.dist(s,g.position),I=C.pxToM(A);if(A<=r)n.push(g);else if(I<=a){const S=p.normalize(p.sub(g.position,s));Math.acos(p.dot(o,S))<=c&&n.push(g)}}const f=[],_=[],y=i.audible_range,v=i.communicating_range;for(const g of e.organisms){if(g.id===t.id)continue;const A=p.dist(s,g.position),I=C.pxToM(A);if(A<=r)d.push(g);else if(I<=a){const S=p.normalize(p.sub(g.position,s));Math.acos(p.dot(o,S))<=c&&d.push(g)}I<=y&&f.push(g),I<=v&&_.push(g)}return{visibleFlora:n,visibleFauna:d,audibleFauna:f,communicatingFauna:_}}}class bt{constructor(t){this.data=t}addMemory(t,e,i,s,o){var v;const r=3*N.FRAMES_PER_HOUR,n=C.mToPx(this.data.expressedStats.sight_range),d=o==null?void 0:o.id;let a=this.data.memories.find(g=>{var A;return g.type===e&&(d&&g.data&&g.data.id===d||d&&((A=g.entityIds)==null?void 0:A.includes(d))||g.content===s&&p.dist(g.position,i)<8)});if(a){a.position={...i},t-a.timestamp;return}const c=this.data.memories.find(g=>g.type===e&&t-g.timestamp<r);if(c&&e==="Fauna"){const g=p.dist(c.position,i),A=g/n,I=1-Math.pow(A,.5);if((Math.random()<I||g<50)&&d&&!((v=c.entityIds)!=null&&v.includes(d))){c.entityIds=[...c.entityIds||[],d],c.count=c.entityIds.length,c.count>1&&(c.content=`${c.count} entities encountered`),c.timestamp=t,this.data.memories=[c,...this.data.memories.filter(S=>S.id!==(c==null?void 0:c.id))];return}}const f=N.FRAMES_PER_DAY*rt.DAYS_TO_REMEMBER,_=N.FRAMES_PER_HOUR*12,y=e==="Food"?Math.max(_,f/4):f;if(this.data.memories.push({id:Math.random().toString(36).substr(2,5),type:e,position:{...i},timestamp:t,duration:y,content:s,count:1,data:o,entityIds:o&&o.id?[o.id]:void 0,isFamiliar:o?o.isFamiliar:!1}),this.data.memories.length>rt.TEMPORARY_MEMORY_LIMIT){const g=this.data.memories.findIndex(S=>(S.count||0)<3&&!S.isFamiliar),A=g!==-1?g:0,I=this.data.memories[A];Y.pushToHistory(this.data.id,I),this.data.memories.splice(A,1)}}validateMemories(t,e,i){this.data.memories=this.data.memories.filter(s=>!((s.type==="Food"||s.type==="Flora")&&p.dist(i,s.position)<e&&!t.some(n=>p.dist(n.position,s.position)<12)))}removeMemory(t,e){this.data.memories=this.data.memories.filter(i=>{var o;return i.data&&i.data.id===t||((o=i.entityIds)==null?void 0:o.includes(t))?!!(e&&i.type!==e):!0})}getBestFoodLocation(){return this.data.memories.find(t=>t.type==="Food"||t.type==="Flora")||null}}class wt{constructor(t){this.me=t,this.memorySystem=new bt(t)}decide(t,e,i,s){var U,w;const o=Nt.scan(this.me,i);this.memorySystem.validateMemories(o.visibleFlora,C.mToPx(this.me.expressedStats.sight_range),this.me.position);const r=t,n=this.me.lastPerceptionTick||0,d=V.PERCEPTION_COOLDOWN_TICKS;r-n>=d&&(o.visibleFlora.forEach(u=>{u.energyValue>V.FOOD_MEMORY_ENERGY_THRESHOLD&&this.memorySystem.addMemory(t,"Food",u.position,u.name,{energy:u.energyValue,id:u.id})}),o.visibleFauna.forEach(u=>{const h=this.me.memories.some(m=>{var M;return((M=m.data)==null?void 0:M.id)===u.id&&m.isFamiliar});this.memorySystem.addMemory(t,"Fauna",u.position,u.name,{id:u.id,name:u.name,isFamiliar:h})}),this.me.lastPerceptionTick=r);const a=N.COMM_COOLDOWN_TICKS,c=this.me.lastVocalTick||0;if(r-c>=a&&o.communicatingFauna.length>0){let u=!1;o.communicatingFauna.forEach(h=>{const m=p.dist(this.me.position,h.position),M=C.pxToM(m),b=h.expressedStats.audible_range;if(M<=b){const O=this.me.memories.find(z=>z.type==="Food");O&&(h.memories.some(k=>k.type===O.type&&p.dist(k.position,O.position)<10)||(h.memories.push({...O,id:Math.random().toString(36).substr(2,5),timestamp:r,content:O.content,count:1}),h.isHearingActive=!0,this.memorySystem.addMemory(t,"Fauna",h.position,h.name,{id:h.id,name:h.name,isFamiliar:!0}),u=!0))}}),u&&(this.me.lastVocalTick=r,this.me.isTransmittingActive=!0)}let f={x:0,y:0};const _=C.toInternalSpeed(this.me.expressedStats.speed);C.toDisplaySpeed(Math.sqrt(this.me.velocity.x**2+this.me.velocity.y**2));const y=Tt.calculateEnergyLoss(this.me.expressedStats,this.me.expressedStats.speed),v=Math.max(2200,y*N.FRAMES_PER_DAY*1.25),g=this.me.energy>v,A=this.me.energy<v*.7;let I=null,S=-1,x=null,D=null;for(const u of o.visibleFlora){const h=p.dist(this.me.position,u.position),m=u.energyValue*u.growthState/(h+V.FOOD_DESIRABILITY_DISTANCE_WEIGHT);m>S&&(S=m,I=u.position,x=u,D=u.id)}const H=this.me.memories.filter(u=>u.type==="Food");for(const u of H){const h=p.dist(this.me.position,u.position),M=(((U=u.data)==null?void 0:U.energy)||500)*V.MEMORY_CONFIDENCE_PENALTY/(h+V.FOOD_DESIRABILITY_DISTANCE_WEIGHT);M>S&&(S=M,I=u.position,x=null,D=((w=u.data)==null?void 0:w.id)||null)}if(I){let u=x;u||(u=o.visibleFlora.find(M=>p.dist(M.position,I)<10)||null);const h=p.dist(this.me.position,I),m=C.cmToPx(this.me.expressedStats.size)*.8;if(u&&h<m)s.onEat(u),this.memorySystem.addMemory(t,"Flora",u.position,`Ate ${u.name}`,{energy:u.energyValue,id:u.id}),this.memorySystem.removeMemory(u.id,"Food");else{const M=C.cmToPx(this.me.expressedStats.size)*2;if(h<V.MEMORY_PRUNING_RADIUS_METERS&&!u&&!x&&D)return this.memorySystem.removeMemory(D,"Food"),{x:0,y:0};let b=_*(A?1:.78);h<M&&(b*=h/M);const O=p.normalize(p.sub(I,this.me.position)),z=p.mul(O,b);f=p.sub(z,this.me.velocity)}}else if(g){const u=t*.005,h=parseInt(this.me.id)||0,m=Math.sin(u+h)+Math.sin(u*.5+h),M=Math.cos(u+h)+Math.cos(u*.5+h),b=p.normalize({x:m,y:M}),O=_*(this.me.energy>v*1.75?.38:.24),z=Math.sqrt(this.me.velocity.x**2+this.me.velocity.y**2);let k={x:0,y:0};z<.03&&(k={x:(Math.random()-.5)*2.5,y:(Math.random()-.5)*2.5});const et=p.add(p.mul(b,O),k);f=p.sub(et,this.me.velocity)}else f=p.mul(this.me.velocity,-.18);if(this.me.energy>P.MATING_ENERGY_THRESHOLD&&this.me.matingTimer===0){const u=o.visibleFauna.find(h=>h.energy>P.MATING_ENERGY_THRESHOLD&&h.matingTimer===0&&h.id!==this.me.id);if(u){const h=p.dist(this.me.position,u.position),m=C.cmToPx(this.me.expressedStats.size)*1.5;if(h<m)return s.onMate(u),{x:0,y:0};{const M=p.normalize(p.sub(u.position,this.me.position)),b=p.mul(M,_*(A?.92:.75));f=p.add(f,p.sub(b,this.me.velocity))}}}return f}}class Ot extends Ct{constructor(t){super(t),this.brain=new wt(t)}update(t,e,i,s){super.update(t,e,i,s)}think(t,e,i,s,o,r){const n=this.data;n.isHearingActive=!1,n.isTransmittingActive=!1,t%60===0&&(n.title=q.getTitle(n,s),!n.isNoble&&(n.matingCount>nt.NOBILITY_MATING_THRESHOLD||n.age>nt.NOBILITY_AGE_THRESHOLD_DAYS*N.FRAMES_PER_DAY)&&(n.isNoble=!0,n.houseName=`House ${n.surname}`,n.lineageDescription=`Founder of the Noble ${n.houseName}.`));const d=this.brain.decide(t,e,o,r);this.applySteering(d),this.calculateBending(d)}}const Pt={processBirth:(l,t)=>{const e=t?L.recombine(l.genome,t.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})(),i=L.mutate(e),s=L.express(i),o=P.BIRTH_COST_BASE/2,r=s.speed*$.TRAIT_SURCHARGE_SPEED_WEIGHT+s.size*$.TRAIT_SURCHARGE_SIZE_WEIGHT+s.sight_range*$.TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT+s.sight_fov*$.TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT+s.lifespan*$.TRAIT_SURCHARGE_LIFESPAN_WEIGHT,n=o+r/2,d=f=>Math.min(1,1/f),a=n*d(l.expressedStats.metabolism),c=t?n*d(t.expressedStats.metabolism):a;return{childGenome:i,childStats:s,costToEachParent:n,initialEnergy:a+c,energyWasted:n*2-(a+c)}}},K=class K{constructor(t,e,i){this.lastId=0,this.floraGridDirty=!0,this.logicInstances=new Map,this.config={initialPopulation:P.INITIAL_ORGANISMS,initialEnergy:P.INITIAL_ENERGY,traitRanges:W};const s=i||null;s?(this.state={config:{...this.config},hour:0,day:0,season:1,cycle:1,events:[],apexCandidates:[],organisms:[],Flora:[],seed:Math.random(),...s},this.state.config.traitRanges={...W},this.state.config.initialEnergy=[...P.INITIAL_ENERGY],s.food&&(!this.state.Flora||this.state.Flora.length===0)&&(this.state.Flora=s.food),this.state.Flora&&this.state.Flora.forEach(n=>{n.growthState===void 0&&(n.growthState=.5),n.genome||(n.genome={traits:{structure:{v1:.001,v2:6,d1:.5,d2:.5},vitality:{v1:1200,v2:1e4,d1:.5,d2:.5},morphology:{v1:4,v2:120,d1:.5,d2:.5},ecology:{v1:20,v2:1.5,d1:.5,d2:.5}}})}),this.state.organisms&&this.state.organisms.forEach(n=>{(!n.genome||!n.genome.traits||Object.keys(n.genome.traits).length===0)&&(console.warn(`SimEngine: Healed CORRUPT genome for organism ${n.id}`,n.genome),n.genome=L.createRandomGenome(this.state.config)),L.ensureIntegrity(n.genome),n.expressedStats=L.express(n.genome),n.memories||(n.memories=[]),n.heading||(n.heading=p.normalize({x:Math.random()-.5,y:Math.random()-.5}))})):this.state={organisms:[],Flora:[],worldSize:{x:t,y:e},time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random()};const o=this.state.worldSize.x,r=this.state.worldSize.y;if(this.terrain=new pt(o,r,this.state.seed),this.orgGrid=new J(o,r,F.PIXELS_PER_METER),this.FloraGrid=new J(o,r,F.PIXELS_PER_METER),s){const n=(this.state.organisms||[]).map(a=>parseInt(a.id)).filter(a=>!isNaN(a)),d=(this.state.Flora||[]).map(a=>parseInt(a.id)).filter(a=>!isNaN(a));this.lastId=Math.max(0,...n,...d)}else this.init()}init(){for(let t=0;t<this.state.config.initialPopulation;t++)this.spawnOrganism();for(let t=0;t<P.INITIAL_FLORA;t++){const e=.4+Math.random()*.5;this.spawnFlora(void 0,void 0,e)}}hardReset(){Y.hardReset(),this.logicInstances.clear(),this.state={organisms:[],Flora:[],worldSize:this.state.worldSize,time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random(),lastResetTime:new Date().toISOString()},this.lastId=0,this.terrain=new pt(this.state.worldSize.x,this.state.worldSize.y),this.orgGrid=new J(this.state.worldSize.x,this.state.worldSize.y,F.PIXELS_PER_METER),this.FloraGrid=new J(this.state.worldSize.x,this.state.worldSize.y,F.PIXELS_PER_METER),this.init()}spawnOrganism(t,e,i,s,o){const r=o||(t?e?L.recombine(t.genome,e.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})():L.createRandomGenome(this.state.config)),n=L.express(r),d=q.generateFirstName(),a=t?e?Math.random()>.5?t.surname:e.surname:t.surname:q.generateSurname(),c={id:(++this.lastId).toString(),parentA_Id:t==null?void 0:t.id,parentB_Id:e==null?void 0:e.id,position:i||this.terrain.getSafeSpawnPos(),velocity:{x:(Math.random()-.5)*2,y:(Math.random()-.5)*2},heading:p.normalize({x:Math.random()-.5,y:Math.random()-.5}),energy:s!==void 0?s:t?400:this.state.config.initialEnergy[0]+Math.random()*(this.state.config.initialEnergy[1]-this.state.config.initialEnergy[0]),age:0,genome:r,expressedStats:n,color:t?t.color:`hsl(${Math.random()*360}, 70%, 60%)`,generation:t?t.generation+1:1,name:`${d} ${a}`,firstName:d,surname:a,matingTimer:0,matingCount:0,memories:[],timestamp:this.state.time,bending:0};typeof window<"u"?Y.addHistory(c):self.postMessage({type:"REGISTRY_LOG",data:c}),this.state.organisms.push(c),this.logEvent("BIRTH",t?`${c.name} born to ${t.surname} clan`:`Progenitor ${c.name} enters the world`,c.position,c.id,c.color)}spawnFlora(t,e="HERBIVORE",i){const s=t||this.terrain.getSafeSpawnPos(),o=ct.create(Math.random().toString(36).substr(2,9),s,0,0,e,"Fern",G.generateGenome);i!==void 0&&(o.data.growthState=Math.max(.3,i)),o.data.biome=this.terrain.getBiomeAt(s.x,s.y),this.state.Flora.push(o.data),this.floraGridDirty=!0}logEvent(t,e,i,s,o){this.state.events||(this.state.events=[]),this.state.events.unshift({id:Math.random().toString(36).substr(2,9),type:t,message:e,timestamp:this.state.time,position:{...i},entityId:s,color:o}),this.state.events.length>50&&this.state.events.pop()}forceSave(){this.state.events&&this.state.events.length>20&&(this.state.events=this.state.events.slice(0,20)),typeof window<"u"&&(Y.syncLiving(this.state.organisms),Y.saveSimState(this.state))}update(){this.state.time++;const t=At.isHourlyTick(this.state.time);this.state.time%600===0&&this.forceSave(),this.orgGrid.update(this.state.organisms),this.floraGridDirty&&(this.FloraGrid.update(this.state.Flora),this.floraGridDirty=!1);const e=new Map;this.state.organisms.forEach(a=>e.set(a.id,a));const i=new Map;this.state.Flora.forEach(a=>i.set(a.id,a)),this.state.hour=Math.floor(this.state.time%N.FRAMES_PER_DAY/N.FRAMES_PER_HOUR);const s=Math.floor(this.state.time/N.FRAMES_PER_DAY);this.state.day=s;const o=Math.floor(s/N.DAYS_PER_SEASON),r=this.state.season;if(this.state.season=o%N.SEASONS_PER_CYCLE+1,this.state.cycle=Math.floor(o/N.SEASONS_PER_CYCLE)+1,r!==this.state.season){const a=Math.floor(P.BLOOM_COUNT_MIN+Math.random()*(P.BLOOM_COUNT_MAX-P.BLOOM_COUNT_MIN));for(let c=0;c<a;c++)this.spawnFlora();this.logEvent("MILESTONE",`Season ${this.state.season} bloom: ${a} new flora emerged`,{x:this.state.worldSize.x/2,y:this.state.worldSize.y/2},void 0,"#4ade80")}if(t){const a=G.ECOLOGY,c=P.INITIAL_FLORA*a.GLOBAL_TARGET_FLORA_MULTIPLIER,f=Math.max(0,(this.state.Flora.length-c)/Math.max(1,c)),_=a.HOURLY_RANDOM_SPAWN_CHANCE*Math.max(.08,1-f*a.GLOBAL_OVERGROWTH_PENALTY);Math.random()<_&&this.spawnFlora();const y=C.mToPx(a.CLUSTER_SEARCH_RADIUS_METERS);this.state.Flora.forEach(v=>{const A=this.FloraGrid.getNeighbors(v.position,y).map(w=>i.get(w)).filter(w=>w!==void 0),I=Math.max(0,A.filter(w=>w.id!==v.id).length),S=Math.max(0,A.reduce((w,u)=>w+u.growthState,0)-v.growthState),x=this.terrain.getFertilityAt(v.position.x,v.position.y);Et.update(v,this.terrain,{nearbyCount:I,nearbyBiomass:S,fertility:x});const D=a.CLUSTER_MAX_NEIGHBORS+Math.round(x*a.FERTILE_DENSITY_BONUS),H=Math.max(0,S-a.SPREAD_BIOMASS_THRESHOLD),U=a.CLUSTER_GROWTH_RATE*Math.max(.18,v.growthState)*(1+x*a.SPREAD_FERTILITY_BONUS)*Math.max(.2,1-H*a.SPREAD_CROWDING_PENALTY);if(I>=a.CLUSTER_MIN_NEIGHBORS&&I<D&&Math.random()<U){const w=Math.random()*Math.PI*2,u=a.CLUSTER_SPAWN_DISTANCE_MIN+Math.random()*(a.CLUSTER_SPAWN_DISTANCE_MAX-a.CLUSTER_SPAWN_DISTANCE_MIN),h=C.mToPx(u),m={x:v.position.x+Math.cos(w)*h,y:v.position.y+Math.sin(w)*h};m.x>0&&m.x<this.state.worldSize.x&&m.y>0&&m.y<this.state.worldSize.y&&!this.terrain.isImpassable(m.x,m.y)&&this.terrain.getBiomeAt(m.x,m.y)!=="CLIFF"&&this.spawnFlora(m)}}),this.state.Flora=this.state.Flora.filter(v=>v.lifetime===void 0||v.lifetime>0)}if(this.state.time%60===0)if(this.state.organisms.length>0){const a=this.state.organisms.map(_=>_.age),c=a.reduce((_,y)=>_+y,0)/a.length,f=this.state.organisms.map(_=>_.expressedStats.speed).sort((_,y)=>_-y);K.lastPopStats={meanAge:c,speed95th:f[Math.floor(f.length*.95)]||0},this.state.apexCandidates=[...this.state.organisms].sort((_,y)=>y.generation-_.generation||y.energy-_.energy).slice(0,20)}else this.state.apexCandidates=[];const n=K.lastPopStats;this.state.organisms.forEach(a=>{let c=this.logicInstances.get(a.id);if(c||(c=new Ot(a),this.logicInstances.set(a.id,c)),a.matingTimer===0&&a.matingTargetId){const S=e.get(a.matingTargetId);if(S&&parseInt(a.id)<parseInt(S.id)){const x=Pt.processBirth(a,S);a.energy-=x.costToEachParent,S.energy-=x.costToEachParent,this.spawnOrganism(a,S,{...a.position},x.initialEnergy,x.childGenome),a.matingCount++,S.matingCount++}a.matingTargetId=void 0}const f=C.mToPx(a.expressedStats.sight_range),_=C.mToPx(a.expressedStats.audible_range||3),y=Math.max(f,_),g=this.FloraGrid.getNeighbors(a.position,f).map(S=>i.get(S)).filter(S=>S!==void 0),I=this.orgGrid.getNeighbors(a.position,y).map(S=>e.get(S)).filter(S=>S!==void 0&&S.id!==a.id);c.think(this.state.time,this.state.worldSize,this.terrain,n,{organisms:I,flora:g},{onEat:S=>{a.energy+=S.energyValue*Math.max(.35,S.growthState);const x=this.state.Flora.findIndex(D=>D.id===S.id);x!==-1&&(this.state.Flora.splice(x,1),this.floraGridDirty=!0)},onMate:S=>{if(a.matingTimer===0&&S.matingTimer===0){const x=P.MATING_BOND_DURATION_HOURS*N.FRAMES_PER_HOUR;a.matingTimer=x,a.matingTargetId=S.id,S.matingTimer=x,S.matingTargetId=a.id,this.logEvent("MILESTONE",`${a.name} & ${S.name} are bonding`,a.position)}}}),c.update(this.state.time,this.state.worldSize,this.terrain,n)}),this.state.organisms=this.state.organisms.filter(a=>{const c=a.age>a.expressedStats.lifespan||a.energy<=0;return c&&(this.logicInstances.delete(a.id),this.spawnFlora(a.position,"CARNIVORE"),typeof window<"u"?Y.markDeceased(a.id,a):self.postMessage({type:"REGISTRY_DEATH",id:a.id,data:a})),!c});const d=this.state.Flora.length;this.state.Flora=this.state.Flora.filter(a=>a.lifetime===void 0||a.lifetime>0),this.state.Flora.length!==d&&(this.floraGridDirty=!0)}};K.lastPopStats={meanAge:0,speed95th:0};let dt=K;function Dt(l){const t=l.expressedStats.speed/1.5,e=Ft(1-t,.2,1);return{primaryColor:l.color,skeletalRigidity:e}}function Ft(l,t,e){return Math.max(t,Math.min(e,l))}const R=class R{constructor(t){this.terrainInitialized=!1,this.colorCache=new Map,this.prevVelocities=new Map;const e=t.getContext("webgl2",{alpha:!1,antialias:!0,preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const i=e.getParameter(e.MAX_TEXTURE_SIZE);R.MAX_INSTANCES=Math.max(2048,Math.min(8192,i||8192)),this.orgDataBuffer=new Float32Array(R.MAX_INSTANCES*4*5),this.floraDataBuffer=new Float32Array(R.MAX_INSTANCES*4*2),this.program=this.createProgram(R.VERT_SHADER,R.FRAG_SHADER),this.faunaProgram=this.createProgram(R.FAUNA_VERT_SHADER,R.FAUNA_FRAG_SHADER),this.floraProgram=this.createProgram(R.FLORA_VERT_SHADER,R.FLORA_FRAG_SHADER),this.quadBuffer=this.createQuad(),this.faunaUnitQuadBuffer=this.createQuad(),this.floraUnitQuadBuffer=this.createQuad(),this.instanceIDBuffer=this.gl.createBuffer();const s=new Int32Array(R.MAX_INSTANCES);for(let o=0;o<R.MAX_INSTANCES;o++)s[o]=o;this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.instanceIDBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,s,this.gl.STATIC_DRAW),this.orgTexture=this.createDataTexture(R.MAX_INSTANCES,5),this.floraTexture=this.createDataTexture(R.MAX_INSTANCES,2),this.terrainTexture=e.createTexture()}createShader(t,e){const i=this.gl.createShader(t);if(this.gl.shaderSource(i,e),this.gl.compileShader(i),!this.gl.getShaderParameter(i,this.gl.COMPILE_STATUS))throw new Error("Shader compile error: "+this.gl.getShaderInfoLog(i));return i}createProgram(t,e){const i=this.createShader(this.gl.VERTEX_SHADER,t),s=this.createShader(this.gl.FRAGMENT_SHADER,e),o=this.gl.createProgram();if(this.gl.attachShader(o,i),this.gl.attachShader(o,s),this.gl.linkProgram(o),!this.gl.getProgramParameter(o,this.gl.LINK_STATUS))throw new Error("Program link error: "+this.gl.getProgramInfoLog(o));return o}createQuad(){const t=this.gl.createBuffer();return this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),t}createDataTexture(t,e){const i=this.gl,s=i.createTexture();return i.bindTexture(i.TEXTURE_2D,s),i.texImage2D(i.TEXTURE_2D,0,i.RGBA32F,t,e,0,i.RGBA,i.FLOAT,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.NEAREST),s}static parseHSL(t){const e=t.match(/hsl\((\d+\.?\d*),\s*(\d+)%,\s*(\d+)%\)/);if(!e)return[.5,.5,.5];const i=parseFloat(e[1])/360,s=parseInt(e[2])/100,o=parseInt(e[3])/100,r=(a,c,f)=>(f<0&&(f+=1),f>1&&(f-=1),f<1/6?a+(c-a)*6*f:f<1/2?c:f<2/3?a+(c-a)*(2/3-f)*6:a),n=o<.5?o*(1+s):o+s-o*s,d=2*o-n;return[r(d,n,i+1/3),r(d,n,i),r(d,n,i-1/3)]}updateTerrainTexture(t,e){const i=this.gl,s=512,o=new Uint8Array(s*s*4);for(let r=0;r<s;r++)for(let n=0;n<s;n++){const d=t.getBiomeAt(n/s*e.x,r/s*e.y),a=(r*s+n)*4;d==="GRASS"?o[a]=255:d==="CLIFF"&&(o[a]=127,o[a+1]=255),o[a+3]=255}i.bindTexture(i.TEXTURE_2D,this.terrainTexture),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,s,s,0,i.RGBA,i.UNSIGNED_BYTE,o),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),this.terrainInitialized=!0}render(t){const e=this.gl,i=1/t.zoom,s=(0-t.cameraOffset[0])*i-100,o=(t.logicalResolution[0]-t.cameraOffset[0])*i+100,r=(0-t.cameraOffset[1])*i-100,n=(t.logicalResolution[1]-t.cameraOffset[1])*i+100,d=t.organisms.filter(h=>h.position.x>s&&h.position.x<o&&h.position.y>r&&h.position.y<n),a=t.Flora.filter(h=>h.position.x>s&&h.position.x<o&&h.position.y>r&&h.position.y<n);e.viewport(0,0,t.resolution[0],t.resolution[1]);const c=this.orgDataBuffer;c.fill(0);const f=Math.min(d.length,R.MAX_INSTANCES),_=new Map;for(let h=0;h<f;h++)_.set(d[h].id,h);for(let h=0;h<f;h++){const m=d[h],M=Dt(m);let b=this.colorCache.get(m.id);b||(b=R.parseHSL(M.primaryColor),this.colorCache.set(m.id,b));const[O,z,k]=b,et=C.cmToPx(m.expressedStats.size),it=h*4;c[it]=m.position.x,c[it+1]=m.position.y,c[it+2]=et*.4,c[it+3]=et*.2;const st=(R.MAX_INSTANCES+h)*4;c[st]=O,c[st+1]=z,c[st+2]=k,c[st+3]=parseFloat(m.id);const ot=(R.MAX_INSTANCES*2+h)*4;c[ot]=m.velocity.x,c[ot+1]=m.velocity.y,c[ot+2]=m.expressedStats.sight_fov,c[ot+3]=m.id===t.selectedId?1:0;const at=(R.MAX_INSTANCES*3+h)*4;c[at]=(m.bending||0)*M.skeletalRigidity;let vt=-1;if(m.matingTimer&&m.matingTimer>0&&m.matingTargetId){const Rt=_.get(m.matingTargetId);Rt!==void 0&&(vt=Rt)}c[at+1]=vt,c[at+2]=C.mToPx(m.expressedStats.sight_range),c[at+3]=C.mToPx(m.expressedStats.audible_range||3)+(m.isHearingActive?1e4:0);const j=(R.MAX_INSTANCES*4+h)*4;c[j]=C.mToPx(m.expressedStats.communicating_range||1.5)+(m.isTransmittingActive?1e4:0);const Lt=m.energy>28e3?1:0,Bt=m.matingTimer&&m.matingTimer>0?m.matingTimer/120:0;c[j+1]=Lt+Bt,c[j+2]=Math.min(1,m.energy/3e4);const ut=this.prevVelocities.get(m.id);ut?c[j+3]=(ut.x*m.velocity.y-ut.y*m.velocity.x)*5:c[j+3]=0}for(let h=0;h<f;h++){const m=d[h];this.prevVelocities.set(m.id,{x:m.velocity.x,y:m.velocity.y})}e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,R.MAX_INSTANCES,5,e.RGBA,e.FLOAT,c);const y=this.floraDataBuffer;y.fill(0);const v=Math.min(a.length,R.MAX_INSTANCES);for(let h=0;h<v;h++){const m=a[h],M=h*4;y[M]=m.position.x,y[M+1]=m.position.y,y[M+2]=m.growthState,y[M+3]=m.complexity;const b=(R.MAX_INSTANCES+h)*4,O=R.parseHSL(m.color);y[b]=O[0],y[b+1]=O[1],y[b+2]=O[2],y[b+3]=parseFloat(m.id)}e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,R.MAX_INSTANCES,2,e.RGBA,e.FLOAT,y),e.useProgram(this.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.terrainTexture);const g=(h,m,M)=>e.uniform1f(e.getUniformLocation(h,m),M),A=(h,m,M,b)=>e.uniform2f(e.getUniformLocation(h,m),M,b),I=h=>{A(h,"u_logicalResolution",t.logicalResolution[0],t.logicalResolution[1]),A(h,"u_cameraOffset",t.cameraOffset[0],t.cameraOffset[1]),g(h,"u_zoom",t.zoom),g(h,"u_time",t.time/N.FPS),g(h,"u_selectedId",t.selectedId?parseFloat(t.selectedId):-1),g(h,"u_hoveredId",t.hoveredId?parseFloat(t.hoveredId):-1)};I(this.program),A(this.program,"u_resolution",t.resolution[0],t.resolution[1]),A(this.program,"u_worldSize",t.worldSize[0],t.worldSize[1]),g(this.program,"u_showVision",t.showVision?1:0),g(this.program,"u_showHearing",t.showHearing?1:0),g(this.program,"u_showCommunication",t.showCommunication?1:0),g(this.program,"u_showGrid",t.showGrid?1:0),e.uniform1i(e.getUniformLocation(this.program,"u_orgTexture"),0),e.uniform1i(e.getUniformLocation(this.program,"u_terrainTexture"),1),e.uniform1i(e.getUniformLocation(this.program,"u_orgCount"),f);const S=t.organisms.find(h=>h.id===t.selectedId),x=t.organisms.find(h=>h.id===t.hoveredId);A(this.program,"u_selectedPos",S?S.position.x:-1e3,S?S.position.y:-1e3),g(this.program,"u_selectedSize",S?C.cmToPx(S.expressedStats.size)*.5:0),A(this.program,"u_hoveredPos",x?x.position.x:-1e3,x?x.position.y:-1e3),g(this.program,"u_hoveredSize",x?C.cmToPx(x.expressedStats.size)*.5:0),e.bindBuffer(e.ARRAY_BUFFER,this.quadBuffer);const D=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(D),e.vertexAttribPointer(D,2,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLES,0,6),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.useProgram(this.faunaProgram),I(this.faunaProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.uniform1i(e.getUniformLocation(this.faunaProgram,"u_orgTexture"),0),g(this.faunaProgram,"u_showVision",t.showVision?1:0),g(this.faunaProgram,"u_showHearing",t.showHearing?1:0),g(this.faunaProgram,"u_showCommunication",t.showCommunication?1:0),e.bindBuffer(e.ARRAY_BUFFER,this.faunaUnitQuadBuffer);const H=e.getAttribLocation(this.faunaProgram,"a_unitPosition");e.enableVertexAttribArray(H),e.vertexAttribPointer(H,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const U=e.getAttribLocation(this.faunaProgram,"a_instanceID");e.enableVertexAttribArray(U),e.vertexAttribIPointer(U,1,e.INT,0,0),e.vertexAttribDivisor(U,1),e.drawArraysInstanced(e.TRIANGLES,0,6,f),e.useProgram(this.floraProgram),I(this.floraProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.uniform1i(e.getUniformLocation(this.floraProgram,"u_floraTexture"),0),e.bindBuffer(e.ARRAY_BUFFER,this.floraUnitQuadBuffer);const w=e.getAttribLocation(this.floraProgram,"a_unitPosition");e.enableVertexAttribArray(w),e.vertexAttribPointer(w,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const u=e.getAttribLocation(this.floraProgram,"a_instanceID");e.enableVertexAttribArray(u),e.vertexAttribIPointer(u,1,e.INT,0,0),e.vertexAttribDivisor(u,1),e.drawArraysInstanced(e.TRIANGLES,0,6,v),e.disableVertexAttribArray(u),e.vertexAttribDivisor(u,0),e.disable(e.BLEND)}};R.MAX_INSTANCES=2048,R.VERT_SHADER=`#version 300 es
        in vec2 a_position;
        out vec2 v_texCoord;
        void main() {
            v_texCoord = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `,R.FRAG_SHADER=`#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 outColor;

        uniform vec2 u_resolution;
        uniform vec2 u_logicalResolution;
        uniform vec2 u_worldSize;
        uniform vec2 u_cameraOffset;
        uniform float u_zoom;
        uniform float u_time;
        uniform float u_dpr;
        
        uniform vec2 u_selectedPos;
        uniform float u_selectedSize;
        uniform float u_selectedId;
        uniform vec2 u_hoveredPos;
        uniform float u_hoveredSize;
        uniform float u_hoveredId;
        uniform float u_isFollowing;
        uniform float u_showVision;
        uniform float u_showHearing;
        uniform float u_showCommunication;
        uniform float u_showGrid;
        
        uniform sampler2D u_orgTexture;
        uniform int u_orgCount;
        
        uniform sampler2D u_terrainTexture;

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
            vec2 pa = p - a, ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * h) - r;
        }
        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }
        vec2 rotate(vec2 v, vec2 dir) {
            dir = normalize(dir);
            return vec2(v.x * dir.x - v.y * dir.y, v.x * dir.y + v.y * dir.x);
        }
        float sdHexagon(vec2 p, float r) {
            const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
            p = abs(p);
            p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
            p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
            return length(p) * sign(p.y);
        }

        void main() {
            vec2 fragCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_logicalResolution;
            vec2 worldCoord = (fragCoord - u_cameraOffset) / u_zoom;
            
            vec2 terrainUV = vec2(worldCoord.x / u_worldSize.x, 1.0 - worldCoord.y / u_worldSize.y);
            vec4 terrainData = texture(u_terrainTexture, terrainUV);
            
            vec3 background = terrainData.g > 0.8 ? vec3(0.1) : mix(vec3(0.25, 0.2, 0.1), vec3(0.12, 0.25, 0.15), terrainData.r);
            if (worldCoord.x < 0.0 || worldCoord.x > u_worldSize.x || worldCoord.y < 0.0 || worldCoord.y > u_worldSize.y) background = vec3(0.002, 0.004, 0.003);

            vec4 resColor = vec4(background, 1.0); 
            if (u_showGrid > 0.5) {
                vec2 gridUV = fract(worldCoord / 20.0);
                resColor.rgb += vec3(0.1, 0.2, 0.15) * (smoothstep(0.02, 0.0, abs(gridUV.x - 0.5)) + smoothstep(0.02, 0.0, abs(gridUV.y - 0.5))) * 0.2;
            }

            // --- JELLY BODY SDF (Global smin REMOVED for Performance) ---
            // The O(Pixels * Count) loop was causing massive lag at high populations.
            // Body rendering is now handled entirely in the instanced FAUNA_FRAG_SHADER (Pass 2).
            
            outColor = vec4(resColor.rgb, 1.0);
        }
    `,R.FAUNA_VERT_SHADER=`#version 300 es
        // === GPGPU FAUNA VERTEX SHADER ===
        // Reactive trailing jelly stretch + side-to-side jiggle
        in vec2 a_unitPosition;
        in int a_instanceID;

        out vec2 v_localCoord;
        out float v_id;
        flat out int v_instanceID;
        out vec2 v_worldCenter;

        uniform sampler2D u_orgTexture;
        uniform vec2 u_cameraOffset;
        uniform float u_zoom;
        uniform vec2 u_logicalResolution;
        uniform float u_time;

        void main() {
            float maxInst = ${R.MAX_INSTANCES}.0;
            float tx = (float(a_instanceID) + 0.5) / maxInst;
            vec4 d1 = texture(u_orgTexture, vec2(tx, 0.1)); 
            vec2 pos = d1.xy;
            float size = d1.z;
            float skeletalLength = d1.w;

            vec4 d3 = texture(u_orgTexture, vec2(tx, 0.5));
            vec2 vel = d3.xy;

            vec4 d4 = texture(u_orgTexture, vec2(tx, 0.7));
            float sightRange = d4.z;
            float audibleRange = d4.w;
            vec4 d5 = texture(u_orgTexture, vec2(tx, 0.9));
            float commRange = d5.x;

            float maxSense = max(sightRange, max(audibleRange, commRange));
            float bodyBound = size + skeletalLength + 15.0;
            // Tighten quad when zoomed out to curb overdraw from sensory auras
            float senseMask = step(0.35, u_zoom); // 0 when far zoomed out
            float quadSize = max(bodyBound + 10.0, mix(bodyBound, maxSense, senseMask)) + 10.0;

            // --- REACTIVE TRAILING STRETCH ---
            float spd = length(vel);
            vec2 moveDir = spd > 0.001 ? normalize(vel) : vec2(1.0, 0.0);
            
            // Push trailing vertices BACK (away from moveDir)
            float stretchAmount = min(spd * 1.2, 4.5); 
            vec2 stretchedPos = a_unitPosition * quadSize;
            float projLen = dot(a_unitPosition, moveDir);
            
            // Only affect trailing half (projLen < 0)
            stretchedPos -= moveDir * stretchAmount * max(-projLen, 0.0) * 1.5;

            // --- SIDE-TO-SIDE JIGGLE ---
            // Oscillation frequency and amplitude scale with speed
            float jiggleFreq = 6.0 + spd * 10.0; 
            float jiggleAmp = 0.2 + spd * 0.6;
            float wobble = sin(u_time * jiggleFreq + float(a_instanceID) * 1.618) * jiggleAmp;
            vec2 perpDir = vec2(-moveDir.y, moveDir.x);
            stretchedPos += perpDir * wobble;

            v_localCoord = stretchedPos;
            v_id = texture(u_orgTexture, vec2(tx, 0.3)).w;
            v_instanceID = a_instanceID;
            v_worldCenter = pos;

            vec2 worldPos = pos + v_localCoord;
            vec2 screenPos = worldPos * u_zoom + u_cameraOffset;
            vec2 clipPos = (screenPos / u_logicalResolution) * 2.0 - 1.0;
            gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
        }
    `,R.FAUNA_FRAG_SHADER=`#version 300 es
        // === GPGPU FAUNA FRAGMENT SHADER ===
        // Inertial warp + smooth mating fusion + GPU visuals
        precision highp float;
        in vec2 v_localCoord;
        in float v_id;
        flat in int v_instanceID;
        in vec2 v_worldCenter;
        
        out vec4 outColor;

        uniform sampler2D u_orgTexture;
        uniform float u_time;
        uniform float u_zoom;
        uniform float u_selectedId;
        uniform float u_hoveredId;
        uniform float u_showVision;
        uniform float u_showHearing;
        uniform float u_showCommunication;
        uniform sampler2D u_terrainTexture;

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
            vec2 pa = p - a, ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            return length(pa - ba * h) - r;
        }
        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }
        vec2 rotate(vec2 v, vec2 dir) {
            dir = normalize(dir);
            return vec2(v.x * dir.x - v.y * dir.y, v.x * dir.y + v.y * dir.x);
        }

        void main() {
            float maxInst = ${R.MAX_INSTANCES}.0;
            float tx = (float(v_instanceID) + 0.5) / maxInst;
            vec4 d1 = texture(u_orgTexture, vec2(tx, 0.1));
            vec2 pos = d1.xy;
            float size = d1.z;
            float skeletalLength = d1.w;
            
            vec4 d2 = texture(u_orgTexture, vec2(tx, 0.3));
            vec3 col = d2.rgb;
            float id = d2.w;
            
            vec4 d3 = texture(u_orgTexture, vec2(tx, 0.5));
            vec2 vel = d3.xy;
            float fov = d3.z;
            float isSelected = d3.w;

            vec4 d4 = texture(u_orgTexture, vec2(tx, 0.7));
            float bending = d4.x;
            float mateIndex = d4.y;
            float sightRange = d4.z;
            float rawAudible = d4.w;
            float isHearingActive = step(10000.0, rawAudible);
            float audibleRange = mod(rawAudible, 10000.0);

            vec4 d5 = texture(u_orgTexture, vec2(tx, 0.9));
            float rawComm = d5.x;
            float isTransmittingActive = step(10000.0, rawComm);
            float commRange = mod(rawComm, 10000.0);
            // Unpack: d5.y = [isNoble (integer)] + [matingFactor (fractional)]
            float isNoble = floor(d5.y);
            float matingFactor = fract(d5.y);
            float energyNorm = d5.z;
            float turnForce = d5.w;

            float glowIntensity = mix(0.65, 1.8, clamp(energyNorm * 1.5, 0.0, 1.0));
            vec2 dir = length(vel) > 0.001 ? normalize(vel) : vec2(1.0, 0.0);
            
            vec3 finalCol = vec3(0.0);
            float finalAlpha = 0.0;
            float dist = length(v_localCoord);

            // --- SENSORY OVERLAYS ---
            if (u_zoom > 0.35 && u_showVision > 0.5 && dist < sightRange) {
                vec2 rel = normalize(v_localCoord);
                float angle = acos(clamp(dot(rel, dir), -1.0, 1.0));
                if (angle < fov * 0.5) {
                    float intensity = 0.25 * (1.0 - dist / sightRange);
                    finalCol += col * intensity;
                    finalAlpha = max(finalAlpha, intensity);
                }
            }
            if (u_zoom > 0.35 && max(u_showHearing, isHearingActive) > 0.5 && dist < audibleRange + 4.0) {
                float pulse = 0.7 + 0.3 * sin(u_time * 1.5 + v_id * 0.3);
                float dRingH = abs(dist - audibleRange) - 1.5;
                if (dRingH < 3.0) {
                    float angleH = atan(v_localCoord.y, v_localCoord.x);
                    float dashH = step(0.3, fract(angleH * 6.0 / 6.28318 + u_time * 0.3));
                    float ringAlpha = exp(-abs(dRingH) * 1.2) * 0.4 * pulse * dashH;
                    finalCol += vec3(0.2, 0.65, 0.85) * ringAlpha;
                    finalAlpha = max(finalAlpha, ringAlpha);
                }
            }
            if (u_zoom > 0.35 && max(u_showCommunication, isTransmittingActive) > 0.5 && dist < commRange) {
                float ping1 = fract(u_time * 0.4 + v_id * 0.1);
                float ping2 = fract(u_time * 0.4 + v_id * 0.1 + 0.5);
                float dPing1 = abs(dist - ping1 * commRange);
                float dPing2 = abs(dist - ping2 * commRange);
                float fade1 = (1.0 - ping1) * 0.6;
                float fade2 = (1.0 - ping2) * 0.6;
                float ripple = 0.0;
                if (dPing1 < 2.5) ripple += exp(-dPing1 * 0.8) * fade1;
                if (dPing2 < 2.5) ripple += exp(-dPing2 * 0.8) * fade2;
                finalCol += vec3(1.0, 0.7, 0.15) * ripple;
                finalAlpha = max(finalAlpha, ripple);
            }

            // --- REFINED BODY RENDERING ---
            float softness = mix(0.1, 4.0, clamp(1.0 - u_zoom * 1.5, 0.0, 1.0));
            vec2 perp = vec2(-dir.y, dir.x);
            float spd = length(vel);
            
            // Inertial warp: subtle but visible curve when turning
            float warp = clamp(turnForce * 3.0, -10.0, 10.0); 
            float totalWarp = bending + warp;
            float distAlong = dot(v_localCoord, dir);
            vec2 warpedP = v_localCoord - (perp * totalWarp * 0.18 * distAlong);
            
            // NO DOUBLE STRETCH: Central body stays fixed, vertex shader handles tail drag
            vec2 pA = dir * (skeletalLength * 0.5);
            vec2 pB = -dir * (skeletalLength * 0.5);
            float r = size * (0.95 + 0.05 * sin(u_time * 0.1 + v_id));
            
            float dBody = sdCapsule(warpedP, pA, pB, r);

            // --- MEATBALL FUSION ---
            if (mateIndex > -0.5 && matingFactor > 0.01) {
                float mTx = (mateIndex + 0.5) / maxInst;
                vec4 mD1 = texture(u_orgTexture, vec2(mTx, 0.1));
                vec2 mPos = mD1.xy;
                // Blend with partner's circle (approximation)
                vec2 mLocal = (mPos - v_worldCenter); 
                float dMate = sdCircle(v_localCoord - mLocal, mD1.z);
                // Continuous blend: starts tight, melts fully, then separates
                float k = mix(2.0, 18.0, 1.0 - abs(matingFactor * 2.0 - 1.0));
                dBody = smin(dBody, dMate, k);
            }
            
            float bodyAlpha = smoothstep(softness, -softness, dBody);
            
            // Outline Glow
            if (dBody > 0.0 && dBody < 25.0) {
                float outlineGlow = exp(-dBody * 0.12) * glowIntensity * 0.8;
                finalCol += col * outlineGlow;
                finalAlpha = max(finalAlpha, outlineGlow * 0.7);
            }

            float glowFalloff = exp(-max(0.0, dBody) * 0.1);
            float coreGradient = pow(clamp(1.0 - abs(dBody) / r, 0.0, 1.0), 3.0);
            vec3 bodyCol = col * (0.6 + 0.8 * coreGradient + 0.5 * glowFalloff * glowIntensity);

            // GPU Pulsing: High energy or Noble status
            float pulse = 0.5 + 0.5 * sin(u_time * 4.0 + v_id);
            if (isNoble > 0.5) {
                bodyCol *= (1.0 + 0.6 * pulse);
            } else if (energyNorm > 0.85) {
                bodyCol *= (1.0 + 0.2 * pulse);
            }

            // Health Desaturation
            float luma = dot(bodyCol, vec3(0.299, 0.587, 0.114));
            bodyCol = mix(vec3(luma), bodyCol, 0.5 + 0.5 * energyNorm);

            vec3 finalBody = bodyCol * bodyAlpha;
            finalCol = mix(finalCol, finalBody, bodyAlpha);
            finalAlpha = max(finalAlpha, bodyAlpha);

            // Eyes & Selection (Static local relative to head/size)
            if (u_zoom > 0.5 && bodyAlpha > 0.01) {
                vec2 eyeP1 = rotate(vec2(size * 0.75, size * 0.45), dir);
                vec2 eyeP2 = rotate(vec2(size * 0.75, -size * 0.45), dir);
                float eyeSize = size * 0.35;
                float dE = min(sdCircle(v_localCoord - eyeP1, eyeSize), sdCircle(v_localCoord - eyeP2, eyeSize));
                if (dE < 2.0) {
                    float alphaE = smoothstep(1.5, -1.5, dE);
                    float dPupil = min(sdCircle(v_localCoord - (eyeP1 + dir * eyeSize * 0.25), eyeSize * 0.42),
                                       sdCircle(v_localCoord - (eyeP2 + dir * eyeSize * 0.25), eyeSize * 0.42));
                    vec3 eCol = dPupil < 0.0 ? vec3(0.01) : vec3(1.0);
                    finalCol = mix(finalCol, eCol, alphaE);
                    finalAlpha = max(finalAlpha, alphaE);
                }
            }

            float idDiff = abs(id - u_selectedId);
            if (idDiff < 0.1 || abs(id - u_hoveredId) < 0.1) {
                float ringSize = size + 14.0 + sin(u_time * 3.0) * 3.0;
                float dRing = abs(length(v_localCoord) - ringSize) - 2.0;
                if (dRing < 4.0) {
                    float opacity = (idDiff < 0.1 ? 1.0 : 0.6) * smoothstep(2.0, -1.0, dRing);
                    vec3 ringCol = idDiff < 0.1 ? vec3(0.1, 0.7, 1.0) : vec3(0.5, 1.0, 0.8);
                    finalCol = mix(finalCol, ringCol, opacity * 0.5);
                    finalAlpha = max(finalAlpha, opacity * 0.5);
                }
            }

            if (finalAlpha < 0.001) discard;
            outColor = vec4(finalCol, finalAlpha);
        }
    `,R.FLORA_VERT_SHADER=`#version 300 es
        in vec2 a_unitPosition;
        in int a_instanceID;

        out vec2 v_localCoord;
        out float v_growth;
        out float v_complexity;
        out vec4 v_color;
        out vec2 v_worldCenter;
        flat out int v_id;

        uniform sampler2D u_floraTexture;
        uniform vec2 u_cameraOffset;
        uniform float u_zoom;
        uniform vec2 u_logicalResolution;

        void main() {
            float maxInst = ${R.MAX_INSTANCES}.0;
            float tx = (float(a_instanceID) + 0.5) / maxInst;
            vec4 d1 = texture(u_floraTexture, vec2(tx, 0.25)); // x, y, growth, complexity
            vec2 fPos = d1.xy;
            float growth = d1.z;
            float complexity = d1.w;
            
            vec4 d2 = texture(u_floraTexture, vec2(tx, 0.75)); // Color
            
            float maxRad = max(10.0, (complexity * 4.0 + 10.0));
            // Add slight margin for swaying/blooming
            float quadSize = maxRad * 2.0 + 6.0; 

            v_localCoord = a_unitPosition * quadSize;
            v_growth = growth;
            v_complexity = complexity;
            v_color = vec4(d2.rgb, 1.0);
            v_worldCenter = fPos;
            v_id = a_instanceID;

            vec2 worldPos = fPos + v_localCoord;
            vec2 screenPos = worldPos * u_zoom + u_cameraOffset;
            vec2 clipPos = (screenPos / u_logicalResolution) * 2.0 - 1.0;
            
            gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
        }
    `,R.FLORA_FRAG_SHADER=`#version 300 es
        precision highp float;
        in vec2 v_localCoord;
        in float v_growth;
        in float v_complexity;
        in vec4 v_color;
        in vec2 v_worldCenter;
        flat in int v_id;

        out vec4 outColor;
        
        uniform float u_time;
        uniform float u_zoom;
        uniform float u_selectedId;
        uniform float u_hoveredId;

        float sdHexagon(vec2 p, float r) {
            const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
            p = abs(p);
            p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
            p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
            return length(p) * sign(p.y);
        }

        void main() {
            float phase = dot(floor(v_worldCenter), vec2(12.9898, 78.233));
            float timeOff = u_time * 2.5 + phase;
            float breathe = 0.5 + 0.5 * sin(timeOff);
            
            vec2 sway = vec2(sin(timeOff * 0.5), cos(timeOff * 0.7)) * 0.8;
            vec2 local = v_localCoord - (sway * v_growth);
            
            float distToCenter = length(local);
            float maxRad = max(10.0, (v_complexity * 4.0 + 10.0));
            
            // Fast culling for sparse areas of the quad
            if (distToCenter > maxRad + 5.0) discard;

            vec3 finalCol = vec3(0.0);
            float finalAlpha = 0.0;

            if (u_zoom < 0.3) {
                // LOD: Simple circle for zoomed out
                float d = distToCenter - (maxRad * 0.5 * (0.8 + 0.2 * breathe));
                finalAlpha = smoothstep(2.0, -2.0, d);
                finalCol = mix(vec3(0.2, 0.3, 0.1), v_color.rgb, 0.6);
            } else {
                float spacing = 3.2;
                vec2 cell = round(local / spacing);
                vec2 cellCenter = cell * spacing;
                float distIdx = length(cell); 

                float angle = atan(cell.y, cell.x); 
                float armHash = fract(sin(angle * 10.0 + phase) * 43758.5453);
                float armLen = (v_complexity * v_growth) * (0.6 + 0.8 * armHash);
                
                bool isCore = distIdx < 2.2;
                bool isArm = (cell.x == 0.0 || cell.y == 0.0 || abs(cell.x) == abs(cell.y));
                float cellHash = fract(sin(dot(cell, vec2(12.9898, 78.233)) + phase) * 43758.5453);
                bool isBud = !isArm && (distIdx < armLen * 0.6) && (cellHash > 0.7);

                if (isCore || (isArm && distIdx <= armLen) || isBud) {
                    float taper = clamp(1.0 - (distIdx / (armLen + 1.0)), 0.0, 1.0);
                    float baseRad = isCore ? 0.75 : (0.45 + 0.35 * taper);
                    float radius = (spacing * baseRad) * (0.8 + 0.2 * breathe);
                    
                    float dF = length(local - cellCenter) - radius;
                    if (dF < 4.0) {
                         vec3 leafCol = v_color.rgb;
                         vec3 stemCol = vec3(0.2, 0.3, 0.1); 
                         vec3 cellCol = mix(stemCol, leafCol, smoothstep(0.4, 4.2, distIdx));
                         cellCol = mix(cellCol, cellCol * 1.5, breathe * 0.3);
                         cellCol += vec3(0.1, 0.2, 0.1) * cellHash * 0.5;
                         
                         float alpha = smoothstep(1.2, -0.8, dF);
                         float glow = exp(-max(0.0, dF) * 1.8) * breathe;
                         
                         // Premultiplied blending for botanical bloom
                         finalCol += mix(vec3(0.0), cellCol, alpha) + (vec3(0.08, 0.32, 0.24) * glow * 1.0);
                         finalAlpha = max(finalAlpha, alpha);
                    }
                } else {
                    // Slight core glow even for missing cells
                    if (distIdx < 4.0) {
                        float coreGlow = exp(-distIdx * 0.8) * breathe * 0.2;
                        finalCol += v_color.rgb * coreGlow;
                        finalAlpha = max(finalAlpha, 0.0); // Don't block background with core glow
                    }
                }
            }

            // Botanical Interaction Aura
            float floraId = v_color.w;
            float isSel = abs(floraId - u_selectedId) < 0.1 ? 1.0 : 0.0;
            float isHov = abs(floraId - u_hoveredId) < 0.1 ? 1.0 : 0.0;
            if (isSel > 0.5 || isHov > 0.5) {
                float auraPulse = 0.5 + 0.5 * sin(u_time * 4.0);
                float dHex = sdHexagon(v_localCoord, maxRad + 5.0 + auraPulse);
                float dRing = abs(dHex) - 1.5;
                if (dRing < 4.0) {
                    vec3 auraCol = isSel > 0.5 ? vec3(0.6, 1.0, 0.4) : vec3(1.0);
                    float opacity = (isSel > 0.5 ? 0.8 : 0.3) * exp(-abs(dRing) * 1.5);
                    finalCol += auraCol * opacity;
                }
            }

            outColor = vec4(finalCol, finalAlpha);
        }
    `;let ht=R,E=null,B=null,yt=!1,tt=0,T={cameraOffset:[0,0],zoom:1,selectedId:null,hoveredId:null,isFollowing:!1,showVision:!1,showGrid:!1,showHearing:!1,showCommunication:!1,dpr:1,resolution:[1920,1080]};self.onmessage=l=>{const{type:t,data:e}=l.data;switch(t){case"INIT":const{canvas:i,worldSize:s,initialState:o,resolution:r}=e;console.log("[Worker] Initializing Engine & Renderer..."),E=new dt(s.x,s.y,o),r&&(T.resolution=r,T.dpr=e.dpr||1,i.width=r[0],i.height=r[1]),B=new ht(i),B.updateTerrainTexture(E.terrain,s),performance.now(),console.log("[Worker] Initialization Complete. Starting Tick."),requestAnimationFrame(mt);break;case"UPDATE_CAMERA":T={...T,...e};break;case"SET_PAUSED":yt=e;break;case"RESIZE":T.resolution=[e.width,e.height],B&&B.gl.canvas&&(B.gl.canvas.width=e.width,B.gl.canvas.height=e.height);break;case"HIT_TEST":if(E){const{x:n,y:d}=e,a=n,c=d;let f=null;for(const _ of E.state.organisms){const y=(_.position.x-a)**2+(_.position.y-c)**2,v=_.expressedStats.size*.4+25;if(y<v*v){f=_.id;break}}if(!f){for(const _ of E.state.Flora)if((_.position.x-a)**2+(_.position.y-c)**2<900){f=_.id;break}}self.postMessage({type:"HIT_RESULT",data:f,originalEvent:e.originalEvent})}break;case"UPDATE_CONFIG":E&&(E.state.config=e);break;case"RESET":E&&E.hardReset();break}};function mt(l){if(!E||!B){requestAnimationFrame(mt);return}if(!yt){if(E.update(),E.state.organisms.length===0?(tt++,tt>=300&&(console.warn("[Worker] Extinction detected — all organisms dead. Auto-resetting simulation."),E.hardReset(),B.updateTerrainTexture(E.terrain,E.state.worldSize),tt=0,self.postMessage({type:"STATE_REFRESH",data:{time:E.state.time,day:E.state.day,hour:E.state.hour,popCount:E.state.organisms.length,floraCount:E.state.Flora.length,events:E.state.events.slice(0,5),apexCandidates:E.state.apexCandidates,selectedEntity:null,hoveredEntity:null,lastResetTime:E.state.lastResetTime}}))):tt=0,T.isFollowing&&T.selectedId){const t=E.state.organisms.find(e=>e.id===T.selectedId);if(t){const e=T.resolution[0]/T.dpr,i=T.resolution[1]/T.dpr,s=e/2-t.position.x*T.zoom,o=i/2-t.position.y*T.zoom;T.cameraOffset[0]+=(s-T.cameraOffset[0])*.1,T.cameraOffset[1]+=(o-T.cameraOffset[1])*.1,self.postMessage({type:"CAMERA_SYNC",data:{offset:T.cameraOffset}})}}if(E.state.time%10===0){const t=T.selectedId?E.state.organisms.find(i=>i.id===T.selectedId)||E.state.Flora.find(i=>i.id===T.selectedId):null,e=!T.selectedId&&T.hoveredId?E.state.organisms.find(i=>i.id===T.hoveredId)||E.state.Flora.find(i=>i.id===T.hoveredId):null;self.postMessage({type:"STATE_REFRESH",data:{time:E.state.time,day:E.state.day,hour:E.state.hour,popCount:E.state.organisms.length,floraCount:E.state.Flora.length,events:E.state.events.slice(0,5),apexCandidates:E.state.apexCandidates,selectedEntity:t,hoveredEntity:e,lastResetTime:E.state.lastResetTime}})}E.state.time%600===0&&self.postMessage({type:"SAVE_REQUIRED",data:E.state})}B.render({resolution:T.resolution,logicalResolution:[T.resolution[0]/T.dpr,T.resolution[1]/T.dpr],worldSize:[E.state.worldSize.x,E.state.worldSize.y],cameraOffset:T.cameraOffset,zoom:T.zoom,time:E.state.time,organisms:E.state.organisms,Flora:E.state.Flora,selectedId:T.selectedId,hoveredId:T.hoveredId,isFollowing:T.isFollowing,dpr:T.dpr,showVision:T.showVision,showGrid:T.showGrid,showHearing:T.showHearing,showCommunication:T.showCommunication}),requestAnimationFrame(mt)}})();
