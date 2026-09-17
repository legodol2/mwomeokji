import { ING, AISLES, FRESH_AISLES, TOOLS, PANTRY, R, MART, REGIONS, PROVINCE } from './data';

const TOOLNAME = Object.fromEntries(TOOLS.map(t => [t.id, t.n]));
export const WHEN = { 1:['저녁'], 2:['점심','저녁'], 3:['아침','점심','저녁'] };
export const won = n => Math.round(n).toLocaleString('ko-KR');
export function qty(id, v){
  const u = ING[id].u;
  if(u==='g' && v>=1000) return (Math.round(v/100)/10)+'kg';
  if(u==='ml' && v>=1000) return (Math.round(v/100)/10)+'L';
  return (Math.round(v*10)/10)+u;
}
export function toolNames(r){
  return r.tools.map(t => Array.isArray(t) ? t.map(x=>TOOLNAME[x]).join(' 또는 ') : TOOLNAME[t]).join(', ');
}
export function ownedFrom(pantryIds){
  return new Set(PANTRY.filter(p=>pantryIds.has(p.id)).flatMap(p=>p.ids));
}

/* ── 지역 ── */
function resolveRegion(txt){
  const t=(txt||'').replace(/\s/g,'');
  for(const r of REGIONS) for(const k of r.k) if(t.includes(k)) return r;
  return {k:[],n:(txt||'').trim()||'전국',m:PROVINCE,unknown:true};
}
function unitInfo(id,mk,reg){
  const g=ING[id], m=MART[mk];
  const mult = FRESH_AISLES.has(g.a) ? m.f : m.p;
  const island = reg.island ? 1.07 : 1;
  const bulk = m.bulk||1, bd = m.bd||1;
  return {pq:g.pq*bulk, price:Math.round(g.p*mult*island*bulk*bd/10)*10};
}

function hasTools(r,tools){
  return r.tools.every(t => Array.isArray(t) ? t.some(x=>tools.has(x)) : tools.has(t));
}
function dietOK(r,diet){
  const tags=Object.keys(r.ing).map(i=>ING[i].d);
  if(diet==='nopork') return !tags.includes('meat-pork');
  if(diet==='nofish') return !tags.includes('fish');
  if(diet==='veg') return !tags.some(t=>t==='fish'||t.startsWith('meat-'));
  return true;
}
function candidates(cfg){
  const base = R.filter(r=>hasTools(r,cfg.tools) && dietOK(r,cfg.diet));
  let c = base.filter(r=>r.sp<=cfg.spice && (cfg.cuisines.size===0||cfg.cuisines.has(r.c)));
  const notes=[];
  if(c.length<4){ c = base.filter(r=>r.sp<=cfg.spice); if(c.length>=4) notes.push('고른 종류만으로는 식단이 안 나와서 다른 종류도 섞었습니다.'); }
  if(c.length<4){ c = base.slice(); if(c.length>=4) notes.push('매운맛 조건까지 풀어야 식단이 나옵니다.'); }
  if(c.length<7){
    const pool=R.filter(r=>dietOK(r,cfg.diet)&&r.sp<=cfg.spice&&(cfg.cuisines.size===0||cfg.cuisines.has(r.c)));
    let best=null;
    for(const t of TOOLS){
      if(cfg.tools.has(t.id)) continue;
      const n=pool.filter(r=>hasTools(r,new Set([...cfg.tools,t.id]))).length;
      if(!best||n>best.n) best={t,n};
    }
    notes.push('지금 조건으로 만들 수 있는 요리가 '+c.length+'가지뿐이라 같은 요리가 여러 번 나옵니다.');
    if(best&&best.n>c.length) notes.push(best.t.n+' 하나만 더 있으면 '+best.n+'가지로 늘어납니다.');
  }
  return {list:c, notes};
}
const minShelf = r => Math.min(...Object.keys(r.ing).map(i=>ING[i].s));

