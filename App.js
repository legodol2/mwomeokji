import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MART } from './src/data';
import { resolveRegion, candidates, plan, cheapPlanFor, cartBill, ownedFrom, won } from './src/engine';
import { useTheme, sp, type, num } from './src/theme';
import { PrimaryButton, EmptyState } from './src/ui';
import Onboarding from './src/screens/Onboarding';
import MenuScreen from './src/screens/MenuScreen';
import PlanScreen from './src/screens/PlanScreen';
import ShoppingScreen from './src/screens/ShoppingScreen';
import Setup from './src/screens/Setup';
import LocationPicker from './src/screens/LocationPicker';
import { syncReminders } from './src/notify';
import { pushToWidget } from './src/widget';

const KEY = 'mwomeokji.v2';
const DEFAULT = {
  onboarded:false,
  region:'', coords:null, marts:[],
  tools:['pot','pan','knife','rice','micro','air'],
  pantry:['p0','p1','p2'],
  cuisines:[], spice:2, diet:'none',
  budget:90000, days:5, people:1, mpd:2, seed:7,
  cart:{}, shopMode:'cart',
  notify:false, notifyHour:9,
  tier:'mid',            // 장바구니 가격대 (기본: 중간)
  stock:{}               // 지난 장보기에서 남은 재료 { 재료id: {q, at} }
};
const TABS = [
  { k:'menu',  n:'홈',     i:'home' },
  { k:'plan',  n:'식단',   i:'restaurant' },
  { k:'shop',  n:'장보기', i:'cart' },
  { k:'setup', n:'설정',   i:'settings' }
];
const TITLES = { menu:'뭐먹고', plan:'앱이 짠 식단', shop:'장보기', setup:'설정' };

