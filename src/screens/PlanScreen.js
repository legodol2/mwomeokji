import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { ING } from '../data';
import { won, qty, toolNames, minShelf, WHEN } from '../engine';
import { advice } from '../advice';
import { Card, Label, Bar } from '../ui';
import RecipeSheet from '../RecipeSheet';
import { mono } from '../theme';

function Stat({ t, k, v, unit, sub }){
  return (
    <View style={{ flex:1 }}>
      <Text style={{ color:t.ink3, fontSize:11, letterSpacing:0.6 }}>{k}</Text>
      <Text style={[mono,{ color:t.ink, fontSize:19, fontWeight:'700', marginTop:3 }]}>
        {v}<Text style={{ fontSize:12, fontWeight:'400', color:t.ink2 }}>{unit}</Text>
      </Text>
      {sub ? <Text style={{ color:t.ink3, fontSize:11, marginTop:1 }}>{sub}</Text> : null}
    </View>
  );
}

function Banner({ a, t }){
  if(!a) return null;
  const over = a.kind === 'over';
  const bg = over ? t.dangerSoft : t.accentSoft;
  const fg = over ? t.danger : t.accent;
  return (
    <View style={{ backgroundColor:bg, borderRadius:12, borderWidth:1, borderColor:fg, padding:14, marginBottom:14 }}>
      <Text style={{ color:fg, fontSize:15.5, fontWeight:'700' }}>{a.title}</Text>
      {a.body ? <Text style={{ color:t.ink2, fontSize:13, marginTop:4, lineHeight:19 }}>{a.body}</Text> : null}
      {a.lines.map((l,i)=>(
        <View key={i} style={{ flexDirection:'row', marginTop:7 }}>
          <Text style={{ color:t.ink3, fontSize:13, width:14 }}>·</Text>
          <Text style={{ color:t.ink2, fontSize:13, flex:1, lineHeight:19 }}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PlanScreen({ result, st, set, t, onFillCart }){
  const [meal, setMeal] = useState(null);
  const { cfg, p } = result;
  const a = advice(cfg, result.list, result, result.martTotals, result.notes);
  const slots = cfg.days*cfg.mpd, servings = slots*cfg.people;
  const labels = WHEN[cfg.mpd];
  const byDay = {};
  p.meals.forEach(m => { (byDay[m.day] = byDay[m.day] || []).push(m); });

  return (
    <>
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:18, paddingBottom:40 }}>
        <Banner a={a} t={t} />

        <Card t={t} style={{ marginBottom:16 }}>
          <View style={{ flexDirection:'row', gap:12 }}>
            <Stat t={t} k="한 끼 단가" v={won(p.total/servings)} unit="원" sub={`${cfg.people}명 × ${slots}끼`} />
            <Stat t={t} k="하루 식비" v={won(p.total/cfg.days)} unit="원" sub={`${cfg.days}일 / 하루 ${cfg.mpd}끼`} />
            <Stat t={t} k="요리" v={p.distinct} unit="가지" sub={`품목 ${p.lines.length}개`} />
          </View>
        </Card>

        {Object.keys(byDay).map(Number).sort((x,y)=>x-y).map(d => {
          const list = byDay[d], mins = list.reduce((s,m)=>s+m.r.t, 0);
          return (
            <View key={d} style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12,
                                   marginBottom:11, overflow:'hidden' }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline',
                             paddingHorizontal:15, paddingVertical:10, backgroundColor:t.sunk,
                             borderBottomWidth:1, borderColor:t.line }}>
                <Text style={{ color:t.ink, fontSize:15.5, fontWeight:'700' }}>{d+1}일차</Text>
                <Text style={[mono,{ color:t.ink3, fontSize:12 }]}>조리 {mins}분</Text>
              </View>
              {list.map((m,i)=>(
                <Pressable key={i}
                  onPress={()=>setMeal({ ...m, dayLabel:`${d+1}일차`, whenLabel:labels[m.mi] })}
                  style={({pressed})=>({ flexDirection:'row', alignItems:'center', gap:12,
                    paddingHorizontal:15, paddingVertical:12,
                    borderTopWidth: i?1:0, borderColor:t.line,
                    backgroundColor: pressed ? t.sunk : 'transparent' })}>
                  <Text style={{ color:t.ink3, fontSize:11.5, width:30 }}>{labels[m.mi]}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:t.ink, fontSize:15, fontWeight:'500' }}>{m.r.n}</Text>
                    <Text style={{ color:t.ink3, fontSize:11.5, marginTop:1 }}>
                      {m.r.c}{m.r.sp>=2 ? ' · 매움' : ''}{minShelf(m.r)<=4 ? ' · 신선재료' : ''}
                    </Text>
                  </View>
                  <Text style={[mono,{ color:t.ink3, fontSize:12 }]}>{m.r.t}분</Text>
                  <Text style={{ color:t.line2, fontSize:16 }}>›</Text>
                </Pressable>
              ))}
            </View>
          );
        })}

        <Pressable onPress={onFillCart}
          style={({pressed})=>({ marginTop:6, paddingVertical:13, borderRadius:11, backgroundColor:t.accent,
                                 alignItems:'center', opacity:pressed?0.8:1 })}>
          <Text style={{ color:t.onAccent, fontSize:15, fontWeight:'700' }}>이 {slots}끼 그대로 담기</Text>
        </Pressable>

        <Pressable onPress={()=>set(s=>({ ...s, seed:(s.seed*1664525+1013904223)%4294967296 }))}
          style={({pressed})=>({ marginTop:6, paddingVertical:13, borderRadius:11, borderWidth:1,
                                 borderColor:t.line2, alignItems:'center', opacity:pressed?0.7:1 })}>
          <Text style={{ color:t.ink2, fontSize:14.5 }}>다른 조합으로 다시 짜기</Text>
        </Pressable>
      </ScrollView>
      <RecipeSheet recipe={meal?.r} people={cfg.people} t={t} onClose={()=>setMeal(null)}
        caption={meal ? `${meal.dayLabel} · ${meal.whenLabel}` : ''} />
    </>
  );
}
