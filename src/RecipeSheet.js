import React from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { ING } from './data';
import { qty, toolNames, minShelf } from './engine';
import { Label, TextButton, Thumb } from './ui';
import { sp, radius, type, num } from './theme';

export default function RecipeSheet({ recipe:r, caption, people, t, onClose, footer }){
  return (
    <Modal visible={!!r} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)' }} />
      <View style={{ backgroundColor:t.bg, borderTopLeftRadius:24, borderTopRightRadius:24,
                     maxHeight:'85%', paddingBottom:sp.xxl }}>
        <View style={{ alignItems:'center', paddingTop:sp.m }}>
          <View style={{ width:36, height:4, borderRadius:2, backgroundColor:t.line2 }} />
        </View>
        {r && (
          <ScrollView contentContainerStyle={{ paddingHorizontal:sp.xl, paddingTop:sp.l, paddingBottom:sp.l }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:sp.m }}>
              <Thumb t={t} emoji={r.e} size={56} tone="soft" />
              <Text style={[type.title,{ color:t.ink, fontSize:24, flex:1 }]}>{r.n}</Text>
            </View>
            <Text style={[type.caption,{ color:t.ink3, marginTop:sp.m }]}>
              {r.c} · 조리 {r.t}분{r.sp>=2 ? ' · 매움' : ''}{minShelf(r)<=4 ? ' · 신선재료 먼저' : ''}
            </Text>
            {caption ? <Text style={[type.caption,{ color:t.ink3, marginTop:2 }]}>{caption}</Text> : null}

            <Label t={t} style={{ marginTop:sp.xxl, marginBottom:sp.xs }}>재료 {people}인분</Label>
            <View>
              {Object.entries(r.ing).map(([id,q],i)=>(
                <View key={id} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:11,
                                        borderTopWidth: i ? 0.5 : 0, borderTopColor:t.line }}>
                  <Text style={[type.body,{ color:t.ink }]}>{ING[id].n}</Text>
                  <Text style={[num, type.body, { color:t.ink2 }]}>{qty(id, q*people)}</Text>
                </View>
              ))}
            </View>

            <Label t={t} style={{ marginTop:sp.xxl, marginBottom:sp.xs }}>쓰는 도구</Label>
            <Text style={[type.body,{ color:t.ink2 }]}>{toolNames(r)}</Text>

            <Label t={t} style={{ marginTop:sp.xxl, marginBottom:sp.s }}>만드는 법</Label>
            {r.steps.map((s,i)=>(
              <View key={i} style={{ flexDirection:'row', gap:sp.m, marginTop:sp.m }}>
                <View style={{ width:24, height:24, borderRadius:12, backgroundColor:t.primarySoft,
                               alignItems:'center', justifyContent:'center' }}>
                  <Text style={[num,{ color:t.primary, fontSize:12.5, fontWeight:'800' }]}>{i+1}</Text>
                </View>
                <Text style={[type.body,{ color:t.ink, flex:1, lineHeight:24 }]}>{s}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={{ paddingHorizontal:sp.xl, gap:sp.s }}>
          {footer}
          <TextButton t={t} label="닫기" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