export default function App(){
  const t = useTheme();
  const [st, setSt] = useState(DEFAULT);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('menu');
  const [mapOpen, setMapOpen] = useState(false);
  const [checked, setChecked] = useState({ sig:'', map:{} });

  useEffect(()=>{ (async()=>{
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if(raw) setSt(s => ({ ...s, ...JSON.parse(raw) }));
    } catch(e){ /* 저장된 값이 깨졌으면 기본값으로 시작한다 */ }
    setReady(true);
  })(); }, []);

  useEffect(()=>{ if(ready) AsyncStorage.setItem(KEY, JSON.stringify(st)).catch(()=>{}); }, [st, ready]);

  const result = useMemo(()=>{
    const reg = resolveRegion(st.region);
    const pool = st.marts.filter(k => reg.m.includes(k));
    const usable = pool.length ? pool : reg.m;
    const base = {
      reg, mart:usable[0], budget:st.budget, days:st.days, people:st.people, mpd:st.mpd,
      spice:st.spice, diet:st.diet, seed:st.seed, tier:st.tier, stock:st.stock,
      tools:new Set(st.tools), cuisines:new Set(st.cuisines), owned:ownedFrom(new Set(st.pantry))
    };
    const { list, notes } = candidates(base);
    if(!list.length) return { cfg:base, empty:true, notes, martTotals:{}, usable };
    // 고른 마트들 중 가장 싼 곳을 기준으로 삼는다
    const martTotals = {};
    for(const k of reg.m) martTotals[k] = cheapPlanFor(base, list, k).total;
    let mart = usable[0];
    for(const k of usable) if(martTotals[k] < martTotals[mart]) mart = k;
    const cfg = { ...base, mart };
    return { cfg, list, notes, martTotals, usable, ...plan(cfg, list) };
  }, [st.region, st.marts, st.budget, st.days, st.people, st.mpd, st.spice, st.diet, st.seed, st.tier, st.tools, st.cuisines, st.pantry, st.stock]);

  const cart = useMemo(()=> cartBill(st.cart, result.cfg), [st.cart, result.cfg]);
  const bill = st.shopMode === 'cart' ? cart : (result.empty ? null : result.p);

  /* 식단이나 알림 설정이 바뀌면 예약을 다시 잡는다 */
  useEffect(()=>{
    if(!ready) return;
    syncReminders({
      enabled: st.notify, hour: st.notifyHour,
      meals: result.empty ? null : result.p.meals, mpd: st.mpd
    });
    pushToWidget({ meals: result.empty ? null : result.p.meals, mpd: st.mpd, empty: result.empty });
  }, [ready, st.notify, st.notifyHour, st.mpd, result.empty ? null : result.p?.meals]);

  const sig = bill ? st.shopMode + '|' + result.cfg.mart + '|' + bill.lines.map(l=>l.id+':'+l.packs).join(',') : '';
  useEffect(()=>{ setChecked(c => c.sig === sig ? c : { sig, map:{} }); }, [sig]);

  /* 장을 다 봤을 때: 이번에 쓰고 남는 양을 다음 장보기로 넘긴다 */
  const finishShopping = () => {
    if(!bill || !bill.lines.length) return;
    const now = Date.now();
    const next = { ...(st.stock || {}) };
    bill.lines.forEach(l => {
      const rest = Math.max(0, (l.have || 0) + l.packs*l.pq - l.need);
      if(rest > 0.0001) next[l.id] = { q:rest, at: l.packs ? now : (st.stock?.[l.id]?.at || now) };
      else delete next[l.id];
    });
    setSt(s => ({ ...s, stock: next }));
    setChecked({ sig:'', map:{} });
    Alert.alert('남은 재료를 저장했어요',
      '다음에 식단을 짤 때 이 재료부터 씁니다. 설정 > 집에 남은 재료에서 확인할 수 있습니다.');
  };

  const setCart = next => setSt(s => ({
    ...s, cart: typeof next === 'function' ? next(s.cart) : next, shopMode:'cart'
  }));
  const fillCartFromPlan = () => {
    if(result.empty) return;
    const c = {};
    result.p.meals.forEach(m => { c[m.r.id] = (c[m.r.id]||0) + 1; });
    setCart(c);
    setTab('menu');
  };

  if(!ready){
    return (
      <SafeAreaProvider>
        <View style={{ flex:1, backgroundColor:t.bg, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  if(!st.onboarded){
    return (
      <SafeAreaProvider>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <SafeAreaView style={{ flex:1, backgroundColor:t.bg }} edges={['top','left','right','bottom']}>
          <Onboarding draft={st} setDraft={setSt} t={t}
            onFinish={()=>{ setSt(s=>({ ...s, onboarded:true })); setTab('menu'); }} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const over = bill && bill.total > st.budget;
  const rest = bill ? st.budget - bill.total : st.budget;

  return (
    <SafeAreaProvider>
      <View style={{ flex:1, backgroundColor:t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex:1 }} edges={['top','left','right','bottom']}>

        <View style={{ paddingHorizontal:sp.xl, paddingTop:sp.m, paddingBottom:sp.s }}>
          <Text style={[type.title,{ color: tab === 'menu' ? t.ink3 : t.ink }]}>{TITLES[tab]}</Text>
          <Text style={[type.caption,{ color:t.ink3, marginTop:2 }]} numberOfLines={1}>
            {result.cfg.reg.n} · {MART[result.cfg.mart].n} · {st.days}일 × {st.mpd}끼 · {st.people}명
            {bill && bill.total > 0 ? `  ·  ${won(bill.total)}원` : ''}
          </Text>
        </View>

        <View style={{ flex:1 }}>
          {tab === 'menu' ? (
            <MenuScreen cfg={result.cfg} st={st} set={setSt} cart={st.cart} setCart={setCart}
              bill={cart} t={t} onGoShop={()=>{ setSt(s=>({...s, shopMode:'cart'})); setTab('shop'); }} />
          ) : tab === 'plan' ? (
            result.empty ? (
              <EmptyState t={t}
                title="짤 수 있는 식단이 없습니다"
                body={'조리도구를 하나도 안 골랐거나 조건이 너무 좁습니다.\n냄비나 프라이팬 중 하나는 체크해 주세요.'}
                action={<PrimaryButton t={t} label="설정 고치기" onPress={()=>setTab('setup')} />} />

            ) : (
              <PlanScreen result={result} st={st} set={setSt} t={t} onFillCart={fillCartFromPlan} />
            )
          ) : tab === 'shop' ? (
            <ShoppingScreen bill={bill} cfg={result.cfg} t={t}
              mode={st.shopMode} setMode={v=>setSt(s=>({ ...s, shopMode:v }))}
              cartMeals={cart.mealCount} hasPlan={!result.empty}
              checked={checked.map}
              toggle={id => setChecked(c => ({ sig:c.sig, map:{ ...c.map, [id]: !c.map[id] } }))}
              reset={()=>setChecked(c => ({ sig:c.sig, map:{} }))}
              onGoPick={()=>setTab('menu')} onFinish={finishShopping} />
          ) : (
            <Setup st={st} set={setSt} result={result} t={t}
              onOpenMap={()=>setMapOpen(true)}
              onRestart={()=>Alert.alert(
                '처음부터 다시 할까요?',
                '담은 메뉴와 장보기 체크, 지금까지의 설정이 모두 지워지고 첫 설정 화면부터 다시 시작합니다.',
                [{ text:'취소', style:'cancel' },
                 { text:'다시 시작', style:'destructive', onPress:()=>{
                     setSt({ ...DEFAULT });          // 담은 메뉴와 남은 재료까지 전부 초기화
                     setChecked({ sig:'', map:{} });
                     setTab('menu');
                   } }]
              )} />
          )}
        </View>

        <View style={{ flexDirection:'row', borderTopWidth:0.5, borderTopColor:t.line2, backgroundColor:t.bg }}>
          {TABS.map(x => {
            const on = tab === x.k;
            const badge = x.k === 'menu' && cart.mealCount ? cart.mealCount : 0;
            return (
              <Pressable key={x.k} onPress={()=>setTab(x.k)} accessibilityRole="tab" accessibilityState={{selected:on}}
                style={({pressed})=>({ flex:1, alignItems:'center', paddingTop:sp.s,
                  paddingBottom: Platform.OS==='ios' ? sp.xs : sp.s, opacity: pressed ? 0.6 : 1 })}>
                <View>
                  <Ionicons name={on ? x.i : `${x.i}-outline`} size={23}
                    color={on ? t.primary : t.ink3} />
                  {badge ? (
                    <View style={{ position:'absolute', top:-2, right:-12, backgroundColor:t.primary, borderRadius:999,
                                   minWidth:17, paddingHorizontal:4.5, paddingVertical:1.5 }}>
                      <Text style={[num,{ color:t.onPrimary, fontSize:10, fontWeight:'800', textAlign:'center' }]}>{badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: on ? t.primary : t.ink3, fontSize:11.5, fontWeight: on ? '700' : '500', marginTop:2 }}>
                  {x.n}
                </Text>
              </Pressable>
            );
          })}
        </View>

      </SafeAreaView>

      <Modal visible={mapOpen} animationType="slide" onRequestClose={()=>setMapOpen(false)}>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex:1, backgroundColor:t.bg }} edges={['top','left','right','bottom']}>
            <LocationPicker t={t} initial={st.coords}
              onDone={(addr, coords)=>{ setSt(s=>({ ...s, region:addr, coords })); setMapOpen(false); }}
              onCancel={()=>setMapOpen(false)} />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
      </View>
    </SafeAreaProvider>
  );
}
