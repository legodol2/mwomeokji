import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { R, CUISINES } from '../data';
import { won, addCost, hasTools, dietOK, toolNames } from '../engine';
import RecipeSheet from '../RecipeSheet';
import { Chip, Seg, Bar, Label } from '../ui';
import { mono } from '../theme';

const SORTS = [{ v:'cost', n:'싼 순' }, { v:'time', n:'빠른 순' }, { v:'cuisine', n:'종류순' }];

export default function MenuScreen({ cfg, st, set, cart, setCart, bill, t, onGoShop }){
  const [sort, setSort] = useState('cost');
  const [onlyMakeable, setOnlyMakeable] = useState(true);
  const [sheet, setSheet] = useState(null);

  const rows = useMemo(()=>{
    const cs = cfg.cuisines;
    let list = R.filter(r =>
      (cs.size === 0 || cs.has(r.c)) && r.sp <= cfg.spice && dietOK(r, cfg.diet)
    );
    if(onlyMakeable) list = list.filter(r => hasTools(r, cfg.tools));
    const out = list.map(r => ({ r, add:addCost(r, bill.basket, cfg), ok:hasTools(r, cfg.tools) }));
    if(sort === 'cost') out.sort((a,b)=> a.add - b.add || a.r.n.localeCompare(b.r.n,'ko'));
    else if(sort === 'time') out.sort((a,b)=> a.r.t - b.r.t || a.r.n.localeCompare(b.r.n,'ko'));
    else out.sort((a,b)=> CUISINES.indexOf(a.r.c) - CUISINES.indexOf(b.r.c) || a.r.n.localeCompare(b.r.n,'ko'));
    return out;
  }, [sort, onlyMakeable, bill.basket, cfg]);

  const bump = (id, d) => setCart(c => {
    const n = Math.max(0, Math.min(20, (c[id]||0) + d));
    const next = { ...c };
    if(n) next[id] = n; else delete next[id];
    return next;
  });
  const togCuisine = c => set(s => ({
    ...s, cuisines: s.cuisines.includes(c) ? s.cuisines.filter(x=>x!==c) : [...s.cuisines, c]
  }));

  const over = bill.total > cfg.budget;
  const need = cfg.days * cfg.mpd;

  return (
    <>
      <View style={{ paddingHorizontal:18, paddingTop:14, paddingBottom:12, borderBottomWidth:1, borderColor:t.line }}>
        <Label t={t}>입맛</Label>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7, marginTop:9, marginBottom:11 }}>
          {CUISINES.map(c => <Chip key={c} t={t} label={c} on={st.cuisines.includes(c)} onPress={()=>togCuisine(c)} />)}
          {st.cuisines.length ? (
            <Chip t={t} label="전체" on={false} onPress={()=>set(s=>({ ...s, cuisines:[] }))} />
          ) : null}
        </View>
        <Seg t={t} value={st.spice} onChange={v=>set(s=>({ ...s, spice:v }))}
          options={[{v:0,n:'안 매움'},{v:1,n:'약간'},{v:2,n:'보통'},{v:3,n:'아주'}]} />
      </View>

      <View style={{ paddingHorizontal:18, paddingVertical:10, borderBottomWidth:1, borderColor:t.line }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:7, paddingRight:8 }}>
          {SORTS.map(s => <Chip key={s.v} small t={t} label={s.n} on={sort===s.v} onPress={()=>setSort(s.v)} />)}
          <Chip small t={t} label="가진 도구로만" on={onlyMakeable} onPress={()=>setOnlyMakeable(v=>!v)} />
        </ScrollView>
      </View>

      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:18, paddingBottom:24 }}>
        <Text style={{ color:t.ink3, fontSize:12.5, lineHeight:18, marginBottom:12 }}>
          먹을 메뉴를 눌러 담으면 장보기 목록이 그 자리에서 다시 계산됩니다. 옆의 금액은{' '}
          <Text style={{ color:t.warm }}>그 메뉴를 한 끼 더 담을 때 새로 사야 하는 돈</Text>이라, 이미 산 재료를 다시 쓰는 메뉴는 +0원입니다.
        </Text>

        <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, overflow:'hidden' }}>
          {rows.map(({ r, add, ok }, i) => {
            const n = cart[r.id] || 0;
            return (
              <View key={r.id} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:11, paddingHorizontal:13,
                                        borderTopWidth: i?1:0, borderColor:t.line,
                                        backgroundColor: n ? t.accentSoft : 'transparent' }}>
                <Pressable onPress={()=>setSheet(r)} style={{ flex:1 }} accessibilityRole="button">
                  <Text style={{ color:t.ink, fontSize:15, fontWeight: n ? '700' : '500' }}>{r.n}</Text>
                  <Text style={{ color:t.ink3, fontSize:11.5, marginTop:2 }}>
                    {r.c} · {r.t}분{r.sp>=2 ? ' · 매움' : ''}{ok ? '' : ' · 도구 부족'}
                  </Text>
                </Pressable>

                <Text style={[mono,{ color: add ? t.warm : t.accent, fontSize:12.5, minWidth:58, textAlign:'right' }]}>
                  {add ? '+'+won(add) : '+0'}
                </Text>

                {n ? (
                  <View style={{ flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:t.accent,
                                 borderRadius:999, overflow:'hidden' }}>
                    <Pressable onPress={()=>bump(r.id,-1)} hitSlop={4} style={{ paddingHorizontal:11, paddingVertical:5 }}>
                      <Text style={{ color:t.accent, fontSize:17, lineHeight:20 }}>−</Text>
                    </Pressable>
                    <Text style={[mono,{ color:t.ink, fontSize:14, fontWeight:'700', minWidth:16, textAlign:'center' }]}>{n}</Text>
                    <Pressable onPress={()=>bump(r.id,1)} hitSlop={4} style={{ paddingHorizontal:11, paddingVertical:5 }}>
                      <Text style={{ color:t.accent, fontSize:17, lineHeight:20 }}>+</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={()=>bump(r.id,1)} accessibilityRole="button"
                    style={({pressed})=>({ paddingHorizontal:14, paddingVertical:7, borderRadius:999,
                      borderWidth:1, borderColor:t.line2, opacity:pressed?0.6:1 })}>
                    <Text style={{ color:t.ink2, fontSize:13 }}>담기</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {!rows.length && (
            <Text style={{ color:t.ink2, fontSize:13.5, padding:16, lineHeight:20 }}>
              지금 조건으로 만들 수 있는 메뉴가 없습니다. 입맛을 넓히거나 ‘가진 도구로만’을 꺼 보세요.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={{ borderTopWidth:1, borderColor:t.line, backgroundColor:t.card, padding:14, gap:10 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' }}>
          <Text style={{ color:t.ink2, fontSize:13 }}>
            담은 메뉴 <Text style={{ color:t.ink, fontWeight:'700' }}>{bill.mealCount}끼</Text>
            <Text style={{ color:t.ink3 }}>  / {cfg.days}일 × {cfg.mpd}끼 = {need}끼 필요</Text>
          </Text>
          <Text style={[mono,{ color: over ? t.danger : t.warm, fontSize:17, fontWeight:'700' }]}>{won(bill.total)}원</Text>
        </View>
        <Bar t={t} pct={bill.total/Math.max(cfg.budget,1)*100} over={over} />
        <Pressable onPress={onGoShop} disabled={!bill.mealCount}
          style={({pressed})=>({ backgroundColor: bill.mealCount ? t.accent : t.line, borderRadius:11,
            paddingVertical:13, alignItems:'center', opacity:pressed?0.8:1 })}>
          <Text style={{ color: bill.mealCount ? t.onAccent : t.ink3, fontSize:15.5, fontWeight:'700' }}>
            {bill.mealCount ? `이 ${bill.mealCount}끼 장보기 목록 보기` : '메뉴를 담아 주세요'}
          </Text>
        </Pressable>
      </View>

      <RecipeSheet recipe={sheet} people={cfg.people} t={t} onClose={()=>setSheet(null)}
        caption={sheet ? `${toolNames(sheet)} 사용` : ''}
        footer={sheet ? (
          <Pressable onPress={()=>{ bump(sheet.id,1); setSheet(null); }}
            style={{ backgroundColor:t.accent, paddingVertical:13, borderRadius:11, alignItems:'center' }}>
            <Text style={{ color:t.onAccent, fontSize:15, fontWeight:'700' }}>
              담기{cart[sheet.id] ? ` (지금 ${cart[sheet.id]}끼)` : ''}
            </Text>
          </Pressable>
        ) : null} />
    </>
  );
}
