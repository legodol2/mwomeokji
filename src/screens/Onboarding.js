import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { TOOLS, PANTRY, MART } from '../data';
import { resolveRegion, won } from '../engine';
import { Chip, Seg, Stepper, Label } from '../ui';
import { mono } from '../theme';
import LocationPicker from './LocationPicker';

const STEPS = ['지역', '마트', '조리도구', '못 먹는 것', '예산·기간'];
const BUDGETS = [30000, 50000, 100000, 200000];

export default function Onboarding({ draft, setDraft, t, onFinish }){
  const [step, setStep] = useState(0);
  const [budgetText, setBudgetText] = useState(String(draft.budget));

  const next = () => setStep(s => Math.min(STEPS.length-1, s+1));
  const back = () => setStep(s => Math.max(0, s-1));
  const tog = (key, id) => setDraft(d => ({
    ...d, [key]: d[key].includes(id) ? d[key].filter(x=>x!==id) : [...d[key], id]
  }));

  const reg = resolveRegion(draft.region);
  const canNext =
    step === 0 ? !!draft.region :
    step === 1 ? draft.marts.length > 0 :
    step === 2 ? draft.tools.length > 0 : true;

  const Head = ({ title, hint }) => (
    <View style={{ marginBottom:20 }}>
      <Text style={{ color:t.ink, fontSize:22, fontWeight:'800' }}>{title}</Text>
      <Text style={{ color:t.ink2, fontSize:13.5, marginTop:6, lineHeight:20 }}>{hint}</Text>
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor:t.bg }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:20, paddingTop:14, paddingBottom:6 }}>
        {STEPS.map((s,i)=>(
          <View key={s} style={{ flex:1, height:3, borderRadius:2,
            backgroundColor: i <= step ? t.accent : t.line }} />
        ))}
        <Text style={[mono,{ color:t.ink3, fontSize:11, marginLeft:6 }]}>{step+1}/{STEPS.length}</Text>
      </View>

      {step === 0 ? (
        <LocationPicker t={t} firstRun initial={draft.coords}
          onDone={(addr, coords)=>{ setDraft(d=>({ ...d, region:addr, coords })); next(); }}
          onCancel={()=>{ setDraft(d=>({ ...d, region:d.region || '서울 마포구' })); next(); }} />
      ) : (
        <>
          <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20, paddingBottom:24 }}>
            {step === 1 && (
              <>
                <Head title="어느 마트에 가세요?" hint={`${reg.n}에서 갈 수 있는 곳입니다. 여러 곳을 고르면 그중 가장 싼 곳으로 계산하고, 나머지는 비교해서 보여 드립니다.`} />
                <Pressable onPress={()=>setDraft(d=>({ ...d, marts: d.marts.length === reg.m.length ? [] : [...reg.m] }))}
                  style={{ alignSelf:'flex-start', marginBottom:12, paddingHorizontal:14, paddingVertical:8,
                           borderRadius:999, borderWidth:1, borderColor:t.line2 }}>
                  <Text style={{ color:t.ink2, fontSize:13 }}>
                    {draft.marts.length === reg.m.length ? '전체 해제' : '전체 선택'}
                  </Text>
                </Pressable>
                <View style={{ gap:8 }}>
                  {reg.m.map(k => {
                    const on = draft.marts.includes(k);
                    return (
                      <Pressable key={k} onPress={()=>tog('marts', k)} accessibilityRole="checkbox" accessibilityState={{checked:on}}
                        style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, borderRadius:12,
                                 borderWidth:1, borderColor: on ? t.accent : t.line,
                                 backgroundColor: on ? t.accentSoft : t.card }}>
                        <View style={{ width:22, height:22, borderRadius:6, borderWidth:1.5,
                                       borderColor: on ? t.accent : t.line2, backgroundColor: on ? t.accent : 'transparent',
                                       alignItems:'center', justifyContent:'center' }}>
                          {on ? <Text style={{ color:t.onAccent, fontSize:13, fontWeight:'700', lineHeight:15 }}>✓</Text> : null}
                        </View>
                        <View style={{ flex:1 }}>
                          <Text style={{ color:t.ink, fontSize:15.5, fontWeight: on ? '700' : '500' }}>{MART[k].n}</Text>
                          <Text style={{ color:t.ink3, fontSize:12, marginTop:2 }}>{MART[k].note}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <Head title="집에 어떤 조리도구가 있나요?" hint="있는 것만 고르세요. 가진 도구로 만들 수 있는 요리만 보여 드립니다. 여러 개 고를 수 있습니다." />
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:9 }}>
                  {TOOLS.map(x => <Chip key={x.id} t={t} label={x.n} on={draft.tools.includes(x.id)} onPress={()=>tog('tools', x.id)} />)}
                </View>
                <Label t={t} style={{ marginTop:30, marginBottom:10 }}>집에 이미 있는 양념</Label>
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:9 }}>
                  {PANTRY.map(p => <Chip key={p.id} t={t} label={p.n} on={draft.pantry.includes(p.id)} onPress={()=>tog('pantry', p.id)} />)}
                </View>
                <Text style={{ color:t.ink3, fontSize:12.5, marginTop:10, lineHeight:18 }}>
                  체크한 양념은 장보기 목록과 예산에서 뺍니다.
                </Text>
              </>
            )}

            {step === 3 && (
              <>
                <Head title="못 먹는 게 있나요?" hint="고른 재료가 들어간 요리는 아예 빼고 식단을 짭니다." />
                <Seg t={t} value={draft.diet} onChange={v=>setDraft(d=>({ ...d, diet:v }))}
                  options={[{v:'none',n:'없음'},{v:'nopork',n:'돼지'},{v:'nofish',n:'해산물'},{v:'veg',n:'채식'}]} />
                <Text style={{ color:t.ink3, fontSize:12.5, marginTop:10, lineHeight:18 }}>
                  {draft.diet === 'none' ? '빼는 재료 없이 전부 보여 드립니다.'
                  : draft.diet === 'nopork' ? '삼겹살·앞다리살·다짐육·베이컨·햄이 들어간 요리를 뺍니다.'
                  : draft.diet === 'nofish' ? '생선·오징어·새우·멸치 육수·굴소스가 들어간 요리를 뺍니다.'
                  : '고기와 해산물이 들어간 요리를 모두 뺍니다. 계란과 유제품은 남깁니다.'}
                </Text>
              </>
            )}

            {step === 4 && (
              <>
                <Head title="예산과 기간을 정해 주세요" hint="이 금액 안에서 이 기간을 버티는 장보기를 짭니다. 나중에 언제든 바꿀 수 있습니다." />
                <Label t={t}>예산</Label>
                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginTop:8, marginBottom:10 }}>
                  <TextInput value={budgetText} keyboardType="number-pad"
                    onChangeText={v=>{ const n=v.replace(/[^0-9]/g,''); setBudgetText(n); setDraft(d=>({ ...d, budget:Math.max(5000, +n||0) })); }}
                    style={[mono,{ flex:1, backgroundColor:t.sunk, borderWidth:1, borderColor:t.line2, borderRadius:9,
                             paddingHorizontal:12, paddingVertical:12, color:t.ink, fontSize:18, textAlign:'right' }]} />
                  <Text style={{ color:t.ink2, fontSize:15 }}>원</Text>
                </View>
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:24 }}>
                  {BUDGETS.map(b => <Chip key={b} small t={t} label={(b/10000)+'만'} on={draft.budget===b}
                    onPress={()=>{ setDraft(d=>({ ...d, budget:b })); setBudgetText(String(b)); }} />)}
                </View>

                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <Text style={{ color:t.ink2, fontSize:14.5 }}>며칠치</Text>
                  <Stepper t={t} value={draft.days} min={1} max={14} suffix="일" onChange={v=>setDraft(d=>({ ...d, days:v }))} />
                </View>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <Text style={{ color:t.ink2, fontSize:14.5 }}>먹는 사람</Text>
                  <Stepper t={t} value={draft.people} min={1} max={6} suffix="명" onChange={v=>setDraft(d=>({ ...d, people:v }))} />
                </View>
                <Label t={t} style={{ marginBottom:8 }}>하루 몇 끼</Label>
                <Seg t={t} value={draft.mpd} onChange={v=>setDraft(d=>({ ...d, mpd:v }))}
                  options={[{v:1,n:'저녁만'},{v:2,n:'두 끼'},{v:3,n:'세 끼'}]} />
                <Text style={{ color:t.ink3, fontSize:12.5, marginTop:12, lineHeight:18 }}>
                  {draft.days}일 × 하루 {draft.mpd}끼 × {draft.people}명 = 총 {draft.days*draft.mpd*draft.people}인분,
                  한 끼에 약 {won(draft.budget/(draft.days*draft.mpd*draft.people))}원꼴입니다.
                </Text>
              </>
            )}
          </ScrollView>

          <View style={{ flexDirection:'row', gap:10, padding:16, borderTopWidth:1, borderColor:t.line }}>
            <Pressable onPress={back} style={{ paddingHorizontal:20, paddingVertical:14, borderRadius:11,
                        borderWidth:1, borderColor:t.line2 }}>
              <Text style={{ color:t.ink2, fontSize:15 }}>이전</Text>
            </Pressable>
            <Pressable onPress={step === STEPS.length-1 ? onFinish : next} disabled={!canNext}
              style={({pressed})=>({ flex:1, backgroundColor: canNext ? t.accent : t.line, borderRadius:11,
                paddingVertical:14, alignItems:'center', opacity:pressed?0.8:1 })}>
              <Text style={{ color: canNext ? t.onAccent : t.ink3, fontSize:16, fontWeight:'700' }}>
                {step === STEPS.length-1 ? '메뉴 보러 가기' : '다음'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
