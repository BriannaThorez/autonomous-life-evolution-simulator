(function(){"use strict";const p={dist:(c,t)=>Math.sqrt((c.x-t.x)**2+(c.y-t.y)**2),distSq:(c,t)=>(c.x-t.x)**2+(c.y-t.y)**2,normalize:c=>{const t=Math.sqrt(c.x*c.x+c.y*c.y);return t===0?{x:0,y:0}:{x:c.x/t,y:c.y/t}},dot:(c,t)=>c.x*t.x+c.y*t.y,angleBetween:(c,t)=>{const e=p.dot(p.normalize(c),p.normalize(t));return Math.acos(Math.max(-1,Math.min(1,e)))},sub:(c,t)=>({x:c.x-t.x,y:c.y-t.y}),add:(c,t)=>({x:c.x+t.x,y:c.y+t.y}),mul:(c,t)=>({x:c.x*t,y:c.y*t}),limit:(c,t)=>{const e=c.x*c.x+c.y*c.y;if(e>t*t){const i=Math.sqrt(e);return{x:c.x/i*t,y:c.y/i*t}}return c},seek:(c,t,e)=>{const i={x:t.x-c.x,y:t.y-c.y},s=Math.sqrt(i.x*i.x+i.y*i.y);if(s===0)return{x:0,y:0};const o={x:i.x/s,y:i.y/s};return{x:o.x*e,y:o.y*e}}},Y={NAME_INHERITANCE_CHANCE:.05,FIRST_NAME_SYLLABLES_MIN:2,FIRST_NAME_SYLLABLES_RANGE:2,SURNAME_SYLLABLES_MIN:2,SURNAME_SYLLABLES_RANGE:2},K={plosives:["p","t","k","b","d","g","pr","tr"],fricatives:["s","f","v","th","sh","z","h"],nasals:["m","n","gn","ny"],vowels:["a","e","i","o","u","y"]},mt=["ae","ou","ai","ea"],ft=["m","n","t","k","l","sh","th"],st={NOBILITY_MATING_THRESHOLD:10,NOBILITY_AGE_THRESHOLD_DAYS:1,PROLIFIC_MATING_THRESHOLD:5},G={PIXELS_PER_METER:20,CM_TO_M:.01},M={FPS:60,HOURS_PER_DAY:24,DAYS_PER_SEASON:20,SEASONS_PER_CYCLE:4,FRAMES_PER_DAY:1800,FRAMES_PER_HOUR:75,FRAMES_PER_SEASON:36e3,COMM_COOLDOWN_TICKS:300},Tt={isHourlyTick:c=>c%M.FRAMES_PER_HOUR===0},ot={DAYS_TO_REMEMBER:12,TEMPORARY_MEMORY_LIMIT:200,PERSISTENT_MEMORY_LIMIT:200},z={PERCEPTION_COOLDOWN_TICKS:60,FOOD_MEMORY_ENERGY_THRESHOLD:100,MEMORY_CONFIDENCE_PENALTY:.8,FOOD_DESIRABILITY_DISTANCE_WEIGHT:1,MEMORY_PRUNING_RADIUS_METERS:15},ut={MUTATION_STRENGTH:.12,PHYSICAL_LIMITS:{speed:[.1,5],size:[2,150],metabolism:[.1,5],sight_range:[2,100],sight_fov:[.1,Math.PI*2],lifespan:[100,1e3*(3600*24)],audible_range:[1,20],communicating_range:[.5,10]}},F={INITIAL_ORGANISMS:20,INITIAL_FLORA:90,BLOOM_COUNT_MIN:10,BLOOM_COUNT_MAX:20,BIRTH_COST_BASE:25e3,INITIAL_ENERGY:[7e3,8e3],MATING_ENERGY_THRESHOLD:2e4,MATING_BOND_DURATION_HOURS:2.5},k={TRAIT_SURCHARGE_SPEED_WEIGHT:150,TRAIT_SURCHARGE_SIZE_WEIGHT:5,TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT:20,TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT:1,TRAIT_SURCHARGE_LIFESPAN_WEIGHT:1e-4},V={speed:[1.2,1.5],size:[75,85],metabolism:[.4,.5],sight_range:[15,18],sight_fov:[85*Math.PI/180,95*Math.PI/180],lifespan:[72e3,108e3],audible_range:[3.5,4.5],communicating_range:[2.5,3.5]},I={mToPx:c=>c*G.PIXELS_PER_METER,pxToM:c=>c/G.PIXELS_PER_METER,cmToPx:c=>c*G.CM_TO_M*G.PIXELS_PER_METER,toInternalSpeed:c=>c*G.PIXELS_PER_METER/M.FPS,toDisplaySpeed:c=>c*M.FPS/G.PIXELS_PER_METER,toDegrees:c=>c*180/Math.PI,toRadians:c=>c*Math.PI/180,toDays:c=>c/1800},H={createRandomGenome:c=>{const t={},e=(c==null?void 0:c.traitRanges)||V;return Object.keys(e).forEach(i=>{if(!e[i])return;const s=e[i],o=Math.random()*(s[1]-s[0])+s[0],n=o;t[i]={v1:o,v2:n,d1:Math.random(),d2:Math.random()}}),{traits:t}},express:c=>{const t={};return Object.keys(c.traits).forEach(e=>{const i=c.traits[e];t[e]=i.d1>=i.d2?i.v1:i.v2}),t},mutate:(c,t)=>{const e={},i=(t==null?void 0:t.traitRanges)||V,s=ut.MUTATION_STRENGTH,o=ut.PHYSICAL_LIMITS;return Object.keys(c.traits).forEach(n=>{const a=c.traits[n],d=i[n],r=o[n],l=g=>{const v=d[1]-d[0],A=(Math.random()*2-1)*s*v;return Math.max(r[0],Math.min(r[1],g+A))},f=g=>{const v=(Math.random()*2-1)*s*.5;return Math.max(0,Math.min(1,g+v))};e[n]={v1:l(a.v1),v2:l(a.v2),d1:f(a.d1),d2:f(a.d2)}}),{traits:e}},recombine:(c,t)=>{const e={};return Object.keys(c.traits).forEach(i=>{const s=c.traits[i],o=t.traits[i];e[i]={v1:Math.random()>.5?s.v1:o.v1,v2:Math.random()>.5?s.v2:o.v2,d1:Math.random()>.5?s.d1:o.d1,d2:Math.random()>.5?s.d2:o.d2}}),{traits:e}},ensureIntegrity:c=>{const t=V;Object.keys(t).forEach(e=>{if(!c.traits[e]){const i=t[e],s=Math.random()*(i[1]-i[0])+i[0];c.traits[e]={v1:s,v2:s,d1:Math.random(),d2:Math.random()}}})}},at={organisms:"o",Flora:"f",position:"p",velocity:"v",expressedStats:"es",genome:"g",traits:"tr",memories:"m",id:"i",timestamp:"t",energy:"e",age:"a",generation:"gn",matingCount:"mc",matingTimer:"mt",matingTargetId:"mti",firstName:"fn",surname:"sn",name:"n",color:"c",bending:"b",parentId:"pi",parentA_Id:"pa",parentB_Id:"pb",growthState:"gs",complexity:"cx",lifetime:"lt",biome:"bm",type:"tp",config:"cfg",initialPopulation:"ip",initialEnergy:"ie",traitRanges:"trr"},yt=Object.fromEntries(Object.entries(at).map(([c,t])=>[t,c])),j={STATE:"ales_sim_state",SETTINGS:"ales_settings"};class Rt{constructor(){this.organisms=new Map,this.documents=[],this.settingsCache=new Map,this.eventsCache=[],this.dirtyOrganisms=new Set,this.surnameIndex=new Map,this.familyCountIndex=new Map,this.SAVE_DEBOUNCE_MS=1e3,this.saveTimeout=null,this.DB_NAME="ales_persistence_v2",this.DB_STORES={ORGANISMS:"organisms",EVENTS:"events",SYSTEM:"system"},this.DB_VERSION=1,this.dbPromise=null,this.isReady=!1,this.lastSaveMs=0,this.lastLoadMs=0,this.lastSaveOrgCount=0,this.saveCount=0,this.initDocs()}async init(){if(this.isReady)return;const t=performance.now();try{console.log("[VDB] Opening Database...");const e=await this.openDB();console.log("[VDB] Database opened. Fetching stores...");const[i,s,o]=await Promise.all([this.getAllFromStore(this.DB_STORES.SYSTEM),this.getAllFromStore(this.DB_STORES.ORGANISMS),this.getAllFromStore(this.DB_STORES.EVENTS)]);console.log(`[VDB] Stores fetched: System(${i.length}), Organisms(${s.length}), Events(${o.length})`),i.forEach(({key:n,value:a})=>{n===j.SETTINGS&&Object.entries(a).forEach(([d,r])=>this.settingsCache.set(d,r))}),console.log("[VDB] Detokenizing organisms..."),s.forEach(({key:n,value:a})=>{try{const d=this.detokenize(a);this.organisms.set(d.id,d)}catch(d){console.error(`[VDB] Hydration Error: Failed to detokenize organism ${n}`,d)}}),console.log("[VDB] Refreshing indices..."),this.refreshIndices(),console.log("[VDB] Detokenizing events..."),this.eventsCache=this.detokenize(o.map(n=>n.value)),console.log("[VDB] Hydration complete.")}catch(e){console.warn("[VDB] init() failed, check IndexedDB state",e)}this.isReady=!0,this.lastLoadMs=performance.now()-t,console.log(`[VDB] Init complete in ${this.lastLoadMs.toFixed(1)}ms (${this.organisms.size} records)`)}getSetting(t,e){const i=this.settingsCache.get(t);return i!==void 0?i:e}setSetting(t,e){this.settingsCache.set(t,e);const i=Object.fromEntries(this.settingsCache);this.idbPut(this.DB_STORES.SYSTEM,j.SETTINGS,i).catch(()=>{})}saveSimState(t){const e=()=>{var n;const i=performance.now(),s=this.tokenizeAndPrune(t),o=((n=t.organisms)==null?void 0:n.length)||0;this.idbPut(this.DB_STORES.SYSTEM,j.STATE,s).then(()=>{this.lastSaveMs=performance.now()-i,this.lastSaveOrgCount=o,this.saveCount++,t.organisms&&this.syncLiving(t.organisms)}).catch(()=>{})};typeof window<"u"&&"requestIdleCallback"in window?window.requestIdleCallback(()=>e(),{timeout:2e3}):setTimeout(e,0)}tokenizeAndPrune(t){if(t===null||typeof t!="object")return t;if(Array.isArray(t))return t.map(i=>this.tokenizeAndPrune(i));const e={};for(const i in t){if(i==="expressedStats"||i==="events")continue;const s=at[i]||i;let o=t[i];i==="memories"&&Array.isArray(o)&&o.length>ot.PERSISTENT_MEMORY_LIMIT&&(o=o.slice(-200)),e[s]=this.tokenizeAndPrune(o)}return e}async loadSimState(){try{const t=await this.idbGet(this.DB_STORES.SYSTEM,j.STATE);if(t){const e=this.detokenize(t);return e.events=this.eventsCache,e}}catch{return null}return null}syncLiving(t){t.forEach(e=>{const i=this.organisms.get(e.id);i?this.organisms.set(e.id,{...i,age:e.age,energy:e.energy,matingCount:e.matingCount,isAlive:!0}):(this.organisms.set(e.id,{...e,isAlive:!0,memories:[]}),this.updateIndicesFor(e)),this.dirtyOrganisms.add(e.id)}),this.debounceSave()}pushToHistory(t,e){const i=this.organisms.get(t);if(!i)return;i.memories||(i.memories=[]);const s=i.memories[i.memories.length-1];if(s&&e.content.includes("Energy")&&s.content.includes("Energy")){const n=s.content.match(/Harvested (\d+)x Energy/),a=n?parseInt(n[1]):1;s.content=`Harvested ${a+1}x Energy`,s.timestamp=Date.now()}else i.memories.some(n=>n.id===e.id)||i.memories.push(e);i.memories.length>200&&i.memories.shift(),this.dirtyOrganisms.add(t),this.debounceSave()}markDeceased(t,e){const i=this.organisms.get(t);i&&(e?this.organisms.set(t,{...e,isAlive:!1}):i.isAlive=!1,this.dirtyOrganisms.add(t),this.debounceSave())}addHistory(t){this.organisms.set(t.id,{...t,isAlive:!0}),this.updateIndicesFor(t),this.dirtyOrganisms.add(t.id),this.debounceSave()}getHistory(){return Array.from(this.organisms.values()).sort((t,e)=>e.generation-t.generation)}getFamilyCount(t,e){return this.familyCountIndex.get(`${t}_${e}`)||0}getEvents(){return this.eventsCache}getAssets(){return this.documents}debounceSave(){this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>this.flushDirty(),this.SAVE_DEBOUNCE_MS)}async flushDirty(){if(this.dirtyOrganisms.size===0)return;const e=(await this.openDB()).transaction(this.DB_STORES.ORGANISMS,"readwrite"),i=e.objectStore(this.DB_STORES.ORGANISMS),s=Array.from(this.dirtyOrganisms);this.dirtyOrganisms.clear(),s.forEach(o=>{const n=this.organisms.get(o);if(n){const a=this.tokenize({...n,lastSaved:Date.now()});i.put(a,o)}}),e.oncomplete=()=>{console.log(`[VDB] Atomic flush complete: ${s.length} records persisted.`)}}async saveEventsBatch(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(this.DB_STORES.EVENTS,"readwrite"),n=o.objectStore(this.DB_STORES.EVENTS);n.clear(),t.forEach((a,d)=>n.put(this.tokenize(a),d)),o.oncomplete=()=>i(),o.onerror=()=>s(o.error)})}openDB(){return this.dbPromise?this.dbPromise:(this.dbPromise=new Promise((t,e)=>{if(typeof indexedDB>"u")return e("No IndexedDB");const i=setTimeout(()=>{console.error("[VDB] openDB timeout — IndexedDB may be blocked by another tab."),e(new Error("IndexedDB open timeout"))},3e3),s=indexedDB.open(this.DB_NAME,this.DB_VERSION);s.onupgradeneeded=()=>{const o=s.result;Object.values(this.DB_STORES).forEach(n=>{o.objectStoreNames.contains(n)||o.createObjectStore(n)})},s.onsuccess=()=>{clearTimeout(i),t(s.result)},s.onerror=()=>{clearTimeout(i),e(s.error)},s.onblocked=()=>{console.warn("[VDB] IndexedDB blocked — close other tabs using this app."),clearTimeout(i),e(new Error("IndexedDB blocked"))}}).catch(t=>{throw this.dbPromise=null,t}),this.dbPromise)}async idbPut(t,e,i){const s=await this.openDB();return new Promise((o,n)=>{const a=s.transaction(t,"readwrite");a.objectStore(t).put(i,e),a.oncomplete=()=>o(),a.onerror=()=>n(a.error)})}async idbGet(t,e){const i=await this.openDB();return new Promise((s,o)=>{const a=i.transaction(t,"readonly").objectStore(t).get(e);a.onsuccess=()=>s(a.result??null),a.onerror=()=>o(a.error)})}async getAllFromStore(t){const e=await this.openDB();return new Promise((i,s)=>{const o=e.transaction(t,"readonly"),n=o.objectStore(t),a=n.getAll(),d=n.getAllKeys();o.oncomplete=()=>{const r=a.result,l=d.result;i(r.map((f,g)=>({key:l[g],value:f})))},o.onerror=()=>s(o.error)})}hardReset(){this.openDB().then(t=>{const e=t.transaction(Object.values(this.DB_STORES),"readwrite");Object.values(this.DB_STORES).forEach(i=>e.objectStore(i).clear())}),this.organisms.clear(),this.settingsCache.clear(),this.eventsCache=[],this.refreshIndices()}tokenize(t){if(Array.isArray(t))return t.map(e=>this.tokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=at[i]||i;e[s]=this.tokenize(t[i])}return e}return t}detokenize(t){if(Array.isArray(t))return t.map(e=>this.detokenize(e));if(t!==null&&typeof t=="object"){const e={};for(const i in t){const s=yt[i]||i;e[s]=this.detokenize(t[i])}return e}return t}updateIndicesFor(t){const e=this.surnameIndex.get(t.surname)||new Set;e.add(t.id),this.surnameIndex.set(t.surname,e);const i=`${t.firstName}_${t.surname}`;this.familyCountIndex.set(i,(this.familyCountIndex.get(i)||0)+1)}refreshIndices(){this.surnameIndex.clear(),this.familyCountIndex.clear(),this.organisms.forEach(t=>this.updateIndicesFor(t))}initDocs(){this.documents.push({id:"doc_genetics",type:"SYSTEM_DOC",timestamp:Date.now(),data:{title:"Genetic Expression: Standardized Units",content:"Trait values are expressed in metric units where applicable."}})}}const U=new Rt,dt=class dt{static generateSyllable(t,e,i){const s=(i==null?void 0:i.simplify)??!1,o=s?.08:e.prosody==="Fluid"?.22:e.prosody==="Angry"?.14:.08;let n=K[t][Math.floor(Math.random()*K[t].length)];if(e.phonotacticFilter&&n.length>2&&Math.random()>(s?.05:.35))return this.generateSyllable(t,e,i);s&&n.length>1&&Math.random()<.55&&(n=n[0]);const a=Math.random()<o?mt[Math.floor(Math.random()*mt.length)]:K.vowels[Math.floor(Math.random()*K.vowels.length)],d=s?.12:.2,r=Math.random()<d?ft[Math.floor(Math.random()*ft.length)]:"";return n+a+r}static constructWord(t,e,i){let s="";for(let o=0;o<t;o++){const n=o===0?e:"vowels";s+=this.generateSyllable(n,i,{simplify:o>0})}return s.charAt(0).toUpperCase()+s.slice(1)}static generatePhoneticName(t){const e={prosody:"Fluid",phonotacticFilter:!0};return this.constructWord(t,"plosives",e)}static generateFirstName(){const t=Math.floor(Math.random()*Y.FIRST_NAME_SYLLABLES_RANGE)+Y.FIRST_NAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static generateSurname(){const t=Math.floor(Math.random()*Y.SURNAME_SYLLABLES_RANGE)+Y.SURNAME_SYLLABLES_MIN;return this.generatePhoneticName(t)}static romanize(t){const e={M:1e3,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};let i="",s=t;for(let o in e)for(;s>=e[o];)i+=o,s-=e[o];return i}static constructFullLinguisticProfile(t,e){let i=this.generateFirstName(),s=this.generateSurname(),o="First of their lineage, born of the primal void.",n,a=!1;if(t&&(e?(s=Math.random()>.5?t.surname:e.surname,o=`Inherited the ${s} name from the union of ${t.firstName} and ${e.firstName}.`,(t.houseName||e.houseName)&&(n=t.houseName||e.houseName,a=!0)):(s=t.surname,o=`A direct sprout from the ${s} legacy of ${t.firstName}.`,n=t.houseName,a=t.isNoble||!1),Math.random()<Y.NAME_INHERITANCE_CHANCE)){i=t.firstName,s=t.surname;const r=U.getFamilyCount(i,s)+1,l=r>1?` ${this.romanize(r)}`:"";return{firstName:i,surname:s,name:`${i} ${s}${l}`,lineageDescription:l?`Named after their progenitor, ${t.firstName} ${t.surname}, carrying the weight of ${this.romanize(r)} generations.`:`A fresh branch from the ${s} vine.`,isNoble:a||t.isNoble,houseName:n}}return{firstName:i,surname:s,name:`${i} ${s}`,lineageDescription:o,isNoble:a,houseName:n}}static getTitle(t,e){if(t.isNoble)return"The Noble";if(t.age>e.meanAge*2)return"The Elder";if(t.expressedStats.speed>e.speed95th)return"The Swift";if(t.matingCount>st.PROLIFIC_MATING_THRESHOLD)return"The Prolific"}static generateLexiconEntry(t,e){let i=1,s="plosives",o="Primitive";switch(t){case"Items":i=1,s="plosives",o="Primitive";break;case"Grammar":i=1,s="vowels",o="Primitive";break;case"Species":i=2,s="nasals",o="Abstract";break;case"Entities":i=2,s="plosives",o="Abstract";break;case"Locations":i=3,s="fricatives",o="Navigational";break;case"Places":i=4,s="fricatives",o="Complex";break}const n=this.constructWord(i,s,e),a={id:crypto.randomUUID(),word:n,ipa:`/${n.toLowerCase()}/`,category:t,complexity:o,timestamp:Date.now()};return this.lexicon.push(a),a}static applySemanticDrift(){}static constructPhrase(t){}};dt.lexicon=[];let X=dt;class Q{constructor(t,e,i=50){this.cells=new Map,this.width=t,this.height=e,this.cellSize=i}getCellKey(t){const e=Math.floor(t.x/this.cellSize),i=Math.floor(t.y/this.cellSize);return e<<16|i}update(t){this.cells.clear();for(let e=0;e<t.length;e++){const i=t[e],s=this.getCellKey(i.position);this.cells.has(s)||this.cells.set(s,[]),this.cells.get(s).push(i.id)}}getNeighbors(t,e){const i=[],s=Math.floor((t.x-e)/this.cellSize),o=Math.floor((t.x+e)/this.cellSize),n=Math.floor((t.y-e)/this.cellSize),a=Math.floor((t.y+e)/this.cellSize);for(let d=s;d<=o;d++)for(let r=n;r<=a;r++){const l=d<<16|r,f=this.cells.get(l);f&&i.push(...f)}return i}}class xt{constructor(t=Math.random()){this.p=new Array(512),this.permutation=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];for(let e=0;e<256;e++)this.p[e]=this.permutation[e],this.p[256+e]=this.permutation[e]}fade(t){return t*t*t*(t*(t*6-15)+10)}lerp(t,e,i){return e+t*(i-e)}grad(t,e,i,s){const o=t&15,n=o<8?e:i,a=o<4?i:o===12||o===14?e:s;return((o&1)===0?n:-n)+((o&2)===0?a:-a)}noise(t,e,i=0){const s=Math.floor(t)&255,o=Math.floor(e)&255,n=Math.floor(i)&255;t-=Math.floor(t),e-=Math.floor(e),i-=Math.floor(i);const a=this.fade(t),d=this.fade(e),r=this.fade(i),l=this.p[s]+o,f=this.p[l]+n,g=this.p[l+1]+n,v=this.p[s+1]+o,A=this.p[v]+n,m=this.p[v+1]+n;return this.lerp(r,this.lerp(d,this.lerp(a,this.grad(this.p[f],t,e,i),this.grad(this.p[A],t-1,e,i)),this.lerp(a,this.grad(this.p[g],t,e-1,i),this.grad(this.p[m],t-1,e-1,i))),this.lerp(d,this.lerp(a,this.grad(this.p[f+1],t,e,i-1),this.grad(this.p[A+1],t-1,e,i-1)),this.lerp(a,this.grad(this.p[g+1],t,e-1,i-1),this.grad(this.p[m+1],t-1,e-1,i-1))))}fbm(t,e,i=4){let s=0,o=1,n=1,a=0;for(let d=0;d<i;d++)s+=this.noise(t*o,e*o)*n,a+=n,n*=.5,o*=2;return s/a}}class gt{constructor(t,e,i=Math.random()){this.biomeScale=.002,this.cliffScale=.005,this.cliffThreshold=.65,this.gridRes=512,this.noise=new xt(i),this.width=t,this.height=e,this.collisionGrid=new Uint8Array(this.gridRes*this.gridRes),this.precomputeCollisionGrid()}precomputeCollisionGrid(){for(let t=0;t<this.gridRes;t++)for(let e=0;e<this.gridRes;e++){const i=e/this.gridRes*this.width,s=t/this.gridRes*this.height,o=this.noise.fbm(i*this.cliffScale,s*this.cliffScale,2);this.collisionGrid[t*this.gridRes+e]=o>this.cliffThreshold?1:0}}getBiomeAt(t,e){const i=this.noise.fbm(t*this.biomeScale,e*this.biomeScale,3);return this.noise.fbm(t*this.cliffScale,e*this.cliffScale,2)>this.cliffThreshold?"CLIFF":i>0?"GRASS":"ARID"}isImpassable(t,e){if(t<0||t>this.width||e<0||e>this.height)return!0;const i=Math.floor(t/this.width*(this.gridRes-1)),s=Math.floor(e/this.height*(this.gridRes-1));return this.collisionGrid[s*this.gridRes+i]===1}getSafeSpawnPos(){let t,e,i=0;do t=Math.random()*this.width,e=Math.random()*this.height,i++;while(this.isImpassable(t,e)&&i<100);return{x:t,y:e}}getBiomeColor(t,e,i){const s=this.noise.noise(e*.1,i*.1)*10;switch(t){case"GRASS":return`hsl(${100+s}, 45%, ${25+s}%)`;case"ARID":return`hsl(${35+s}, 35%, ${30+s}%)`;case"CLIFF":return`hsl(0, 0%, ${15+s}%)`;default:return"#000"}}}const w={TRAIT_RANGES:{growth_speed_ratio:[.8,1.2],complexity:[2,12],stem_thickness:[.5,3.5],leaf_size:[10,50],persistence:[2,8],hue:[90,150],clump_radius:[1,3]},ECOLOGY:{HOURLY_RANDOM_SPAWN_CHANCE:.75,BIOME_GRASS_GROWTH:1.5,BIOME_ARID_GROWTH:.1,PROXIMITY_DENSITY_BONUS:3.5,CLUSTER_SEARCH_RADIUS_METERS:1.2,CLUSTER_MIN_NEIGHBORS:2,CLUSTER_MAX_NEIGHBORS:5,CLUSTER_GROWTH_RATE:.55,CLUSTER_SPAWN_DISTANCE_MIN:.1,CLUSTER_SPAWN_DISTANCE_MAX:.5},THERMODYNAMICS:{NUTRIENT_BASE_MIN:150,MASS_TO_ENERGY_SCALAR:350,GROWTH_MASS_PENALTY:.1},generateGenome:()=>{const c=(x,C)=>x+Math.random()*(C-x),t=w.TRAIT_RANGES,e=c(t.growth_speed_ratio[0],t.growth_speed_ratio[1]),i=c(t.complexity[0],t.complexity[1]),s=c(t.stem_thickness[0],t.stem_thickness[1]),o=c(t.leaf_size[0],t.leaf_size[1]),n=c(t.persistence[0],t.persistence[1]),a=c(t.hue[0],t.hue[1]),d=c(t.clump_radius[0],t.clump_radius[1]),r=s*o*(i/6),l=1+r*w.THERMODYNAMICS.GROWTH_MASS_PENALTY,f=e/l,v=M.FRAMES_PER_SEASON/M.FRAMES_PER_HOUR/f,A=Math.max(1e-5,1/v),m=Math.max(w.THERMODYNAMICS.NUTRIENT_BASE_MIN,r*w.THERMODYNAMICS.MASS_TO_ENERGY_SCALAR);return{traits:{structure:{v1:A,v2:i,d1:Math.random(),d2:Math.random()},vitality:{v1:m,v2:n,d1:Math.random(),d2:Math.random()},morphology:{v1:o,v2:a,d1:Math.random(),d2:Math.random()},ecology:{v1:d,v2:s,d1:Math.random(),d2:Math.random()}}}}};class St{static update(t,e){const i=t.biome;let s=1;i==="GRASS"?s=w.ECOLOGY.BIOME_GRASS_GROWTH:i==="ARID"&&(s=w.ECOLOGY.BIOME_ARID_GROWTH),t.nearbyFloraCount&&t.nearbyFloraCount>w.ECOLOGY.CLUSTER_MIN_NEIGHBORS&&(s*=w.ECOLOGY.PROXIMITY_DENSITY_BONUS);const n=t.genome.traits.structure.v1*s;t.growthState<1&&(t.growthState=Math.min(1,t.growthState+n)),t.lifetime!==void 0&&t.lifetime--}}class nt{constructor(t){this.data=t}static create(t,e,i,s,o,n,a){const d=a(),r=d.traits.structure.v2,l=d.traits.vitality.v1,g=d.traits.vitality.v2*M.FRAMES_PER_DAY;return new nt({id:t,name:n,color:`hsl(${d.traits.morphology.v2}, 70%, 50%)`,position:e,energyValue:l,complexity:r,type:o,lifetime:g,genome:d,growthState:.1,nearbyFloraCount:0})}update(t){St.update(this.data,t)}isExpired(){return this.data.lifetime!==void 0&&this.data.lifetime<=0}getExpressedTraits(){const t=this.data.genome.traits.structure.v1*24,e=1-this.data.growthState,i=Math.max(1,Math.ceil(e/t));return{growthRate:(t*100).toFixed(2)+"% / day",maturation:i+" days",complexity:Math.floor(this.data.genome.traits.structure.v2),nutrients:Math.floor(this.data.genome.traits.vitality.v1),leafSize:this.data.genome.traits.morphology.v1.toFixed(1),stemThickness:this.data.genome.traits.ecology.v2.toFixed(1),clumpRadius:this.data.genome.traits.ecology.v1.toFixed(1),hue:Math.floor(this.data.genome.traits.morphology.v2)}}}const At={calculateEnergyLoss:c=>1/c.metabolism*c.speed*c.size/M.HOURS_PER_DAY};class It{constructor(t){this.data=t}update(t,e,i,s){const o=At.calculateEnergyLoss(this.data.expressedStats);this.data.energy-=o,this.data.age++;const n=p.add(this.data.position,this.data.velocity);i.isImpassable(n.x,n.y)&&((n.x<0||n.x>e.x)&&(this.data.velocity.x*=-1),(n.y<0||n.y>e.y)&&(this.data.velocity.y*=-1),i.getBiomeAt(n.x,n.y)==="CLIFF"&&(this.data.velocity.x*=-1,this.data.velocity.y*=-1)),this.data.matingTimer&&this.data.matingTimer>0&&this.data.matingTimer--,this.data.memories=this.data.memories.filter(r=>t-r.timestamp<r.duration),this.data.velocity.x**2+this.data.velocity.y**2>.01&&(this.data.heading=p.normalize(this.data.velocity));const d=I.toInternalSpeed(this.data.expressedStats.speed);this.data.velocity=p.limit(this.data.velocity,d),this.data.position=p.add(this.data.position,this.data.velocity),this.data.position.x=Math.max(0,Math.min(e.x,this.data.position.x)),this.data.position.y=Math.max(0,Math.min(e.y,this.data.position.y))}applySteering(t){const i=I.toInternalSpeed(this.data.expressedStats.speed)*.1,s=p.limit(t,i);this.data.velocity=p.add(this.data.velocity,s)}calculateBending(t){const e=Math.atan2(this.data.velocity.y,this.data.velocity.x),i=p.add(this.data.velocity,t);let o=Math.atan2(i.y,i.x)-e;o>Math.PI&&(o-=Math.PI*2),o<-Math.PI&&(o+=Math.PI*2);const d=(this.data.bending||0)*.85+o*3.5;this.data.bending=Math.max(-1.5,Math.min(1.5,d))}}class Mt{static scan(t,e){const i=t.expressedStats,s=t.position,o=t.heading,n=I.cmToPx(i.size)*.8,a=[],d=[],r=i.sight_range,l=i.sight_fov/2;for(const m of e.flora){const x=p.dist(s,m.position),C=I.pxToM(x);if(x<=n)a.push(m);else if(C<=r){const E=p.normalize(p.sub(m.position,s));Math.acos(p.dot(o,E))<=l&&a.push(m)}}const f=[],g=[],v=i.audible_range,A=i.communicating_range;for(const m of e.organisms){if(m.id===t.id)continue;const x=p.dist(s,m.position),C=I.pxToM(x);if(x<=n)d.push(m);else if(C<=r){const E=p.normalize(p.sub(m.position,s));Math.acos(p.dot(o,E))<=l&&d.push(m)}C<=v&&f.push(m),C<=A&&g.push(m)}return{visibleFlora:a,visibleFauna:d,audibleFauna:f,communicatingFauna:g}}}class Ct{constructor(t){this.data=t}addMemory(t,e,i,s,o){var A;const n=3*M.FRAMES_PER_HOUR,a=I.mToPx(this.data.expressedStats.sight_range),d=o==null?void 0:o.id;let r=this.data.memories.find(m=>{var x;return m.type===e&&(d&&m.data&&m.data.id===d||d&&((x=m.entityIds)==null?void 0:x.includes(d))||m.content===s&&p.dist(m.position,i)<8)});if(r){r.position={...i},t-r.timestamp;return}const l=this.data.memories.find(m=>m.type===e&&t-m.timestamp<n);if(l&&e==="Fauna"){const m=p.dist(l.position,i),x=m/a,C=1-Math.pow(x,.5);if((Math.random()<C||m<50)&&d&&!((A=l.entityIds)!=null&&A.includes(d))){l.entityIds=[...l.entityIds||[],d],l.count=l.entityIds.length,l.count>1&&(l.content=`${l.count} entities encountered`),l.timestamp=t,this.data.memories=[l,...this.data.memories.filter(E=>E.id!==(l==null?void 0:l.id))];return}}const f=M.FRAMES_PER_DAY*ot.DAYS_TO_REMEMBER,g=M.FRAMES_PER_HOUR*12,v=e==="Food"?Math.max(g,f/4):f;if(this.data.memories.push({id:Math.random().toString(36).substr(2,5),type:e,position:{...i},timestamp:t,duration:v,content:s,count:1,data:o,entityIds:o&&o.id?[o.id]:void 0,isFamiliar:o?o.isFamiliar:!1}),this.data.memories.length>ot.TEMPORARY_MEMORY_LIMIT){const m=this.data.memories.findIndex(E=>(E.count||0)<3&&!E.isFamiliar),x=m!==-1?m:0,C=this.data.memories[x];U.pushToHistory(this.data.id,C),this.data.memories.splice(x,1)}}validateMemories(t,e,i){this.data.memories=this.data.memories.filter(s=>!((s.type==="Food"||s.type==="Flora")&&p.dist(i,s.position)<e&&!t.some(a=>p.dist(a.position,s.position)<12)))}removeMemory(t,e){this.data.memories=this.data.memories.filter(i=>{var o;return i.data&&i.data.id===t||((o=i.entityIds)==null?void 0:o.includes(t))?!!(e&&i.type!==e):!0})}getBestFoodLocation(){return this.data.memories.find(t=>t.type==="Food"||t.type==="Flora")||null}}class Nt{constructor(t){this.me=t,this.memorySystem=new Ct(t)}decide(t,e,i,s){var C,E;const o=Mt.scan(this.me,i);this.memorySystem.validateMemories(o.visibleFlora,I.mToPx(this.me.expressedStats.sight_range),this.me.position);const n=t,a=this.me.lastPerceptionTick||0,d=z.PERCEPTION_COOLDOWN_TICKS;n-a>=d&&(o.visibleFlora.forEach(h=>{h.energyValue>z.FOOD_MEMORY_ENERGY_THRESHOLD&&this.memorySystem.addMemory(t,"Food",h.position,h.name,{energy:h.energyValue,id:h.id})}),o.visibleFauna.forEach(h=>{const y=this.me.memories.some(b=>{var N;return((N=b.data)==null?void 0:N.id)===h.id&&b.isFamiliar});this.memorySystem.addMemory(t,"Fauna",h.position,h.name,{id:h.id,name:h.name,isFamiliar:y})}),this.me.lastPerceptionTick=n);const r=M.COMM_COOLDOWN_TICKS,l=this.me.lastVocalTick||0;if(n-l>=r&&o.communicatingFauna.length>0){let h=!1;o.communicatingFauna.forEach(y=>{const b=p.dist(this.me.position,y.position),N=I.pxToM(b),D=y.expressedStats.audible_range;if(N<=D){const O=this.me.memories.find(u=>u.type==="Food");O&&(y.memories.some(S=>S.type===O.type&&p.dist(S.position,O.position)<10)||(y.memories.push({...O,id:Math.random().toString(36).substr(2,5),timestamp:n,content:O.content,count:1}),y.isHearingActive=!0,this.memorySystem.addMemory(t,"Fauna",y.position,y.name,{id:y.id,name:y.name,isFamiliar:!0}),h=!0))}}),h&&(this.me.lastVocalTick=n,this.me.isTransmittingActive=!0)}let f={x:0,y:0},g=null,v=-1,A=null,m=null;for(const h of o.visibleFlora){const y=p.dist(this.me.position,h.position),b=h.energyValue*h.growthState/(y+z.FOOD_DESIRABILITY_DISTANCE_WEIGHT);b>v&&(v=b,g=h.position,A=h,m=h.id)}const x=this.me.memories.filter(h=>h.type==="Food");for(const h of x){const y=p.dist(this.me.position,h.position),N=(((C=h.data)==null?void 0:C.energy)||500)*z.MEMORY_CONFIDENCE_PENALTY/(y+z.FOOD_DESIRABILITY_DISTANCE_WEIGHT);N>v&&(v=N,g=h.position,A=null,m=((E=h.data)==null?void 0:E.id)||null)}if(g){let h=A;h||(h=o.visibleFlora.find(N=>p.dist(N.position,g)<10)||null);const y=p.dist(this.me.position,g),b=I.cmToPx(this.me.expressedStats.size)*.8;if(h&&y<b)s.onEat(h),this.memorySystem.addMemory(t,"Flora",h.position,`Ate ${h.name}`,{energy:h.energyValue,id:h.id}),this.memorySystem.removeMemory(h.id,"Food");else{const N=I.cmToPx(this.me.expressedStats.size)*2;if(y<z.MEMORY_PRUNING_RADIUS_METERS&&!h&&!A&&m)return this.memorySystem.removeMemory(m,"Food"),{x:0,y:0};let D=I.toInternalSpeed(this.me.expressedStats.speed);y<N&&(D*=y/N);const O=p.normalize(p.sub(g,this.me.position)),u=p.mul(O,D);f=p.sub(u,this.me.velocity)}}else{const h=t*.005,y=parseInt(this.me.id)||0,b=Math.sin(h+y)+Math.sin(h*.5+y),N=Math.cos(h+y)+Math.cos(h*.5+y),D=p.normalize({x:b,y:N}),O=I.toInternalSpeed(this.me.expressedStats.speed)*.4,u=Math.sqrt(this.me.velocity.x**2+this.me.velocity.y**2);let S={x:0,y:0};u<.05&&(S={x:(Math.random()-.5)*5,y:(Math.random()-.5)*5});const P=p.add(p.mul(D,O),S);f=p.sub(P,this.me.velocity)}if(this.me.energy>F.MATING_ENERGY_THRESHOLD&&this.me.matingTimer===0){const h=o.visibleFauna.find(y=>y.energy>F.MATING_ENERGY_THRESHOLD&&y.matingTimer===0&&y.id!==this.me.id);if(h){const y=p.dist(this.me.position,h.position),b=I.cmToPx(this.me.expressedStats.size)*1.5;if(y<b)return s.onMate(h),{x:0,y:0};{const N=p.normalize(p.sub(h.position,this.me.position)),D=I.toInternalSpeed(this.me.expressedStats.speed),O=p.mul(N,D);f=p.add(f,p.sub(O,this.me.velocity))}}}return f}}class wt extends It{constructor(t){super(t),this.brain=new Nt(t)}update(t,e,i,s){super.update(t,e,i,s)}think(t,e,i,s,o,n){const a=this.data;a.isHearingActive=!1,a.isTransmittingActive=!1,t%60===0&&(a.title=X.getTitle(a,s),!a.isNoble&&(a.matingCount>st.NOBILITY_MATING_THRESHOLD||a.age>st.NOBILITY_AGE_THRESHOLD_DAYS*M.FRAMES_PER_DAY)&&(a.isNoble=!0,a.houseName=`House ${a.surname}`,a.lineageDescription=`Founder of the Noble ${a.houseName}.`));const d=this.brain.decide(t,e,o,n);this.applySteering(d),this.calculateBending(d)}}const bt={processBirth:(c,t)=>{const e=t?H.recombine(c.genome,t.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})(),i=H.mutate(e),s=H.express(i),o=F.BIRTH_COST_BASE/2,n=s.speed*k.TRAIT_SURCHARGE_SPEED_WEIGHT+s.size*k.TRAIT_SURCHARGE_SIZE_WEIGHT+s.sight_range*k.TRAIT_SURCHARGE_SIGHT_RANGE_WEIGHT+s.sight_fov*k.TRAIT_SURCHARGE_SIGHT_FOV_WEIGHT+s.lifespan*k.TRAIT_SURCHARGE_LIFESPAN_WEIGHT,a=o+n/2,d=f=>Math.min(1,1/f),r=a*d(c.expressedStats.metabolism),l=t?a*d(t.expressedStats.metabolism):r;return{childGenome:i,childStats:s,costToEachParent:a,initialEnergy:r+l,energyWasted:a*2-(r+l)}}},$=class ${constructor(t,e,i){this.lastId=0,this.floraGridDirty=!0,this.logicInstances=new Map,this.config={initialPopulation:F.INITIAL_ORGANISMS,initialEnergy:F.INITIAL_ENERGY,traitRanges:V};const s=i||null;s?(this.state={config:{...this.config},hour:0,day:0,season:1,cycle:1,events:[],apexCandidates:[],organisms:[],Flora:[],seed:Math.random(),...s},this.state.config.traitRanges={...V},this.state.config.initialEnergy=[...F.INITIAL_ENERGY],s.food&&(!this.state.Flora||this.state.Flora.length===0)&&(this.state.Flora=s.food),this.state.Flora&&this.state.Flora.forEach(a=>{a.growthState===void 0&&(a.growthState=.5),a.genome||(a.genome={traits:{structure:{v1:.001,v2:6,d1:.5,d2:.5},vitality:{v1:1200,v2:1e4,d1:.5,d2:.5},morphology:{v1:4,v2:120,d1:.5,d2:.5},ecology:{v1:20,v2:1.5,d1:.5,d2:.5}}})}),this.state.organisms&&this.state.organisms.forEach(a=>{(!a.genome||!a.genome.traits||Object.keys(a.genome.traits).length===0)&&(console.warn(`SimEngine: Healed CORRUPT genome for organism ${a.id}`,a.genome),a.genome=H.createRandomGenome(this.state.config)),H.ensureIntegrity(a.genome),a.expressedStats=H.express(a.genome),a.memories||(a.memories=[]),a.heading||(a.heading=p.normalize({x:Math.random()-.5,y:Math.random()-.5}))})):this.state={organisms:[],Flora:[],worldSize:{x:t,y:e},time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random()};const o=this.state.worldSize.x,n=this.state.worldSize.y;if(this.terrain=new gt(o,n,this.state.seed),this.orgGrid=new Q(o,n,G.PIXELS_PER_METER),this.FloraGrid=new Q(o,n,G.PIXELS_PER_METER),s){const a=(this.state.organisms||[]).map(r=>parseInt(r.id)).filter(r=>!isNaN(r)),d=(this.state.Flora||[]).map(r=>parseInt(r.id)).filter(r=>!isNaN(r));this.lastId=Math.max(0,...a,...d)}else this.init()}init(){for(let t=0;t<this.state.config.initialPopulation;t++)this.spawnOrganism();for(let t=0;t<F.INITIAL_FLORA;t++){const e=.4+Math.random()*.5;this.spawnFlora(void 0,void 0,e)}}hardReset(){U.hardReset(),this.logicInstances.clear(),this.state={organisms:[],Flora:[],worldSize:this.state.worldSize,time:0,day:0,hour:0,season:1,cycle:1,config:this.config,events:[],apexCandidates:[],seed:Math.random(),lastResetTime:new Date().toISOString()},this.lastId=0,this.terrain=new gt(this.state.worldSize.x,this.state.worldSize.y),this.orgGrid=new Q(this.state.worldSize.x,this.state.worldSize.y,G.PIXELS_PER_METER),this.FloraGrid=new Q(this.state.worldSize.x,this.state.worldSize.y,G.PIXELS_PER_METER),this.init()}spawnOrganism(t,e,i,s,o){const n=o||(t?e?H.recombine(t.genome,e.genome):(()=>{throw new Error("Asexual reproduction is disabled.")})():H.createRandomGenome(this.state.config)),a=H.express(n),d=X.generateFirstName(),r=t?e?Math.random()>.5?t.surname:e.surname:t.surname:X.generateSurname(),l={id:(++this.lastId).toString(),parentA_Id:t==null?void 0:t.id,parentB_Id:e==null?void 0:e.id,position:i||this.terrain.getSafeSpawnPos(),velocity:{x:(Math.random()-.5)*2,y:(Math.random()-.5)*2},heading:p.normalize({x:Math.random()-.5,y:Math.random()-.5}),energy:s!==void 0?s:t?400:this.state.config.initialEnergy[0]+Math.random()*(this.state.config.initialEnergy[1]-this.state.config.initialEnergy[0]),age:0,genome:n,expressedStats:a,color:t?t.color:`hsl(${Math.random()*360}, 70%, 60%)`,generation:t?t.generation+1:1,name:`${d} ${r}`,firstName:d,surname:r,matingTimer:0,matingCount:0,memories:[],timestamp:this.state.time,bending:0};typeof window<"u"?U.addHistory(l):self.postMessage({type:"REGISTRY_LOG",data:l}),this.state.organisms.push(l),this.logEvent("BIRTH",t?`${l.name} born to ${t.surname} clan`:`Progenitor ${l.name} enters the world`,l.position,l.id,l.color)}spawnFlora(t,e="HERBIVORE",i){const s=t||this.terrain.getSafeSpawnPos(),o=nt.create(Math.random().toString(36).substr(2,9),s,0,0,e,"Fern",w.generateGenome);i!==void 0&&(o.data.growthState=i),o.data.biome=this.terrain.getBiomeAt(s.x,s.y),this.state.Flora.push(o.data),this.floraGridDirty=!0}logEvent(t,e,i,s,o){this.state.events||(this.state.events=[]),this.state.events.unshift({id:Math.random().toString(36).substr(2,9),type:t,message:e,timestamp:this.state.time,position:{...i},entityId:s,color:o}),this.state.events.length>50&&this.state.events.pop()}forceSave(){this.state.events&&this.state.events.length>20&&(this.state.events=this.state.events.slice(0,20)),typeof window<"u"&&(U.syncLiving(this.state.organisms),U.saveSimState(this.state))}update(){this.state.time++;const t=Tt.isHourlyTick(this.state.time);this.state.time%600===0&&this.forceSave(),this.orgGrid.update(this.state.organisms),this.floraGridDirty&&(this.FloraGrid.update(this.state.Flora),this.floraGridDirty=!1);const e=new Map;this.state.organisms.forEach(r=>e.set(r.id,r));const i=new Map;this.state.Flora.forEach(r=>i.set(r.id,r)),this.state.hour=Math.floor(this.state.time%M.FRAMES_PER_DAY/M.FRAMES_PER_HOUR);const s=Math.floor(this.state.time/M.FRAMES_PER_DAY);this.state.day=s;const o=Math.floor(s/M.DAYS_PER_SEASON),n=this.state.season;if(this.state.season=o%M.SEASONS_PER_CYCLE+1,this.state.cycle=Math.floor(o/M.SEASONS_PER_CYCLE)+1,n!==this.state.season){const r=Math.floor(F.BLOOM_COUNT_MIN+Math.random()*(F.BLOOM_COUNT_MAX-F.BLOOM_COUNT_MIN));for(let l=0;l<r;l++)this.spawnFlora();this.logEvent("MILESTONE",`Season ${this.state.season} bloom: ${r} new flora emerged`,{x:this.state.worldSize.x/2,y:this.state.worldSize.y/2},void 0,"#4ade80")}if(t){Math.random()<w.ECOLOGY.HOURLY_RANDOM_SPAWN_CHANCE&&this.spawnFlora();const r=I.mToPx(w.ECOLOGY.CLUSTER_SEARCH_RADIUS_METERS);this.state.Flora.forEach(l=>{St.update(l,this.terrain);const g=this.FloraGrid.getNeighbors(l.position,r).length;if(l.nearbyFloraCount=g,g>=w.ECOLOGY.CLUSTER_MIN_NEIGHBORS&&g<w.ECOLOGY.CLUSTER_MAX_NEIGHBORS&&Math.random()<w.ECOLOGY.CLUSTER_GROWTH_RATE*l.growthState){const v=Math.random()*Math.PI*2,A=w.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN+Math.random()*(w.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MAX-w.ECOLOGY.CLUSTER_SPAWN_DISTANCE_MIN),m=I.mToPx(A),x={x:l.position.x+Math.cos(v)*m,y:l.position.y+Math.sin(v)*m};x.x>0&&x.x<this.state.worldSize.x&&x.y>0&&x.y<this.state.worldSize.y&&this.spawnFlora(x)}}),this.state.Flora=this.state.Flora.filter(l=>l.lifetime===void 0||l.lifetime>0)}if(this.state.time%60===0)if(this.state.organisms.length>0){const r=this.state.organisms.map(g=>g.age),l=r.reduce((g,v)=>g+v,0)/r.length,f=this.state.organisms.map(g=>g.expressedStats.speed).sort((g,v)=>g-v);$.lastPopStats={meanAge:l,speed95th:f[Math.floor(f.length*.95)]||0},this.state.apexCandidates=[...this.state.organisms].sort((g,v)=>v.generation-g.generation||v.energy-g.energy).slice(0,20)}else this.state.apexCandidates=[];const a=$.lastPopStats;this.state.organisms.forEach(r=>{let l=this.logicInstances.get(r.id);if(l||(l=new wt(r),this.logicInstances.set(r.id,l)),r.matingTimer===0&&r.matingTargetId){const E=e.get(r.matingTargetId);if(E&&parseInt(r.id)<parseInt(E.id)){const h=bt.processBirth(r,E);r.energy-=h.costToEachParent,E.energy-=h.costToEachParent,this.spawnOrganism(r,E,{...r.position},h.initialEnergy,h.childGenome),r.matingCount++,E.matingCount++}r.matingTargetId=void 0}const f=I.mToPx(r.expressedStats.sight_range),g=I.mToPx(r.expressedStats.audible_range||3),v=Math.max(f,g),m=this.FloraGrid.getNeighbors(r.position,f).map(E=>i.get(E)).filter(E=>E!==void 0),C=this.orgGrid.getNeighbors(r.position,v).map(E=>e.get(E)).filter(E=>E!==void 0&&E.id!==r.id);l.think(this.state.time,this.state.worldSize,this.terrain,a,{organisms:C,flora:m},{onEat:E=>{r.energy+=E.energyValue*E.growthState;const h=this.state.Flora.findIndex(y=>y.id===E.id);h!==-1&&(this.state.Flora.splice(h,1),this.floraGridDirty=!0)},onMate:E=>{if(r.matingTimer===0&&E.matingTimer===0){const h=F.MATING_BOND_DURATION_HOURS*M.FRAMES_PER_HOUR;r.matingTimer=h,r.matingTargetId=E.id,E.matingTimer=h,E.matingTargetId=r.id,this.logEvent("MILESTONE",`${r.name} & ${E.name} are bonding`,r.position)}}}),l.update(this.state.time,this.state.worldSize,this.terrain,a)}),this.state.organisms=this.state.organisms.filter(r=>{const l=r.age>r.expressedStats.lifespan||r.energy<=0;return l&&(this.logicInstances.delete(r.id),this.spawnFlora(r.position,"CARNIVORE"),typeof window<"u"?U.markDeceased(r.id,r):self.postMessage({type:"REGISTRY_DEATH",id:r.id,data:r})),!l});const d=this.state.Flora.length;this.state.Flora=this.state.Flora.filter(r=>r.lifetime!==void 0?(r.lifetime--,r.lifetime>0):!0),this.state.Flora.length!==d&&(this.floraGridDirty=!0)}};$.lastPopStats={meanAge:0,speed95th:0};let rt=$;class Ot{static getVisuals(t){const e=t.expressedStats.speed/1.5;return{primaryColor:t.color,skeletalRigidity:Pt(1-e,.2,1)}}}function Pt(c,t,e){return Math.max(t,Math.min(e,c))}const R=class R{constructor(t){this.terrainInitialized=!1,this.orgDataBuffer=new Float32Array(R.MAX_INSTANCES*4*5),this.floraDataBuffer=new Float32Array(R.MAX_INSTANCES*4*2),this.colorCache=new Map,this.prevVelocities=new Map;const e=t.getContext("webgl2",{alpha:!1,antialias:!0,preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e,this.program=this.createProgram(R.VERT_SHADER,R.FRAG_SHADER),this.faunaProgram=this.createProgram(R.FAUNA_VERT_SHADER,R.FAUNA_FRAG_SHADER),this.floraProgram=this.createProgram(R.FLORA_VERT_SHADER,R.FLORA_FRAG_SHADER),this.quadBuffer=this.createQuad(),this.faunaUnitQuadBuffer=this.createQuad(),this.floraUnitQuadBuffer=this.createQuad(),this.instanceIDBuffer=this.gl.createBuffer();const i=new Int32Array(R.MAX_INSTANCES);for(let s=0;s<R.MAX_INSTANCES;s++)i[s]=s;this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.instanceIDBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,i,this.gl.STATIC_DRAW),this.orgTexture=this.createDataTexture(R.MAX_INSTANCES,5),this.floraTexture=this.createDataTexture(R.MAX_INSTANCES,2),this.terrainTexture=e.createTexture()}createShader(t,e){const i=this.gl.createShader(t);if(this.gl.shaderSource(i,e),this.gl.compileShader(i),!this.gl.getShaderParameter(i,this.gl.COMPILE_STATUS))throw new Error("Shader compile error: "+this.gl.getShaderInfoLog(i));return i}createProgram(t,e){const i=this.createShader(this.gl.VERTEX_SHADER,t),s=this.createShader(this.gl.FRAGMENT_SHADER,e),o=this.gl.createProgram();if(this.gl.attachShader(o,i),this.gl.attachShader(o,s),this.gl.linkProgram(o),!this.gl.getProgramParameter(o,this.gl.LINK_STATUS))throw new Error("Program link error: "+this.gl.getProgramInfoLog(o));return o}createQuad(){const t=this.gl.createBuffer();return this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),this.gl.STATIC_DRAW),t}createDataTexture(t,e){const i=this.gl,s=i.createTexture();return i.bindTexture(i.TEXTURE_2D,s),i.texImage2D(i.TEXTURE_2D,0,i.RGBA32F,t,e,0,i.RGBA,i.FLOAT,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.NEAREST),s}static parseHSL(t){const e=t.match(/hsl\((\d+\.?\d*),\s*(\d+)%,\s*(\d+)%\)/);if(!e)return[.5,.5,.5];const i=parseFloat(e[1])/360,s=parseInt(e[2])/100,o=parseInt(e[3])/100,n=(r,l,f)=>(f<0&&(f+=1),f>1&&(f-=1),f<1/6?r+(l-r)*6*f:f<1/2?l:f<2/3?r+(l-r)*(2/3-f)*6:r),a=o<.5?o*(1+s):o+s-o*s,d=2*o-a;return[n(d,a,i+1/3),n(d,a,i),n(d,a,i-1/3)]}updateTerrainTexture(t,e){const i=this.gl,s=512,o=new Uint8Array(s*s*4);for(let n=0;n<s;n++)for(let a=0;a<s;a++){const d=t.getBiomeAt(a/s*e.x,n/s*e.y),r=(n*s+a)*4;d==="GRASS"?o[r]=255:d==="CLIFF"&&(o[r]=127,o[r+1]=255),o[r+3]=255}i.bindTexture(i.TEXTURE_2D,this.terrainTexture),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,s,s,0,i.RGBA,i.UNSIGNED_BYTE,o),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),this.terrainInitialized=!0}render(t){const e=this.gl,i=1/t.zoom,s=(0-t.cameraOffset[0])*i-100,o=(t.logicalResolution[0]-t.cameraOffset[0])*i+100,n=(0-t.cameraOffset[1])*i-100,a=(t.logicalResolution[1]-t.cameraOffset[1])*i+100,d=t.organisms.filter(u=>u.position.x>s&&u.position.x<o&&u.position.y>n&&u.position.y<a),r=t.Flora.filter(u=>u.position.x>s&&u.position.x<o&&u.position.y>n&&u.position.y<a);e.viewport(0,0,t.resolution[0],t.resolution[1]);const l=this.orgDataBuffer;l.fill(0);const f=Math.min(d.length,R.MAX_INSTANCES),g=new Map;for(let u=0;u<f;u++)g.set(d[u].id,u);for(let u=0;u<f;u++){const S=d[u],P=Ot.getVisuals(S);let L=this.colorCache.get(S.id);L||(L=R.parseHSL(P.primaryColor),this.colorCache.set(S.id,L));const[W,Ft,Dt]=L,_t=I.cmToPx(S.expressedStats.size),J=u*4;l[J]=S.position.x,l[J+1]=S.position.y,l[J+2]=_t*.4,l[J+3]=_t*.2;const tt=(R.MAX_INSTANCES+u)*4;l[tt]=W,l[tt+1]=Ft,l[tt+2]=Dt,l[tt+3]=parseFloat(S.id);const et=(R.MAX_INSTANCES*2+u)*4;l[et]=S.velocity.x,l[et+1]=S.velocity.y,l[et+2]=S.expressedStats.sight_fov,l[et+3]=S.id===t.selectedId?1:0;const it=(R.MAX_INSTANCES*3+u)*4;l[it]=(S.bending||0)*P.skeletalRigidity;let Et=-1;if(S.matingTimer&&S.matingTimer>0&&S.matingTargetId){const vt=g.get(S.matingTargetId);vt!==void 0&&(Et=vt)}l[it+1]=Et,l[it+2]=I.mToPx(S.expressedStats.sight_range),l[it+3]=I.mToPx(S.expressedStats.audible_range||3)+(S.isHearingActive?1e4:0);const q=(R.MAX_INSTANCES*4+u)*4;l[q]=I.mToPx(S.expressedStats.communicating_range||1.5)+(S.isTransmittingActive?1e4:0);const Lt=S.energy>28e3?1:0,Gt=S.matingTimer&&S.matingTimer>0?S.matingTimer/120:0;l[q+1]=Lt+Gt,l[q+2]=Math.min(1,S.energy/3e4);const ht=this.prevVelocities.get(S.id);ht?l[q+3]=(ht.x*S.velocity.y-ht.y*S.velocity.x)*5:l[q+3]=0}for(let u=0;u<f;u++){const S=d[u];this.prevVelocities.set(S.id,{x:S.velocity.x,y:S.velocity.y})}e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,R.MAX_INSTANCES,5,e.RGBA,e.FLOAT,l);const v=this.floraDataBuffer;v.fill(0);const A=Math.min(r.length,R.MAX_INSTANCES);for(let u=0;u<A;u++){const S=r[u],P=u*4;v[P]=S.position.x,v[P+1]=S.position.y,v[P+2]=S.growthState,v[P+3]=S.complexity;const L=(R.MAX_INSTANCES+u)*4,W=R.parseHSL(S.color);v[L]=W[0],v[L+1]=W[1],v[L+2]=W[2],v[L+3]=parseFloat(S.id)}e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.texSubImage2D(e.TEXTURE_2D,0,0,0,R.MAX_INSTANCES,2,e.RGBA,e.FLOAT,v),e.useProgram(this.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.terrainTexture);const m=(u,S,P)=>e.uniform1f(e.getUniformLocation(u,S),P),x=(u,S,P,L)=>e.uniform2f(e.getUniformLocation(u,S),P,L),C=u=>{x(u,"u_logicalResolution",t.logicalResolution[0],t.logicalResolution[1]),x(u,"u_cameraOffset",t.cameraOffset[0],t.cameraOffset[1]),m(u,"u_zoom",t.zoom),m(u,"u_time",t.time/M.FPS),m(u,"u_selectedId",t.selectedId?parseFloat(t.selectedId):-1),m(u,"u_hoveredId",t.hoveredId?parseFloat(t.hoveredId):-1)};C(this.program),x(this.program,"u_resolution",t.resolution[0],t.resolution[1]),x(this.program,"u_worldSize",t.worldSize[0],t.worldSize[1]),m(this.program,"u_showVision",t.showVision?1:0),m(this.program,"u_showHearing",t.showHearing?1:0),m(this.program,"u_showCommunication",t.showCommunication?1:0),m(this.program,"u_showGrid",t.showGrid?1:0),e.uniform1i(e.getUniformLocation(this.program,"u_orgTexture"),0),e.uniform1i(e.getUniformLocation(this.program,"u_terrainTexture"),1),e.uniform1i(e.getUniformLocation(this.program,"u_orgCount"),f);const E=t.organisms.find(u=>u.id===t.selectedId),h=t.organisms.find(u=>u.id===t.hoveredId);x(this.program,"u_selectedPos",E?E.position.x:-1e3,E?E.position.y:-1e3),m(this.program,"u_selectedSize",E?I.cmToPx(E.expressedStats.size)*.5:0),x(this.program,"u_hoveredPos",h?h.position.x:-1e3,h?h.position.y:-1e3),m(this.program,"u_hoveredSize",h?I.cmToPx(h.expressedStats.size)*.5:0),e.bindBuffer(e.ARRAY_BUFFER,this.quadBuffer);const y=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(y),e.vertexAttribPointer(y,2,e.FLOAT,!1,0,0),e.drawArrays(e.TRIANGLES,0,6),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.useProgram(this.faunaProgram),C(this.faunaProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.orgTexture),e.uniform1i(e.getUniformLocation(this.faunaProgram,"u_orgTexture"),0),m(this.faunaProgram,"u_showVision",t.showVision?1:0),m(this.faunaProgram,"u_showHearing",t.showHearing?1:0),m(this.faunaProgram,"u_showCommunication",t.showCommunication?1:0),e.bindBuffer(e.ARRAY_BUFFER,this.faunaUnitQuadBuffer);const b=e.getAttribLocation(this.faunaProgram,"a_unitPosition");e.enableVertexAttribArray(b),e.vertexAttribPointer(b,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const N=e.getAttribLocation(this.faunaProgram,"a_instanceID");e.enableVertexAttribArray(N),e.vertexAttribIPointer(N,1,e.INT,0,0),e.vertexAttribDivisor(N,1),e.drawArraysInstanced(e.TRIANGLES,0,6,f),e.useProgram(this.floraProgram),C(this.floraProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.floraTexture),e.uniform1i(e.getUniformLocation(this.floraProgram,"u_floraTexture"),0),e.bindBuffer(e.ARRAY_BUFFER,this.floraUnitQuadBuffer);const D=e.getAttribLocation(this.floraProgram,"a_unitPosition");e.enableVertexAttribArray(D),e.vertexAttribPointer(D,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.instanceIDBuffer);const O=e.getAttribLocation(this.floraProgram,"a_instanceID");e.enableVertexAttribArray(O),e.vertexAttribIPointer(O,1,e.INT,0,0),e.vertexAttribDivisor(O,1),e.drawArraysInstanced(e.TRIANGLES,0,6,A),e.disableVertexAttribArray(O),e.vertexAttribDivisor(O,0),e.disable(e.BLEND)}};R.MAX_INSTANCES=2048,R.VERT_SHADER=`#version 300 es
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
    `;let lt=R,_=null,B=null,pt=!1,Z=0,T={cameraOffset:[0,0],zoom:1,selectedId:null,hoveredId:null,isFollowing:!1,showVision:!1,showGrid:!1,showHearing:!1,showCommunication:!1,dpr:1,resolution:[1920,1080]};self.onmessage=c=>{const{type:t,data:e}=c.data;switch(t){case"INIT":const{canvas:i,worldSize:s,initialState:o,resolution:n}=e;console.log("[Worker] Initializing Engine & Renderer..."),_=new rt(s.x,s.y,o),n&&(T.resolution=n,T.dpr=e.dpr||1,i.width=n[0],i.height=n[1]),B=new lt(i),B.updateTerrainTexture(_.terrain,s),performance.now(),console.log("[Worker] Initialization Complete. Starting Tick."),requestAnimationFrame(ct);break;case"UPDATE_CAMERA":T={...T,...e};break;case"SET_PAUSED":pt=e;break;case"RESIZE":T.resolution=[e.width,e.height],B&&B.gl.canvas&&(B.gl.canvas.width=e.width,B.gl.canvas.height=e.height);break;case"HIT_TEST":if(_){const{x:a,y:d}=e,r=a,l=d;let f=null;for(const g of _.state.organisms){const v=(g.position.x-r)**2+(g.position.y-l)**2,A=g.expressedStats.size*.4+25;if(v<A*A){f=g.id;break}}if(!f){for(const g of _.state.Flora)if((g.position.x-r)**2+(g.position.y-l)**2<900){f=g.id;break}}self.postMessage({type:"HIT_RESULT",data:f,originalEvent:e.originalEvent})}break;case"UPDATE_CONFIG":_&&(_.state.config=e);break;case"RESET":_&&_.hardReset();break}};function ct(c){if(!_||!B){requestAnimationFrame(ct);return}if(!pt){if(_.update(),_.state.organisms.length===0?(Z++,Z>=300&&(console.warn("[Worker] Extinction detected — all organisms dead. Auto-resetting simulation."),_.hardReset(),B.updateTerrainTexture(_.terrain,_.state.worldSize),Z=0,self.postMessage({type:"STATE_REFRESH",data:{time:_.state.time,day:_.state.day,hour:_.state.hour,popCount:_.state.organisms.length,floraCount:_.state.Flora.length,events:_.state.events.slice(0,5),apexCandidates:_.state.apexCandidates,selectedEntity:null,hoveredEntity:null,lastResetTime:_.state.lastResetTime}}))):Z=0,T.isFollowing&&T.selectedId){const t=_.state.organisms.find(e=>e.id===T.selectedId);if(t){const e=T.resolution[0]/T.dpr,i=T.resolution[1]/T.dpr,s=e/2-t.position.x*T.zoom,o=i/2-t.position.y*T.zoom;T.cameraOffset[0]+=(s-T.cameraOffset[0])*.1,T.cameraOffset[1]+=(o-T.cameraOffset[1])*.1,self.postMessage({type:"CAMERA_SYNC",data:{offset:T.cameraOffset}})}}if(_.state.time%10===0){const t=T.selectedId?_.state.organisms.find(i=>i.id===T.selectedId)||_.state.Flora.find(i=>i.id===T.selectedId):null,e=!T.selectedId&&T.hoveredId?_.state.organisms.find(i=>i.id===T.hoveredId)||_.state.Flora.find(i=>i.id===T.hoveredId):null;self.postMessage({type:"STATE_REFRESH",data:{time:_.state.time,day:_.state.day,hour:_.state.hour,popCount:_.state.organisms.length,floraCount:_.state.Flora.length,events:_.state.events.slice(0,5),apexCandidates:_.state.apexCandidates,selectedEntity:t,hoveredEntity:e,lastResetTime:_.state.lastResetTime}})}_.state.time%600===0&&self.postMessage({type:"SAVE_REQUIRED",data:_.state})}B.render({resolution:T.resolution,logicalResolution:[T.resolution[0]/T.dpr,T.resolution[1]/T.dpr],worldSize:[_.state.worldSize.x,_.state.worldSize.y],cameraOffset:T.cameraOffset,zoom:T.zoom,time:_.state.time,organisms:_.state.organisms,Flora:_.state.Flora,selectedId:T.selectedId,hoveredId:T.hoveredId,isFollowing:T.isFollowing,dpr:T.dpr,showVision:T.showVision,showGrid:T.showGrid,showHearing:T.showHearing,showCommunication:T.showCommunication}),requestAnimationFrame(ct)}})();
