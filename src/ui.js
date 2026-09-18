import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { sp, radius, type, num } from './theme';

const hair = StyleSheet.hairlineWidth;

/* 섹션 제목 — 화면이 무엇을 묻는지 한 줄로 */
export function SectionHeader({ t, title, hint, style }){
  return (
    <View style={[{ marginBottom: hint ? sp.m : sp.s }, style]}>
      <Text style={[type.subtitle, { color:t.ink }]}>{title}</Text>
      {hint ? <Text style={[type.caption, { color:t.ink3, marginTop:2, lineHeight:19 }]}>{hint}</Text> : null}
    </View>
  );
}

/* 목록 위에 붙는 작은 머리말 */
export function Label({ t, children, style }){
  return <Text style={[type.micro, { color:t.ink3, fontWeight:'600' }, style]}>{children}</Text>;
}

/* 묶어야 이해가 쉬운 것에만 */
export function Card({ t, children, style }){
  return <View style={[{ backgroundColor:t.surface, borderRadius:radius.lg, padding:sp.l }, style]}>{children}</View>;
}

export function Divider({ t, style }){
  return <View style={[{ height:hair, backgroundColor:t.line2 }, style]} />;
}

/* 목록 한 줄 — 테두리 대신 옅은 선으로만 나눈다 */
export function Row({ t, children, onPress, first, style }){
  const inner = (
    <View style={[{ flexDirection:'row', alignItems:'center', gap:sp.m,
                    paddingVertical:sp.l, borderTopWidth: first ? 0 : hair, borderTopColor:t.line }, style]}>
      {children}
    </View>
  );
  if(!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({pressed})=>({ opacity:pressed?0.55:1 })}>{inner}</Pressable>
  );
}

export function Chip({ label, on, onPress, t, small, tone }){
  const soft = tone === 'soft';
  const bg = on ? (soft ? t.primarySoft : t.primary) : t.surface;
  const fg = on ? (soft ? t.primary : t.onPrimary) : t.ink2;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected:on }}
      style={({pressed})=>({
        paddingVertical: small ? 7 : 9, paddingHorizontal: small ? 13 : 15, borderRadius:radius.pill,
        backgroundColor: bg, opacity: pressed ? 0.6 : 1
      })}>
      <Text style={{ color: fg, fontSize: small ? 13.5 : 14.5, fontWeight: on ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}

/* 목록에서 한 줄만 짚어 줄 때 */
export function Badge({ t, label }){
  return (
    <View style={{ backgroundColor:t.primarySoft, borderRadius:radius.pill, paddingHorizontal:8, paddingVertical:3 }}>
      <Text style={{ color:t.primary, fontSize:11.5, fontWeight:'700' }}>{label}</Text>
    </View>
  );
}

/* 한 줄에서 하나만 고르는 자리 */
export function Seg({ options, value, onChange, t }){
  return (
    <View style={{ flexDirection:'row', backgroundColor:t.surface, borderRadius:radius.md, padding:3 }}>
      {options.map(o => {
        const on = o.v === value;
        return (
          <Pressable key={String(o.v)} onPress={()=>onChange(o.v)}
            accessibilityRole="button" accessibilityState={{ selected:on }}
            style={({pressed})=>({
              flex:1, paddingVertical:9, alignItems:'center', borderRadius:radius.sm + 1,
              backgroundColor: on ? t.bg : 'transparent', opacity: pressed && !on ? 0.6 : 1,
              ...(on ? { shadowColor:t.shadow, shadowOpacity:1, shadowRadius:3, shadowOffset:{width:0,height:1}, elevation:1 } : null)
            })}>
            <Text numberOfLines={1} style={{ color: on ? t.ink : t.ink3, fontSize:14, fontWeight: on ? '700' : '500' }}>
              {o.n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min, max, suffix, t }){
  const btn = (d, label) => {
    const off = d < 0 ? value <= min : value >= max;
    return (
      <Pressable onPress={()=>!off && onChange(Math.max(min, Math.min(max, value + d)))}
        disabled={off} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}
        style={({pressed})=>({ width:36, height:36, borderRadius:18, backgroundColor:t.surface,
                               alignItems:'center', justifyContent:'center', opacity: off ? 0.35 : (pressed ? 0.6 : 1) })}>
        <Text style={{ fontSize:19, lineHeight:21, color:t.ink2, fontWeight:'600' }}>{d>0?'+':'−'}</Text>
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:sp.m }}>
      {btn(-1,'줄이기')}
      <Text style={[num, { minWidth:52, textAlign:'center', color:t.ink, fontSize:17, fontWeight:'700' }]}>
        {value}{suffix||''}
      </Text>
      {btn(1,'늘리기')}
    </View>
  );
}

export function Bar({ pct, over, t, height=6 }){
  return (
    <View style={{ height, borderRadius:height/2, backgroundColor:t.line2, overflow:'hidden' }}>
      <View style={{ width:`${Math.max(0,Math.min(100,pct))}%`, height:'100%',
                     borderRadius:height/2, backgroundColor: over ? t.danger : t.primary }} />
    </View>
  );
}

/* 화면마다 눈에 띄는 행동은 하나만 */
export function PrimaryButton({ t, label, onPress, disabled, style }){
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={({pressed})=>([{
        height:54, borderRadius:radius.md, alignItems:'center', justifyContent:'center',
        backgroundColor: disabled ? t.surface : (pressed ? t.primaryPress : t.primary)
      }, style])}>
      <Text style={{ color: disabled ? t.ink3 : t.onPrimary, fontSize:16.5, fontWeight:'700' }}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ t, label, onPress, style, tone }){
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({pressed})=>([{ height:50, paddingHorizontal:sp.l, alignItems:'center', justifyContent:'center',
                              borderRadius:radius.md, backgroundColor:t.surface, opacity:pressed?0.6:1 }, style])}>
      <Text style={{ color: tone === 'primary' ? t.primary : t.ink2, fontSize:15.5, fontWeight:'600' }}>{label}</Text>
    </Pressable>
  );
}

/* 아무것도 없을 때 무엇을 하면 되는지 */
export function EmptyState({ t, title, body, action }){
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:sp.xxxl, gap:sp.s }}>
      <Text style={[type.subtitle, { color:t.ink, textAlign:'center' }]}>{title}</Text>
      <Text style={[type.body, { color:t.ink3, textAlign:'center', lineHeight:23 }]}>{body}</Text>
      {action ? <View style={{ marginTop:sp.l, alignSelf:'stretch' }}>{action}</View> : null}
    </View>
  );
}
