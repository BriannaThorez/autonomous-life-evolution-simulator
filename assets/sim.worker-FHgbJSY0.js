(function(){"use strict";const _={dist:(c,t)=>Math.sqrt((c.x-t.x)**2+(c.y-t.y)**2),distSq:(c,t)=>(c.x-t.x)**2+(c.y-t.y)**2,normalize:c=>{const t=Math.sqrt(c.x*c.x+c.y*c.y);return t===0?{x:0,y:0}:{x:c.x/t,y:c.y/t}},dot:(c,t)=>c.x*t.x+c.y*t.y,angleBetween:(c,t)=>{const e=_.dot(_.normalize(c),_.normalize(t));return Math.acos(Math.max(-1,Math.min(1,e)))},sub:(c,t)=>({x:c.x-t.x,y:c.y-t.y}),add:(c,t)=>({x:c.x+t.x,y:c.y+t.y}),mul:(c,t)=>({x:c.x*t,y:c.y*t}),limit:(c,t)=>{const e=c.x*c.x+c.y*c.y;if(e>t*t){const i=Math.sqrt(e);return{x:c.x/i*t,y:c.y/i*t}}return c},seek:(c,t,e)=>{const i={x:t.x-c.x,y:t.y-c.y},s=Math.sqrt(i.x*i.x+i.y*i.y);if(s===0)return{x:0,y:0};const o={x:i.x/s,y:i.y/s};return{x:o.x*e,y:o.y*e}}},k={NAME_INHERITANCE_CHANCE:.05,FIRST_NAME_SYLLABLES_MIN:2,FIRST_NAME_SYLLABLES_RANGE:2,SURNAME_SYLLABLES_MIN:2,SURNAME_SYLLABLES_RANGE:2},j={plosives:["p","t","k","b","d","g","pr","tr"],fricatives:["s","f","v","th","sh","z","h"],nasals:["m","n","gn","ny"],vowels:["a","e","i","o","u","y"]},gt=["ae","ou","ai","ea"],St=["m","n","t","k","l","sh","th"],nt={NOBILITY_MATING_THRESHOLD:10,NOBILITY_AGE_THRESHOLD_DAYS:1,PROLIFIC_MATING_THRESHOLD:5},D={PIXELS_PER_METER:20,CM_TO_M:.01},N={FPS:60,HOURS_PER_DAY:24,DAYS_PER_SEASON:20,SEASONS_PER_CYCLE:4,FRAMES_PER_DAY:1800,FRAMES_PER_HOUR:75,COMM_COOLDOWN_TICKS:300},xt={isHourlyTick:c=>c%N.FRAMES_PER_HOUR===0},rt={DAYS_TO_REMEMBER:12,TEMPORARY_MEMORY_LIMIT:200,PERSISTENT_MEMORY_LIMIT:200},z={PERCEPTION_COOLDOWN_TICKS:60,FOOD_MEMORY_ENERGY_THRESHOLD:100,MEMORY_CONFIDENCE_PENALTY:.8,FOOD_DESIRABILITY_DISTANCE_WEIGHT:1,MEMORY_PRUNING_RADIUS_METERS:15},pt={MUTATION_STRENGTH:.12,PHYSICAL_LIMITS:{speed:[.1,5],size:[2,150],metabolism:[.1,5],sight_range:[2,100],sight_fov:[.1,Math.PI*2],lifespan:[100,1e3*(3600*24)],audible_range:[1,20],communicating_range:[.5,10]}},P={INITIAL_ORGANISMS:20,INITIAL_FLORA:90,BLOOM_COUNT_MIN:10,BLOOM_COUNT_MAX:20,BIRTH_COST_BASE:25e3,INITIAL_ENERGY:[7e3,8e3],MATING_ENERGY_THRESHOLD:2e4,MATING_BOND_DURATION_HOURS:2.5},V={TRAIT_SURCHARGE_SPEED_WEIGHT:150,TRAIT_SURCHARGE_SIZE_WEIGHT:5,TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT:20,TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT:1,TRAIT_SURCHARGE_LIFESPAN_WEIGHT:1e-4},X={speed:[1.2,1.5],size:[75,85],metabolism:[.4,.5],sight_range:[15,18],sight_fov:[85*Math.PI/180,95*Math.PI/180],lifespan:[72e3,108e3],audible_range:[3.5,4.5],communicating_range:[2.5,3.5]},I={mToPx:c=>c*D.PIXELS_PER_METER,pxToM:c=>c/D.PIXELS_PER_METER,cmToPx:c=>c*D.CM_TO_M*D.PIXELS_PER_METER,toInternalSpeed:c=>c*D.PIXELS_PER_METER/N.FPS,toDisplaySpeed:c=>c*N.FPS/D.PIXELS_PER_METER,toDegrees:c=>c*180/Math.PI,toRadians:c=>c*Math.PI/180,toDays:c=>c/1800},F={createRandomGenome:c=>{const t={},e=(c==null?void 0:c.traitRanges)||X;return Object.keys(e).forEach(i=>{if(!e[i])return;const s=e[i],o=Math.random()*(s[1]-s[0])+s[0],r=o;t[i]={v1:o,v2:r,d1:Math.random(),d2:Math.random()}}),{traits:t}},express:c=>{const t={};return Object.keys(c.traits).forEach(e=>{const i=c.traits[e];t[e]=i.d1>=i.d2?i.v1:i.v2}),t},mutate:(c,t)=>{const e={},i=(t==null?void 0:t.traitRanges)||X,s=pt.MUTATION_STRENGTH,o=pt.PHYSICAL_LIMITS;return Object.keys(c.traits).forEach(r=>{const a=c.traits[r],h=i[r],n=o[r],l=S=>{const T=h[1]-h[0],M=(Math.random()*2-1)*s*T;return Math.max(n[0],Math.min(n[1],S+M))},f=S=>{const T=(Math.random()*2-1)*s*.5;return Math.max(0,Math.min(1,S+T))};e[r]={v1:l(a.v1),v2:l(a.v2),d1:f(a.d1),d2:f(a.d2)}}),{traits:e}},recombine:(c,t)=>{const e={};return Object.keys(c.traits).forEach(i=>{const s=c.traits[i],o=t.traits[i];e[i]={v1:Math.random()>.5?s.v1:o.v1,v2:Math.random()>.5?s.v2:o.v2,d1:Math.random()>.5?s.d1:o.d1,d2:Math.random()>.5?s.d2:o.d2}}),{traits:e}},ensureIntegrity:c=>{const t=X;Object.keys(t).forEach(e=>{if(!c.traits[e]){const i=t[e],s=Math.random()*(i[1]-i[0])+i[0];c.traits[e]={v1:s,v2:s,d1:Math.random(),d2:Math.random()}}})}},lt={organisms:"o",Flora:"f",position:"p",velocity:"v",expressedStats:"es",genome:"g",traits:"tr",memories:"m",id:"i",timestamp:"t",energy:"e",age:"a",generation:"gn",matingCount:"mc",matingTimer:"mt",matingTargetId:"mti",firstName:"fn",surname:"sn",name:"n",color:"c",bending:"b",parentId:"pi",parentA_Id:"pa",parentB_Id:"pb",growthState:"gs",complexity:"cx",lifetime:"lt",biome:"bm",type:"tp",config:"cfg",initialPopulation:"ip",initialEnergy:"ie",traitRanges:"trr"},At=Object.fromEntries(Object.entries(lt).map(([c,t])=>[t,c])),Q={STATE:"ales_sim_state",SETTINGS:"ales_settings"};class It{constructor(){this.organisms=new Map,this.documents=[],this.settingsCache=new Map,this.eventsCache=[],this.dirtyOrganisms=new Set,this.surnameIndex=new Map,this.familyCountIndex=new Map,this.SAVE_DEBOUNCE_MS=1e3,this.saveTimeout=null,this.DB_NAME="ales_persistence_v2",this.DB_STORES={ORGANISMS:"organisms",EVENTS:"events",SYSTEM:"system"},this.DB_VERSION=1,this.dbPromise=null,this.isReady=!1,this.lastSaveMs=0,this.lastLoadMs=0,this.lastSaveOrgCount=0,this.saveCount=0,this.initDocs()}async init(){if(this.isReady)return;const t=performance.now();try{console.log("[VDB] Opening Database...");const e=await this.openDB();console.log("[VDB] Database opened. Fetching stores...");const[i,s,o]=await Promise.all([this.getAllFromStore(this.DB_STORES.SYSTEM),this.getAllFromStore(this.DB_STORES.ORGANISMS),this.getAllFromStore(this.DB_STORES.EVENTS)]);console.log(`[VDB] Stores fetched: System(${i.length}), Organisms(${s.length}), Events(${o.length})`),i.forEach(({key:r,value:a})=>{r===Q.SETTINGS&&Object.entries(a).forEach(([h,n])=>this.settingsCache.set(h,n))}),console.log("[VDB] Detokenizing organisms..."),s.forEach(({key:r,value:a})=>{try{const h=this.detokenize(a);this.organisms.set(h.id,h)}catch(h){console.error(`[VDB] Hydration Error: Failed to detokenize organism ${r}`,h)}}),console.log("[VDB] Refreshing indices..."),this.refreshIndices(),console.log("[VDB] Detokenizing events..."),this.eventsCache=this.detokenize(o.map(r=>r.value)),console.log("[VDB] Hydration complete.")}catch(e){console.warn("[VDB] init() failed, check IndexedDB state",e)}this.isReady=!0,this.lastLoadMs=performance.now()-t,console.log(`[VDB] Init complete in ${this.lastLoadMs.toFixed(1)}ms (${this.organisms.size} records)`)}getSetting(t,e){const i=this.settingsCache.get(t);return i!==void 0?i:e}setSetting(t,e){this.settingsCache.set(t,e);const i=Object.fromEntries(this.settingsCache);this.idbPut(this.DB_STORES.SYSTEM,Q.SETTINGS,i).catch(()=>{})}saveSimState(t){const e=()=>{var r;const i=performance.now(),s=this.tokenizeAndPrune(t),o=((r=t.organisms)==null?void 0:r.length)||0;this.idbPut(this.DB_STORES.SYSTEM,Q.STATE,s).then(()=>{this.lastSaveMs=performance.now()-i,this.lastSaveOrgCount=o,this.saveCount++,t.organisms&&this.syncLiving(t.organisms)}).catch(()=>{})};typeof window<"u"&&"requestIdleCallback"in window?window.requestIdleCallback(()=>e(),{timeout:2e3}):setTimeout(e,0)}tokenizeAndPrune(t){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(i=>this.tokenizeAndPrune(i));const e={};for(const i in t){if(i==="expressedStats"||i==="events")continue;const s=lt[i]||i;let o=t[i];i==="memories"&&Array.isArray(o)&&o.length>rt.PERSISTENT_MEMORY_LIMIT&&(o=o.slice(-200)),e[s]=this.tokenizeAndPrune(o)}return e}async loadSimState(){try{const t=await this.idbGet(this.DB_STORES.SYSTEM,Q.STATE);if(t){const e=this.detokenize(t);return e.events=this.eventsCache,e}}catch{return null}return null}syncLiving(t){t.forEach(e=>{const i=this.organisms.get(e.id);i?this.organisms.set(e.id,{...i,age:e.age,energy:e.energy,matingCount:e.matingCount,isAlive:!0}):(this.organisms.set(e.id,{...e,isAlive:!0,memories:[]}),this.updateIndicesFor(e)),this.dirtyOrganisms.add(e.id)}),this.debounceSave()}pushToHistory(t,e){const i=this.organisms.get(t);if(!i)return;i.memories||(i.memories=[]);const s=i.memories[i.memories.length-1];if(s&&e.content.includes("Energy")&&s.content.includes("Energy")){const r=s.content.match(/Harvested (\d+)x Energy/),a=r?parseInt(r[1]):1;s.content=`Harvested ${a+1}x Energy`,s.timestamp=Date.now()}else i.memories.some(r=>r.id===e.id)||i.memories.push(e);i.memories.length>200&&i.memories.shift(),this.dirtyOrganisms.add(t),this.debounceSave()}markDeceased(t,e){const i=this.organisms.get(t);i&&(e?this.organisms.set(t,{...e,isAlive:!1}):i.isAlive=!1,this.dirtyOrganisms.add(t),this.debounceSave())}addHistory(t){this.organisms.set(t.id,{...t,isAlive:!0}),this.updateIndicesFor(t),this.dirtyOrganisms.add(t.id),this.debounceSave()}getHistory(){return Array.from(this.organisms.values()).sort((t,e)=>e.generation-t.generation)}getFamilyCount(t,e){return this.familyCountIndex.get(`${t}_${e}`)||0}getEvents(){return this.eventsCache}getAssets(){return this.documents}debounceSave(){this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>this.flushDirty(),this.SAVE_DEBOUNCE_MS)}async flushDirty(){if(this.dirtyOrganisms.size===0)return;const e=(await this.openDB()).transaction(this.DB_STORES.ORGANISMS,"readwrite"),i=e.objectStore(this.DB_STORES.ORGANISMS),s=Array.from(this.dirtyOrganisms);this.dirtyOrganisms.clear(),s.forEach(o=>{const r=this.organisms.get(o);if(r){const a=this.tokenize({...r,lastSaved:Date.now()});i.put(a,o)}}),e.oncomplete=()=>{console.log(`[VDB] Atomic flush complete: ${s.length} records persisted.`)}}async saveEventsBatch(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(this.DB_STORES.EVENTS,"readwrite"),r=o.objectStore(this.DB_STORES.EVENTS);r.clear(),t.forEach((a,h)=>r.put(this.tokenize(a),h)),o.oncomplete=()=>i(),o.onerror=()=>s(o.error)})}openDB(){return this.dbPromise?this.dbPromise:(this.dbPromise=new Promise((t,e)=>{if(typeof indexedDB>"u")return e("No IndexedDB");const i=setTimeout(()=>{console.error("[VDB] openDB timeout — IndexedDB may be blocked by another tab."),e(new Error("IndexedDB open timeout"))},3e3),s=indexedDB.open(this.DB_NAME,this.DB_VERSION);s.onupgradeneeded=()=>{const o=s.result;Object.values(this.DB_STORES).forEach(r=>{o.objectStoreNames.contains(r)||o.createObjectStore(r)})},s.onsuccess=()=>{clearTimeout(i),t(s.result)},s.onerror=()=>{clearTimeout(i),e(s.error)},s.onblocked=()=>{console.warn("[VDB] IndexedDB blocked — close other tabs using this app."),clearTimeout(i),e(new Error("IndexedDB blocked"))}}).catch(t=>{throw this.dbPromise=null,t}),this.dbPromise)}async idbPut(t,e,i){const s=await this.openDB();return new Promise((o,r)=>{const a=s.transaction(t,"readwrite");a.objectStore(t).put(i,e),a.oncomplete=()=>o(),a.onerror=()=>r(a.error)})}async idbGet(t,e){const i=await this.openDB();return new Promise((s,o)=>{const a=i.transaction(t,"readonly").objectStore(t).get(e);a.onsuccess=()=>s(a.result??null),a.onerror=()=>o(a.error)})}async getAllFromStore(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(t,"readonly"),r=o.objectStore(t),a=r.getAll(),h=r.getAllKeys();o.oncomplete=()=>{const n=a.result,l=h.result;i(n.map((f,S)=>({key:l[S],value:f})))},o.onerror=()=>s(o.error)})}hardReset(){this.openDB().then(t=>{const e=t.transaction(Object.values(this.DB_STORES),"readwrite");Object.values(this.DB_STORES).forEach(i=>e.objectStore(i).clear())}),this.organisms.clear(),this.settingsCache.clear(),this.eventsCache=[],this.refreshIndices()}tokenize(t){if(Array.isArray(t))return t.map(e=>this.tokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=lt[i]||i;e[s]=this.tokenize(t[i])}return e}return t}detokenize(t){if(Array.isArray(t))return t.map(e=>this.detokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=At[i]||i;e[s]=this.detokenize(t[i])}return e}return t}updateIndicesFor(t){const e=this.surnameIndex.get(t.surname)||new Set;e.add(t.id),this.surnameIndex.set(t.surname,e);const i=`${t.firstName}_${t.surname}`;this.familyCountIndex.set(i,(this.familyCountIndex.get(i)||0)+1)}refreshIndices(){this.surnameIndex.clear(),this.familyCountIndex.clear(),this.organisms.forEach(t=>this.updateIndicesFor(t))}initDocs(){this.documents.push({id:"doc_genetics",type:"SYSTEM_DOC",timestamp:Date.now(),data:{title:"Genetic Expression: Standardized Units",content:"Trait values are expressed in metric units where applicable."}})}}const B=new It,ft=class ft{static generateSyllable(t,e,i){const s=(i==null?void 0:i.simplify)??!1,o=s?.08:e.prosody==="Fluid"?.22:e.prosody==="Angry"?.14:.08;let r=j[t][Math.floor(Math.random()*j[t].length)];if(e.phonotacticFilter&&r.length>2&&Math.random()>(s?.05:.35))return this.generateSyllable(t,e,i);s&&r.length>1&&Math.random()<.55&&(r=r[0]);const a=Math.random()<o?gt[Math.floor(Math.random()*gt.length)]:j.vowels[Math.floor(Math.random()*j.vowels.length)],h=s?.12:.2,n=Math.random()<h?St[Math.floor(Math.random()*St.length)]:"";return r+a+n}static constructWord(t,e,i){let s="";for(let o=0;o<t;o++){const r=o===0?e:"vowels";s+=this.generateSyllable(r,i,{simplify:o>0})}return s.charAt(0).toUpperCase()+s.slice(1)}static generatePhoneticName(t){const e={prosody:"Fluid",phonotacticFilter:!0};return this.constructWord(t,"plosives",e)}static generateFirstName(){const t=Math.floor(Math.random()*k.FIRST_NAME_SYLLABLES_RANGE)+k.FIRST_NAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static generateSurname(){const t=Math.floor(Math.random()*k.SURNAME_SYLLABLES_RANGE)+k.SURNAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static romanize(t){const e={M:1e3,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};let i="",s=t;for(let o in e)for(;s>=e[o];)i+=o,s-=e[o];return i}static constructFullLinguisticProfile(t,e){let i=this.generateFirstName(),s=this.generateSurname(),o="First of their lineage, born of the primal void.",r,a=!1;if(t&&(e?(s=Math.random()>.5?t.surname:e.surname,o=`Inherited the ${s} name from the union of ${t.firstName} and ${e.firstName}.`,(t.houseName||e.houseName)&&(r=t.houseName||e.houseName,a=!0)):(s=t.surname,o=`A direct sprout from the ${s} legacy of ${t.firstName}.`,r=t.houseName,a=t.isNoble||!1),Math.random()<k.NAME_INHERITANCE_CHANCE)){i=t.firstName,s=t.surname;const n=B.getFamilyCount(i,s)+1,l=n>1?` ${this.romanize(n)}`:"";return{firstName:i,surname:s,name:`${i} ${s}${l}`,lineageDescription:l?`Named after their progenitor, ${t.firstName} ${t.surname}, carrying the weight of ${this.romanize(n)} generations.`:`A fresh branch from the ${s} vine.`,isNoble:a||t.isNoble,houseName:r}}return{firstName:i,surname:s,name:`${i} ${s}`,lineageDescription:o,isNoble:a,houseName:r}}static getTitle(t,e){if(t.isNoble)return"The Noble";if(t.age>e.meanAge*2)return"The Elder";if(t.expressedStats.speed>e.speed95th)return"The Swift";if(t.matingCount>nt.PROLIFIC_MATING_THRESHOLD)return"The Prolific"}static generateLexiconEntry(t,e){let i=1,s="plosives",o="Primitive";switch(t){case"Items":i=1,s="plosives",o="Primitive";break;case"Grammar":i=1,s="vowels",o="Primitive";break;case"Species":i=2,s="nasals",o="Abstract";break;case"Entities":i=2,s="plosives",o="Abstract";break;case"Locations":i=3,s="fricatives",o="Navigational";break;case"Places":i=4,s="fricatives",o="Complex";break}const r=this.constructWord(i,s,e),a={id:crypto.randomUUID(),word:r,ipa:`/${r.toLowerCase()}/`,category:t,complexity:o,timestamp:Date.now()};return this.lexicon.push(a),a}static applySemanticDrift(){}static constructPhrase(t){}};ft.lexicon=[];let $=ft;class Z{constructor(t,e,i=50){this.cells=new Map,this.width=t,this.height=e,this.cellSize=i}getCellKey(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize);return e<<16|i}update(t){this.cells.clear();for(let e=0;e<t.length;e++){const i=t[e],s=this.getCellKey(i.position);this.cells.has(s)||this.cells.set(s,[]),this.cells.get(s).push(i.id)}}getNeighbors(t,e){const i=[],s=Math.floor((t.x-e)/this.cellSize),o=Math.floor((t.x+e)/this.cellSize),r=Math.floor((t.y-e)/this.cellSize),a=Math.floor((t.y+e)/this.cellSize);for(let h=s;h<=o;h++)for(let n=r;n<=a;n++){const l=h<<16|n,f=this.cells.get(l);f&&i.push(...f)}return i}}class Mt{constructor(t=Math.random()){this.p=new Array(512),this.permutation=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];for(let e=0;e<256;e++)this.p[e]=this.permutation[e],this.p[256+e]=this.permutation[e]}fade(t){return t*t*t*(t*(t*6-15)+10)}lerp(t,e,i){return e+t*(i-e)}grad(t,e,i,s){const o=t&15,r=o<8?e:i,a=o<4?i:o===12||o===14?e:s;return((o&1)===0?r:-r)+((o&2)===0?a:-a)}noise(t,e,i=0){const s=Math.floor(t)&255,o=Math.floor(e)&255,r=Math.floor(i)&255;t-=Math.floor(t),e-=Math.floor(e),i-=Math.floor(i);const a=this.fade(t),h=this.fade(e),n=this.fade(i),l=this.p[s]+o,f=this.p[l]+r,S=this.p[l+1]+r,T=this.p[s+1]+o,M=this.p[T]+r,g=this.p[T+1]+r;return this.lerp(n,this.lerp(h,this.lerp(a,this.grad(this.p[f],t,e,i),this.grad(this.p[M],t-1,e,i)),this.lerp(a,this.grad(this.p[S],t,e-1,i),this.grad(this.p[g],t-1,e-1,i))),this.lerp(h,this.lerp(a,this.grad(this.p[f+1],t,e,i-1),this.grad(this.p[M+1],t-1,e,i-1)),this.lerp(a,this.grad(this.p[S+1],t,e-1,i-1),this.grad(this.p[g+1],t-1,e-1,i-1))))}fbm(t,e,i=4){let s=0,o=1,r=1,a=0;for(let h=0;h<i;h++)s+=this.noise(t*o,e*o)*r,a+=r,r*=.5,o*=2;return s/a}}class _t{constructor(t,e,i=Math.random()){this.biomeScale=.002,this.cliffScale=.005,this.cliffThreshold=.65,this.gridRes=512,this.noise=new Mt(i),this.width=t,this.height=e,this.collisionGrid=new Uint8Array(this.gridRes*this.gridRes),this.precomputeCollisionGrid()}precomputeCollisionGrid(){for(let t=0;t<this.gridRes;t++)for(let e=0;e<this.gridRes;e++){const i=e/this.gridRes*this.width,s=t/this.gridRes*this.height,o=this.noise.fbm(i*this.cliffScale,s*this.cliffScale,2);this.collisionGrid[t*this.gridRes+e]=o>this.cliffThreshold?1:0}}getBiomeAt(t,e){const i=this.noise.fbm(t*this.biomeScale,e*this.biomeScale,3);return this.noise.fbm(t*this.cliffScale,e*this.cliffScale,2)>this.cliffThreshold?"CLIFF":i>0?"GRASS":"ARID"}isImpassable(t,e){if(t<0||t>this.width||e<0||e>this.height)return!0;const i=Math.floor(t/this.width*(this.gridRes-1)),s=Math.floor(e/this.height*(this.gridRes-1));return this.collisionGrid[s*this.gridRes+i]===1}getSafeSpawnPos(){let t,e,i=0;do t=Math.random()*this.width,e=Math.random()*this.height,i++;while(this.isImpassable(t,e)&&i<100);return{x:t,y:e}}getBiomeColor(t,e,i){const s=this.noise.noise(e*.1,i*.1)*10;switch(t){case"GRASS":return`hsl(${100+s}, 45%, ${25+s}%)`;case"ARID":return`hsl(${35+s}, 35%, ${30+s}%)`;case"CLIFF":return`hsl(0, 0%, ${15+s}%)`;default:return"#000"}}}const b={MATURATION_DAYS_ESTIMATE:2.5,TRAIT_RANGES:{growth_speed_ratio:[.9,1.3],complexity:[2,12],stem_thickness:[.5,3.5],leaf_size:[10,50],persistence:[2,8],hue:[90,150],clump_radius:[1,3]},ECOLOGY:{HOURLY_RANDOM_SPAWN_CHANCE:.9,BIOME_GRASS_GROWTH:1.5,BIOME_ARID_GROWTH:.1,PROXIMITY_DENSITY_BONUS:1.65,CLUSTER_SEARCH_RADIUS_METERS:1.2,CLUSTER_MIN_NEIGHBORS:2,CLUSTER_MAX_NEIGHBORS:5,CLUSTER_GROWTH_RATE:.42,CLUSTER_SPAWN_DISTANCE_MIN:.1,CLUSTER_SPAWN_DISTANCE_MAX:.5},THERMODYNAMICS:{NUTRIENT_BASE_MIN:320,MASS_TO_ENERGY_SCALAR:420,GROWTH_MASS_PENALTY:.012},generateGenome:()=>{const c=(A,p)=>A+Math.random()*(p-A),t=b.TRAIT_RANGES,e=c(t.growth_speed_ratio[0],t.growth_speed_ratio[1]),i=c(t.complexity[0],t.complexity[1]),s=c(t.stem_thickness[0],t.stem_thickness[1]),o=c(t.leaf_size[0],t.leaf_size[1]),r=c(t.persistence[0],t.persistence[1]),a=c(t.hue[0],t.hue[1]),h=c(t.clump_radius[0],t.clump_radius[1]),n=s*o*(i/6),l=1+n*b.THERMODYNAMICS.GROWTH_MASS_PENALTY,f=e/l,S=b.MATURATION_DAYS_ESTIMATE*N.HOURS_PER_DAY,T=Math.max(.45,f),M=S/T,g=Math.max(5e-4,1/M),R=Math.max(b.THERMODYNAMICS.NUTRIENT_BASE_MIN,n*b.THERMODYNAMICS.MASS_TO_ENERGY_SCALAR);return{traits:{structure:{v1:g,v2:i,d1:Math.random(),d2:Math.random()},vitality:{v1:R,v2:r,d1:Math.random(),d2:Math.random()},morphology:{v1:o,v2:a,d1:Math.random(),d2:Math.random()},ecology:{v1:h,v2:s,d1:Math.random(),d2:Math.random()}}}}};class Et{static update(t,e){const i=t.biome;let s=1;i==="GRASS"?s=b.ECOLOGY.BIOME_GRASS_GROWTH:i==="ARID"&&(s=b.ECOLOGY.BIOME_ARID_GROWTH),t.nearbyFloraCount&&t.nearbyFloraCount>b.ECOLOGY.CLUSTER_MIN_NEIGHBORS&&(s*=b.ECOLOGY.PROXIMITY_DENSITY_BONUS);const r=t.genome.traits.structure.v1*s;t.growthState<1&&(t.growthState=Math.min(1,t.growthState+r)),t.lifetime!==void 0&&(t.lifetime=Math.max(0,t.lifetime-N.FRAMES_PER_HOUR))}}class ct{constructor(t){this.data=t}static create(t,e,i,s,o,r,a){const h=a(),n=h.traits.structure.v2,l=h.traits.vitality.v1,S=h.traits.vitality.v2*N.FRAMES_PER_DAY;return new ct({id:t,name:r,color:`hsl(${h.traits.morphology.v2}, 70%, 50%)`,position:e,energyValue:l,complexity:n,type:o,lifetime:S,genome:h,growthState:.1,nearbyFloraCount:0})}update(t){Et.update(this.data,t)}isExpired(){return this.data.lifetime!==void 0&&this.data.lifetime<=0}getExpressedTraits(){const t=this.data.genome.traits.structure.v1*24,e=1-this.data.growthState,i=Math.max(1,Math.ceil(e/t));return{growthRate:(t*100).toFixed(2)+"% / day",maturation:i+" days",complexity:Math.floor(this.data.genome.traits.structure.v2),nutrients:Math.floor(this.data.genome.traits.vitality.v1),leafSize:this.data.genome.traits.morphology.v1.toFixed(1),stemThickness:this.data.genome.traits.ecology.v2.toFixed(1),clumpRadius:this.data.genome.traits.ecology.v1.toFixed(1),hue:Math.floor(this.data.genome.traits.morphology.v2)}}}const vt={calculateEnergyLoss:(c,t=0)=>{const e=Math.max(.01,c.speed),s=Math.max(0,Math.min(t,e))/e,o=.18;return 1/Math.max(.1,c.metabolism)*e*c.size*(o+s*(1-o))/N.FRAMES_PER_HOUR}};class Ct{constructor(t){this.data=t}update(t,e,i,s){const o=I.toDisplaySpeed(Math.sqrt(this.data.velocity.x**2+this.data.velocity.y**2)),r=vt.calculateEnergyLoss(this.data.expressedStats,o);this.data.energy-=r,this.data.age++;const a=_.add(this.data.position,this.data.velocity);i.isImpassable(a.x,a.y)&&((a.x<0||a.x>e.x)&&(this.data.velocity.x*=-1),(a.y<0||a.y>e.y)&&(this.data.velocity.y*=-1),i.getBiomeAt(a.x,a.y)==="CLIFF"&&(this.data.velocity.x*=-1,this.data.velocity.y*=-1)),this.data.matingTimer&&this.data.matingTimer>0&&this.data.matingTimer--,this.data.memories=this.data.memories.filter(l=>t-l.timestamp<l.duration),this.data.velocity.x**2+this.data.velocity.y**2>.01&&(this.data.heading=_.normalize(this.data.velocity));const n=I.toInternalSpeed(this.data.expressedStats.speed);this.data.velocity=_.limit(this.data.velocity,n),this.data.position=_.add(this.data.position,this.data.velocity),this.data.position.x=Math.max(0,Math.min(e.x,this.data.position.x)),this.data.position.y=Math.max(0,Math.min(e.y,this.data.position.y))}applySteering(t){const i=I.toInternalSpeed(this.data.expressedStats.speed)*.1,s=_.limit(t,i);this.data.velocity=_.add(this.data.velocity,s)}calculateBending(t){const e=Math.atan2(this.data.velocity.y,this.data.velocity.x),i=_.add(this.data.velocity,t);let o=Math.atan2(i.y,i.x)-e;o>Math.PI&&(o-=Math.PI*2),o<-Math.PI&&(o+=Math.PI*2);const h=(this.data.bending||0)*.85+o*3.5;this.data.bending=Math.max(-1.5,Math.min(1.5,h))}}class Nt{static scan(t,e){const i=t.expressedStats,s=t.position,o=t.heading,r=I.cmToPx(i.size)*.8,a=[],h=[],n=i.sight_range,l=i.sight_fov/2;for(const g of e.flora){const R=_.dist(s,g.position),A=I.pxToM(R);if(R<=r)a.push(g);else if(A<=n){const p=_.normalize(_.sub(g.position,s));Math.acos(_.dot(o,p))<=l&&a.push(g)}}const f=[],S=[],T=i.audible_range,M=i.communicating_range;for(const g of e.organisms){if(g.id===t.id)continue;const R=_.dist(s,g.position),A=I.pxToM(R);if(R<=r)h.push(g);else if(A<=n){const p=_.normalize(_.sub(g.position,s));Math.acos(_.dot(o,p))<=l&&h.push(g)}A<=T&&f.push(g),A<=M&&S.push(g)}return{visibleFlora:a,visibleFauna:h,audibleFauna:f,communicatingFauna:S}}}class wt{constructor(t){this.data=t}addMemory(t,e,i,s,o){var M;const r=3*N.FRAMES_PER_HOUR,a=I.mToPx(this.data.expressedStats.sight_range),h=o==null?void 0:o.id;let n=this.data.memories.find(g=>{var R;return g.type===e&&(h&&g.data&&g.data.id===h||h&&((R=g.entityIds)==null?void 0:R.includes(h))||g.content===s&&_.dist(g.position,i)<8)});if(n){n.position={...i},t-n.timestamp;return}const l=this.data.memories.find(g=>g.type===e&&t-g.timestamp<r);if(l&&e==="Fauna"){const g=_.dist(l.position,i),R=g/a,A=1-Math.pow(R,.5);if((Math.random()<A||g<50)&&h&&!((M=l.entityIds)!=null&&M.includes(h))){l.entityIds=[...l.entityIds||[],h],l.count=l.entityIds.length,l.count>1&&(l.content=`${l.count} entities encountered`),l.timestamp=t,this.data.memories=[l,...this.data.memories.filter(p=>p.id!==(l==null?void 0:l.id))];return}}const f=N.FRAMES_PER_DAY*rt.DAYS_TO_REMEMBER,S=N.FRAMES_PER_HOUR*12,T=e==="Food"?Math.max(S,f/4):f;if(this.data.memories.push({id:Math.random().toString(36).substr(2,5),type:e,position:{...i},timestamp:t,duration:T,content:s,count:1,data:o,entityIds:o&&o.id?[o.id]:void 0,isFamiliar:o?o.isFamiliar:!1}),this.data.memories.length>rt.TEMPORARY_MEMORY_LIMIT){const g=this.data.memories.findIndex(p=>(p.count||0)<3&&!p.isFamiliar),R=g!==-1?g:0,A=this.data.memories[R];B.pushToHistory(this.data.id,A),this.data.memories.splice(R,1)}}validateMemories(t,e,i){this.data.memories=this.data.memories.filter(s=>!((s.type==="Food"||s.type==="Flora")&&_.dist(i,s.position)<e&&!t.some(a=>_.dist(a.position,s.position)<12)))}removeMemory(t,e){this.data.memories=this.data.memories.filter(i=>{var o;return i.data&&i.data.id===t||((o=i.entityIds)==null?void 0:o.includes(t))?!!(e&&i.type!==e):!0})}getBestFoodLocation(){return this.data.memories.find(t=>t.type==="Food"||t.type==="Flora")||null}}class bt{constructor(t){this.me=t,this.memorySystem=new wt(t)}decide(t,e,i,s){var Y,q;const o=Nt.scan(this.me,i);this.memorySystem.validateMemories(o.visibleFlora,I.mToPx(this.me.expressedStats.sight_range),this.me.position);const r=t,a=this.me.lastPerceptionTick||0,h=z.PERCEPTION_COOLDOWN_TICKS;r-a>=h&&(o.visibleFlora.forEach(u=>{u.energyValue>z.FOOD_MEMORY_ENERGY_THRESHOLD&&this.memorySystem.addMemory(t,"Food",u.position,u.name,{energy:u.energyValue,id:u.id})}),o.visibleFauna.forEach(u=>{const d=this.me.memories.some(m=>{var x;return((x=m.data)==null?void 0:x.id)===u.id&&m.isFamiliar});this.memorySystem.addMemory(t,"Fauna",u.position,u.name,{id:u.id,name:u.name,isFamiliar:d})}),this.me.lastPerceptionTick=r);const n=N.COMM_COOLDOWN_TICKS,l=this.me.lastVocalTick||0;if(r-l>=n&&o.communicatingFauna.length>0){let u=!1;o.communicatingFauna.forEach(d=>{const m=_.dist(this.me.position,d.position),x=I.pxToM(m),w=d.expressedStats.audible_range;if(x<=w){const O=this.me.memories.find(H=>H.type==="Food");O&&(d.memories.some(U=>U.type===O.type&&_.dist(U.position,O.position)<10)||(d.memories.push({...O,id:Math.random().toString(36).substr(2,5),timestamp:r,content:O.content,count:1}),d.isHearingActive=!0,this.memorySystem.addMemory(t,"Fauna",d.position,d.name,{id:d.id,name:d.name,isFamiliar:!0}),u=!0))}}),u&&(this.me.lastVocalTick=r,this.me.isTransmittingActive=!0)}let f={x:0,y:0};const S=I.toInternalSpeed(this.me.expressedStats.speed);I.toDisplaySpeed(Math.sqrt(this.me.velocity.x**2+this.me.velocity.y**2));const T=vt.calculateEnergyLoss(this.me.expressedStats,this.me.expressedStats.speed),M=Math.max(2200,T*N.FRAMES_PER_DAY*1.25),g=this.me.energy>M,R=this.me.energy<M*.7;let A=null,p=-1,C=null,G=null;for(const u of o.visibleFlora){const d=_.dist(this.me.position,u.position),m=u.energyValue*u.growthState/(d+z.FOOD_DESIRABILITY_DISTANCE_WEIGHT);m>p&&(p=m,A=u.position,C=u,G=u.id)}const tt=this.me.memories.filter(u=>u.type==="Food");for(const u of tt){const d=_.dist(this.me.position,u.position),x=(((Y=u.data)==null?void 0:Y.energy)||500)*z.MEMORY_CONFIDENCE_PENALTY/(d+z.FOOD_DESIRABILITY_DISTANCE_WEIGHT);x>p&&(p=x,A=u.position,C=null,G=((q=u.data)==null?void 0:q.id)||null)}if(A){let u=C;u||(u=o.visibleFlora.find(x=>_.dist(x.position,A)<10)||null);const d=_.dist(this.me.position,A),m=I.cmToPx(this.me.expressedStats.size)*.8;if(u&&d<m)s.onEat(u),this.memorySystem.addMemory(t,"Flora",u.position,`Ate ${u.name}`,{energy:u.energyValue,id:u.id}),this.memorySystem.removeMemory(u.id,"Food");else{const x=I.cmToPx(this.me.expressedStats.size)*2;if(d<z.MEMORY_PRUNING_RADIUS_METERS&&!u&&!C&&G)return this.memorySystem.removeMemory(G,"Food"),{x:0,y:0};let w=S*(R?1:.78);d<x&&(w*=d/x);const O=_.normalize(_.sub(A,this.me.position)),H=_.mul(O,w);f=_.sub(H,this.me.velocity)}}else if(g){const u=t*.005,d=parseInt(this.me.id)||0,m=Math.sin(u+d)+Math.sin(u*.5+d),x=Math.cos(u+d)+Math.cos(u*.5+d),w=_.normalize({x:m,y:x}),O=S*(this.me.energy>M*1.75?.38:.24),H=Math.sqrt(this.me.velocity.x**2+this.me.velocity.y**2);let U={x:0,y:0};H<.03&&(U={x:(Math.random()-.5)*2.5,y:(Math.random()-.5)*2.5});const et=_.add(_.mul(w,O),U);f=_.sub(et,this.me.velocity)}else f=_.mul(this.me.velocity,-.18);if(this.me.energy>P.MATING_ENERGY_THRESHOLD&&this.me.matingTimer===0){const u=o.visibleFauna.find(d=>d.energy>P.MATING_ENERGY_THRESHOLD&&d.matingTimer===0&&d.id!==this.me.id);if(u){const d=_.dist(this.me.position,u.position),m=I.cmToPx(this.me.expressedStats.size)*1.5;if(d<m)return s.onMate(u),{x:0,y:0};{const x=_.normalize(_.sub(u.position,this.me.position)),w=_.mul(x,S*(R?.92:.75));f=_.add(f,_.sub(w,this.me.velocity))}}}return f}}class Ot extends Ct{constructor(t){super(t),this.brain=new bt(t)}update(t,e,i,s){super.update(t,e,i,s)}think(t,e,i,s,o,r){const a=this.data;a.isHearingActive=!1,a.isTransmittingActive=!1,t%60===0&&(a.title=$.getTitle(a,s),!a.isNoble&&(a.matingCount>nt.NOBILITY_MATING_THRESHOLD||a.age>nt.NOBILITY_AGE_THRESHOLD_DAYS*N.FRAMES_PER_DAY)&&(a.isNoble=!0,a.houseName=`House ${a.surname}`,a.lineageDescription=`Founder of the Noble ${a.houseName}.`));const h=this.brain.decide(t,e,o,r);this.applySteering(h),this.calculateBending(h)}}const Pt={processBirth:(c,t)=>{const e=t?F.recombine(c.genome,t.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})(),i=F.mutate(e),s=F.express(i),o=P.BIRTH_COST_BASE/2,r=s.speed*V.TRAIT_SURCHARGE_SPEED_WEIGHT+s.size*V.TRAIT_SURCHARGE_SIZE_WEIGHT+s.sight_range*V.TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT+s.sight_fov*V.TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT+s.lifespan*V.TRAIT_SURCHARGE_LIFESPAN_WEIGHT,a=o+r/2,h=f=>Math.min(1,1/f),n=a*h(c.expressedStats.metabolism),l=t?a*h(t.expressedStats.metabolism):n;return{childGenome:i,childStats:s,costToEachParent:a,initialEnergy:n+l,energyWasted:a*2-(n+l)}}},W=class W{constructor(t,e,i){this.lastId=0,this.floraGridDirty=!0,this.logicInstances=new Map,this.config={initialPopulation:P.INITIAL_ORGANISMS,initialEnergy:P.INITIAL_ENERGY,traitRanges:X};const s=i||null;s?(this.state={config:{...this.config},hour:0,day:0,season:1,cycle:1,events:[],apexCandidates:[],organisms:[],Flora:[],seed:Math.random(),...s},this.state.config.traitRanges={...X},this.state.config.initialEnergy=[...P.INITIAL_ENERGY],s.food&&(!this.state.Flora||this.state.Flora.length===0)&&(this.state.Flora=s.food),this.state.Flora&&this.state.Flora.forEach(a=>{a.growthState===void 0&&(a.growthState=.5),a.genome||(a.genome={traits:{structure:{v1:.001,v2:6,d1:.5,d2:.5},vitality:{v1:1200,v2:1e4,d1:.5,d2:.5},morphology:{v1:4,v2:120,d1:.5,d2:.5},ecology:{v1:20,v2:1.5,d1:.5,d2:.5}}})}),this.state.organisms&&this.state.organisms.forEach(a=>{(!a.genome||!a.genome.traits||Object.keys(a.genome.traits).length===0)&&(console.warn(`SimEngine: Healed CORRUPT genome for organism ${a.id}`,a.genome),a.genome=F.createRandomGenome(this.state.config)),F.ensureIntegrity(a.genome),a.expressedStats=F.express(a.genome),a.memories||(a.memories=[]),a.heading||(a.heading=_.normalize({x:Math.random()-.5,y:Math.random()-.5}))})):this.state={organisms:[],Flora:[],worldSize:{x:t,y:e},time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random()};const o=this.state.worldSize.x,r=this.state.worldSize.y;if(this.terrain=new _t(o,r,this.state.seed),this.orgGrid=new Z(o,r,D.PIXELS_PER_METER),this.FloraGrid=new Z(o,r,D.PIXELS_PER_METER),s){const a=(this.state.organisms||[]).map(n=>parseInt(n.id)).filter(n=>!isNaN(n)),h=(this.state.Flora||[]).map(n=>parseInt(n.id)).filter(n=>!isNaN(n));this.lastId=Math.max(0,...a,...h)}else this.init()}init(){for(let t=0;t<this.state.config.initialPopulation;t++)this.spawnOrganism();for(let t=0;t<P.INITIAL_FLORA;t++){const e=.4+Math.random()*.5;this.spawnFlora(void 0,void 0,e)}}hardReset(){B.hardReset(),this.logicInstances.clear(),this.state={organisms:[],Flora:[],worldSize:this.state.worldSize,time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random(),lastResetTime:new Date().toISOString()},this.lastId=0,this.terrain=new _t(this.state.worldSize.x,this.state.worldSize.y),this.orgGrid=new Z(this.state.worldSize.x,this.state.worldSize.y,D.PIXELS_PER_METER),this.FloraGrid=new Z(this.state.worldSize.x,this.state.worldSize.y,D.PIXELS_PER_METER),this.init()}spawnOrganism(t,e,i,s,o){const r=o||(t?e?F.recombine(t.genome,e.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})():F.createRandomGenome(this.state.config)),a=F.express(r),h=$.generateFirstName(),n=t?e?Math.random()>.5?t.surname:e.surname:t.surname:$.generateSurname(),l={id:(++this.lastId).toString(),parentA_Id:t==null?void 0:t.id,parentB_Id:e==null?void 0:e.id,position:i||this.terrain.getSafeSpawnPos(),velocity:{x:(Math.random()-.5)*2,y:(Math.random()-.5)*2},heading:_.normalize({x:Math.random()-.5,y:Math.random()-.5}),energy:s!==void 0?s:t?400:this.state.config.initialEnergy[0]+Math.random()*(this.state.config.initialEnergy[1]-this.state.config.initialEnergy[0]),age:0,genome:r,expressedStats:a,color:t?t.color:`hsl(${Math.random()*360}, 70%, 60%)`,generation:t?t.generation+1:1,name:`${h} ${n}`,firstName:h,surname:n,matingTimer:0,matingCount:0,memories:[],timestamp:this.state.time,bending:0};typeof window<"u"?B.addHistory(l):self.postMessage({type:"REGISTRY_LOG",data:l}),this.state.organisms.push(l),this.logEvent("BIRTH",t?`${l.name} born to ${t.surname} clan`:`Progenitor ${l.name} enters the world`,l.position,l.id,l.color)}spawnFlora(t,e="HERBIVORE",i){const s=t||this.terrain.getSafeSpawnPos(),o=ct.create(Math.random().toString(36).substr(2,9),s,0,0,e,"Fern",b.generateGenome);i!==void 0&&(o.data.growthState=Math.max(.3,i)),o.data.biome=this.terrain.getBiomeAt(s.x,s.y),this.state.Flora.push(o.data),this.floraGridDirty=!0}logEvent(t,e,i,s,o){this.state.events||(this.state.events=[]),this.state.events.unshift({id:Math.random().toString(36).substr(2,9),type:t,message:e,timestamp:this.state.time,position:{...i},entityId:s,color:o}),this.state.events.length>50&&this.state.events.pop()}forceSave(){this.state.events&&this.state.events.length>20&&(this.state.events=this.state.events.slice(0,20)),typeof window<"u"&&(B.syncLiving(this.state.organisms),B.saveSimState(this.state))}update(){this.state.time++;const t=xt.isHourlyTick(this.state.time);this.state.time%600===0&&this.forceSave(),this.orgGrid.update(this.state.organisms),this.floraGridDirty&&(this.FloraGrid.update(this.state.Flora),this.floraGridDirty=!1);const e=new Map;this.state.organisms.forEach(n=>e.set(n.id,n));const i=new Map;this.state.Flora.forEach(n=>i.set(n.id,n)),this.state.hour=Math.floor(this.state.time%N.FRAMES_PER_DAY/N.FRAMES_PER_HOUR);const s=Math.floor(this.state.time/N.FRAMES_PER_DAY);this.state.day=s;const o=Math.floor(s/N.DAYS_PER_SEASON),r=this.state.season;if(this.state.season=o%N.SEASONS_PER_CYCLE+1,this.state.cycle=Math.floor(o/N.SEASONS_PER_CYCLE)+1,r!==this.state.season){const n=Math.floor(P.BLOOM_COUNT_MIN+Math.random()*(P.BLOOM_COUNT_MAX-P.BLOOM_COUNT_MIN));for(let l=0;l<n;l++)this.spawnFlora();this.logEvent("MILESTONE",`Season ${this.state.season} bloom: ${n} new flora emerged`,{x:this.state.worldSize.x/2,y:this.state.worldSize.y/2},void 0,"#4ade80")}if(t){Math.random()<b.ECOLOGY.HOURLY_RANDOM_SPAWN_CHANCE&&this.spawnFlora();const n=I.mToPx(b.ECOLOGY.CLUSTER_SEARCH_RADIUS_METERS);this.state.Flora.forEach(l=>{Et.update(l,this.terrain);const S=this.FloraGrid.getNeighbors(l.position,n).length;if(l.nearbyFloraCount=S,S>=b.ECOLOGY.CLUSTER_MIN_NEIGHBORS&&S<b.ECOLOGY.CLUSTER_MAX_NEIGHBORS&&Math.random()<b.ECOLOGY.CLUSTER_GROWTH_RATE*l.growthState){const T=Math.random()*Math.PI*2,M=b.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN+Math.random()*(b.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MAX-b.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN),g=I.mToPx(M),R={x:l.position.x+Math.cos(T)*g,y:l.position.y+Math.sin(T)*g};R.x>0&&R.x<this.state.worldSize.x&&R.y>0&&R.y<this.state.worldSize.y&&this.spawnFlora(R)}}),this.state.Flora=this.state.Flora.filter(l=>l.lifetime===void 0||l.lifetime>0)}if(this.state.time%60===0)if(this.state.organisms.length>0){const n=this.state.organisms.map(S=>S.age),l=n.reduce((S,T)=>S+T,0)/n.length,f=this.state.organisms.map(S=>S.expressedStats.speed).sort((S,T)=>S-T);W.lastPopStats={meanAge:l,speed95th:f[Math.floor(f.length*.95)]||0},this.state.apexCandidates=[...this.state.organisms].sort((S,T)=>T.generation-S.generation||T.energy-S.energy).slice(0,20)}else this.state.apexCandidates=[];const a=W.lastPopStats;this.state.organisms.forEach(n=>{let l=this.logicInstances.get(n.id);if(l||(l=new Ot(n),this.logicInstances.set(n.id,l)),n.matingTimer===0&&n.matingTargetId){const p=e.get(n.matingTargetId);if(p&&parseInt(n.id)<parseInt(p.id)){const C=Pt.processBirth(n,p);n.energy-=C.costToEachParent,p.energy-=C.costToEachParent,this.spawnOrganism(n,p,{...n.position},C.initialEnergy,C.childGenome),n.matingCount++,p.matingCount++}n.matingTargetId=void 0}const f=I.mToPx(n.expressedStats.sight_range),S=I.mToPx(n.expressedStats.audible_range||3),T=Math.max(f,S),g=this.FloraGrid.getNeighbors(n.position,f).map(p=>i.get(p)).filter(p=>p!==void 0),A=this.orgGrid.getNeighbors(n.position,T).map(p=>e.get(p)).filter(p=>p!==void 0&&p.id!==n.id);l.think(this.state.time,this.state.worldSize,this.terrain,a,{organisms:A,flora:g},{onEat:p=>{n.energy+=p.energyValue*Math.max(.35,p.growthState);const C=this.state.Flora.findIndex(G=>G.id===p.id);C!==-1&&(this.state.Flora.splice(C,1),this.floraGridDirty=!0)},onMate:p=>{if(n.matingTimer===0&&p.matingTimer===0){const C=P.MATING_BOND_DURATION_HOURS*N.FRAMES_PER_HOUR;n.matingTimer=C,n.matingTargetId=p.id,p.matingTimer=C,p.matingTargetId=n.id,this.logEvent("MILESTONE",`${n.name} & ${p.name} are bonding`,n.position)}}}),l.update(this.state.time,this.state.worldSize,this.terrain,a)}),this.state.organisms=this.state.organisms.filter(n=>{const l=n.age>n.expressedStats.lifespan||n.energy<=0;return l&&(this.logicInstances.delete(n.id),this.spawnFlora(n.position,"CARNIVORE"),typeof window<"u"?B.markDeceased(n.id,n):self.postMessage({type:"REGISTRY_DEATH",id:n.id,data:n})),!l});const h=this.state.Flora.length;this.state.Flora=this.state.Flora.filter(n=>n.lifetime===void 0||n.lifetime>0),this.state.Flora.length!==h&&(this.floraGridDirty=!0)}};W.lastPopStats={meanAge:0,speed95th:0};let dt=W;class Dt{static getVisuals(t){const e=t.expressedStats.speed/1.5;return{primaryColor:t.color,skeletalRigidity:Ft(1-e,.2,1)}}}function Ft(c,t,e){return Math.max(t,Math.min(e,c))}const y=class y{constructor(t){this.terrainInitialized=!1,this.orgDataBuffer=new Float32Array(y.MAX_INSTANCES*4*5),this.floraDataBuffer=new Float32Array(y.MAX_INSTANCES*4*2),this.colorCache=new Map,this.prevVelocities=new Map;const e=t.getContext("webgl2",{alpha:!1,antialias:!0,preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e,this.program=this.createProgram(y.VERT_SHADER,y.FRAG_SHADER),this.faunaProgram=this.createProgram(y.FAUNA_VERT_SHADER,y.FAUNA_FRAG_SHADER),this.floraProgram=this.createProgram(y.FLORA_VERT_SHADER,y.FLORA_FRAG_SHADER),this.quadBuffer=this.createQuad(),this.faunaUnitQuadBuffer=this.createQuad(),this.floraUnitQuadBuffer=this.createQuad(),this.instanceIDBuffer=this.gl.createBuffer();const i=new Int32Array(y.MAX_INSTANCES);for(let s=0;s<y.MAX_INSTANCES;s++)i[s]=s;this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.instanceIDBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,i,this.gl.STATIC_DRAW),this.orgTexture=this.createDataTexture(y.MAX_INSTANCES,5),this.floraTexture=this.createDataTexture(y.MAX_INSTANCES,2),this.terrainTexture=e.createTexture()}createShader(t,e){const i=this.gl.createShader(t);if(this.gl.shaderSource(i,e),this.gl.compileShader(i),!this.gl.getShaderParameter(i,this.gl.COMPILE_STATUS))throw new Error("Shader compile error: "+this.gl.getShaderInfoLog(i));return i}createProgram(t,e){const i=this.createShader(this.gl.VERTEX_SHADER,t),s=this.createShader(this.gl.FRAGMENT_SHADER,e),o=this.gl.createProgram();if(this.gl.attachShader(o,i),this.gl.attachShader(o,s),this.gl.linkProgram(o),!this.gl.getProgramParameter(o,this.gl.LINK_STATUS))throw new Error("Program link error: "+this.gl.getProgramInfoLog(o));return o}createQuad(){const t=this.gl.createBuffer();return this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),t}createDataTexture(t,e){const i=this.gl,s=i.createTexture();return i.bindTexture(i.TEXTURE_2D,s),i.texImage2D(i.TEXTURE_2D,0,i.RGBA32F,t,e,0,i.RGBA,i.FLOAT,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.NEAREST),s}static parseHSL(t){const e=t.match(/hsl\((\d+\.?\d*),\s*(\d+)%,\s*(\d+)%\)/);if(!e)return[.5,.5,.5];const i=parseFloat(e[1])/360,s=parseInt(e[2])/100,o=parseInt(e[3])/100,r=(n,l,f)=>(f<0&&(f+=1),f>1&&(f-=1),f<1/6?n+(l-n)*6*f:f<1/2?l:f<2/3?n+(l-n)*(2/3-f)*6:n),a=o<.5?o*(1+s):o+s-o*s,h=2*o-a;return[r(h,a,i+1/3),r(h,a,i),r(h,a,i-1/3)]}updateTerrainTexture(t,e){const i=this.gl,s=512,o=new Uint8Array(s*s*4);for(let r=0;r<s;r++)for(let a=0;a<s;a++){const h=t.getBiomeAt(a/s*e.x,r/s*e.y),n=(r*s+a)*4;h==="GRASS"?o[n]=255:h==="CLIFF"&&(o[n]=127,o[n+1]=255),o[n+3]=255}i.bindTexture(i.TEXTURE_2D,this.terrainTexture),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,s,s,0,i.RGBA,i.UNSIGNED_BYTE,o),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),this.terrainInitialized=!0}render(t){const e=this.gl,i=1/t.zoom,s=(0-t.cameraOffset[0])*i-100,o=(t.logicalResolution[0]-t.cameraOffset[0])*i+100,r=(0-t.cameraOffset[1])*i-100,a=(t.logicalResolution[1]-t.cameraOffset[1])*i+100,h=t.organisms.filter(d=>d.position.x>s&&d.position.x<o&&d.position.y>r&&d.position.y<a),n=t.Flora.filter(d=>d.position.x>s&&d.position.x<o&&d.position.y>r&&d.position.y<a);e.viewport(0,0,t.resolution[0],t.resolution[1]);const l=this.orgDataBuffer;l.fill(0);const f=Math.min(h.length,y.MAX_INSTANCES),S=new Map;for(let d=0;d<f;d++)S.set(h[d].id,d);for(let d=0;d<f;d++){const m=h[d],x=Dt.getVisuals(m);let w=this.colorCache.get(m.id);w||(w=y.parseHSL(x.primaryColor),this.colorCache.set(m.id,w));const[O,H,U]=w,et=I.cmToPx(m.expressedStats.size),it=d*4;l[it]=m.position.x,l[it+1]=m.position.y,l[it+2]=et*.4,l[it+3]=et*.2;const st=(y.MAX_INSTANCES+d)*4;l[st]=O,l[st+1]=H,l[st+2]=U,l[st+3]=parseFloat(m.id);const ot=(y.MAX_INSTANCES*2+d)*4;l[ot]=m.velocity.x,l[ot+1]=m.velocity.y,l[ot+2]=m.expressedStats.sight_fov,l[ot+3]=m.id===t.selectedId?1:0;const at=(y.MAX_INSTANCES*3+d)*4;l[at]=(m.bending||0)*x.skeletalRigidity;let yt=-1;if(m.matingTimer&&m.matingTimer>0&&m.matingTargetId){const Rt=S.get(m.matingTargetId);Rt!==void 0&&(yt=Rt)}l[at+1]=yt,l[at+2]=I.mToPx(m.expressedStats.sight_range),l[at+3]=I.mToPx(m.expressedStats.audible_range||3)+(m.isHearingActive?1e4:0);const K=(y.MAX_INSTANCES*4+d)*4;l[K]=I.mToPx(m.expressedStats.communicating_range||1.5)+(m.isTransmittingActive?1e4:0);const Lt=m.energy>28e3?1:0,Gt=m.matingTimer&&m.matingTimer>0?m.matingTimer/120:0;l[K+1]=Lt+Gt,l[K+2]=Math.min(1,m.energy/3e4);const ut=this.prevVelocities.get(m.id);ut?l[K+3]=(ut.x*m.velocity.y-ut.y*m.velocity.x)*5:l[K+3]=0}for(let d=0;d<f;d++){const m=h[d];this.prevVelocities.set(m.id,{x:m.velocity.x,y:m.velocity.y})}e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,y.MAX_INSTANCES,5,e.RGBA,e.FLOAT,l);const T=this.floraDataBuffer;T.fill(0);const M=Math.min(n.length,y.MAX_INSTANCES);for(let d=0;d<M;d++){const m=n[d],x=d*4;T[x]=m.position.x,T[x+1]=m.position.y,T[x+2]=m.growthState,T[x+3]=m.complexity;const w=(y.MAX_INSTANCES+d)*4,O=y.parseHSL(m.color);T[w]=O[0],T[w+1]=O[1],T[w+2]=O[2],T[w+3]=parseFloat(m.id)}e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,y.MAX_INSTANCES,2,e.RGBA,e.FLOAT,T),e.useProgram(this.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.terrainTexture);const g=(d,m,x)=>e.uniform1f(e.getUniformLocation(d,m),x),R=(d,m,x,w)=>e.uniform2f(e.getUniformLocation(d,m),x,w),A=d=>{R(d,"u_logicalResolution",t.logicalResolution[0],t.logicalResolution[1]),R(d,"u_cameraOffset",t.cameraOffset[0],t.cameraOffset[1]),g(d,"u_zoom",t.zoom),g(d,"u_time",t.time/N.FPS),g(d,"u_selectedId",t.selectedId?parseFloat(t.selectedId):-1),g(d,"u_hoveredId",t.hoveredId?parseFloat(t.hoveredId):-1)};A(this.program),R(this.program,"u_resolution",t.resolution[0],t.resolution[1]),R(this.program,"u_worldSize",t.worldSize[0],t.worldSize[1]),g(this.program,"u_showVision",t.showVision?1:0),g(this.program,"u_showHearing",t.showHearing?1:0),g(this.program,"u_showCommunication",t.showCommunication?1:0),g(this.program,"u_showGrid",t.showGrid?1:0),e.uniform1i(e.getUniformLocation(this.program,"u_orgTexture"),0),e.uniform1i(e.getUniformLocation(this.program,"u_terrainTexture"),1),e.uniform1i(e.getUniformLocation(this.program,"u_orgCount"),f);const p=t.organisms.find(d=>d.id===t.selectedId),C=t.organisms.find(d=>d.id===t.hoveredId);R(this.program,"u_selectedPos",p?p.position.x:-1e3,p?p.position.y:-1e3),g(this.program,"u_selectedSize",p?I.cmToPx(p.expressedStats.size)*.5:0),R(this.program,"u_hoveredPos",C?C.position.x:-1e3,C?C.position.y:-1e3),g(this.program,"u_hoveredSize",C?I.cmToPx(C.expressedStats.size)*.5:0),e.bindBuffer(e.ARRAY_BUFFER,this.quadBuffer);const G=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(G),e.vertexAttribPointer(G,2,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLES,0,6),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.useProgram(this.faunaProgram),A(this.faunaProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.uniform1i(e.getUniformLocation(this.faunaProgram,"u_orgTexture"),0),g(this.faunaProgram,"u_showVision",t.showVision?1:0),g(this.faunaProgram,"u_showHearing",t.showHearing?1:0),g(this.faunaProgram,"u_showCommunication",t.showCommunication?1:0),e.bindBuffer(e.ARRAY_BUFFER,this.faunaUnitQuadBuffer);const tt=e.getAttribLocation(this.faunaProgram,"a_unitPosition");e.enableVertexAttribArray(tt),e.vertexAttribPointer(tt,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const Y=e.getAttribLocation(this.faunaProgram,"a_instanceID");e.enableVertexAttribArray(Y),e.vertexAttribIPointer(Y,1,e.INT,0,0),e.vertexAttribDivisor(Y,1),e.drawArraysInstanced(e.TRIANGLES,0,6,f),e.useProgram(this.floraProgram),A(this.floraProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.uniform1i(e.getUniformLocation(this.floraProgram,"u_floraTexture"),0),e.bindBuffer(e.ARRAY_BUFFER,this.floraUnitQuadBuffer);const q=e.getAttribLocation(this.floraProgram,"a_unitPosition");e.enableVertexAttribArray(q),e.vertexAttribPointer(q,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const u=e.getAttribLocation(this.floraProgram,"a_instanceID");e.enableVertexAttribArray(u),e.vertexAttribIPointer(u,1,e.INT,0,0),e.vertexAttribDivisor(u,1),e.drawArraysInstanced(e.TRIANGLES,0,6,M),e.disableVertexAttribArray(u),e.vertexAttribDivisor(u,0),e.disable(e.BLEND)}};y.MAX_INSTANCES=2048,y.VERT_SHADER=`#version 300 es
        in vec2 a_position;
        out vec2 v_texCoord;
        void main() {
            v_texCoord = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `,y.FRAG_SHADER=`#version 300 es
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
    `,y.FAUNA_VERT_SHADER=`#version 300 es
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
            float maxInst = ${y.MAX_INSTANCES}.0;
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
            float quadSize = max(bodyBound, maxSense) + 20.0;

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
    `,y.FAUNA_FRAG_SHADER=`#version 300 es
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
            float maxInst = ${y.MAX_INSTANCES}.0;
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
            if (u_showVision > 0.5 && dist < sightRange) {
                vec2 rel = normalize(v_localCoord);
                float angle = acos(clamp(dot(rel, dir), -1.0, 1.0));
                if (angle < fov * 0.5) {
                    float intensity = 0.25 * (1.0 - dist / sightRange);
                    finalCol += col * intensity;
                    finalAlpha = max(finalAlpha, intensity);
                }
            }
            if (max(u_showHearing, isHearingActive) > 0.5 && dist < audibleRange + 4.0) {
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
            if (max(u_showCommunication, isTransmittingActive) > 0.5 && dist < commRange) {
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
    `,y.FLORA_VERT_SHADER=`#version 300 es
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
            float maxInst = ${y.MAX_INSTANCES}.0;
            float tx = (float(a_instanceID) + 0.5) / maxInst;
            vec4 d1 = texture(u_floraTexture, vec2(tx, 0.25)); // x, y, growth, complexity
            vec2 fPos = d1.xy;
            float growth = d1.z;
            float complexity = d1.w;
            
            vec4 d2 = texture(u_floraTexture, vec2(tx, 0.75)); // Color
            
            float maxRad = max(10.0, (complexity * 4.0 + 10.0));
            // Add slight margin for swaying/blooming
            float quadSize = maxRad * 2.0 + 10.0; 

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
    `,y.FLORA_FRAG_SHADER=`#version 300 es
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
    `;let ht=y,E=null,L=null,Tt=!1,J=0,v={cameraOffset:[0,0],zoom:1,selectedId:null,hoveredId:null,isFollowing:!1,showVision:!1,showGrid:!1,showHearing:!1,showCommunication:!1,dpr:1,resolution:[1920,1080]};self.onmessage=c=>{const{type:t,data:e}=c.data;switch(t){case"INIT":const{canvas:i,worldSize:s,initialState:o,resolution:r}=e;console.log("[Worker] Initializing Engine & Renderer..."),E=new dt(s.x,s.y,o),r&&(v.resolution=r,v.dpr=e.dpr||1,i.width=r[0],i.height=r[1]),L=new ht(i),L.updateTerrainTexture(E.terrain,s),performance.now(),console.log("[Worker] Initialization Complete. Starting Tick."),requestAnimationFrame(mt);break;case"UPDATE_CAMERA":v={...v,...e};break;case"SET_PAUSED":Tt=e;break;case"RESIZE":v.resolution=[e.width,e.height],L&&L.gl.canvas&&(L.gl.canvas.width=e.width,L.gl.canvas.height=e.height);break;case"HIT_TEST":if(E){const{x:a,y:h}=e,n=a,l=h;let f=null;for(const S of E.state.organisms){const T=(S.position.x-n)**2+(S.position.y-l)**2,M=S.expressedStats.size*.4+25;if(T<M*M){f=S.id;break}}if(!f){for(const S of E.state.Flora)if((S.position.x-n)**2+(S.position.y-l)**2<900){f=S.id;break}}self.postMessage({type:"HIT_RESULT",data:f,originalEvent:e.originalEvent})}break;case"UPDATE_CONFIG":E&&(E.state.config=e);break;case"RESET":E&&E.hardReset();break}};function mt(c){if(!E||!L){requestAnimationFrame(mt);return}if(!Tt){if(E.update(),E.state.organisms.length===0?(J++,J>=300&&(console.warn("[Worker] Extinction detected — all organisms dead. Auto-resetting simulation."),E.hardReset(),L.updateTerrainTexture(E.terrain,E.state.worldSize),J=0,self.postMessage({type:"STATE_REFRESH",data:{time:E.state.time,day:E.state.day,hour:E.state.hour,popCount:E.state.organisms.length,floraCount:E.state.Flora.length,events:E.state.events.slice(0,5),apexCandidates:E.state.apexCandidates,selectedEntity:null,hoveredEntity:null,lastResetTime:E.state.lastResetTime}}))):J=0,v.isFollowing&&v.selectedId){const t=E.state.organisms.find(e=>e.id===v.selectedId);if(t){const e=v.resolution[0]/v.dpr,i=v.resolution[1]/v.dpr,s=e/2-t.position.x*v.zoom,o=i/2-t.position.y*v.zoom;v.cameraOffset[0]+=(s-v.cameraOffset[0])*.1,v.cameraOffset[1]+=(o-v.cameraOffset[1])*.1,self.postMessage({type:"CAMERA_SYNC",data:{offset:v.cameraOffset}})}}if(E.state.time%10===0){const t=v.selectedId?E.state.organisms.find(i=>i.id===v.selectedId)||E.state.Flora.find(i=>i.id===v.selectedId):null,e=!v.selectedId&&v.hoveredId?E.state.organisms.find(i=>i.id===v.hoveredId)||E.state.Flora.find(i=>i.id===v.hoveredId):null;self.postMessage({type:"STATE_REFRESH",data:{time:E.state.time,day:E.state.day,hour:E.state.hour,popCount:E.state.organisms.length,floraCount:E.state.Flora.length,events:E.state.events.slice(0,5),apexCandidates:E.state.apexCandidates,selectedEntity:t,hoveredEntity:e,lastResetTime:E.state.lastResetTime}})}E.state.time%600===0&&self.postMessage({type:"SAVE_REQUIRED",data:E.state})}L.render({resolution:v.resolution,logicalResolution:[v.resolution[0]/v.dpr,v.resolution[1]/v.dpr],worldSize:[E.state.worldSize.x,E.state.worldSize.y],cameraOffset:v.cameraOffset,zoom:v.zoom,time:E.state.time,organisms:E.state.organisms,Flora:E.state.Flora,selectedId:v.selectedId,hoveredId:v.hoveredId,isFollowing:v.isFollowing,dpr:v.dpr,showVision:v.showVision,showGrid:v.showGrid,showHearing:v.showHearing,showCommunication:v.showCommunication}),requestAnimationFrame(mt)}})();
