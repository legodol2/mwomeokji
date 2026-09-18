import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { R, CUISINES } from '../data';
import { won, addCost, hasTools, dietOK, toolNames } from '../engine';
import RecipeSheet from '../RecipeSheet';
import { Chip, Seg, Bar, Label, PrimaryButton, TextButton, Thumb } from '../ui';
import { sp, radius, type, num } from '../theme';

const SORTS = [{ v:'cost', n:'싼 순' }, { v:'time', n:'빠른 순' }, { v:'cuisine', n:'종류순' }];

/* 담기 전에는 '담기', 담은 뒤에는 개수 조절 */
function AddControl({ n, t, onAdd, onSub }){
  if(!n){
    return (
      <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="담기"
        style={({pressed})=>({ height:36, paddingHorizontal:16, borderRadius:radius.pill,
          backgroundColor:t.surface, alignItems:'center', justifyContent:'center', opacity:pressed?0.6:1 })}>
        <Text style={{ color:t.ink2, fontSize:14, fontWeight:'600' }}>담기</Text>
      </Pressable>
    );
  }
  return (
    <View style={{ flexDirection:'row', alignItems:'center', height:36, borderRadius:radius.pill,
                   backgroundColor:t.primarySoft }}>
      <Pressable onPress={onSub} hitSlop={6} style={({pressed})=>({ paddingHorizontal:12, opacity:pressed?0.5:1 })}>
        <Text style={{ color:t.primary, fontSize:18, lineHeight:20, fontWeight:'600' }}>−</Text>
      </Pressable>
      <Text style={[num,{ color:t.primary, fontSize:15, fontWeight:'800', minWidth:14, textAlign:'center' }]}>{n}</Text>
      <Pressable onPress={onAdd} hitSlop={6} style={({pressed})=>({ paddingHorizontal:12, opacity:pressed?0.5:1 })}>
        <Text style={{ color:t.primary, fontSize:18, lineHeight:20, fontWeight:'600' }}>+</Text>
      </Pressable>
    </View>
  );
}

