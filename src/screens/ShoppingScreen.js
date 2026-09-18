import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ING, AISLES, MART } from '../data';
import { won, qty } from '../engine';
import { leftovers, storageTips } from '../advice';
import { Label, Bar, Seg, PrimaryButton, TextButton, EmptyState } from '../ui';
import { sp, radius, type, num } from '../theme';

function Check({ on, t }){
  return (
    <View style={{ width:24, height:24, borderRadius:12,
                   borderWidth: on ? 0 : 1.5, borderColor:t.line2,
                   backgroundColor: on ? t.primary : 'transparent',
                   alignItems:'center', justifyContent:'center' }}>
      {on ? <Text style={{ color:t.onPrimary, fontSize:13, fontWeight:'800', lineHeight:15 }}>✓</Text> : null}
    </View>
  );
}

export default function ShoppingScreen({ bill, cfg, mode, setMode, cartMeals, hasPlan, checked, toggle, reset, t, onGoPick }){
  const got = bill ? bill.lines.filter(l => checked[l.id]).reduce((s,l)=>s+l.cost, 0) : 0;
  const left = bill ? cfg.budget - bill.total : cfg.budget;
  const owned = [...cfg.owned].filter(id => ING[id]).map(id => ING[id].n);

  const Switcher = (
    <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.m }}>
      <Seg t={t} value={mode} onChange={setMode}
        options={[{ v:'plan', n: hasPlan ? '앱이 짠 식단' : '앱이 짠 식단 (없음)' },
                  { v:'cart', n:`내가 담은 메뉴${cartMeals ? ` ${cartMeals}끼` : ''}` }]} />
    </View>
  );

  if(!bill || !bill.lines.length){
    return (
      <View style={{ flex:1 }}>
        {Switcher}
        <EmptyState t={t}
          title={mode === 'cart' ? '아직 담은 메뉴가 없습니다' : '짤 수 있는 식단이 없습니다'}
          body={mode === 'cart'
            ? '메뉴 탭에서 먹을 메뉴를 고르면\n어떤 제품을 얼마나 사야 하는지 여기 나옵니다.'
            : '설정에서 조리도구나 입맛을 넓혀 보세요.'}
          action={mode === 'cart' ? <PrimaryButton t={t} label="메뉴 담으러 가기" onPress={onGoPick} /> : null} />
      </View>
    );
  }

  const lo = leftovers(bill);
  const tips = storageTips(bill, cfg, ING, qty);
  const pct = got/Math.max(bill.total,1)*100;

  return (
    <View style={{ flex:1 }}>
      {Switcher}
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ paddingBottom:sp.xxxl }}>

        <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.xl, paddingBottom:sp.l }}>
          <Text style={[type.caption,{ color:t.ink3 }]}>
            {MART[cfg.mart].n} · {mode==='cart' ? `담은 메뉴 ${bill.mealCount}끼` : `${cfg.days}일 / ${cfg.people}명`} · 품목 {bill.lines.length}개
          </Text>
          <View style={{ flexDirection:'row', alignItems:'baseline', gap:sp.s, marginTop:6 }}>
            <Text style={[num, type.display, { color:t.ink }]}>{won(got)}</Text>
            <Text style={[type.body,{ color:t.ink2 }]}>/ {won(bill.total)}원 담음</Text>
          </View>
          <View style={{ marginTop:sp.m }}><Bar t={t} height={4} pct={pct} /></View>
        </View>

        {mode === 'cart' && bill.items && (
          <View style={{ paddingHorizontal:sp.xl, paddingBottom:sp.l }}>
            <Label t={t} style={{ marginBottom:6 }}>담은 메뉴</Label>
            <Text style={[type.caption,{ color:t.ink2, lineHeight:21 }]}>
              {bill.items.map(({r,n}) => `${r.n}${n>1 ? ` ×${n}` : ''}`).join(' · ')}
            </Text>
          </View>
        )}

        {AISLES.map(a => {
          const rows = bill.lines.filter(l => ING[l.id].a === a);
          if(!rows.length) return null;
          return (
            <View key={a} style={{ marginBottom:sp.s }}>
              <Label t={t} style={{ paddingHorizontal:sp.xl, paddingTop:sp.l, paddingBottom:sp.s }}>{a}</Label>
              <View style={{ paddingHorizontal:sp.xl }}>
                {rows.map((l,i)=>{
                  const g = ING[l.id], on = !!checked[l.id];
                  return (
                    <Pressable key={l.id} onPress={()=>toggle(l.id)} accessibilityRole="checkbox" accessibilityState={{checked:on}}
                      style={({pressed})=>({ flexDirection:'row', alignItems:'center', gap:sp.m, paddingVertical:14,
                        borderTopWidth: i ? 0.5 : 0, borderTopColor:t.line, opacity: pressed ? 0.5 : 1 })}>
                      <Check on={on} t={t} />
                      <View style={{ flex:1 }}>
                        <Text style={{ color: on ? t.ink3 : t.ink, fontSize:16, fontWeight:'500',
                                       textDecorationLine: on ? 'line-through' : 'none' }}>
                          {g.n}{l.packs>1 ? `  ×${l.packs}` : ''}
                        </Text>
                        <Text style={[type.caption,{ color:t.ink3, marginTop:3 }]}>
                          {g.pl} 단위 · 쓰는 양 {qty(l.id, l.need)}
                          {l.left > g.pq*0.35 ? ` · ${qty(l.id, l.left)} 남음` : ''}
                        </Text>
                      </View>
                      <Text style={[num,{ color: on ? t.ink3 : t.ink, fontSize:15.5, fontWeight:'600' }]}>{won(l.cost)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.xl }}>
          <View style={{ backgroundColor:t.surface, borderRadius:radius.lg, padding:sp.l, gap:sp.s }}>
            {bill.fee ? (
              <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                <Text style={[type.body,{ color:t.ink2 }]}>배송비</Text>
                <Text style={[num, type.body,{ color:t.ink2 }]}>{won(bill.fee)}원</Text>
              </View>
            ) : null}
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'baseline' }}>
              <Text style={[type.subtitle,{ color:t.ink }]}>합계</Text>
              <Text style={[num,{ color:t.ink, fontSize:24, fontWeight:'800' }]}>{won(bill.total)}원</Text>
            </View>
            <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              <Text style={[type.caption,{ color:t.ink3 }]}>예산 {won(cfg.budget)}원</Text>
              <Text style={[num, type.caption,{ color: left<0 ? t.danger : t.ink2, fontWeight:'600' }]}>
                {left<0 ? '−' : ''}{won(Math.abs(left))}원 {left<0 ? '초과' : '남음'}
              </Text>
            </View>
            {owned.length ? (
              <Text style={[type.micro,{ color:t.ink3, marginTop:sp.xs, lineHeight:18 }]}>
                집에 있다고 체크해서 뺀 것 — {owned.join(', ')}
              </Text>
            ) : null}
          </View>
          <TextButton t={t} label="체크 전부 지우기" onPress={reset} style={{ marginTop:sp.m }} />
        </View>

        <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.xxl }}>
          <Label t={t} style={{ marginBottom:sp.s }}>남는 재료</Label>
          {lo.length ? lo.map((l,i)=>(
            <View key={l.id} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:11,
                                      borderTopWidth: i ? 0.5 : 0, borderTopColor:t.line }}>
              <Text style={[type.body,{ color:t.ink }]}>{ING[l.id].n}</Text>
              <Text style={[num, type.body,{ color:t.ink2 }]}>{qty(l.id, l.left)} 남음</Text>
            </View>
          )) : <Text style={[type.body,{ color:t.ink3 }]}>규격에 딱 맞게 떨어집니다. 남는 재료가 거의 없습니다.</Text>}
        </View>

        <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.xxl }}>
          <Label t={t} style={{ marginBottom:sp.s }}>사고 나서 할 일</Label>
          {tips.length ? tips.map((tip,i)=>(
            <View key={i} style={{ paddingVertical:sp.m, borderTopWidth: i ? 0.5 : 0, borderTopColor:t.line }}>
              <Text style={[type.label,{ color:t.ink, fontWeight:'600' }]}>{tip.k}</Text>
              <Text style={[type.caption,{ color:t.ink2, marginTop:3, lineHeight:20 }]}>{tip.v}</Text>
            </View>
          )) : <Text style={[type.body,{ color:t.ink3 }]}>기간 안에 다 소진되는 구성입니다.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}
