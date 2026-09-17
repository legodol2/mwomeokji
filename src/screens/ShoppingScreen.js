import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ING, AISLES, MART } from '../data';
import { won, qty } from '../engine';
import { leftovers, storageTips } from '../advice';
import { Label, Bar, Seg } from '../ui';
import { mono } from '../theme';

function Check({ on, t }){
  return (
    <View style={{ width:22, height:22, borderRadius:6, borderWidth:1.5,
                   borderColor: on ? t.accent : t.line2, backgroundColor: on ? t.accent : 'transparent',
                   alignItems:'center', justifyContent:'center' }}>
      {on ? <Text style={{ color:t.onAccent, fontSize:13, fontWeight:'700', lineHeight:15 }}>✓</Text> : null}
    </View>
  );
}

export default function ShoppingScreen({ bill, cfg, mode, setMode, cartMeals, hasPlan, checked, toggle, reset, t, onGoPick }){
  const got = bill ? bill.lines.filter(l => checked[l.id]).reduce((s,l)=>s+l.cost, 0) : 0;
  const left = bill ? cfg.budget - bill.total : cfg.budget;
  const owned = [...cfg.owned].filter(id => ING[id]).map(id => ING[id].n);

  const Switcher = (
    <View style={{ padding:18, paddingBottom:0 }}>
      <Seg t={t} value={mode} onChange={setMode}
        options={[{ v:'plan', n: hasPlan ? '앱이 짠 식단' : '앱이 짠 식단 (없음)' },
                  { v:'cart', n:`내가 담은 메뉴${cartMeals ? ` ${cartMeals}끼` : ''}` }]} />
    </View>
  );

  if(!bill || !bill.lines.length){
    return (
      <View style={{ flex:1 }}>
        {Switcher}
        <View style={{ flex:1, padding:26, justifyContent:'center' }}>
          <Text style={{ color:t.ink, fontSize:17, fontWeight:'700', textAlign:'center' }}>
            {mode === 'cart' ? '아직 담은 메뉴가 없습니다' : '짤 수 있는 식단이 없습니다'}
          </Text>
          <Text style={{ color:t.ink2, fontSize:14, textAlign:'center', marginTop:8, lineHeight:21 }}>
            {mode === 'cart'
              ? '메뉴 탭에서 먹을 메뉴를 고르면\n어떤 제품을 얼마나 사야 하는지 여기 나옵니다.'
              : '조건 탭에서 조리도구나 입맛을 넓혀 보세요.'}
          </Text>
          {mode === 'cart' && (
            <Pressable onPress={onGoPick}
              style={{ marginTop:20, alignSelf:'center', paddingHorizontal:22, paddingVertical:12,
                       borderRadius:11, backgroundColor:t.accent }}>
              <Text style={{ color:t.onAccent, fontSize:15, fontWeight:'700' }}>메뉴 담으러 가기</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const lo = leftovers(bill);
  const tips = storageTips(bill, cfg, ING, qty);

  return (
    <View style={{ flex:1 }}>
      {Switcher}
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:18, paddingBottom:40 }}>

        <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, padding:15, marginBottom:14 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' }}>
            <Text style={{ color:t.ink, fontSize:16, fontWeight:'700' }}>{MART[cfg.mart].n}</Text>
            <Text style={[mono,{ color:t.ink2, fontSize:13 }]}>담은 것 {won(got)} / {won(bill.total)}원</Text>
          </View>
          <View style={{ marginTop:9 }}><Bar t={t} pct={got/Math.max(bill.total,1)*100} /></View>
          <Text style={{ color:t.ink3, fontSize:11.5, marginTop:7 }}>
            {cfg.reg.n} · {mode==='cart' ? `담은 메뉴 ${bill.mealCount}끼` : `${cfg.days}일 / ${cfg.people}명`} · 품목 {bill.lines.length}개
          </Text>
        </View>

        {mode === 'cart' && bill.items && (
          <View style={{ marginBottom:18 }}>
            <Label t={t} style={{ marginBottom:7, marginLeft:2 }}>담은 메뉴</Label>
            <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, padding:13 }}>
              <Text style={{ color:t.ink2, fontSize:13.5, lineHeight:21 }}>
                {bill.items.map(({r,n}) => `${r.n}${n>1 ? ` ×${n}` : ''}`).join(' · ')}
              </Text>
            </View>
          </View>
        )}

        {AISLES.map(a => {
          const rows = bill.lines.filter(l => ING[l.id].a === a);
          if(!rows.length) return null;
          return (
            <View key={a} style={{ marginBottom:18 }}>
              <Label t={t} style={{ marginBottom:7, marginLeft:2 }}>{a}</Label>
              <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, overflow:'hidden' }}>
                {rows.map((l,i)=>{
                  const g = ING[l.id], on = !!checked[l.id];
                  return (
                    <Pressable key={l.id} onPress={()=>toggle(l.id)} accessibilityRole="checkbox" accessibilityState={{checked:on}}
                      style={({pressed})=>({ flexDirection:'row', alignItems:'center', gap:12, padding:13,
                        borderTopWidth: i?1:0, borderColor:t.line, backgroundColor: pressed ? t.sunk : 'transparent' })}>
                      <Check on={on} t={t} />
                      <View style={{ flex:1 }}>
                        <Text style={{ color: on ? t.ink3 : t.ink, fontSize:15, fontWeight:'500',
                                       textDecorationLine: on ? 'line-through' : 'none' }}>
                          {g.n}{l.packs>1 ? `  ×${l.packs}` : ''}
                        </Text>
                        <Text style={{ color:t.ink3, fontSize:11.5, marginTop:2 }}>
                          {g.pl} 단위 · 쓰는 양 {qty(l.id, l.need)}
                          {l.left > g.pq*0.35 ? ` · ${qty(l.id, l.left)} 남음` : ''}
                        </Text>
                      </View>
                      <Text style={[mono,{ color: on ? t.ink3 : t.ink, fontSize:14 }]}>{won(l.cost)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, padding:15, marginBottom:16 }}>
          {bill.fee ? (
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
              <Text style={{ color:t.ink2, fontSize:13.5 }}>배송비</Text>
              <Text style={[mono,{ color:t.ink2, fontSize:13.5 }]}>{won(bill.fee)}원</Text>
            </View>
          ) : null}
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' }}>
            <Text style={{ color:t.ink, fontSize:15, fontWeight:'700' }}>합계</Text>
            <Text style={[mono,{ color:t.warm, fontSize:20, fontWeight:'700' }]}>{won(bill.total)}원</Text>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6 }}>
            <Text style={{ color:t.ink3, fontSize:12.5 }}>예산 {won(cfg.budget)}원</Text>
            <Text style={[mono,{ color: left<0 ? t.danger : t.accent, fontSize:12.5 }]}>
              {left<0 ? '−' : ''}{won(Math.abs(left))}원 {left<0 ? '초과' : '남음'}
            </Text>
          </View>
          {owned.length ? (
            <Text style={{ color:t.ink3, fontSize:11.5, marginTop:10, lineHeight:17 }}>
              집에 있다고 체크해서 뺀 것 — {owned.join(', ')}
            </Text>
          ) : null}
          <Pressable onPress={reset} style={{ marginTop:12, paddingVertical:10, borderRadius:9, borderWidth:1,
                      borderColor:t.line2, alignItems:'center' }}>
            <Text style={{ color:t.ink2, fontSize:13.5 }}>체크 전부 지우기</Text>
          </Pressable>
        </View>

        <Label t={t} style={{ marginBottom:7, marginLeft:2 }}>남는 재료</Label>
        <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, padding:15, marginBottom:16 }}>
          {lo.length ? lo.map((l,i)=>(
            <View key={l.id} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:6,
                                      borderTopWidth: i?1:0, borderColor:t.line }}>
              <Text style={{ color:t.ink, fontSize:14 }}>{ING[l.id].n}</Text>
              <Text style={[mono,{ color:t.ink2, fontSize:13.5 }]}>{qty(l.id, l.left)} 남음</Text>
            </View>
          )) : <Text style={{ color:t.ink2, fontSize:13.5 }}>규격에 딱 맞게 떨어집니다. 남는 재료가 거의 없습니다.</Text>}
        </View>

        <Label t={t} style={{ marginBottom:7, marginLeft:2 }}>사고 나서 할 일</Label>
        <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, padding:15 }}>
          {tips.length ? tips.map((tip,i)=>(
            <View key={i} style={{ paddingVertical:7, borderTopWidth: i?1:0, borderColor:t.line }}>
              <Text style={{ color:t.ink, fontSize:14, fontWeight:'600' }}>{tip.k}</Text>
              <Text style={{ color:t.ink2, fontSize:13, marginTop:2, lineHeight:19 }}>{tip.v}</Text>
            </View>
          )) : <Text style={{ color:t.ink2, fontSize:13.5 }}>기간 안에 다 소진되는 구성입니다.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}