/* ── 식단 생성 ── */
function rng(seed){let a=seed>>>0; return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

function build(cfg,cands,par,priceFn){
  const slots=cfg.days*cfg.mpd, basket={}, counts={}, meals=[];
  const cap=par.cap==='free'?slots:Math.max(1,Math.min(par.cap,slots));
  const rand=rng(par.seed);
  for(let s=0;s<slots;s++){
    const mi=s%cfg.mpd, isBreakfast=(cfg.mpd===3&&mi===0);
    let best=null,bestScore=Infinity;
    for(const r of cands){
      const used=counts[r.id]||0;
      if(used>=cap && cands.length*cap>=slots) continue;
      let sc=marginal(r,basket,cfg,priceFn);
      sc += used*par.rep;
      if(!used) sc -= par.vari;
      if(isBreakfast && !r.q) sc += 3000;
      if(!isBreakfast && r.q) sc += 400;
      sc += rand()*par.jit;
      if(sc<bestScore){bestScore=sc;best=r;}
    }
    if(!best) break;
    counts[best.id]=(counts[best.id]||0)+1;
    for(const [id,q] of Object.entries(best.ing)) basket[id]=(basket[id]||0)+q*cfg.people;
    meals.push({mi,r:best});
  }
  for(let mi=0;mi<cfg.mpd;mi++){
    const g=meals.filter(m=>m.mi===mi);
    g.sort((a,b)=>minShelf(a.r)-minShelf(b.r));
    g.forEach((m,i)=>{m.day=i;});
  }
  dedupeDays(meals,cfg);
  meals.sort((a,b)=>a.day-b.day||a.mi-b.mi);
  const bill=priceBasket(basket,cfg,priceFn);
  return {meals,basket,...bill,distinct:Object.keys(counts).length};
}
/* 같은 요리가 하루에 두 번 오지 않게 자리를 맞바꾼다 */
function dedupeDays(meals,cfg){
  for(let pass=0;pass<4;pass++){
    let moved=false;
    for(let d=0;d<cfg.days;d++){
      const today=meals.filter(m=>m.day===d);
      for(let i=0;i<today.length;i++) for(let j=i+1;j<today.length;j++){
        const a=today[i], b=today[j];
        if(a.r.id!==b.r.id) continue;
        const swap=meals.find(m=>m.mi===b.mi && m.day!==d && m.r.id!==b.r.id
          && !meals.some(x=>x.day===d && x!==b && x.r.id===m.r.id)
          && !meals.some(x=>x.day===m.day && x!==m && x.r.id===b.r.id));
        if(swap){ const t=swap.day; swap.day=d; b.day=t; moved=true; }
      }
    }
    if(!moved) break;
  }
}
function marginal(r,basket,cfg,priceFn){
  let c=0;
  for(const [id,q] of Object.entries(r.ing)){
    if(cfg.owned.has(id)) continue;
    const cur=basket[id]||0, need=q*cfg.people, {pq,price}=priceFn(id);
    c += (Math.ceil((cur+need)/pq-1e-9)-Math.ceil(cur/pq-1e-9))*price;
  }
  return c;
}
function priceBasket(basket,cfg,priceFn){
  const lines=[]; let sub=0;
  for(const [id,need] of Object.entries(basket)){
    if(cfg.owned.has(id)) continue;
    const {pq,price}=priceFn(id), packs=Math.ceil(need/pq-1e-9), cost=packs*price;
    sub+=cost;
    lines.push({id,need,packs,pq,price,cost,left:packs*pq-need});
  }
  lines.sort((a,b)=>AISLES.indexOf(ING[a.id].a)-AISLES.indexOf(ING[b.id].a)||b.cost-a.cost);
  const m=MART[cfg.mart];
  const fee = (m.fee && sub>0 && sub<m.feeFree) ? (cfg.reg.island? m.fee*2 : m.fee) : 0;
  return {lines,sub,fee,total:sub+fee};
}
function plan(cfg,cands){
  const priceFn = id => unitInfo(id,cfg.mart,cfg.reg);
  const cache={}; const pf = id => cache[id] || (cache[id]=priceFn(id));
  let feasible=null, cheapest=null;
  for(const vari of [0,1200,2600,4200]) for(const rep of [900,2600]) for(const cap of [1,2,3,5,'free']){
    const p=build(cfg,cands,{vari,rep,cap,jit:vari?260:60,seed:(cfg.seed||1)+vari+rep},pf);
    if(!cheapest||p.total<cheapest.total) cheapest=p;
    if(p.total<=cfg.budget){
      if(!feasible||p.distinct>feasible.distinct||(p.distinct===feasible.distinct&&p.total<feasible.total)) feasible=p;
    }
  }
  return {p:feasible||cheapest, fits:!!feasible, cheapest};
}
function cheapPlanFor(cfg,cands,mart){
  const c={...cfg,mart}, pf=id=>unitInfo(id,mart,cfg.reg);
  const cache={}; const f=id=>cache[id]||(cache[id]=pf(id));
  let best=null;
  for(const rep of [900,2200]){
    const p=build(c,cands,{vari:0,rep,cap:'free',jit:60,seed:(cfg.seed||1)+rep},f);
    if(!best||p.total<best.total) best=p;
  }
  return best;
}
export { resolveRegion, unitInfo, candidates, minShelf, plan, cheapPlanFor, hasTools, dietOK };

/* ───────── 직접 담은 메뉴로 계산하기 ─────────
   cart = { 레시피id: 담은 끼니 수 }. 한 끼는 인원수만큼의 인분이다. */
const BY_ID = Object.fromEntries(R.map(r => [r.id, r]));

export function cartBasket(cart, people){
  const basket = {};
  for(const id in cart){
    const r = BY_ID[id], n = cart[id];
    if(!r || !n) continue;
    for(const k in r.ing) basket[k] = (basket[k]||0) + r.ing[k]*people*n;
  }
  return basket;
}

export function cartBill(cart, cfg){
  const basket = cartBasket(cart, cfg.people);
  const bill = priceBasket(basket, cfg, id => unitInfo(id, cfg.mart, cfg.reg));
  const ids = Object.keys(cart).filter(id => cart[id] > 0);
  return {
    basket, ...bill,
    distinct: ids.length,
    mealCount: ids.reduce((a,id) => a + cart[id], 0),
    items: ids.map(id => ({ r:BY_ID[id], n:cart[id] }))
  };
}

/* 이 요리를 한 끼 더 담으면 새로 사야 하는 돈 (이미 산 재료를 또 쓰면 0원) */
export function addCost(r, basket, cfg){
  return marginal(r, basket, cfg, id => unitInfo(id, cfg.mart, cfg.reg));
}
