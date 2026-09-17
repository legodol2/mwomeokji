import { cheapPlanFor, won } from './engine';
import { MART } from './data';

function maxDaysFit(cfg, cands){
  for(let d=cfg.days-1; d>=1; d--){
    if(cheapPlanFor({...cfg, days:d}, cands, cfg.mart).total <= cfg.budget) return d;
  }
  return 0;
}

/* 결과를 한 줄 판정 + 실제로 누를 수 있는 선택지로 바꿔 준다 */
export function advice(cfg, cands, res, martTotals, notes){
  let cheapMart = cfg.mart, cheapTot = martTotals[cfg.mart] ?? res.p.total;
  for(const k of cfg.reg.m){
    if(martTotals[k] && martTotals[k] < cheapTot){ cheapTot = martTotals[k]; cheapMart = k; }
  }
  if(!res.fits){
    const short = res.p.total - cfg.budget;
    const d = maxDaysFit(cfg, cands);
    const lines = [];
    if(cheapMart !== cfg.mart) lines.push(`${MART[cheapMart].n}에서 사면 ${won(cheapTot)}원 — ${won(res.p.total-cheapTot)}원 아낍니다.`);
    if(d > 0) lines.push(`같은 예산으로는 ${d}일치까지 됩니다. (지금은 ${cfg.days}일치)`);
    if(cfg.mpd > 1) lines.push(`하루 ${cfg.mpd}끼를 ${cfg.mpd-1}끼로 줄이면 약 ${won(res.p.total/cfg.mpd)}원 줄어듭니다.`);
    lines.push(`예산을 ${won(Math.ceil(short/1000)*1000)}원 더 잡으면 이 식단 그대로 갑니다.`);
    return { kind:'over', title:`예산이 ${won(short)}원 모자랍니다`, body:`가장 싸게 짜도 ${won(res.p.total)}원입니다.`, lines:lines.concat(notes) };
  }
  if(res.p.total < cfg.budget*0.72){
    const perDay = res.p.total/cfg.days;
    return { kind:'slack', title:`예산이 ${won(cfg.budget-res.p.total)}원 남습니다`,
      body:`같은 예산이면 ${Math.floor(cfg.budget/perDay)}일치까지 짤 수 있습니다.`, lines:notes };
  }
  if(notes.length) return { kind:'note', title:'조건을 조금 풀었습니다', body:'', lines:notes };
  return null;
}

/* 규격 때문에 남는 양 */
export function leftovers(p){
  return p.lines.filter(l => l.left > 0 && l.left/l.pq > 0.08)
    .sort((a,b) => b.left/b.pq - a.left/a.pq).slice(0, 10);
}

/* 기간 안에 안 상하게 하는 최소한의 손질 */
export function storageTips(p, cfg, ING, qty){
  const tips = [];
  if(Array.isArray(p.meals)){
    const lastDay = {};
    p.meals.forEach(m => Object.keys(m.r.ing).forEach(id => {
      lastDay[id] = Math.max(lastDay[id] || 0, m.day + 1);
    }));
    for(const l of p.lines){
      const g = ING[l.id];
      if(g.s <= 14 && lastDay[l.id] > g.s){
        tips.push({ k:g.n, v:`${lastDay[l.id]}일차까지 쓰는데 냉장 ${g.s}일이면 상합니다. 사 온 날 한 끼 분량씩 나눠 냉동하세요.` });
      }
    }
  } else {
    for(const l of p.lines){
      const g = ING[l.id];
      if(g.s <= 4) tips.push({ k:g.n, v:`냉장 ${g.s}일이면 상합니다. 담은 메뉴 중 이 재료를 쓰는 것부터 먼저 드세요.` });
    }
  }
  if(p.basket.rice) tips.push({ k:'밥', v:`첫날 ${Math.ceil(p.basket.rice/300)}인분을 몰아 지어 한 끼씩 소분해 두면 매번 밥솥을 돌리지 않아도 됩니다.` });
  if(p.basket.greenonion) tips.push({ k:'대파', v:'산 날 전부 썰어 냉동하세요. 그대로 두면 절반은 버립니다.' });
  const lo = leftovers(p)[0];
  if(lo) tips.push({ k:`남는 ${ING[lo.id].n} ${qty(lo.id, lo.left)}`, v:'다음 장보기 목록에서 빼면 그만큼 예산이 줄어듭니다.' });
  if(MART[cfg.mart].bulk) tips.push({ k:'창고형 매장', v:'용량이 두 배라 못 쓰는 양이 생깁니다. 남는 재료가 많으면 일반 마트가 실제로 더 쌉니다.' });
  return tips.slice(0, 5);
}
