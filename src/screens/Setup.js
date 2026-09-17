import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { TOOLS, PANTRY, MART } from '../data';
import { won } from '../engine';
import { Chip, Seg, Stepper, Label } from '../ui';
import { mono } from '../theme';

const BUDGETS = [30000, 50000, 100000, 200000];

export default function Setup({ st, set, result, t, onOpenMap, onRestart }){
  const [region, setRegion] = useState(st.region);
  const [budget, setBudget] = useState(String(st.budget));
  const timer = useRef();

  useEffect(()=>{ setRegion(st.region); }, [st.region]);
  useEffect(()=>{ setBudget(String(st.budget)); }, [st.budget]);
  const debounce = fn => { clearTimeout(timer.current); timer.current = setTimeout(fn, 450); };

  const tog = (key, id) => set(s => ({
    ...s, [key]: s[key].includes(id) ? s[key].filter(x=>x!==id) : [...s[key], id]
  }));

  const Section = ({ title, hint, children }) => (
    <View style={{ marginBottom:24 }}>
      <Label t={t}>{title}</Label>
      <Text style={{ color:t.ink3, fontSize:12.5, marginTop:4, marginBottom:11, lineHeight:17 }}>{hint}</Text>
      {children}
    </View>
  );

  const marts = result.cfg.reg.m;
  const picked = st.marts.filter(k => marts.includes(k));
  const maxTot = Math.max(1, ...marts.map(k => (result.martTotals?.[k]) || 0));

  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:18, paddingBottom:40 }} keyboardShouldPersistTaps="handled">

      <Section title="사는 지역" hint="지도에서 핀으로 찍거나, 시·군·구를 직접 적으세요.">
        <Pressable onPress={onOpenMap} accessibilityRole="button"
          style={({pressed})=>({ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7,
            borderWidth:1, borderColor:t.accent, backgroundColor:t.accentSoft, borderRadius:9,
            paddingVertical:11, marginBottom:10, opacity:pressed?0.7:1 })}>
          <Text style={{ color:t.accent, fontSize:15, lineHeight:17 }}>◎</Text>
          <Text style={{ color:t.accent, fontSize:14.5, fontWeight:'600' }}>지도에서 위치 찍기</Text>
        </Pressable>
        <TextInput
          value={region}
          onChangeText={v=>{ setRegion(v); debounce(()=>set(s=>({ ...s, region:v }))); }}
          onEndEditing={()=>set(s=>({ ...s, region }))}
          placeholder="예: 부산 해운대구, 전주시, 제주시"
          placeholderTextColor={t.ink3}
          style={{ backgroundColor:t.sunk, borderWidth:1, borderColor:t.line2, borderRadius:9,
                   paddingHorizontal:12, paddingVertical:11, color:t.ink, fontSize:15 }} />
      </Section>

      <Section title="자주 가는 마트"
        hint={`여러 곳을 고르면 그중 가장 싼 곳으로 계산합니다. 지금은 ${MART[result.cfg.mart].n} 기준.`}>
        <Pressable onPress={()=>set(s=>({ ...s, marts: picked.length === marts.length ? [] : [...marts] }))}
          style={{ alignSelf:'flex-start', marginBottom:10, paddingHorizontal:13, paddingVertical:7,
                   borderRadius:999, borderWidth:1, borderColor:t.line2 }}>
          <Text style={{ color:t.ink2, fontSize:12.5 }}>
            {picked.length === marts.length ? '전체 해제' : '전체 선택'}
          </Text>
        </Pressable>
        <View style={{ gap:2 }}>
          {marts.map(k => {
            const m = MART[k], tot = result.martTotals?.[k];
            const on = picked.includes(k), active = k === result.cfg.mart;
            return (
              <Pressable key={k} onPress={()=>tog('marts', k)} accessibilityRole="checkbox" accessibilityState={{checked:on}}
                style={{ padding:11, borderRadius:9, borderWidth:1,
                         borderColor: active ? t.accent : 'transparent',
                         backgroundColor: on ? t.accentSoft : 'transparent' }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline', gap:8 }}>
                  <Text style={{ color: on ? t.ink : t.ink2, fontSize:14.5, fontWeight: on?'600':'400' }}>
                    {m.n}{active ? '  · 가장 쌈' : ''}
                  </Text>
                  <Text style={[mono,{ color: on?t.ink:t.ink3, fontSize:13.5 }]}>{tot ? won(tot)+'원' : '—'}</Text>
                </View>
                <View style={{ marginTop:6, marginBottom:5, height:3, borderRadius:2, backgroundColor:t.line, overflow:'hidden' }}>
                  <View style={{ width:`${(tot||0)/maxTot*100}%`, height:'100%', backgroundColor: on ? t.accent : t.ink3 }} />
                </View>
                <Text style={{ color:t.ink3, fontSize:11.5 }}>{m.note}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="집에 있는 조리도구" hint="가진 도구로 만들 수 있는 요리만 고릅니다.">
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
          {TOOLS.map(x => <Chip key={x.id} t={t} label={x.n} on={st.tools.includes(x.id)} onPress={()=>tog('tools', x.id)} />)}
        </View>
      </Section>

      <Section title="못 먹는 것" hint="고른 재료가 들어간 요리는 아예 뺍니다.">
        <Seg t={t} value={st.diet} onChange={v=>set(s=>({ ...s, diet:v }))}
          options={[{v:'none',n:'없음'},{v:'nopork',n:'돼지'},{v:'nofish',n:'해산물'},{v:'veg',n:'채식'}]} />
      </Section>

      <Section title="예산과 기간" hint="이 금액 안에서 이 기간을 버티는 장보기를 짭니다.">
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
          <TextInput
            value={budget} keyboardType="number-pad"
            onChangeText={v=>{ const n=v.replace(/[^0-9]/g,''); setBudget(n); debounce(()=>set(s=>({ ...s, budget:Math.max(5000, +n||0) }))); }}
            onEndEditing={()=>set(s=>({ ...s, budget:Math.max(5000, +budget||0) }))}
            style={[mono,{ flex:1, backgroundColor:t.sunk, borderWidth:1, borderColor:t.line2, borderRadius:9,
                     paddingHorizontal:12, paddingVertical:11, color:t.ink, fontSize:17, textAlign:'right' }]} />
          <Text style={{ color:t.ink2, fontSize:15 }}>원</Text>
        </View>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:16 }}>
          {BUDGETS.map(b => <Chip key={b} small t={t} label={(b/10000)+'만'} on={st.budget===b} onPress={()=>set(s=>({ ...s, budget:b }))} />)}
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <Text style={{ color:t.ink2, fontSize:14 }}>며칠치</Text>
          <Stepper t={t} value={st.days} min={1} max={14} suffix="일" onChange={v=>set(s=>({ ...s, days:v }))} />
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <Text style={{ color:t.ink2, fontSize:14 }}>먹는 사람</Text>
          <Stepper t={t} value={st.people} min={1} max={6} suffix="명" onChange={v=>set(s=>({ ...s, people:v }))} />
        </View>
        <Text style={{ color:t.ink2, fontSize:13, marginBottom:6 }}>하루 몇 끼</Text>
        <Seg t={t} value={st.mpd} onChange={v=>set(s=>({ ...s, mpd:v }))}
          options={[{v:1,n:'저녁만'},{v:2,n:'두 끼'},{v:3,n:'세 끼'}]} />
      </Section>

      <Section title="이미 집에 있는 것" hint="체크한 건 장보기 목록과 예산에서 뺍니다.">
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
          {PANTRY.map(p => <Chip key={p.id} t={t} label={p.n} on={st.pantry.includes(p.id)} onPress={()=>tog('pantry', p.id)} />)}
        </View>
      </Section>

      <Pressable onPress={onRestart} style={{ paddingVertical:12, alignItems:'center' }}>
        <Text style={{ color:t.ink3, fontSize:13.5 }}>처음 설정부터 다시 하기</Text>
      </Pressable>
    </ScrollView>
  );
}