function FilterSheet({ open, onClose, st, set, sort, setSort, onlyMakeable, setOnlyMakeable, t, count }){
  const togCuisine = c => set(s => ({
    ...s, cuisines: s.cuisines.includes(c) ? s.cuisines.filter(x=>x!==c) : [...s.cuisines, c]
  }));
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)' }} />
      <View style={{ backgroundColor:t.bg, borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom:sp.xxl }}>
        <View style={{ alignItems:'center', paddingTop:sp.m }}>
          <View style={{ width:36, height:4, borderRadius:2, backgroundColor:t.line2 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal:sp.xl, paddingTop:sp.l }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={[type.title,{ color:t.ink, fontSize:22 }]}>필터</Text>
            <Text style={[type.caption,{ color:t.ink3 }]}>메뉴 {count}가지</Text>
          </View>

          <Label t={t} style={{ marginTop:sp.xxl, marginBottom:sp.s }}>입맛</Label>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:sp.s }}>
            <Chip t={t} label="전체" on={st.cuisines.length === 0} onPress={()=>set(s=>({ ...s, cuisines:[] }))} />
            {CUISINES.map(c => <Chip key={c} t={t} label={c} on={st.cuisines.includes(c)} onPress={()=>togCuisine(c)} />)}
          </View>

          <Label t={t} style={{ marginTop:sp.xxl, marginBottom:sp.s }}>매운맛</Label>
          <Seg t={t} value={st.spice} onChange={v=>set(s=>({ ...s, spice:v }))}
            options={[{v:0,n:'안 매움'},{v:1,n:'약간'},{v:2,n:'보통'},{v:3,n:'아주'}]} />

          <Label t={t} style={{ marginTop:sp.xxl, marginBottom:sp.s }}>정렬</Label>
          <Seg t={t} value={sort} onChange={setSort}
            options={SORTS.map(x=>({ v:x.v, n:x.n }))} />

          <Pressable onPress={()=>setOnlyMakeable(v=>!v)} accessibilityRole="switch"
            accessibilityState={{ checked:onlyMakeable }}
            style={({pressed})=>({ flexDirection:'row', alignItems:'center', gap:sp.m, marginTop:sp.xxl,
              paddingVertical:sp.m, opacity:pressed?0.6:1 })}>
            <View style={{ width:22, height:22, borderRadius:6, borderWidth: onlyMakeable ? 0 : 1.5, borderColor:t.line2,
                           backgroundColor: onlyMakeable ? t.primary : 'transparent',
                           alignItems:'center', justifyContent:'center' }}>
              {onlyMakeable ? <Ionicons name="checkmark" size={14} color={t.onPrimary} /> : null}
            </View>
            <View style={{ flex:1 }}>
              <Text style={[type.body,{ color:t.ink }]}>가진 도구로 만들 수 있는 것만</Text>
              <Text style={[type.caption,{ color:t.ink3, marginTop:2 }]}>끄면 도구가 없는 요리도 함께 보입니다</Text>
            </View>
          </Pressable>
        </ScrollView>

        <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.s }}>
          <PrimaryButton t={t} label={`메뉴 ${count}가지 보기`} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export default function MenuScreen({ cfg, st, set, cart, setCart, bill, t, onGoShop }){
  const [sort, setSort] = useState('cost');
  const [onlyMakeable, setOnlyMakeable] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const rows = useMemo(()=>{
    const cs = cfg.cuisines;
    let list = R.filter(r => (cs.size === 0 || cs.has(r.c)) && r.sp <= cfg.spice && dietOK(r, cfg.diet));
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
  const filterSummary = [
    st.cuisines.length ? st.cuisines.join('·') : '전체',
    ['안 매움','약간 매움','보통','아주 매움'][st.spice],
    SORTS.find(x=>x.v===sort)?.n
  ].join(' · ');

  return (
    <>
      <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.s, paddingBottom:sp.m }}>
        <Pressable onPress={()=>setFilterOpen(true)} accessibilityRole="button"
          style={({pressed})=>({ flexDirection:'row', alignItems:'center', gap:sp.s,
            backgroundColor:t.surface, borderRadius:radius.md, paddingHorizontal:sp.l, paddingVertical:12,
            opacity:pressed?0.6:1 })}>
          <Ionicons name="options-outline" size={18} color={t.ink2} />
          <Text style={[type.label,{ color:t.ink, fontWeight:'700' }]}>필터</Text>
          <Text style={[type.caption,{ color:t.ink3, flex:1 }]} numberOfLines={1}>{filterSummary}</Text>
          <Ionicons name="chevron-forward" size={16} color={t.ink3} />
        </Pressable>
      </View>

      <ScrollView style={{ flex:1 }} contentContainerStyle={{ paddingBottom:sp.xl }}>
        <View style={{ paddingHorizontal:sp.xl }}>
          <Label t={t} style={{ marginBottom:sp.xs }}>메뉴 {rows.length}가지</Label>
          <Text style={[type.micro,{ color:t.ink3, lineHeight:18, marginBottom:sp.s }]}>
            옆 금액은 한 끼 더 담을 때 새로 사야 하는 돈입니다
          </Text>
        </View>

        <View style={{ paddingHorizontal:sp.xl }}>
          {rows.map(({ r, add, ok }, i) => {
            const n = cart[r.id] || 0;
            return (
              <View key={r.id}
                style={{ flexDirection:'row', alignItems:'center', gap:sp.m, paddingVertical:14,
                         borderTopWidth: i ? 0.5 : 0, borderTopColor:t.line }}>
                <Pressable onPress={()=>setSheet(r)} accessibilityRole="button"
                  style={({pressed})=>({ flex:1, flexDirection:'row', alignItems:'center', gap:sp.m, opacity:pressed?0.5:1 })}>
                  <Thumb t={t} id={r.id} emoji={r.e} tone={n ? 'soft' : undefined} />
                  <View style={{ flex:1 }}>
                  <Text style={{ color:t.ink, fontSize:16, fontWeight: n ? '700' : '500', letterSpacing:-0.2 }}>{r.n}</Text>
                  <Text style={[type.caption,{ color:t.ink3, marginTop:3 }]}>
                    {r.c} · {r.t}분{r.sp>=2 ? ' · 매움' : ''}{ok ? '' : ' · 도구 부족'}
                  </Text>
                  </View>
                </Pressable>
                <Text style={[num,{ color: add ? t.ink2 : t.primary, fontSize:14.5, fontWeight:'600' }]}>
                  {add ? '+'+won(add) : '+0'}
                </Text>
                <AddControl n={n} t={t} onAdd={()=>bump(r.id,1)} onSub={()=>bump(r.id,-1)} />
              </View>
            );
          })}
          {!rows.length && (
            <Text style={[type.body,{ color:t.ink3, paddingVertical:sp.xxl, lineHeight:23 }]}>
              지금 조건으로 만들 수 있는 메뉴가 없습니다. 입맛을 넓히거나 ‘가진 도구로만’을 꺼 보세요.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.m, paddingBottom:sp.m, gap:sp.m,
                     borderTopWidth:0.5, borderTopColor:t.line2, backgroundColor:t.bg }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' }}>
          <Text style={[type.label,{ color:t.ink2 }]}>
            담은 메뉴 <Text style={{ color:t.ink, fontWeight:'700' }}>{bill.mealCount}끼</Text>
            <Text style={{ color:t.ink3 }}>  / {need}끼 필요</Text>
          </Text>
          <Text style={[num,{ color: over ? t.danger : t.ink, fontSize:18, fontWeight:'800' }]}>{won(bill.total)}원</Text>
        </View>
        <Bar t={t} height={4} pct={bill.total/Math.max(cfg.budget,1)*100} over={over} />
        <PrimaryButton t={t} disabled={!bill.mealCount} onPress={onGoShop}
          label={bill.mealCount ? `${bill.mealCount}끼 장보기 목록 보기` : '메뉴를 담아 주세요'} />
      </View>

      <FilterSheet open={filterOpen} onClose={()=>setFilterOpen(false)}
        st={st} set={set} sort={sort} setSort={setSort}
        onlyMakeable={onlyMakeable} setOnlyMakeable={setOnlyMakeable} t={t} count={rows.length} />

      <RecipeSheet recipe={sheet} people={cfg.people} t={t} onClose={()=>setSheet(null)}
        caption={sheet ? `${toolNames(sheet)} 사용` : ''}
        footer={sheet ? (
          <PrimaryButton t={t} onPress={()=>{ bump(sheet.id,1); setSheet(null); }}
            label={cart[sheet.id] ? `담기 (지금 ${cart[sheet.id]}끼)` : '담기'} />
        ) : null} />
    </>
  );
}
