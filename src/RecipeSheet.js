import React from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { ING } from './data';
import { qty, toolNames, minShelf } from './engine';
import { Label } from './ui';
import { mono } from './theme';

export default function RecipeSheet({ recipe:r, caption, people, t, onClose, footer }){
  return (
    <Modal visible={!!r} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex:1, backgroundColor:'rgba(0,0,0,0.45)' }} />
      <View style={{ backgroundColor:t.card, borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'82%',
                     borderTopWidth:1, borderColor:t.line, paddingBottom:26 }}>
        <View style={{ alignItems:'center', paddingTop:10 }}>
          <View style={{ width:38, height:4, borderRadius:2, backgroundColor:t.line2 }} />
        </View>
        {r && (
          <ScrollView contentContainerStyle={{ padding:20, paddingTop:14 }}>
            {caption ? <Text style={{ color:t.ink3, fontSize:12 }}>{caption}</Text> : null}
            <Text style={{ color:t.ink, fontSize:23, fontWeight:'700', marginTop:3 }}>{r.n}</Text>
            <Text style={{ color:t.ink2, fontSize:13, marginTop:4 }}>
              {r.c} · 조리 {r.t}분{r.sp>=2 ? ' · 매움' : ''}{minShelf(r)<=4 ? ' · 신선재료 먼저' : ''}
            </Text>

            <Label t={t} style={{ marginTop:22 }}>재료 {people}인분</Label>
            <View style={{ marginTop:8, borderTopWidth:1, borderColor:t.line }}>
              {Object.entries(r.ing).map(([id,q])=>(
                <View key={id} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:7,
                                        borderBottomWidth:1, borderColor:t.line }}>
                  <Text style={{ color:t.ink, fontSize:14 }}>{ING[id].n}</Text>
                  <Text style={[mono,{ color:t.ink2, fontSize:13.5 }]}>{qty(id, q*people)}</Text>
                </View>
              ))}
            </View>

            <Label t={t} style={{ marginTop:22 }}>쓰는 도구</Label>
            <Text style={{ color:t.ink2, fontSize:14, marginTop:6 }}>{toolNames(r)}</Text>

            <Label t={t} style={{ marginTop:22 }}>만드는 법</Label>
            {r.steps.map((s,i)=>(
              <View key={i} style={{ flexDirection:'row', marginTop:10 }}>
                <Text style={[mono,{ color:t.accent, fontSize:13, width:22, fontWeight:'700' }]}>{i+1}</Text>
                <Text style={{ color:t.ink, fontSize:14.5, flex:1, lineHeight:21 }}>{s}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={{ paddingHorizontal:20, gap:8 }}>
          {footer}
          <Pressable onPress={onClose} style={{ paddingVertical:13, borderRadius:11,
                      borderWidth:1, borderColor:t.line2, alignItems:'center' }}>
            <Text style={{ color:t.ink2, fontSize:15 }}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
