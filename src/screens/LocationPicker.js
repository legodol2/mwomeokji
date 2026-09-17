import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { resolveRegion } from '../engine';
import { MART } from '../data';

const SEOUL = { latitude:37.5665, longitude:126.9780, latitudeDelta:0.06, longitudeDelta:0.06 };

/* 역지오코딩 결과를 '서울 마포구'처럼 지역표가 알아듣는 문자열로 만든다 */
function addressOf(p){
  if(!p) return '';
  const wide = p.region || p.subregion || p.city || '';
  // 장 볼 곳은 구·군 단위로 갈린다. 구·군이 없으면 동이라도 붙여 어느 동네인지 보이게 한다
  const local = p.subregion || p.district || p.city || '';
  const parts = [wide, local].filter(Boolean).filter((v,i,a) => a.indexOf(v) === i);
  return parts.join(' ').trim();
}

export default function LocationPicker({ t, firstRun, initial, onDone, onCancel }){
  const map = useRef(null);
  const timer = useRef();
  const [coord, setCoord] = useState(initial || null);
  const [addr, setAddr] = useState('');
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const centered = useRef(false);

  const locate = async (animate = true) => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if(status !== 'granted'){ setDenied(true); setBusy(false); return; }
      setDenied(false);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoord(c);
      if(animate) centerOn(c);
    } catch(e){ setDenied(true); }
    setBusy(false);
  };

  /* 지도가 아직 안 붙었을 때 옮기라고 하면 무시되므로, 준비되면 그때 옮긴다 */
  const centerOn = c => {
    if(map.current){ centered.current = true; map.current.animateToRegion({ ...c, latitudeDelta:0.03, longitudeDelta:0.03 }, 600); }
  };
  useEffect(()=>{ if(!initial) locate(true); }, []);
  useEffect(()=>{ if(mapReady && coord && !centered.current) centerOn(coord); }, [mapReady, coord]);

  useEffect(()=>{
    if(!coord) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async()=>{
      try {
        const list = await Location.reverseGeocodeAsync(coord);
        const a = addressOf(list && list[0]);
        if(a) setAddr(a);
      } catch(e){ /* 주소를 못 읽으면 좌표만 쓰고 지역은 직접 입력하게 둔다 */ }
    }, 500);
    return ()=>clearTimeout(timer.current);
  }, [coord]);

  const reg = addr ? resolveRegion(addr) : null;
  const shops = reg ? reg.m.length : 0;

  return (
    <View style={{ flex:1, backgroundColor:t.bg }}>
      <View style={{ paddingHorizontal:20, paddingTop:14, paddingBottom:12 }}>
        <Text style={{ color:t.ink, fontSize:21, fontWeight:'800' }}>
          {firstRun ? '어디서 장 보세요?' : '위치 다시 정하기'}
        </Text>
        <Text style={{ color:t.ink2, fontSize:13.5, marginTop:5, lineHeight:20 }}>
          지도를 눌러 핀을 찍으면 그 동네에 있는 마트로 가격을 계산합니다.
        </Text>
      </View>

      <View style={{ flex:1, marginHorizontal:16, borderRadius:16, overflow:'hidden',
                     borderWidth:1, borderColor:t.line }}>
        <MapView
          ref={map}
          style={{ flex:1 }}
          initialRegion={initial ? { ...initial, latitudeDelta:0.03, longitudeDelta:0.03 } : SEOUL}
          onMapReady={()=>setMapReady(true)}
          onPress={e => { centered.current = true; setCoord(e.nativeEvent.coordinate); }}
          showsUserLocation={!denied}
          showsMyLocationButton={false}
          toolbarEnabled={false}>
          {coord && (
            <Marker coordinate={coord} draggable pinColor={t.accent}
              onDragEnd={e => setCoord(e.nativeEvent.coordinate)}
              title="여기서 장보기" />
          )}
        </MapView>

        <Pressable onPress={()=>locate(true)} accessibilityRole="button" accessibilityLabel="현재 위치로 지도 옮기기"
          style={({pressed})=>({ position:'absolute', right:12, bottom:12, flexDirection:'row', alignItems:'center', gap:6,
            backgroundColor:t.card, borderWidth:1, borderColor:t.line2, borderRadius:999,
            paddingHorizontal:14, paddingVertical:10, opacity:pressed?0.7:1,
            shadowColor:'#000', shadowOpacity:0.18, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:3 })}>
          {busy ? <ActivityIndicator size="small" color={t.accent} />
                : <Text style={{ color:t.accent, fontSize:15, lineHeight:17 }}>◎</Text>}
          <Text style={{ color:t.ink, fontSize:13.5, fontWeight:'600' }}>현재 위치로</Text>
        </Pressable>
      </View>

      <View style={{ padding:16, paddingBottom: Platform.OS === 'ios' ? 8 : 16, gap:10 }}>
        <View style={{ backgroundColor:t.card, borderWidth:1, borderColor:t.line, borderRadius:12, padding:14 }}>
          <Text style={{ color:t.ink3, fontSize:11.5, letterSpacing:1.2, fontWeight:'600' }}>찍은 위치</Text>
          <Text style={{ color: addr ? t.ink : t.ink3, fontSize:16, fontWeight:'600', marginTop:5 }}>
            {addr || (coord ? '주소를 읽는 중…' : '지도를 눌러 핀을 찍어 주세요')}
          </Text>
          {reg && (
            <Text style={{ color:t.ink2, fontSize:12.5, marginTop:4 }}>
              {reg.n} 기준 · 장 볼 곳 {shops}곳 ({reg.m.slice(0,3).map(k=>MART[k].n).join(', ')}…)
            </Text>
          )}
          {denied && (
            <Text style={{ color:t.warm, fontSize:12.5, marginTop:6, lineHeight:18 }}>
              위치 권한이 꺼져 있습니다. 지도를 직접 눌러 찍거나, 설정에서 권한을 켜 주세요.
            </Text>
          )}
        </View>

        <Pressable onPress={()=>onDone(addr, coord)} disabled={!addr}
          style={({pressed})=>({ backgroundColor: addr ? t.accent : t.line, borderRadius:12,
            paddingVertical:15, alignItems:'center', opacity:pressed?0.8:1 })}>
          <Text style={{ color: addr ? t.onAccent : t.ink3, fontSize:16, fontWeight:'700' }}>
            {addr ? `${addr}에서 장보기` : '위치를 찍어 주세요'}
          </Text>
        </Pressable>

        <Pressable onPress={onCancel} style={{ paddingVertical:11, alignItems:'center' }}>
          <Text style={{ color:t.ink3, fontSize:13.5 }}>
            {firstRun ? '지도 없이 직접 입력할게요' : '취소'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
