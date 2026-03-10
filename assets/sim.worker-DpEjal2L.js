(function(){"use strict";const _={dist:(l,t)=>Math.sqrt((l.x-t.x)**2+(l.y-t.y)**2),distSq:(l,t)=>(l.x-t.x)**2+(l.y-t.y)**2,normalize:l=>{const t=Math.sqrt(l.x*l.x+l.y*l.y);return t===0?{x:0,y:0}:{x:l.x/t,y:l.y/t}},dot:(l,t)=>l.x*t.x+l.y*t.y,angleBetween:(l,t)=>{const e=_.dot(_.normalize(l),_.normalize(t));return Math.acos(Math.max(-1,Math.min(1,e)))},sub:(l,t)=>({x:l.x-t.x,y:l.y-t.y}),add:(l,t)=>({x:l.x+t.x,y:l.y+t.y}),mul:(l,t)=>({x:l.x*t,y:l.y*t}),limit:(l,t)=>{const e=l.x*l.x+l.y*l.y;if(e>t*t){const i=Math.sqrt(e);return{x:l.x/i*t,y:l.y/i*t}}return l},seek:(l,t,e)=>{const i={x:t.x-l.x,y:t.y-l.y},s=Math.sqrt(i.x*i.x+i.y*i.y);if(s===0)return{x:0,y:0};const o={x:i.x/s,y:i.y/s};return{x:o.x*e,y:o.y*e}}},Q={NAME_INHERITANCE_CHANCE:.05,FIRST_NAME_SYLLABLES_MIN:2,FIRST_NAME_SYLLABLES_RANGE:2,SURNAME_SYLLABLES_MIN:2,SURNAME_SYLLABLES_RANGE:2},rt={plosives:["p","t","k","b","d","g","pr","tr"],fricatives:["s","f","v","th","sh","z","h"],nasals:["m","n","gn","ny"],vowels:["a","e","i","o","u","y"]},xt=["ae","ou","ai","ea"],Mt=["m","n","t","k","l","sh","th"],pt={NOBILITY_MATING_THRESHOLD:10,NOBILITY_AGE_THRESHOLD_DAYS:1,PROLIFIC_MATING_THRESHOLD:5},U={PIXELS_PER_METER:20,CM_TO_M:.01},P={FPS:60,HOURS_PER_DAY:24,DAYS_PER_SEASON:20,SEASONS_PER_CYCLE:4,FRAMES_PER_DAY:1800,FRAMES_PER_HOUR:75,COMM_COOLDOWN_TICKS:300},Ht={isHourlyTick:l=>l%P.FRAMES_PER_HOUR===0},Et={DAYS_TO_REMEMBER:12,TEMPORARY_MEMORY_LIMIT:200,PERSISTENT_MEMORY_LIMIT:200},Z={PERCEPTION_COOLDOWN_TICKS:60,FOOD_MEMORY_ENERGY_THRESHOLD:100,MEMORY_CONFIDENCE_PENALTY:.8,FOOD_DESIRABILITY_DISTANCE_WEIGHT:1,MEMORY_PRUNING_RADIUS_METERS:15},Ct={MUTATION_STRENGTH:.12,PHYSICAL_LIMITS:{speed:[.1,5],size:[2,150],metabolism:[.1,5],sight_range:[2,100],sight_fov:[.1,Math.PI*2],lifespan:[100,1e3*(3600*24)],audible_range:[1,20],communicating_range:[.5,10]}},G={INITIAL_ORGANISMS:20,INITIAL_FLORA:110,BLOOM_COUNT_MIN:10,BLOOM_COUNT_MAX:20,BIRTH_COST_BASE:25e3,INITIAL_ENERGY:[7e3,8e3],MATING_ENERGY_THRESHOLD:2e4,MATING_BOND_DURATION_HOURS:2.5},tt={TRAIT_SURCHARGE_SPEED_WEIGHT:150,TRAIT_SURCHARGE_SIZE_WEIGHT:5,TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT:20,TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT:1,TRAIT_SURCHARGE_LIFESPAN_WEIGHT:1e-4},et={speed:[1.2,1.5],size:[75,85],metabolism:[.4,.5],sight_range:[15,18],sight_fov:[85*Math.PI/180,95*Math.PI/180],lifespan:[72e3,108e3],audible_range:[3.5,4.5],communicating_range:[2.5,3.5]},b={mToPx:l=>l*U.PIXELS_PER_METER,pxToM:l=>l/U.PIXELS_PER_METER,cmToPx:l=>l*U.CM_TO_M*U.PIXELS_PER_METER,toInternalSpeed:l=>l*U.PIXELS_PER_METER/P.FPS,toDisplaySpeed:l=>l*P.FPS/U.PIXELS_PER_METER,toDegrees:l=>l*180/Math.PI,toRadians:l=>l*Math.PI/180,toDays:l=>l/1800},k={createRandomGenome:l=>{const t={},e=(l==null?void 0:l.traitRanges)||et;return Object.keys(e).forEach(i=>{if(!e[i])return;const s=e[i],o=Math.random()*(s[1]-s[0])+s[0],r=o;t[i]={v1:o,v2:r,d1:Math.random(),d2:Math.random()}}),{traits:t}},express:l=>{const t={};return Object.keys(l.traits).forEach(e=>{const i=l.traits[e];t[e]=i.d1>=i.d2?i.v1:i.v2}),t},mutate:(l,t)=>{const e={},i=(t==null?void 0:t.traitRanges)||et,s=Ct.MUTATION_STRENGTH,o=Ct.PHYSICAL_LIMITS;return Object.keys(l.traits).forEach(r=>{const a=l.traits[r],c=i[r],n=o[r],d=g=>{const I=c[1]-c[0],v=(Math.random()*2-1)*s*I;return Math.max(n[0],Math.min(n[1],g+v))},h=g=>{const I=(Math.random()*2-1)*s*.5;return Math.max(0,Math.min(1,g+I))};e[r]={v1:d(a.v1),v2:d(a.v2),d1:h(a.d1),d2:h(a.d2)}}),{traits:e}},recombine:(l,t)=>{const e={};return Object.keys(l.traits).forEach(i=>{const s=l.traits[i],o=t.traits[i];e[i]={v1:Math.random()>.5?s.v1:o.v1,v2:Math.random()>.5?s.v2:o.v2,d1:Math.random()>.5?s.d1:o.d1,d2:Math.random()>.5?s.d2:o.d2}}),{traits:e}},ensureIntegrity:l=>{const t=et;Object.keys(t).forEach(e=>{if(!l.traits[e]){const i=t[e],s=Math.random()*(i[1]-i[0])+i[0];l.traits[e]={v1:s,v2:s,d1:Math.random(),d2:Math.random()}}})}},Tt={organisms:"o",Flora:"f",position:"p",velocity:"v",expressedStats:"es",genome:"g",traits:"tr",memories:"m",id:"i",timestamp:"t",energy:"e",age:"a",generation:"gn",matingCount:"mc",matingTimer:"mt",matingTargetId:"mti",firstName:"fn",surname:"sn",name:"n",color:"c",bending:"b",parentId:"pi",parentA_Id:"pa",parentB_Id:"pb",growthState:"gs",complexity:"cx",lifetime:"lt",biome:"bm",type:"tp",config:"cfg",initialPopulation:"ip",initialEnergy:"ie",traitRanges:"trr"},Ut=Object.fromEntries(Object.entries(Tt).map(([l,t])=>[t,l])),lt={STATE:"ales_sim_state",SETTINGS:"ales_settings"};class zt{constructor(){this.organisms=new Map,this.documents=[],this.settingsCache=new Map,this.eventsCache=[],this.dirtyOrganisms=new Set,this.surnameIndex=new Map,this.familyCountIndex=new Map,this.SAVE_DEBOUNCE_MS=1e3,this.saveTimeout=null,this.DB_NAME="ales_persistence_v2",this.DB_STORES={ORGANISMS:"organisms",EVENTS:"events",SYSTEM:"system"},this.DB_VERSION=1,this.dbPromise=null,this.isReady=!1,this.lastSaveMs=0,this.lastLoadMs=0,this.lastSaveOrgCount=0,this.saveCount=0,this.initDocs()}async init(){if(this.isReady)return;const t=performance.now();try{console.log("[VDB] Opening Database...");const e=await this.openDB();console.log("[VDB] Database opened. Fetching stores...");const[i,s,o]=await Promise.all([this.getAllFromStore(this.DB_STORES.SYSTEM),this.getAllFromStore(this.DB_STORES.ORGANISMS),this.getAllFromStore(this.DB_STORES.EVENTS)]);console.log(`[VDB] Stores fetched: System(${i.length}), Organisms(${s.length}), Events(${o.length})`),i.forEach(({key:r,value:a})=>{r===lt.SETTINGS&&Object.entries(a).forEach(([c,n])=>this.settingsCache.set(c,n))}),console.log("[VDB] Detokenizing organisms..."),s.forEach(({key:r,value:a})=>{try{const c=this.detokenize(a);this.organisms.set(c.id,c)}catch(c){console.error(`[VDB] Hydration Error: Failed to detokenize organism ${r}`,c)}}),console.log("[VDB] Refreshing indices..."),this.refreshIndices(),console.log("[VDB] Detokenizing events..."),this.eventsCache=this.detokenize(o.map(r=>r.value)),console.log("[VDB] Hydration complete.")}catch(e){console.warn("[VDB] init() failed, check IndexedDB state",e)}this.isReady=!0,this.lastLoadMs=performance.now()-t,console.log(`[VDB] Init complete in ${this.lastLoadMs.toFixed(1)}ms (${this.organisms.size} records)`)}getSetting(t,e){const i=this.settingsCache.get(t);return i!==void 0?i:e}setSetting(t,e){this.settingsCache.set(t,e);const i=Object.fromEntries(this.settingsCache);this.idbPut(this.DB_STORES.SYSTEM,lt.SETTINGS,i).catch(()=>{})}saveSimState(t){const e=()=>{var r;const i=performance.now(),s=this.tokenizeAndPrune(t),o=((r=t.organisms)==null?void 0:r.length)||0;this.idbPut(this.DB_STORES.SYSTEM,lt.STATE,s).then(()=>{this.lastSaveMs=performance.now()-i,this.lastSaveOrgCount=o,this.saveCount++,t.organisms&&this.syncLiving(t.organisms)}).catch(()=>{})};typeof window<"u"&&"requestIdleCallback"in window?window.requestIdleCallback(()=>e(),{timeout:2e3}):setTimeout(e,0)}tokenizeAndPrune(t){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(i=>this.tokenizeAndPrune(i));const e={};for(const i in t){if(i==="expressedStats"||i==="events")continue;const s=Tt[i]||i;let o=t[i];i==="memories"&&Array.isArray(o)&&o.length>Et.PERSISTENT_MEMORY_LIMIT&&(o=o.slice(-200)),e[s]=this.tokenizeAndPrune(o)}return e}async loadSimState(){try{const t=await this.idbGet(this.DB_STORES.SYSTEM,lt.STATE);if(t){const e=this.detokenize(t);return e.events=this.eventsCache,e}}catch{return null}return null}syncLiving(t){t.forEach(e=>{const i=this.organisms.get(e.id);i?this.organisms.set(e.id,{...i,age:e.age,energy:e.energy,matingCount:e.matingCount,isAlive:!0}):(this.organisms.set(e.id,{...e,isAlive:!0,memories:[]}),this.updateIndicesFor(e)),this.dirtyOrganisms.add(e.id)}),this.debounceSave()}pushToHistory(t,e){const i=this.organisms.get(t);if(!i)return;i.memories||(i.memories=[]);const s=i.memories[i.memories.length-1];if(s&&e.content.includes("Energy")&&s.content.includes("Energy")){const r=s.content.match(/Harvested (\d+)x Energy/),a=r?parseInt(r[1]):1;s.content=`Harvested ${a+1}x Energy`,s.timestamp=Date.now()}else i.memories.some(r=>r.id===e.id)||i.memories.push(e);i.memories.length>200&&i.memories.shift(),this.dirtyOrganisms.add(t),this.debounceSave()}markDeceased(t,e){const i=this.organisms.get(t);i&&(e?this.organisms.set(t,{...e,isAlive:!1}):i.isAlive=!1,this.dirtyOrganisms.add(t),this.debounceSave())}addHistory(t){this.organisms.set(t.id,{...t,isAlive:!0}),this.updateIndicesFor(t),this.dirtyOrganisms.add(t.id),this.debounceSave()}getHistory(){return Array.from(this.organisms.values()).sort((t,e)=>e.generation-t.generation)}getFamilyCount(t,e){return this.familyCountIndex.get(`${t}_${e}`)||0}getEvents(){return this.eventsCache}getAssets(){return this.documents}debounceSave(){this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>this.flushDirty(),this.SAVE_DEBOUNCE_MS)}async flushDirty(){if(this.dirtyOrganisms.size===0)return;const e=(await this.openDB()).transaction(this.DB_STORES.ORGANISMS,"readwrite"),i=e.objectStore(this.DB_STORES.ORGANISMS),s=Array.from(this.dirtyOrganisms);this.dirtyOrganisms.clear(),s.forEach(o=>{const r=this.organisms.get(o);if(r){const a=this.tokenize({...r,lastSaved:Date.now()});i.put(a,o)}}),e.oncomplete=()=>{console.log(`[VDB] Atomic flush complete: ${s.length} records persisted.`)}}async saveEventsBatch(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(this.DB_STORES.EVENTS,"readwrite"),r=o.objectStore(this.DB_STORES.EVENTS);r.clear(),t.forEach((a,c)=>r.put(this.tokenize(a),c)),o.oncomplete=()=>i(),o.onerror=()=>s(o.error)})}openDB(){return this.dbPromise?this.dbPromise:(this.dbPromise=new Promise((t,e)=>{if(typeof indexedDB>"u")return e("No IndexedDB");const i=setTimeout(()=>{console.error("[VDB] openDB timeout — IndexedDB may be blocked by another tab."),e(new Error("IndexedDB open timeout"))},3e3),s=indexedDB.open(this.DB_NAME,this.DB_VERSION);s.onupgradeneeded=()=>{const o=s.result;Object.values(this.DB_STORES).forEach(r=>{o.objectStoreNames.contains(r)||o.createObjectStore(r)})},s.onsuccess=()=>{clearTimeout(i),t(s.result)},s.onerror=()=>{clearTimeout(i),e(s.error)},s.onblocked=()=>{console.warn("[VDB] IndexedDB blocked — close other tabs using this app."),clearTimeout(i),e(new Error("IndexedDB blocked"))}}).catch(t=>{throw this.dbPromise=null,t}),this.dbPromise)}async idbPut(t,e,i){const s=await this.openDB();return new Promise((o,r)=>{const a=s.transaction(t,"readwrite");a.objectStore(t).put(i,e),a.oncomplete=()=>o(),a.onerror=()=>r(a.error)})}async idbGet(t,e){const i=await this.openDB();return new Promise((s,o)=>{const a=i.transaction(t,"readonly").objectStore(t).get(e);a.onsuccess=()=>s(a.result??null),a.onerror=()=>o(a.error)})}async getAllFromStore(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(t,"readonly"),r=o.objectStore(t),a=r.getAll(),c=r.getAllKeys();o.oncomplete=()=>{const n=a.result,d=c.result;i(n.map((h,g)=>({key:d[g],value:h})))},o.onerror=()=>s(o.error)})}hardReset(){this.openDB().then(t=>{const e=t.transaction(Object.values(this.DB_STORES),"readwrite");Object.values(this.DB_STORES).forEach(i=>e.objectStore(i).clear())}),this.organisms.clear(),this.settingsCache.clear(),this.eventsCache=[],this.refreshIndices()}tokenize(t){if(Array.isArray(t))return t.map(e=>this.tokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=Tt[i]||i;e[s]=this.tokenize(t[i])}return e}return t}detokenize(t){if(Array.isArray(t))return t.map(e=>this.detokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=Ut[i]||i;e[s]=this.detokenize(t[i])}return e}return t}updateIndicesFor(t){const e=this.surnameIndex.get(t.surname)||new Set;e.add(t.id),this.surnameIndex.set(t.surname,e);const i=`${t.firstName}_${t.surname}`;this.familyCountIndex.set(i,(this.familyCountIndex.get(i)||0)+1)}refreshIndices(){this.surnameIndex.clear(),this.familyCountIndex.clear(),this.organisms.forEach(t=>this.updateIndicesFor(t))}initDocs(){this.documents.push({id:"doc_genetics",type:"SYSTEM_DOC",timestamp:Date.now(),data:{title:"Genetic Expression: Standardized Units",content:"Trait values are expressed in metric units where applicable."}})}}const j=new zt,It=class It{static generateSyllable(t,e,i){const s=(i==null?void 0:i.simplify)??!1,o=s?.08:e.prosody==="Fluid"?.22:e.prosody==="Angry"?.14:.08;let r=rt[t][Math.floor(Math.random()*rt[t].length)];if(e.phonotacticFilter&&r.length>2&&Math.random()>(s?.05:.35))return this.generateSyllable(t,e,i);s&&r.length>1&&Math.random()<.55&&(r=r[0]);const a=Math.random()<o?xt[Math.floor(Math.random()*xt.length)]:rt.vowels[Math.floor(Math.random()*rt.vowels.length)],c=s?.12:.2,n=Math.random()<c?Mt[Math.floor(Math.random()*Mt.length)]:"";return r+a+n}static constructWord(t,e,i){let s="";for(let o=0;o<t;o++){const r=o===0?e:"vowels";s+=this.generateSyllable(r,i,{simplify:o>0})}return s.charAt(0).toUpperCase()+s.slice(1)}static generatePhoneticName(t){const e={prosody:"Fluid",phonotacticFilter:!0};return this.constructWord(t,"plosives",e)}static generateFirstName(){const t=Math.floor(Math.random()*Q.FIRST_NAME_SYLLABLES_RANGE)+Q.FIRST_NAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static generateSurname(){const t=Math.floor(Math.random()*Q.SURNAME_SYLLABLES_RANGE)+Q.SURNAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static romanize(t){const e={M:1e3,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};let i="",s=t;for(let o in e)for(;s>=e[o];)i+=o,s-=e[o];return i}static constructFullLinguisticProfile(t,e){let i=this.generateFirstName(),s=this.generateSurname(),o="First of their lineage, born of the primal void.",r,a=!1;if(t&&(e?(s=Math.random()>.5?t.surname:e.surname,o=`Inherited the ${s} name from the union of ${t.firstName} and ${e.firstName}.`,(t.houseName||e.houseName)&&(r=t.houseName||e.houseName,a=!0)):(s=t.surname,o=`A direct sprout from the ${s} legacy of ${t.firstName}.`,r=t.houseName,a=t.isNoble||!1),Math.random()<Q.NAME_INHERITANCE_CHANCE)){i=t.firstName,s=t.surname;const n=j.getFamilyCount(i,s)+1,d=n>1?` ${this.romanize(n)}`:"";return{firstName:i,surname:s,name:`${i} ${s}${d}`,lineageDescription:d?`Named after their progenitor, ${t.firstName} ${t.surname}, carrying the weight of ${this.romanize(n)} generations.`:`A fresh branch from the ${s} vine.`,isNoble:a||t.isNoble,houseName:r}}return{firstName:i,surname:s,name:`${i} ${s}`,lineageDescription:o,isNoble:a,houseName:r}}static getTitle(t,e){if(t.isNoble)return"The Noble";if(t.age>e.meanAge*2)return"The Elder";if(t.expressedStats.speed>e.speed95th)return"The Swift";if(t.matingCount>pt.PROLIFIC_MATING_THRESHOLD)return"The Prolific"}static generateLexiconEntry(t,e){let i=1,s="plosives",o="Primitive";switch(t){case"Items":i=1,s="plosives",o="Primitive";break;case"Grammar":i=1,s="vowels",o="Primitive";break;case"Species":i=2,s="nasals",o="Abstract";break;case"Entities":i=2,s="plosives",o="Abstract";break;case"Locations":i=3,s="fricatives",o="Navigational";break;case"Places":i=4,s="fricatives",o="Complex";break}const r=this.constructWord(i,s,e),a={id:crypto.randomUUID(),word:r,ipa:`/${r.toLowerCase()}/`,category:t,complexity:o,timestamp:Date.now()};return this.lexicon.push(a),a}static applySemanticDrift(){}static constructPhrase(t){}};It.lexicon=[];let it=It;class ct{constructor(t,e,i=50){this.cells=new Map,this.width=t,this.height=e,this.cellSize=i}getCellKey(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize);return e<<16|i}update(t){this.cells.clear();for(let e=0;e<t.length;e++){const i=t[e],s=this.getCellKey(i.position);this.cells.has(s)||this.cells.set(s,[]),this.cells.get(s).push(i.id)}}getNeighbors(t,e){const i=[],s=Math.floor((t.x-e)/this.cellSize),o=Math.floor((t.x+e)/this.cellSize),r=Math.floor((t.y-e)/this.cellSize),a=Math.floor((t.y+e)/this.cellSize);for(let c=s;c<=o;c++)for(let n=r;n<=a;n++){const d=c<<16|n,h=this.cells.get(d);h&&i.push(...h)}return i}}class Yt{constructor(t=Math.random()){this.p=new Array(512),this.permutation=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];for(let e=0;e<256;e++)this.p[e]=this.permutation[e],this.p[256+e]=this.permutation[e]}fade(t){return t*t*t*(t*(t*6-15)+10)}lerp(t,e,i){return e+t*(i-e)}grad(t,e,i,s){const o=t&15,r=o<8?e:i,a=o<4?i:o===12||o===14?e:s;return((o&1)===0?r:-r)+((o&2)===0?a:-a)}noise(t,e,i=0){const s=Math.floor(t)&255,o=Math.floor(e)&255,r=Math.floor(i)&255;t-=Math.floor(t),e-=Math.floor(e),i-=Math.floor(i);const a=this.fade(t),c=this.fade(e),n=this.fade(i),d=this.p[s]+o,h=this.p[d]+r,g=this.p[d+1]+r,I=this.p[s+1]+o,v=this.p[I]+r,T=this.p[I+1]+r;return this.lerp(n,this.lerp(c,this.lerp(a,this.grad(this.p[h],t,e,i),this.grad(this.p[v],t-1,e,i)),this.lerp(a,this.grad(this.p[g],t,e-1,i),this.grad(this.p[T],t-1,e-1,i))),this.lerp(c,this.lerp(a,this.grad(this.p[h+1],t,e,i-1),this.grad(this.p[v+1],t-1,e,i-1)),this.lerp(a,this.grad(this.p[g+1],t,e-1,i-1),this.grad(this.p[T+1],t-1,e-1,i-1))))}fbm(t,e,i=4){let s=0,o=1,r=1,a=0;for(let c=0;c<i;c++)s+=this.noise(t*o,e*o)*r,a+=r,r*=.5,o*=2;return s/a}}class Nt{constructor(t,e,i=Math.random()){this.biomeScale=.002,this.cliffScale=.005,this.fertilityScale=.01,this.cliffThreshold=.65,this.gridRes=512,this.noise=new Yt(i),this.width=t,this.height=e,this.collisionGrid=new Uint8Array(this.gridRes*this.gridRes),this.precomputeCollisionGrid()}clamp01(t){return Math.max(0,Math.min(1,t))}precomputeCollisionGrid(){for(let t=0;t<this.gridRes;t++)for(let e=0;e<this.gridRes;e++){const i=e/this.gridRes*this.width,s=t/this.gridRes*this.height,o=this.noise.fbm(i*this.cliffScale,s*this.cliffScale,2);this.collisionGrid[t*this.gridRes+e]=o>this.cliffThreshold?1:0}}getBiomeAt(t,e){const i=this.noise.fbm(t*this.biomeScale,e*this.biomeScale,3);return this.noise.fbm(t*this.cliffScale,e*this.cliffScale,2)>this.cliffThreshold?"CLIFF":i>0?"GRASS":"ARID"}getFertilityAt(t,e){const i=this.getBiomeAt(t,e);if(i==="CLIFF")return 0;const s=this.clamp01((this.noise.fbm(t*this.biomeScale,e*this.biomeScale,3)+1)*.5),o=this.clamp01((this.noise.noise(t*this.fertilityScale,e*this.fertilityScale)+1)*.5),r=this.clamp01(s*.72+o*.28);return i==="GRASS"?r:r*.38}isImpassable(t,e){if(t<0||t>this.width||e<0||e>this.height)return!0;const i=Math.floor(t/this.width*(this.gridRes-1)),s=Math.floor(e/this.height*(this.gridRes-1));return this.collisionGrid[s*this.gridRes+i]===1}getSafeSpawnPos(){let t,e,i=0;do t=Math.random()*this.width,e=Math.random()*this.height,i++;while(this.isImpassable(t,e)&&i<100);return{x:t,y:e}}getBiomeColor(t,e,i){const s=this.noise.noise(e*.1,i*.1)*10;switch(t){case"GRASS":return`hsl(${100+s}, 45%, ${25+s}%)`;case"ARID":return`hsl(${35+s}, 35%, ${30+s}%)`;case"CLIFF":return`hsl(0, 0%, ${15+s}%)`;default:return"#000"}}}const V={MATURATION_DAYS_ESTIMATE:3.8,TRAIT_RANGES:{growth_speed_ratio:[.76,1.08],complexity:[2,12],stem_thickness:[.5,3.5],leaf_size:[10,50],persistence:[3,9],hue:[90,150],clump_radius:[1,3]},ECOLOGY:{HOURLY_RANDOM_SPAWN_CHANCE:.92,BIOME_GRASS_GROWTH:.42,BIOME_ARID_GROWTH:.5,LOW_DENSITY_FACILITATION:.32,FERTILITY_FACILITATION_BONUS:.32,FERTILITY_MATURATION_DRAG:.38,IDEAL_DENSITY_NEIGHBORS:3,FERTILE_DENSITY_BONUS:4,CROWDING_STALL_STRENGTH:.32,BIOMASS_SATURATION_STRENGTH:.76,MIN_STALL_MULTIPLIER:.12,PROXIMITY_DENSITY_BONUS:1.15,CLUSTER_SEARCH_RADIUS_METERS:1.2,CLUSTER_MIN_NEIGHBORS:1,CLUSTER_MAX_NEIGHBORS:6,CLUSTER_GROWTH_RATE:.28,SPREAD_FERTILITY_BONUS:.7,SPREAD_BIOMASS_THRESHOLD:2,SPREAD_CROWDING_PENALTY:.1,CLUSTER_SPAWN_DISTANCE_MIN:.05,CLUSTER_SPAWN_DISTANCE_MAX:.35,GLOBAL_TARGET_FLORA_MULTIPLIER:1.2,GLOBAL_OVERGROWTH_PENALTY:.32,CLUMPING_ACCELERATION:.38},THERMODYNAMICS:{NUTRIENT_BASE_MIN:360,MASS_TO_ENERGY_SCALAR:460,GROWTH_MASS_PENALTY:.02},generateGenome:()=>{const l=(x,S)=>x+Math.random()*(S-x),t=V.TRAIT_RANGES,e=l(t.growth_speed_ratio[0],t.growth_speed_ratio[1]),i=l(t.complexity[0],t.complexity[1]),s=l(t.stem_thickness[0],t.stem_thickness[1]),o=l(t.leaf_size[0],t.leaf_size[1]),r=l(t.persistence[0],t.persistence[1]),a=l(t.hue[0],t.hue[1]),c=l(t.clump_radius[0],t.clump_radius[1]),n=s*o*(i/6),d=1+n*V.THERMODYNAMICS.GROWTH_MASS_PENALTY,h=e/d,g=V.MATURATION_DAYS_ESTIMATE*P.HOURS_PER_DAY,I=Math.max(.28,h),v=g/I,T=Math.max(22e-5,1/v),u=Math.max(V.THERMODYNAMICS.NUTRIENT_BASE_MIN,n*V.THERMODYNAMICS.MASS_TO_ENERGY_SCALAR);return{traits:{structure:{v1:T,v2:i,d1:Math.random(),d2:Math.random()},vitality:{v1:u,v2:r,d1:Math.random(),d2:Math.random()},morphology:{v1:o,v2:a,d1:Math.random(),d2:Math.random()},ecology:{v1:c,v2:s,d1:Math.random(),d2:Math.random()}}}}},kt=1.5;class wt{static update(t,e,i={}){const s=t.biome||e.getBiomeAt(t.position.x,t.position.y),o=i.fertility??t.fertility??e.getFertilityAt(t.position.x,t.position.y),r=i.nearbyCount??t.nearbyFloraCount??0,a=i.nearbyBiomass??t.localBiomass??0,c=V.ECOLOGY,n=c.IDEAL_DENSITY_NEIGHBORS+Math.round(o*c.FERTILE_DENSITY_BONUS);let d=1;s==="GRASS"?d=c.BIOME_GRASS_GROWTH*(1-o*c.FERTILITY_MATURATION_DRAG):s==="ARID"&&(d=c.BIOME_ARID_GROWTH);const h=c.LOW_DENSITY_FACILITATION+o*c.FERTILITY_FACILITATION_BONUS,g=r<=n?1+r*h:c.PROXIMITY_DENSITY_BONUS,I=Math.max(0,r-n),v=Math.max(c.MIN_STALL_MULTIPLIER,1/(1+I*c.CROWDING_STALL_STRENGTH)),T=n+1.25+o*1.5,u=Math.max(0,a-T),x=Math.max(c.MIN_STALL_MULTIPLIER,1/(1+u*c.BIOMASS_SATURATION_STRENGTH)),S=Math.max(.16,1-Math.pow(t.growthState,1.6)),C=d*g*v*x*(.34+S),B=t.genome.traits.structure.v1,K=1+(n?Math.min(1,r/n)*c.CLUMPING_ACCELERATION:c.CLUMPING_ACCELERATION),W=B*C*K*kt;t.fertility=o,t.localBiomass=a,t.nearbyFloraCount=r,t.growthState<1&&(t.growthState=Math.min(1,t.growthState+W)),t.lifetime!==void 0&&(t.lifetime=Math.max(0,t.lifetime-P.FRAMES_PER_HOUR))}}function Xt(l){return{leafColor:`hsl(${l.traits.morphology.v2}, 70%, 50%)`}}class yt{constructor(t){this.data=t}static create(t,e,i,s,o,r,a){const c=a(),n=c.traits.structure.v2,d=c.traits.vitality.v1,g=c.traits.vitality.v2*P.FRAMES_PER_DAY,I=Xt(c);return new yt({id:t,name:r,color:I.leafColor,position:e,energyValue:d,complexity:n,type:o,lifetime:g,genome:c,growthState:.1,nearbyFloraCount:0,localBiomass:0,fertility:0})}update(t){wt.update(this.data,t)}isExpired(){return this.data.lifetime!==void 0&&this.data.lifetime<=0}getExpressedTraits(){const t=this.data.genome.traits.structure.v1*24,e=1-this.data.growthState,i=Math.max(1,Math.ceil(e/t));return{growthRate:(t*100).toFixed(2)+"% / day",maturation:i+" days",complexity:Math.floor(this.data.complexity),nutrients:Math.floor(this.data.energyValue),leafSize:this.data.genome.traits.morphology.v1.toFixed(1),stemThickness:this.data.genome.traits.ecology.v2.toFixed(1),clumpRadius:this.data.genome.traits.ecology.v1.toFixed(1),hue:Math.floor(this.data.genome.traits.morphology.v2)}}}const bt={calculateEnergyLoss:(l,t=0)=>{const e=Math.max(.01,l.speed),s=Math.max(0,Math.min(t,e))/e,o=.18;return 1/Math.max(.1,l.metabolism)*e*l.size*(o+s*(1-o))/P.FRAMES_PER_HOUR}};class Vt{constructor(t){this.data=t}update(t,e,i,s){const o=b.toDisplaySpeed(Math.sqrt(this.data.velocity.x**2+this.data.velocity.y**2)),r=bt.calculateEnergyLoss(this.data.expressedStats,o);this.data.energy-=r,this.data.age++;const a=_.add(this.data.position,this.data.velocity);i.isImpassable(a.x,a.y)&&((a.x<0||a.x>e.x)&&(this.data.velocity.x*=-1),(a.y<0||a.y>e.y)&&(this.data.velocity.y*=-1),i.getBiomeAt(a.x,a.y)==="CLIFF"&&(this.data.velocity.x*=-1,this.data.velocity.y*=-1)),this.data.matingTimer&&this.data.matingTimer>0&&this.data.matingTimer--,this.data.memories=this.data.memories.filter(d=>t-d.timestamp<d.duration),this.data.velocity.x**2+this.data.velocity.y**2>.01&&(this.data.heading=_.normalize(this.data.velocity));const n=b.toInternalSpeed(this.data.expressedStats.speed);this.data.velocity=_.limit(this.data.velocity,n),this.data.position=_.add(this.data.position,this.data.velocity),this.data.position.x=Math.max(0,Math.min(e.x,this.data.position.x)),this.data.position.y=Math.max(0,Math.min(e.y,this.data.position.y))}applySteering(t){const i=b.toInternalSpeed(this.data.expressedStats.speed)*.1,s=_.limit(t,i);this.data.velocity=_.add(this.data.velocity,s)}calculateBending(t){const e=Math.atan2(this.data.velocity.y,this.data.velocity.x),i=_.add(this.data.velocity,t);let o=Math.atan2(i.y,i.x)-e;o>Math.PI&&(o-=Math.PI*2),o<-Math.PI&&(o+=Math.PI*2);const c=(this.data.bending||0)*.85+o*3.5;this.data.bending=Math.max(-1.5,Math.min(1.5,c))}}class Wt{static scan(t,e){const i=t.expressedStats,s=t.position,o=t.heading,r=b.cmToPx(i.size)*.8,a=[],c=[],n=i.sight_range,d=i.sight_fov/2;for(const T of e.flora){const u=_.dist(s,T.position),x=b.pxToM(u);if(u<=r)a.push(T);else if(x<=n){const S=_.normalize(_.sub(T.position,s));Math.acos(_.dot(o,S))<=d&&a.push(T)}}const h=[],g=[],I=i.audible_range,v=i.communicating_range;for(const T of e.organisms){if(T.id===t.id)continue;const u=_.dist(s,T.position),x=b.pxToM(u);if(u<=r)c.push(T);else if(x<=n){const S=_.normalize(_.sub(T.position,s));Math.acos(_.dot(o,S))<=d&&c.push(T)}x<=I&&h.push(T),x<=v&&g.push(T)}return{visibleFlora:a,visibleFauna:c,audibleFauna:h,communicatingFauna:g}}}class $t{constructor(t){this.data=t}addMemory(t,e,i,s,o){var v;const r=3*P.FRAMES_PER_HOUR,a=b.mToPx(this.data.expressedStats.sight_range),c=o==null?void 0:o.id;let n=this.data.memories.find(T=>{var u;return T.type===e&&(c&&T.data&&T.data.id===c||c&&((u=T.entityIds)==null?void 0:u.includes(c))||T.content===s&&_.dist(T.position,i)<8)});if(n){n.position={...i},t-n.timestamp;return}const d=this.data.memories.find(T=>T.type===e&&t-T.timestamp<r);if(d&&e==="Fauna"){const T=_.dist(d.position,i),u=T/a,x=1-Math.pow(u,.5);if((Math.random()<x||T<50)&&c&&!((v=d.entityIds)!=null&&v.includes(c))){d.entityIds=[...d.entityIds||[],c],d.count=d.entityIds.length,d.count>1&&(d.content=`${d.count} entities encountered`),d.timestamp=t,this.data.memories=[d,...this.data.memories.filter(S=>S.id!==(d==null?void 0:d.id))];return}}const h=P.FRAMES_PER_DAY*Et.DAYS_TO_REMEMBER,g=P.FRAMES_PER_HOUR*12,I=e==="Food"?Math.max(g,h/4):h;if(this.data.memories.push({id:Math.random().toString(36).substr(2,5),type:e,position:{...i},timestamp:t,duration:I,content:s,count:1,data:o,entityIds:o&&o.id?[o.id]:void 0,isFamiliar:o?o.isFamiliar:!1}),this.data.memories.length>Et.TEMPORARY_MEMORY_LIMIT){const T=this.data.memories.findIndex(S=>(S.count||0)<3&&!S.isFamiliar),u=T!==-1?T:0,x=this.data.memories[u];j.pushToHistory(this.data.id,x),this.data.memories.splice(u,1)}}validateMemories(t,e,i){this.data.memories=this.data.memories.filter(s=>!((s.type==="Food"||s.type==="Flora")&&_.dist(i,s.position)<e&&!t.some(a=>_.dist(a.position,s.position)<12)))}removeMemory(t,e){this.data.memories=this.data.memories.filter(i=>{var o;return i.data&&i.data.id===t||((o=i.entityIds)==null?void 0:o.includes(t))?!!(e&&i.type!==e):!0})}getBestFoodLocation(){return this.data.memories.find(t=>t.type==="Food"||t.type==="Flora")||null}}class qt{constructor(t){this.me=t,this.memorySystem=new $t(t)}decide(t,e,i,s){var W,O;const o=Wt.scan(this.me,i);this.memorySystem.validateMemories(o.visibleFlora,b.mToPx(this.me.expressedStats.sight_range),this.me.position);const r=t,a=this.me.lastPerceptionTick||0,c=Z.PERCEPTION_COOLDOWN_TICKS;r-a>=c&&(o.visibleFlora.forEach(m=>{m.energyValue>Z.FOOD_MEMORY_ENERGY_THRESHOLD&&this.memorySystem.addMemory(t,"Food",m.position,m.name,{energy:m.energyValue,id:m.id})}),o.visibleFauna.forEach(m=>{const R=this.me.memories.some(w=>{var D;return((D=w.data)==null?void 0:D.id)===m.id&&w.isFamiliar});this.memorySystem.addMemory(t,"Fauna",m.position,m.name,{id:m.id,name:m.name,isFamiliar:R})}),this.me.lastPerceptionTick=r);const n=P.COMM_COOLDOWN_TICKS,d=this.me.lastVocalTick||0;if(r-d>=n&&o.communicatingFauna.length>0){let m=!1;o.communicatingFauna.forEach(R=>{const w=_.dist(this.me.position,R.position),D=b.pxToM(w),N=R.expressedStats.audible_range;if(D<=N){const F=this.me.memories.find(z=>z.type==="Food");F&&(R.memories.some(H=>H.type===F.type&&_.dist(H.position,F.position)<10)||(R.memories.push({...F,id:Math.random().toString(36).substr(2,5),timestamp:r,content:F.content,count:1}),R.isHearingActive=!0,this.memorySystem.addMemory(t,"Fauna",R.position,R.name,{id:R.id,name:R.name,isFamiliar:!0}),m=!0))}}),m&&(this.me.lastVocalTick=r,this.me.isTransmittingActive=!0)}let h={x:0,y:0};const g=b.toInternalSpeed(this.me.expressedStats.speed);b.toDisplaySpeed(Math.sqrt(this.me.velocity.x**2+this.me.velocity.y**2));const I=bt.calculateEnergyLoss(this.me.expressedStats,this.me.expressedStats.speed),v=Math.max(2200,I*P.FRAMES_PER_DAY*1.25),T=this.me.energy>v,u=this.me.energy<v*.7;let x=null,S=-1,C=null,B=null;for(const m of o.visibleFlora){const R=_.dist(this.me.position,m.position),w=m.energyValue*m.growthState/(R+Z.FOOD_DESIRABILITY_DISTANCE_WEIGHT);w>S&&(S=w,x=m.position,C=m,B=m.id)}const K=this.me.memories.filter(m=>m.type==="Food");for(const m of K){const R=_.dist(this.me.position,m.position),D=(((W=m.data)==null?void 0:W.energy)||500)*Z.MEMORY_CONFIDENCE_PENALTY/(R+Z.FOOD_DESIRABILITY_DISTANCE_WEIGHT);D>S&&(S=D,x=m.position,C=null,B=((O=m.data)==null?void 0:O.id)||null)}if(x){let m=C;m||(m=o.visibleFlora.find(D=>_.dist(D.position,x)<10)||null);const R=_.dist(this.me.position,x),w=b.cmToPx(this.me.expressedStats.size)*.8;if(m&&R<w)s.onEat(m),this.memorySystem.addMemory(t,"Flora",m.position,`Ate ${m.name}`,{energy:m.energyValue,id:m.id}),this.memorySystem.removeMemory(m.id,"Food");else{const D=b.cmToPx(this.me.expressedStats.size)*2;if(R<Z.MEMORY_PRUNING_RADIUS_METERS&&!m&&!C&&B)return this.memorySystem.removeMemory(B,"Food"),{x:0,y:0};let N=g*(u?1:.78);R<D&&(N*=R/D);const F=_.normalize(_.sub(x,this.me.position)),z=_.mul(F,N);h=_.sub(z,this.me.velocity)}}else if(T){const m=t*.005,R=parseInt(this.me.id)||0,w=Math.sin(m+R)+Math.sin(m*.5+R),D=Math.cos(m+R)+Math.cos(m*.5+R),N=_.normalize({x:w,y:D}),F=g*(this.me.energy>v*1.75?.38:.24),z=Math.sqrt(this.me.velocity.x**2+this.me.velocity.y**2);let H={x:0,y:0};z<.03&&(H={x:(Math.random()-.5)*2.5,y:(Math.random()-.5)*2.5});const $=_.add(_.mul(N,F),H);h=_.sub($,this.me.velocity)}else h=_.mul(this.me.velocity,-.18);if(this.me.energy>G.MATING_ENERGY_THRESHOLD&&this.me.matingTimer===0){const m=o.visibleFauna.find(R=>R.energy>G.MATING_ENERGY_THRESHOLD&&R.matingTimer===0&&R.id!==this.me.id);if(m){const R=_.dist(this.me.position,m.position),w=b.cmToPx(this.me.expressedStats.size)*1.5;if(R<w)return s.onMate(m),{x:0,y:0};{const D=_.normalize(_.sub(m.position,this.me.position)),N=_.mul(D,g*(u?.92:.75));h=_.add(h,_.sub(N,this.me.velocity))}}}return h}}class jt extends Vt{constructor(t){super(t),this.brain=new qt(t)}update(t,e,i,s){super.update(t,e,i,s)}think(t,e,i,s,o,r){const a=this.data;a.isHearingActive=!1,a.isTransmittingActive=!1,t%60===0&&(a.title=it.getTitle(a,s),!a.isNoble&&(a.matingCount>pt.NOBILITY_MATING_THRESHOLD||a.age>pt.NOBILITY_AGE_THRESHOLD_DAYS*P.FRAMES_PER_DAY)&&(a.isNoble=!0,a.houseName=`House ${a.surname}`,a.lineageDescription=`Founder of the Noble ${a.houseName}.`));const c=this.brain.decide(t,e,o,r);this.applySteering(c),this.calculateBending(c)}}const Kt={processBirth:(l,t)=>{const e=t?k.recombine(l.genome,t.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})(),i=k.mutate(e),s=k.express(i),o=G.BIRTH_COST_BASE/2,r=s.speed*tt.TRAIT_SURCHARGE_SPEED_WEIGHT+s.size*tt.TRAIT_SURCHARGE_SIZE_WEIGHT+s.sight_range*tt.TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT+s.sight_fov*tt.TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT+s.lifespan*tt.TRAIT_SURCHARGE_LIFESPAN_WEIGHT,a=o+r/2,c=h=>Math.min(1,1/h),n=a*c(l.expressedStats.metabolism),d=t?a*c(t.expressedStats.metabolism):n;return{childGenome:i,childStats:s,costToEachParent:a,initialEnergy:n+d,energyWasted:a*2-(n+d)}}},st=class st{constructor(t,e,i){this.lastId=0,this.floraGridDirty=!0,this.logicInstances=new Map,this.config={initialPopulation:G.INITIAL_ORGANISMS,initialEnergy:G.INITIAL_ENERGY,traitRanges:et};const s=i||null;s?(this.state={config:{...this.config},hour:0,day:0,season:1,cycle:1,events:[],apexCandidates:[],organisms:[],Flora:[],seed:Math.random(),...s},this.state.config.traitRanges={...et},this.state.config.initialEnergy=[...G.INITIAL_ENERGY],s.food&&(!this.state.Flora||this.state.Flora.length===0)&&(this.state.Flora=s.food),this.state.Flora&&this.state.Flora.forEach(a=>{a.growthState===void 0&&(a.growthState=.5),a.genome||(a.genome={traits:{structure:{v1:.001,v2:6,d1:.5,d2:.5},vitality:{v1:1200,v2:1e4,d1:.5,d2:.5},morphology:{v1:4,v2:120,d1:.5,d2:.5},ecology:{v1:20,v2:1.5,d1:.5,d2:.5}}})}),this.state.organisms&&this.state.organisms.forEach(a=>{(!a.genome||!a.genome.traits||Object.keys(a.genome.traits).length===0)&&(console.warn(`SimEngine: Healed CORRUPT genome for organism ${a.id}`,a.genome),a.genome=k.createRandomGenome(this.state.config)),k.ensureIntegrity(a.genome),a.expressedStats=k.express(a.genome),a.memories||(a.memories=[]),a.heading||(a.heading=_.normalize({x:Math.random()-.5,y:Math.random()-.5}))})):this.state={organisms:[],Flora:[],worldSize:{x:t,y:e},time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random()};const o=this.state.worldSize.x,r=this.state.worldSize.y;if(this.terrain=new Nt(o,r,this.state.seed),this.orgGrid=new ct(o,r,U.PIXELS_PER_METER),this.FloraGrid=new ct(o,r,U.PIXELS_PER_METER),s){const a=(this.state.organisms||[]).map(n=>parseInt(n.id)).filter(n=>!isNaN(n)),c=(this.state.Flora||[]).map(n=>parseInt(n.id)).filter(n=>!isNaN(n));this.lastId=Math.max(0,...a,...c)}else this.init()}init(){for(let t=0;t<this.state.config.initialPopulation;t++)this.spawnOrganism();for(let t=0;t<G.INITIAL_FLORA;t++){const e=.4+Math.random()*.5;this.spawnFlora(void 0,void 0,e)}}hardReset(){j.hardReset(),this.logicInstances.clear(),this.state={organisms:[],Flora:[],worldSize:this.state.worldSize,time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random(),lastResetTime:new Date().toISOString()},this.lastId=0,this.terrain=new Nt(this.state.worldSize.x,this.state.worldSize.y),this.orgGrid=new ct(this.state.worldSize.x,this.state.worldSize.y,U.PIXELS_PER_METER),this.FloraGrid=new ct(this.state.worldSize.x,this.state.worldSize.y,U.PIXELS_PER_METER),this.init()}spawnOrganism(t,e,i,s,o){const r=o||(t?e?k.recombine(t.genome,e.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})():k.createRandomGenome(this.state.config)),a=k.express(r),c=it.generateFirstName(),n=t?e?Math.random()>.5?t.surname:e.surname:t.surname:it.generateSurname(),d={id:(++this.lastId).toString(),parentA_Id:t==null?void 0:t.id,parentB_Id:e==null?void 0:e.id,position:i||this.terrain.getSafeSpawnPos(),velocity:{x:(Math.random()-.5)*2,y:(Math.random()-.5)*2},heading:_.normalize({x:Math.random()-.5,y:Math.random()-.5}),energy:s!==void 0?s:t?400:this.state.config.initialEnergy[0]+Math.random()*(this.state.config.initialEnergy[1]-this.state.config.initialEnergy[0]),age:0,genome:r,expressedStats:a,color:t?t.color:`hsl(${Math.random()*360}, 70%, 60%)`,generation:t?t.generation+1:1,name:`${c} ${n}`,firstName:c,surname:n,matingTimer:0,matingCount:0,memories:[],timestamp:this.state.time,bending:0};typeof window<"u"?j.addHistory(d):self.postMessage({type:"REGISTRY_LOG",data:d}),this.state.organisms.push(d),this.logEvent("BIRTH",t?`${d.name} born to ${t.surname} clan`:`Progenitor ${d.name} enters the world`,d.position,d.id,d.color)}spawnFlora(t,e="HERBIVORE",i){const s=t||this.terrain.getSafeSpawnPos(),o=yt.create(Math.random().toString(36).substr(2,9),s,0,0,e,"Fern",V.generateGenome);i!==void 0&&(o.data.growthState=Math.max(.3,i)),o.data.biome=this.terrain.getBiomeAt(s.x,s.y),this.state.Flora.push(o.data),this.floraGridDirty=!0}logEvent(t,e,i,s,o){this.state.events||(this.state.events=[]),this.state.events.unshift({id:Math.random().toString(36).substr(2,9),type:t,message:e,timestamp:this.state.time,position:{...i},entityId:s,color:o}),this.state.events.length>50&&this.state.events.pop()}forceSave(){this.state.events&&this.state.events.length>20&&(this.state.events=this.state.events.slice(0,20)),typeof window<"u"&&(j.syncLiving(this.state.organisms),j.saveSimState(this.state))}update(){this.state.time++;const t=Ht.isHourlyTick(this.state.time);this.state.time%600===0&&this.forceSave(),this.orgGrid.update(this.state.organisms),this.floraGridDirty&&(this.FloraGrid.update(this.state.Flora),this.floraGridDirty=!1);const e=new Map;this.state.organisms.forEach(n=>e.set(n.id,n));const i=new Map;this.state.Flora.forEach(n=>i.set(n.id,n)),this.state.hour=Math.floor(this.state.time%P.FRAMES_PER_DAY/P.FRAMES_PER_HOUR);const s=Math.floor(this.state.time/P.FRAMES_PER_DAY);this.state.day=s;const o=Math.floor(s/P.DAYS_PER_SEASON),r=this.state.season;if(this.state.season=o%P.SEASONS_PER_CYCLE+1,this.state.cycle=Math.floor(o/P.SEASONS_PER_CYCLE)+1,r!==this.state.season){const n=Math.floor(G.BLOOM_COUNT_MIN+Math.random()*(G.BLOOM_COUNT_MAX-G.BLOOM_COUNT_MIN));for(let d=0;d<n;d++)this.spawnFlora();this.logEvent("MILESTONE",`Season ${this.state.season} bloom: ${n} new flora emerged`,{x:this.state.worldSize.x/2,y:this.state.worldSize.y/2},void 0,"#4ade80")}if(t){const n=V.ECOLOGY,d=G.INITIAL_FLORA*n.GLOBAL_TARGET_FLORA_MULTIPLIER,h=Math.max(0,(this.state.Flora.length-d)/Math.max(1,d)),g=n.HOURLY_RANDOM_SPAWN_CHANCE*Math.max(.08,1-h*n.GLOBAL_OVERGROWTH_PENALTY);Math.random()<g&&this.spawnFlora();const I=b.mToPx(n.CLUSTER_SEARCH_RADIUS_METERS);this.state.Flora.forEach(v=>{const u=this.FloraGrid.getNeighbors(v.position,I).map(O=>i.get(O)).filter(O=>O!==void 0),x=Math.max(0,u.filter(O=>O.id!==v.id).length),S=Math.max(0,u.reduce((O,m)=>O+m.growthState,0)-v.growthState),C=this.terrain.getFertilityAt(v.position.x,v.position.y);wt.update(v,this.terrain,{nearbyCount:x,nearbyBiomass:S,fertility:C});const B=n.CLUSTER_MAX_NEIGHBORS+Math.round(C*n.FERTILE_DENSITY_BONUS),K=Math.max(0,S-n.SPREAD_BIOMASS_THRESHOLD),W=n.CLUSTER_GROWTH_RATE*Math.max(.18,v.growthState)*(1+C*n.SPREAD_FERTILITY_BONUS)*Math.max(.2,1-K*n.SPREAD_CROWDING_PENALTY);if(x>=n.CLUSTER_MIN_NEIGHBORS&&x<B&&Math.random()<W){const O=Math.random()*Math.PI*2,m=n.CLUSTER_SPAWN_DISTANCE_MIN+Math.random()*(n.CLUSTER_SPAWN_DISTANCE_MAX-n.CLUSTER_SPAWN_DISTANCE_MIN),R=b.mToPx(m),w={x:v.position.x+Math.cos(O)*R,y:v.position.y+Math.sin(O)*R};w.x>0&&w.x<this.state.worldSize.x&&w.y>0&&w.y<this.state.worldSize.y&&!this.terrain.isImpassable(w.x,w.y)&&this.terrain.getBiomeAt(w.x,w.y)!=="CLIFF"&&this.spawnFlora(w)}}),this.state.Flora=this.state.Flora.filter(v=>v.lifetime===void 0||v.lifetime>0)}if(this.state.time%60===0)if(this.state.organisms.length>0){const n=this.state.organisms.map(g=>g.age),d=n.reduce((g,I)=>g+I,0)/n.length,h=this.state.organisms.map(g=>g.expressedStats.speed).sort((g,I)=>g-I);st.lastPopStats={meanAge:d,speed95th:h[Math.floor(h.length*.95)]||0},this.state.apexCandidates=[...this.state.organisms].sort((g,I)=>I.generation-g.generation||I.energy-g.energy).slice(0,20)}else this.state.apexCandidates=[];const a=st.lastPopStats;this.state.organisms.forEach(n=>{let d=this.logicInstances.get(n.id);if(d||(d=new jt(n),this.logicInstances.set(n.id,d)),n.matingTimer===0&&n.matingTargetId){const S=e.get(n.matingTargetId);if(S&&parseInt(n.id)<parseInt(S.id)){const C=Kt.processBirth(n,S);n.energy-=C.costToEachParent,S.energy-=C.costToEachParent,this.spawnOrganism(n,S,{...n.position},C.initialEnergy,C.childGenome),n.matingCount++,S.matingCount++}n.matingTargetId=void 0}const h=b.mToPx(n.expressedStats.sight_range),g=b.mToPx(n.expressedStats.audible_range||3),I=Math.max(h,g),T=this.FloraGrid.getNeighbors(n.position,h).map(S=>i.get(S)).filter(S=>S!==void 0),x=this.orgGrid.getNeighbors(n.position,I).map(S=>e.get(S)).filter(S=>S!==void 0&&S.id!==n.id);d.think(this.state.time,this.state.worldSize,this.terrain,a,{organisms:x,flora:T},{onEat:S=>{n.energy+=S.energyValue*Math.max(.35,S.growthState);const C=this.state.Flora.findIndex(B=>B.id===S.id);C!==-1&&(this.state.Flora.splice(C,1),this.floraGridDirty=!0)},onMate:S=>{if(n.matingTimer===0&&S.matingTimer===0){const C=G.MATING_BOND_DURATION_HOURS*P.FRAMES_PER_HOUR;n.matingTimer=C,n.matingTargetId=S.id,S.matingTimer=C,S.matingTargetId=n.id,this.logEvent("MILESTONE",`${n.name} & ${S.name} are bonding`,n.position)}}}),d.update(this.state.time,this.state.worldSize,this.terrain,a)}),this.state.organisms=this.state.organisms.filter(n=>{const d=n.age>n.expressedStats.lifespan||n.energy<=0;return d&&(this.logicInstances.delete(n.id),this.spawnFlora(n.position,"CARNIVORE"),typeof window<"u"?j.markDeceased(n.id,n):self.postMessage({type:"REGISTRY_DEATH",id:n.id,data:n})),!d});const c=this.state.Flora.length;this.state.Flora=this.state.Flora.filter(n=>n.lifetime===void 0||n.lifetime>0),this.state.Flora.length!==c&&(this.floraGridDirty=!0)}};st.lastPopStats={meanAge:0,speed95th:0};let vt=st;function Jt(l){const t=l.expressedStats.speed/1.5,e=Zt(1-t,.2,1);return{primaryColor:l.color,skeletalRigidity:e}}function Zt(l,t,e){return Math.max(t,Math.min(e,l))}const E=class E{constructor(t){this.terrainInitialized=!1,this.useHalfFloat=!1,this.quantScale={pos:1,vel:1,misc:1},this.colorCache=new Map,this.prevVelocities=new Map,this.jiggleStates=new Map;const e=t.getContext("webgl2",{alpha:!1,antialias:!0,preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const i=e.getParameter(e.MAX_TEXTURE_SIZE);E.MAX_INSTANCES=Math.max(2048,Math.min(8192,i||8192)),this.useHalfFloat=!1,this.quantScale={pos:1,vel:1,misc:1};const s=E.MAX_INSTANCES*4*6,o=E.MAX_INSTANCES*4*2;this.orgDataBuffer=new Float32Array(s),this.floraDataBuffer=new Float32Array(o),this.program=this.createProgram(E.VERT_SHADER,E.FRAG_SHADER),this.faunaProgram=this.createProgram(E.FAUNA_VERT_SHADER,E.FAUNA_FRAG_SHADER),this.floraProgram=this.createProgram(E.FLORA_VERT_SHADER,E.FLORA_FRAG_SHADER),this.quadBuffer=this.createQuad(),this.faunaUnitQuadBuffer=this.createQuad(),this.floraUnitQuadBuffer=this.createQuad(),this.instanceIDBuffer=this.gl.createBuffer();const r=new Int32Array(E.MAX_INSTANCES);for(let a=0;a<E.MAX_INSTANCES;a++)r[a]=a;this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.instanceIDBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,r,this.gl.STATIC_DRAW),this.orgTexture=this.createDataTexture(E.MAX_INSTANCES,6,this.useHalfFloat),this.floraTexture=this.createDataTexture(E.MAX_INSTANCES,2,this.useHalfFloat),this.terrainTexture=e.createTexture()}createShader(t,e){const i=this.gl.createShader(t);if(this.gl.shaderSource(i,e),this.gl.compileShader(i),!this.gl.getShaderParameter(i,this.gl.COMPILE_STATUS))throw new Error("Shader compile error: "+this.gl.getShaderInfoLog(i));return i}createProgram(t,e){const i=this.createShader(this.gl.VERTEX_SHADER,t),s=this.createShader(this.gl.FRAGMENT_SHADER,e),o=this.gl.createProgram();if(this.gl.attachShader(o,i),this.gl.attachShader(o,s),this.gl.linkProgram(o),!this.gl.getProgramParameter(o,this.gl.LINK_STATUS))throw new Error("Program link error: "+this.gl.getProgramInfoLog(o));return o}createQuad(){const t=this.gl.createBuffer();return this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),t}createDataTexture(t,e,i){const s=this.gl,o=s.createTexture();s.bindTexture(s.TEXTURE_2D,o);const r=i?s.RGBA16F:s.RGBA32F,a=s.FLOAT;return s.texImage2D(s.TEXTURE_2D,0,r,t,e,0,s.RGBA,a,null),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,s.NEAREST),o}computeJiggleEvent(t,e){if(!e)return 0;const i=Math.hypot(t.velocity.x,t.velocity.y),s=Math.hypot(e.x,e.y),o=Math.abs(i-s),r=Math.abs(e.x*t.velocity.y-e.y*t.velocity.x),a=e.x*t.velocity.x+e.y*t.velocity.y,c=s<.05&&i>.05||i<.05&&s>.05?.4:0,n=Math.min(1,r*1.6),d=Math.min(1,o*1.25),h=a<0?Math.min(1,-a*.9):0,g=Math.min(1,Math.max(i,s)*.4+.25),v=Math.min(1,n+d+h+c)*(.5+g*.5);return Math.min(1,Math.max(v,.02))}updateJiggleState(t,e,i){const s=this.jiggleStates.get(t);if(!s){e>.01&&this.jiggleStates.set(t,{amp:e,timestamp:i});return}const o=Math.max(0,s.amp-(i-s.timestamp)*E.JIGGLE_DECAY);if(o<=.01){this.jiggleStates.delete(t),e>.01&&this.jiggleStates.set(t,{amp:e,timestamp:i});return}e>o+.02&&this.jiggleStates.set(t,{amp:e,timestamp:i})}static parseHSL(t){const e=t.match(/hsl\((\d+\.?\d*),\s*(\d+)%,\s*(\d+)%\)/);if(!e)return[.5,.5,.5];const i=parseFloat(e[1])/360,s=parseInt(e[2])/100,o=parseInt(e[3])/100,r=(n,d,h)=>(h<0&&(h+=1),h>1&&(h-=1),h<1/6?n+(d-n)*6*h:h<1/2?d:h<2/3?n+(d-n)*(2/3-h)*6:n),a=o<.5?o*(1+s):o+s-o*s,c=2*o-a;return[r(c,a,i+1/3),r(c,a,i),r(c,a,i-1/3)]}updateTerrainTexture(t,e){const i=this.gl,s=512,o=new Uint8Array(s*s*4);for(let r=0;r<s;r++)for(let a=0;a<s;a++){const c=t.getBiomeAt(a/s*e.x,r/s*e.y),n=(r*s+a)*4;c==="GRASS"?o[n]=255:c==="CLIFF"&&(o[n]=127,o[n+1]=255),o[n+3]=255}i.bindTexture(i.TEXTURE_2D,this.terrainTexture),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,s,s,0,i.RGBA,i.UNSIGNED_BYTE,o),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),this.terrainInitialized=!0}render(t){const e=this.gl,i=1/t.zoom,s=(0-t.cameraOffset[0])*i-100,o=(t.logicalResolution[0]-t.cameraOffset[0])*i+100,r=(0-t.cameraOffset[1])*i-100,a=(t.logicalResolution[1]-t.cameraOffset[1])*i+100,c=Math.max(256/t.zoom,128),n=Math.floor(s/c),d=Math.floor(o/c),h=Math.floor(r/c),g=Math.floor(a/c),I=(f,Y)=>{const L=Math.floor(f/c),M=Math.floor(Y/c);return L>=n&&L<=d&&M>=h&&M<=g},v=t.organisms.filter(f=>f.position.x>s&&f.position.x<o&&f.position.y>r&&f.position.y<a&&I(f.position.x,f.position.y)),T=t.Flora.filter(f=>f.position.x>s&&f.position.x<o&&f.position.y>r&&f.position.y<a&&I(f.position.x,f.position.y));e.viewport(0,0,t.resolution[0],t.resolution[1]);const u=this.orgDataBuffer,x=v.length,S=Math.min(x,E.MAX_INSTANCES);let C=0;const B=t.time/P.FPS,K=(f,Y)=>{u.fill(0);const L=new Map;for(let M=0;M<Y;M++)L.set(v[f+M].id,M);for(let M=0;M<Y;M++){const A=v[f+M],J=Jt(A);let q=this.colorCache.get(A.id);q||(q=E.parseHSL(J.primaryColor),this.colorCache.set(A.id,q));const[Qt,te,ee]=q,Lt=b.cmToPx(A.expressedStats.size),ht=M*4;u[ht]=A.position.x*this.quantScale.pos,u[ht+1]=A.position.y*this.quantScale.pos,u[ht+2]=Lt*.4,u[ht+3]=Lt*.2;const mt=(E.MAX_INSTANCES+M)*4;u[mt]=Qt,u[mt+1]=te,u[mt+2]=ee,u[mt+3]=parseFloat(A.id);const ut=(E.MAX_INSTANCES*2+M)*4;u[ut]=A.velocity.x*this.quantScale.vel,u[ut+1]=A.velocity.y*this.quantScale.vel,u[ut+2]=A.expressedStats.sight_fov,u[ut+3]=A.id===t.selectedId?1:0;const ft=(E.MAX_INSTANCES*3+M)*4;u[ft]=(A.bending||0)*J.skeletalRigidity;let Gt=-1;if(A.matingTimer&&A.matingTimer>0&&A.matingTargetId){const Bt=L.get(A.matingTargetId);Bt!==void 0&&(Gt=Bt)}u[ft+1]=Gt,u[ft+2]=b.mToPx(A.expressedStats.sight_range),u[ft+3]=b.mToPx(A.expressedStats.audible_range||3)+(A.isHearingActive?1e4:0);const nt=(E.MAX_INSTANCES*4+M)*4;u[nt]=b.mToPx(A.expressedStats.communicating_range||1.5)+(A.isTransmittingActive?1e4:0);const ie=A.energy>28e3?1:0,se=A.matingTimer&&A.matingTimer>0?A.matingTimer/120:0;u[nt+1]=ie+se,u[nt+2]=Math.min(1,A.energy/3e4);const gt=this.prevVelocities.get(A.id);gt?u[nt+3]=(gt.x*A.velocity.y-gt.y*A.velocity.x)*5:u[nt+3]=0;const oe=this.computeJiggleEvent(A,gt);this.updateJiggleState(A.id,oe,B);const St=this.jiggleStates.get(A.id),_t=(E.MAX_INSTANCES*5+M)*4;u[_t]=St?St.amp:0,u[_t+1]=St?St.timestamp:0,u[_t+2]=0,u[_t+3]=0}},W=()=>{for(;C<x;){const f=Math.min(E.MAX_INSTANCES,x-C);K(C,f),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,E.MAX_INSTANCES,6,e.RGBA,e.FLOAT,u),e.uniform1i(e.getUniformLocation(this.faunaProgram,"u_orgCount"),f),e.drawArraysInstanced(e.TRIANGLES,0,6,f),C+=f}};v.forEach(f=>{this.prevVelocities.set(f.id,{x:f.velocity.x,y:f.velocity.y})}),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,E.MAX_INSTANCES,6,e.RGBA,e.FLOAT,u);const O=this.floraDataBuffer,m=T.length;let R=0;const w=(f,Y)=>{O.fill(0);for(let L=0;L<Y;L++){const M=T[f+L],A=L*4;O[A]=M.position.x*this.quantScale.pos,O[A+1]=M.position.y*this.quantScale.pos,O[A+2]=M.growthState,O[A+3]=M.complexity;const J=(E.MAX_INSTANCES+L)*4,q=E.parseHSL(M.color);O[J]=q[0],O[J+1]=q[1],O[J+2]=q[2],O[J+3]=parseFloat(M.id)}},D=()=>{for(;R<m;){const f=Math.min(E.MAX_INSTANCES,m-R);w(R,f),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,E.MAX_INSTANCES,2,e.RGBA,e.FLOAT,O),e.uniform1i(e.getUniformLocation(this.floraProgram,"u_floraCount"),f),e.drawArraysInstanced(e.TRIANGLES,0,6,f),R+=f}};e.useProgram(this.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.terrainTexture);const N=(f,Y,L)=>{const M=e.getUniformLocation(f,Y);M&&e.uniform1f(M,L)},F=(f,Y,L,M)=>e.uniform2f(e.getUniformLocation(f,Y),L,M),z=f=>{F(f,"u_logicalResolution",t.logicalResolution[0],t.logicalResolution[1]),F(f,"u_cameraOffset",t.cameraOffset[0],t.cameraOffset[1]),N(f,"u_zoom",t.zoom),N(f,"u_time",t.time/P.FPS),N(f,"u_selectedId",t.selectedId?parseFloat(t.selectedId):-1),N(f,"u_hoveredId",t.hoveredId?parseFloat(t.hoveredId):-1),N(f,"u_maxInstances",E.MAX_INSTANCES),N(f,"u_posDecode",1/this.quantScale.pos),N(f,"u_velDecode",1/this.quantScale.vel)};z(this.program),F(this.program,"u_resolution",t.resolution[0],t.resolution[1]),F(this.program,"u_worldSize",t.worldSize[0],t.worldSize[1]),N(this.program,"u_showVision",t.showVision?1:0),N(this.program,"u_showHearing",t.showHearing?1:0),N(this.program,"u_showCommunication",t.showCommunication?1:0),N(this.program,"u_showGrid",t.showGrid?1:0),e.uniform1i(e.getUniformLocation(this.program,"u_orgTexture"),0),e.uniform1i(e.getUniformLocation(this.program,"u_terrainTexture"),1),e.uniform1i(e.getUniformLocation(this.program,"u_orgCount"),S);const H=t.organisms.find(f=>f.id===t.selectedId),$=t.organisms.find(f=>f.id===t.hoveredId);F(this.program,"u_selectedPos",H?H.position.x:-1e3,H?H.position.y:-1e3),N(this.program,"u_selectedSize",H?b.cmToPx(H.expressedStats.size)*.5:0),F(this.program,"u_hoveredPos",$?$.position.x:-1e3,$?$.position.y:-1e3),N(this.program,"u_hoveredSize",$?b.cmToPx($.expressedStats.size)*.5:0),e.bindBuffer(e.ARRAY_BUFFER,this.quadBuffer);const Pt=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(Pt),e.vertexAttribPointer(Pt,2,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLES,0,6),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.useProgram(this.faunaProgram),z(this.faunaProgram),N(this.faunaProgram,"u_jiggleDecay",E.JIGGLE_DECAY),N(this.faunaProgram,"u_jiggleThreshold",E.JIGGLE_THRESHOLD),N(this.faunaProgram,"u_jiggleZoomGate",E.JIGGLE_ZOOM_GATE),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.uniform1i(e.getUniformLocation(this.faunaProgram,"u_orgTexture"),0),N(this.faunaProgram,"u_showVision",t.showVision?1:0),N(this.faunaProgram,"u_showHearing",t.showHearing?1:0),N(this.faunaProgram,"u_showCommunication",t.showCommunication?1:0),e.bindBuffer(e.ARRAY_BUFFER,this.faunaUnitQuadBuffer);const Dt=e.getAttribLocation(this.faunaProgram,"a_unitPosition");e.enableVertexAttribArray(Dt),e.vertexAttribPointer(Dt,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const ot=e.getAttribLocation(this.faunaProgram,"a_instanceID");e.enableVertexAttribArray(ot),e.vertexAttribIPointer(ot,1,e.INT,0,0),e.vertexAttribDivisor(ot,1),W(),e.disableVertexAttribArray(ot),e.vertexAttribDivisor(ot,0),e.useProgram(this.floraProgram),z(this.floraProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.uniform1i(e.getUniformLocation(this.floraProgram,"u_floraTexture"),0),e.bindBuffer(e.ARRAY_BUFFER,this.floraUnitQuadBuffer);const Ft=e.getAttribLocation(this.floraProgram,"a_unitPosition");e.enableVertexAttribArray(Ft),e.vertexAttribPointer(Ft,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const at=e.getAttribLocation(this.floraProgram,"a_instanceID");e.enableVertexAttribArray(at),e.vertexAttribIPointer(at,1,e.INT,0,0),e.vertexAttribDivisor(at,1),D(),e.disableVertexAttribArray(at),e.vertexAttribDivisor(at,0),e.disable(e.BLEND)}};E.MAX_INSTANCES=2048,E.JIGGLE_DECAY=3.5,E.JIGGLE_THRESHOLD=.02,E.JIGGLE_ZOOM_GATE=.4,E.VERT_SHADER=`#version 300 es
        in vec2 a_position;
        out vec2 v_texCoord;
        void main() {
            v_texCoord = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `,E.FRAG_SHADER=`#version 300 es
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
    `,E.FAUNA_VERT_SHADER=`#version 300 es
        // === GPGPU FAUNA VERTEX SHADER ===
        // Reactive trailing jelly stretch + side-to-side jiggle
        in vec2 a_unitPosition;
        in int a_instanceID;

        out vec2 v_localCoord;
        out float v_id;
        flat out int v_instanceID;
        out vec2 v_worldCenter;
        out float v_jiggleStrength;

        uniform sampler2D u_orgTexture;
        uniform vec2 u_cameraOffset;
        uniform float u_zoom;
        uniform vec2 u_logicalResolution;
        uniform float u_time;
        uniform float u_posDecode;
        uniform float u_velDecode;
        uniform float u_maxInstances;
        uniform float u_jiggleDecay;
        uniform float u_jiggleThreshold;
        uniform float u_jiggleZoomGate;

        const float ORG_ROW_COUNT = 6.0;
        const float LENGTH_EXTEND = 1.1;
        float rowY(float idx) {
            return (idx + 0.5) / ORG_ROW_COUNT;
        }

        void main() {
            float maxInst = u_maxInstances;
            float tx = (float(a_instanceID) + 0.5) / maxInst;
            vec4 d1 = texture(u_orgTexture, vec2(tx, rowY(0.0))); 
            vec2 pos = d1.xy * u_posDecode;
            float size = d1.z;
            float skeletalLength = d1.w;
            float extendedSkeleton = skeletalLength * LENGTH_EXTEND;

            vec4 d3 = texture(u_orgTexture, vec2(tx, rowY(2.0)));
            vec2 vel = d3.xy * u_velDecode;

            vec4 d4 = texture(u_orgTexture, vec2(tx, rowY(3.0)));
            float sightRange = d4.z;
            float audibleRange = d4.w;
            vec4 d5 = texture(u_orgTexture, vec2(tx, rowY(4.0)));
            float commRange = d5.x;
            vec4 d6 = texture(u_orgTexture, vec2(tx, rowY(5.0)));

            float maxSense = max(sightRange, max(audibleRange, commRange));
            float bodyBound = size + extendedSkeleton + 15.0;
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

            float rawImpulse = max(0.0, d6.x - max(0.0, u_time - d6.y) * u_jiggleDecay);
            float zoomGate = step(u_jiggleZoomGate, u_zoom);
            float gatedImpulse = max(0.0, rawImpulse - u_jiggleThreshold);
            float impulse = zoomGate * gatedImpulse;
            if (impulse > 0.0) {
                stretchedPos += perpDir * impulse * 3.0;
                stretchedPos -= moveDir * impulse * 0.35;
                stretchAmount += impulse * 0.5;
            }
            v_jiggleStrength = impulse;

            v_localCoord = stretchedPos;
            v_id = texture(u_orgTexture, vec2(tx, rowY(1.0))).w;
            v_instanceID = a_instanceID;
            v_worldCenter = pos;

            vec2 worldPos = pos + v_localCoord;
            vec2 screenPos = worldPos * u_zoom + u_cameraOffset;
            vec2 clipPos = (screenPos / u_logicalResolution) * 2.0 - 1.0;
            gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
        }
    `,E.FAUNA_FRAG_SHADER=`#version 300 es
        // === GPGPU FAUNA FRAGMENT SHADER ===
        // Inertial warp + smooth mating fusion + GPU visuals
        precision highp float;
        in vec2 v_localCoord;
        in float v_id;
        flat in int v_instanceID;
        in vec2 v_worldCenter;
        in float v_jiggleStrength;
        
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
        uniform float u_maxInstances;

        const float ORG_ROW_COUNT = 6.0;
        const float LENGTH_EXTEND = 1.1;
        float rowY(float idx) {
            return (idx + 0.5) / ORG_ROW_COUNT;
        }

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
            float maxInst = u_maxInstances;
            float tx = (float(v_instanceID) + 0.5) / maxInst;
            vec4 d1 = texture(u_orgTexture, vec2(tx, rowY(0.0)));
            vec2 pos = d1.xy;
            float size = d1.z;
            float skeletalLength = d1.w;
            float extendedSkeleton = skeletalLength * LENGTH_EXTEND;
            
            vec4 d2 = texture(u_orgTexture, vec2(tx, rowY(1.0)));
            vec3 col = d2.rgb;
            float id = d2.w;
            
            vec4 d3 = texture(u_orgTexture, vec2(tx, rowY(2.0)));
            vec2 vel = d3.xy;
            float fov = d3.z;
            float isSelected = d3.w;

            vec4 d4 = texture(u_orgTexture, vec2(tx, rowY(3.0)));
            float bending = d4.x;
            float mateIndex = d4.y;
            float sightRange = d4.z;
            float rawAudible = d4.w;
            float isHearingActive = step(10000.0, rawAudible);
            float audibleRange = mod(rawAudible, 10000.0);

            vec4 d5 = texture(u_orgTexture, vec2(tx, rowY(4.0)));
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
            vec2 pA = dir * (extendedSkeleton * 0.5);
            vec2 pB = -dir * (extendedSkeleton * 0.5);
            float r = size * (0.95 + 0.05 * sin(u_time * 0.1 + v_id));
            
            float dBody = sdCapsule(warpedP, pA, pB, r);

            // --- MEATBALL FUSION ---
            if (mateIndex > -0.5 && matingFactor > 0.01) {
                float mTx = (mateIndex + 0.5) / maxInst;
                vec4 mD1 = texture(u_orgTexture, vec2(mTx, rowY(0.0)));
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

            if (v_jiggleStrength > 0.01) {
                float glow = pow(v_jiggleStrength, 0.75);
                finalCol += vec3(1.0, 0.65, 0.35) * glow * 0.4;
                finalAlpha = max(finalAlpha, glow * 0.45);
            }

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
    `,E.FLORA_VERT_SHADER=`#version 300 es
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
        uniform float u_posDecode;
        uniform float u_maxInstances;

        void main() {
            float maxInst = u_maxInstances;
            float tx = (float(a_instanceID) + 0.5) / maxInst;
            vec4 d1 = texture(u_floraTexture, vec2(tx, 0.25)); // x, y, growth, complexity
            vec2 fPos = d1.xy * u_posDecode;
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
    `,E.FLORA_FRAG_SHADER=`#version 300 es
        precision highp float;
        in vec2 v_localCoord;
        in float v_growth;
        in float v_complexity;
        in vec4 v_color;
        in vec2 v_worldCenter;
        in float v_jiggleStrength;
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
    `;let Rt=E,p=null,X=null,Ot=!1,dt=0,y={cameraOffset:[0,0],zoom:1,selectedId:null,hoveredId:null,isFollowing:!1,showVision:!1,showGrid:!1,showHearing:!1,showCommunication:!1,dpr:1,resolution:[1920,1080]};self.onmessage=l=>{const{type:t,data:e}=l.data;switch(t){case"INIT":const{canvas:i,worldSize:s,initialState:o,resolution:r}=e;console.log("[Worker] Initializing Engine & Renderer..."),p=new vt(s.x,s.y,o),r&&(y.resolution=r,y.dpr=e.dpr||1,i.width=r[0],i.height=r[1]),X=new Rt(i),X.updateTerrainTexture(p.terrain,s),performance.now(),console.log("[Worker] Initialization Complete. Starting Tick."),requestAnimationFrame(At);break;case"UPDATE_CAMERA":y={...y,...e};break;case"SET_PAUSED":Ot=e;break;case"RESIZE":y.resolution=[e.width,e.height],X&&X.gl.canvas&&(X.gl.canvas.width=e.width,X.gl.canvas.height=e.height);break;case"HIT_TEST":if(p){const{x:a,y:c}=e,n=a,d=c;let h=null;for(const g of p.state.organisms){const I=(g.position.x-n)**2+(g.position.y-d)**2,v=g.expressedStats.size*.4+25;if(I<v*v){h=g.id;break}}if(!h){for(const g of p.state.Flora)if((g.position.x-n)**2+(g.position.y-d)**2<900){h=g.id;break}}self.postMessage({type:"HIT_RESULT",data:h,originalEvent:e.originalEvent})}break;case"UPDATE_CONFIG":p&&(p.state.config=e);break;case"RESET":p&&p.hardReset();break}};function At(l){if(!p||!X){requestAnimationFrame(At);return}if(!Ot){if(p.update(),p.state.organisms.length===0?(dt++,dt>=300&&(console.warn("[Worker] Extinction detected — all organisms dead. Auto-resetting simulation."),p.hardReset(),X.updateTerrainTexture(p.terrain,p.state.worldSize),dt=0,self.postMessage({type:"STATE_REFRESH",data:{time:p.state.time,day:p.state.day,hour:p.state.hour,popCount:p.state.organisms.length,floraCount:p.state.Flora.length,events:p.state.events.slice(0,5),apexCandidates:p.state.apexCandidates,selectedEntity:null,hoveredEntity:null,lastResetTime:p.state.lastResetTime}}))):dt=0,y.isFollowing&&y.selectedId){const t=p.state.organisms.find(e=>e.id===y.selectedId);if(t){const e=y.resolution[0]/y.dpr,i=y.resolution[1]/y.dpr,s=e/2-t.position.x*y.zoom,o=i/2-t.position.y*y.zoom;y.cameraOffset[0]+=(s-y.cameraOffset[0])*.1,y.cameraOffset[1]+=(o-y.cameraOffset[1])*.1,self.postMessage({type:"CAMERA_SYNC",data:{offset:y.cameraOffset}})}}if(p.state.time%10===0){const t=y.selectedId?p.state.organisms.find(i=>i.id===y.selectedId)||p.state.Flora.find(i=>i.id===y.selectedId):null,e=!y.selectedId&&y.hoveredId?p.state.organisms.find(i=>i.id===y.hoveredId)||p.state.Flora.find(i=>i.id===y.hoveredId):null;self.postMessage({type:"STATE_REFRESH",data:{time:p.state.time,day:p.state.day,hour:p.state.hour,popCount:p.state.organisms.length,floraCount:p.state.Flora.length,events:p.state.events.slice(0,5),apexCandidates:p.state.apexCandidates,selectedEntity:t,hoveredEntity:e,lastResetTime:p.state.lastResetTime}})}p.state.time%600===0&&self.postMessage({type:"SAVE_REQUIRED",data:p.state})}X.render({resolution:y.resolution,logicalResolution:[y.resolution[0]/y.dpr,y.resolution[1]/y.dpr],worldSize:[p.state.worldSize.x,p.state.worldSize.y],cameraOffset:y.cameraOffset,zoom:y.zoom,time:p.state.time,organisms:p.state.organisms,Flora:p.state.Flora,selectedId:y.selectedId,hoveredId:y.hoveredId,isFollowing:y.isFollowing,dpr:y.dpr,showVision:y.showVision,showGrid:y.showGrid,showHearing:y.showHearing,showCommunication:y.showCommunication}),requestAnimationFrame(At)}})();
