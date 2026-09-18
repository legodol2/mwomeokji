import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOOLS, PANTRY, MART } from '../data';
import { won } from '../engine';
import { Chip, Seg, Stepper, Label, TextButton, Badge } from '../ui';
import { sp, radius, type, num } from '../theme';

const BUDGETS = [30000, 50000, 100000, 200000];

export default function Setup({ st, set, result, t, onOpenMap, onRestart }){
  const [region, setRegion] = useState(st.region);
  const [budget, setBudget] = useState(String(st.budget));
  const timer = useRef();
  const [open, setOpen] = useState({});

  useEffect(()=>{ setRegion(st.region); }, [st.region]);
  useEffect(()=>{ setBudget(String(st.budget)); }, [st.budget]);
  const debounce = fn => { clearTimeout(timer.current); timer.current = setTimeout(fn, 450); };

  const tog = (key, id) => set(s => ({
    ...s, [key]: s[key].includes(id) ? s[key].filter(x=>x!==id) : [...s[key], id]
  }));

  const toggle = key => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(o => ({ ...o, [key]: !o[key] }));
  };

  /* 제목만 보이다가 누르면 아래로 펼쳐진다 */
  const Section = ({ id, title, summary, hint, children }) => {
    const on = !!open[id];
    return (
      <View style={{ marginTop:sp.m }}>
        <Pressable onPress={()=>toggle(id)} accessibilityRole="button" accessibilityState={{ expanded:on }}
          style={({pressed})=>({ flexDirection:'row', alignItems:'center', gap:sp.s,
            backgroundColor:t.surface, borderRadius:radius.md,
            paddingHorizontal:sp.l, paddingVertical:14, opacity:pressed?0.7:1 })}>
          <Text style={[type.subtitle,{ color:t.ink }]}>{title}</Text>
          <Text style={[type.caption,{ color:t.ink3, flex:1, textAlign:'right' }]} numberOfLines={1}>
            {on ? '' : summary}
          </Text>
          <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={16} color={t.ink3} />
        </Pressable>
        {on && (
          <View style={{ paddingTop:sp.l, paddingHorizontal:sp.xs, paddingBottom:sp.s }}>
            {hint ? <Text style={[type.caption,{ color:t.ink3, marginBottom:sp.m, lineHeight:19 }]}>{hint}</Text> : null}
            {children}
          </View>
        )}
      </View>
    );
  };
  const input = {
    backgroundColor:t.surface, borderRadius:radius.md, paddingHorizontal:sp.l, paddingVertical:14,
    color:t.ink, fontSize:16
  };

  const marts = result.cfg.reg.m;
  const picked = st.marts.filter(k => marts.includes(k));
  const maxTot = Math.max(1, ...marts.map(k => (result.martTotals?.[k]) || 0));

  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={{ paddingHorizontal:sp.xl, paddingBottom:sp.xxxl }}
      keyboardShouldPersistTaps="handled">

      <Section id="region" summary={st.region || '정하지 않음'} title="사는 지역" hint="지도에서 핀으로 찍거나, 시·군·구를 직접 적으세요.">
        <Pressable onPress={onOpenMap} accessibilityRole="button"
          style={({pressed})=>({ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6,
            backgroundColor:t.primarySoft, borderRadius:radius.md, height:50, marginBottom:sp.s, opacity:pressed?0.6:1 })}>
          <Text style={{ color:t.primary, fontSize:15, lineHeight:17 }}>◎</Text>
          <Text style={{ color:t.primary, fontSize:15.5, fontWeight:'700' }}>지도에서 위치 찍기</Text>
        </Pressable>
        <TextInput
          value={region}
          onChangeText={v=>{ setRegion(v); debounce(()=>set(s=>({ ...s, region:v }))); }}
          onEndEditing={()=>set(s=>({ ...s, region }))}
          placeholder="예: 부산 해운대구, 전주시, 제주시"
          placeholderTextColor={t.ink3}
          style={input} />
      </Section>

      <Section id="mart" summary={picked.length ? `${MART[result.cfg.mart].n}${picked.length>1 ? ` 외 ${picked.length-1}곳` : ''}` : '전체'} title="자주 가는 마트"
        hint={`여러 곳을 고르면 그중 가장 싼 곳으로 계산합니다. 지금은 ${MART[result.cfg.mart].n} 기준. 마트별 금액은 실제 조사값이 아닌 추정치입니다.`}>
        <Pressable onPress={()=>set(s=>({ ...s, marts: picked.length === marts.length ? [] : [...marts] }))}
          style={({pressed})=>({ alignSelf:'flex-start', marginBottom:sp.s, paddingHorizontal:14, paddingVertical:8,
            borderRadius:radius.pill, backgroundColor:t.surface, opacity:pressed?0.6:1 })}>
          <Text style={[type.caption,{ color:t.ink2, fontWeight:'600' }]}>
            {picked.length === marts.length ? '전체 해제' : '전체 선택'}
          </Text>
        </Pressable>
        {marts.map((k,i) => {
          const m = MART[k], tot = result.martTotals?.[k];
          const on = picked.includes(k), active = k === result.cfg.mart;
          return (
            <Pressable key={k} onPress={()=>tog('marts', k)} accessibilityRole="checkbox" accessibilityState={{checked:on}}
              style={({pressed})=>({ paddingVertical:14, borderTopWidth: i ? 0.5 : 0, borderTopColor:t.line,
                                     opacity: pressed ? 0.5 : 1 })}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:sp.m }}>
                <View style={{ width:22, height:22, borderRadius:11, borderWidth: on ? 0 : 1.5, borderColor:t.line2,
                               backgroundColor: on ? t.primary : 'transparent', alignItems:'center', justifyContent:'center' }}>
                  {on ? <Text style={{ color:t.onPrimary, fontSize:12, fontWeight:'800', lineHeight:14 }}>✓</Text> : null}
                </View>
                <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:6 }}>
                  <Text style={{ color: on ? t.ink : t.ink2, fontSize:16, fontWeight: on ? '600' : '400' }}>{m.n}</Text>
                  {active ? <Badge t={t} label="가장 쌈" /> : null}
                </View>
                <Text style={[num,{ color: on ? t.ink : t.ink3, fontSize:15, fontWeight:'600' }]}>
                  {tot ? won(tot)+'원' : '—'}
                </Text>
              </View>
              <View style={{ height:3, borderRadius:2, backgroundColor:t.line, overflow:'hidden', marginTop:10, marginLeft:34 }}>
                <View style={{ width:`${(tot||0)/maxTot*100}%`, height:'100%',
                               backgroundColor: on ? t.primary : t.line2 }} />
              </View>
            </Pressable>
          );
        })}
      </Section>

      <Section id="tools" summary={`${st.tools.length}가지`} title="집에 있는 조리도구" hint="가진 도구로 만들 수 있는 요리만 고릅니다.">
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:sp.s }}>
          {TOOLS.map(x => <Chip key={x.id} t={t} label={x.n} on={st.tools.includes(x.id)} onPress={()=>tog('tools', x.id)} />)}
        </View>
      </Section>

      <Section id="diet" summary={({none:'없음',nopork:'돼지',nofish:'해산물',veg:'채식'})[st.diet]} title="못 먹는 것" hint="고른 재료가 들어간 요리는 아예 뺍니다.">
        <Seg t={t} value={st.diet} onChange={v=>set(s=>({ ...s, diet:v }))}
          options={[{v:'none',n:'없음'},{v:'nopork',n:'돼지'},{v:'nofish',n:'해산물'},{v:'veg',n:'채식'}]} />
      </Section>

      <Section id="budget" summary={`${won(st.budget)}원 · ${st.days}일 · ${st.people}명 · 하루 ${st.mpd}끼`} title="예산과 기간" hint="이 금액 안에서 이 기간을 버티는 장보기를 짭니다.">
        <View style={{ flexDirection:'row', alignItems:'center', gap:sp.m }}>
          <TextInput
            value={budget} keyboardType="number-pad"
            onChangeText={v=>{ const n=v.replace(/[^0-9]/g,''); setBudget(n); debounce(()=>set(s=>({ ...s, budget:Math.max(5000, +n||0) }))); }}
            onEndEditing={()=>set(s=>({ ...s, budget:Math.max(5000, +budget||0) }))}
            style={[input, num, { flex:1, textAlign:'right', fontSize:18, fontWeight:'700' }]} />
          <Text style={[type.body,{ color:t.ink2 }]}>원</Text>
        </View>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:sp.m }}>
          {BUDGETS.map(b => <Chip key={b} small t={t} label={(b/10000)+'만'} on={st.budget===b} onPress={()=>set(s=>({ ...s, budget:b }))} />)}
        </View>

        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:sp.xl }}>
          <Text style={[type.body,{ color:t.ink }]}>며칠치</Text>
          <Stepper t={t} value={st.days} min={1} max={14} suffix="일" onChange={v=>set(s=>({ ...s, days:v }))} />
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:sp.l }}>
          <Text style={[type.body,{ color:t.ink }]}>먹는 사람</Text>
          <Stepper t={t} value={st.people} min={1} max={6} suffix="명" onChange={v=>set(s=>({ ...s, people:v }))} />
        </View>
        <Label t={t} style={{ marginTop:sp.xl, marginBottom:sp.s }}>하루 몇 끼</Label>
        <Seg t={t} value={st.mpd} onChange={v=>set(s=>({ ...s, mpd:v }))}
          options={[{v:1,n:'저녁만'},{v:2,n:'두 끼'},{v:3,n:'세 끼'}]} />
      </Section>

      <Section id="pantry" summary={st.pantry.length ? `${st.pantry.length}가지` : '없음'} title="이미 집에 있는 것" hint="체크한 건 장보기 목록과 예산에서 뺍니다.">
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:sp.s }}>
          {PANTRY.map(p => <Chip key={p.id} t={t} label={p.n} on={st.pantry.includes(p.id)} onPress={()=>tog('pantry', p.id)} />)}
        </View>
      </Section>

      <TextButton t={t} label="처음 설정부터 다시 하기" onPress={onRestart} style={{ marginTop:sp.xxxl }} />
    </ScrollView>
  );
}
