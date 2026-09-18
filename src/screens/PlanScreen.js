import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { won, minShelf, WHEN } from '../engine';
import { advice } from '../advice';
import RecipeSheet from '../RecipeSheet';
import { Label, PrimaryButton, TextButton, Thumb } from '../ui';
import { sp, radius, type, num } from '../theme';

function Stat({ t, k, v, unit, sub }){
  return (
    <View style={{ flex:1 }}>
      <Text style={[type.micro,{ color:t.ink3 }]}>{k}</Text>
      <Text style={[num,{ color:t.ink, fontSize:20, fontWeight:'800', marginTop:4, letterSpacing:-0.4 }]}>
        {v}<Text style={{ fontSize:13, fontWeight:'500', color:t.ink2 }}>{unit}</Text>
      </Text>
      {sub ? <Text style={[type.micro,{ color:t.ink3, marginTop:2 }]}>{sub}</Text> : null}
    </View>
  );
}

function Banner({ a, t }){
  if(!a) return null;
  const over = a.kind === 'over';
  return (
    <View style={{ backgroundColor: over ? t.dangerSoft : t.primarySoft, borderRadius:radius.lg,
                   padding:sp.l, marginBottom:sp.l }}>
      <Text style={[type.subtitle,{ color: over ? t.danger : t.ink }]}>{a.title}</Text>
      {a.body ? <Text style={[type.caption,{ color:t.ink2, marginTop:4, lineHeight:20 }]}>{a.body}</Text> : null}
      {a.lines.map((l,i)=>(
        <View key={i} style={{ flexDirection:'row', marginTop:8, gap:6 }}>
          <Text style={[type.caption,{ color:t.ink3 }]}>·</Text>
          <Text style={[type.caption,{ color:t.ink2, flex:1, lineHeight:20 }]}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

/* 위쪽 날짜 줄 — 날짜마다 끼니 수만큼 점을 찍는다 */
const DAY_W = 52;   // 날짜 한 칸 너비 (자동 스크롤 계산에 쓴다)

function DayStrip({ days, counts, value, onChange, t }){
  const scroller = useRef(null);
  const [width, setWidth] = useState(0);

  /* 고른 날짜가 화면 밖에 있으면 가운데로 끌어온다 */
  useEffect(()=>{
    const i = days.indexOf(value);
    if(i < 0 || !width) return;
    const step = DAY_W + sp.s;
    const max = Math.max(0, days.length*step - sp.s - width);
    const x = Math.min(max, Math.max(0, i*step + DAY_W/2 - width/2));
    scroller.current?.scrollTo({ x, animated:true });
  }, [value, width, days.length]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      ref={scroller}
      onLayout={e=>setWidth(e.nativeEvent.layout.width)}
      contentContainerStyle={{ gap:sp.s, paddingVertical:sp.s }}>
      {days.map(d => {
        const on = d === value;
        return (
          <Pressable key={d} onPress={()=>onChange(d)} accessibilityRole="button"
            accessibilityLabel={`${d+1}일차`} accessibilityState={{ selected:on }}
            style={({pressed})=>({ alignItems:'center', width:DAY_W, paddingVertical:8, borderRadius:radius.md,
              backgroundColor: on ? t.primarySoft : 'transparent', opacity: pressed ? 0.6 : 1 })}>
            <Text style={[num,{ color: on ? t.primary : t.ink2, fontSize:17, fontWeight: on ? '800' : '600' }]}>{d+1}</Text>
            <Text style={{ color: on ? t.primary : t.ink3, fontSize:10.5, marginTop:1 }}>일차</Text>
            <View style={{ flexDirection:'row', gap:3, marginTop:6, height:5 }}>
              {Array.from({ length:counts[d] || 0 }).map((_,i)=>(
                <View key={i} style={{ width:5, height:5, borderRadius:3,
                                       backgroundColor: on ? t.primary : t.line2 }} />
              ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function PlanScreen({ result, st, set, t, onFillCart }){
  const [meal, setMeal] = useState(null);
  const [day, setDay] = useState(0);
  const { cfg, p } = result;
  const a = advice(cfg, result.list, result, result.martTotals, result.notes);
  const slots = cfg.days*cfg.mpd, servings = slots*cfg.people;
  const labels = WHEN[cfg.mpd];
  const byDay = {};
  p.meals.forEach(m => { (byDay[m.day] = byDay[m.day] || []).push(m); });
  const dayList = Object.keys(byDay).map(Number).sort((x,y)=>x-y);
  const mealCounts = {};
  dayList.forEach(d => { mealCounts[d] = byDay[d].length; });
  const shownDay = byDay[day] ? day : (dayList[0] ?? 0);   // 기간을 줄이면 없는 날짜를 가리킬 수 있다
  const today = byDay[shownDay] || [];
  const todayMins = today.reduce((s2,m)=>s2+m.r.t, 0);

  return (
    <>
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ paddingHorizontal:sp.xl, paddingTop:sp.xl, paddingBottom:sp.xxxl }}>
        <Banner a={a} t={t} />

        <View style={{ flexDirection:'row', gap:sp.m, paddingBottom:sp.l,
                       borderBottomWidth:0.5, borderBottomColor:t.line2 }}>
          <Stat t={t} k="한 끼 단가" v={won(p.total/servings)} unit="원" sub={`${cfg.people}명 × ${slots}끼`} />
          <Stat t={t} k="하루 식비" v={won(p.total/cfg.days)} unit="원" sub={`하루 ${cfg.mpd}끼`} />
          <Stat t={t} k="요리" v={p.distinct} unit="가지" sub={`품목 ${p.lines.length}개`} />
        </View>

        <View style={{ borderBottomWidth:0.5, borderBottomColor:t.line2 }}>
          <DayStrip t={t} days={dayList} counts={mealCounts} value={shownDay} onChange={setDay} />
        </View>

        <View style={{ paddingTop:sp.l }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' }}>
            <Text style={[type.subtitle,{ color:t.ink }]}>{shownDay+1}일차</Text>
            <Text style={[num, type.micro,{ color:t.ink3 }]}>조리 {todayMins}분</Text>
          </View>
          {today.map((m,i)=>(
            <Pressable key={i}
              onPress={()=>setMeal({ ...m, dayLabel:`${shownDay+1}일차`, whenLabel:labels[m.mi] })}
              style={({pressed})=>({ flexDirection:'row', alignItems:'center', gap:sp.m, paddingVertical:14,
                borderTopWidth: i ? 0.5 : 0, borderTopColor:t.line, opacity: pressed ? 0.5 : 1 })}>
              <Thumb t={t} emoji={m.r.e} />
              <View style={{ flex:1 }}>
                <Text style={{ color:t.ink, fontSize:16, fontWeight:'500', letterSpacing:-0.2 }}>{m.r.n}</Text>
                <Text style={[type.caption,{ color:t.ink3, marginTop:3 }]}>
                  <Text style={{ color:t.ink2, fontWeight:'600' }}>{labels[m.mi]}</Text>
                  {' · '}{m.r.t}분{m.r.sp>=2 ? ' · 매움' : ''}{minShelf(m.r)<=4 ? ' · 신선재료' : ''}
                </Text>
              </View>
              <Text style={{ color:t.ink3, fontSize:18, lineHeight:20 }}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap:sp.s, marginTop:sp.xxl }}>
          <PrimaryButton t={t} label={`이 ${slots}끼 그대로 담기`} onPress={onFillCart} />
          <TextButton t={t} label="다른 조합으로 다시 짜기"
            onPress={()=>set(s=>({ ...s, seed:(s.seed*1664525+1013904223)%4294967296 }))} />
        </View>
      </ScrollView>

      <RecipeSheet recipe={meal?.r} people={cfg.people} t={t} onClose={()=>setMeal(null)}
        caption={meal ? `${meal.dayLabel} · ${meal.whenLabel}` : ''} />
    </>
  );
}
