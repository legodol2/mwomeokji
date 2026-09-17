import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { mono } from './theme';

export function Label({ t, children, style }){
  return <Text style={[{ color:t.ink3, fontSize:11.5, letterSpacing:1.4, fontWeight:'600' }, style]}>{children}</Text>;
}

export function Card({ t, children, style }){
  return <View style={[{ backgroundColor:t.card, borderColor:t.line, borderWidth:StyleSheet.hairlineWidth*2, borderRadius:12, padding:16 }, style]}>{children}</View>;
}

export function Chip({ label, on, onPress, t, small }){
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected:on }}
      style={({pressed})=>({
        paddingVertical: small?5:7, paddingHorizontal: small?11:13, borderRadius:999,
        borderWidth:1, borderColor: on ? t.accent : t.line2,
        backgroundColor: on ? t.accent : 'transparent', opacity: pressed?0.65:1
      })}>
      <Text style={{ color: on ? t.onAccent : t.ink2, fontSize: small?13:14, fontWeight: on?'600':'400' }}>{label}</Text>
    </Pressable>
  );
}

export function Seg({ options, value, onChange, t }){
  return (
    <View style={{ flexDirection:'row', borderWidth:1, borderColor:t.line2, borderRadius:9, overflow:'hidden', backgroundColor:t.sunk }}>
      {options.map((o,i)=>{
        const on = o.v === value;
        return (
          <Pressable key={String(o.v)} onPress={()=>onChange(o.v)} accessibilityRole="button" accessibilityState={{selected:on}}
            style={{ flex:1, paddingVertical:9, alignItems:'center', backgroundColor: on?t.accent:'transparent',
                     borderLeftWidth: i?1:0, borderLeftColor:t.line2 }}>
            <Text numberOfLines={1} style={{ color:on?t.onAccent:t.ink2, fontSize:13.5, fontWeight:on?'600':'400' }}>{o.n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min, max, suffix, t }){
  const step = d => onChange(Math.max(min, Math.min(max, value + d)));
  const btn = (d,label) => (
    <Pressable onPress={()=>step(d)} hitSlop={6} accessibilityRole="button" accessibilityLabel={label}
      style={({pressed})=>({ width:42, height:40, alignItems:'center', justifyContent:'center', backgroundColor: pressed?t.accentSoft:'transparent' })}>
      <Text style={{ fontSize:20, color:t.ink2, lineHeight:22 }}>{d>0?'+':'−'}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:t.line2, borderRadius:9, backgroundColor:t.sunk }}>
      {btn(-1,'줄이기')}
      <Text style={[mono,{ minWidth:56, textAlign:'center', color:t.ink, fontSize:16, fontWeight:'600' }]}>{value}{suffix||''}</Text>
      {btn(1,'늘리기')}
    </View>
  );
}

export function Bar({ pct, over, t, height=6 }){
  return (
    <View style={{ height, borderRadius:height/2, backgroundColor:t.line, overflow:'hidden' }}>
      <View style={{ width:`${Math.max(0,Math.min(100,pct))}%`, height:'100%', backgroundColor: over?t.danger:t.accent }} />
    </View>
  );
}

export function Divider({ t, style }){
  return <View style={[{ height:StyleSheet.hairlineWidth, backgroundColor:t.line }, style]} />;
}
