import { useColorScheme } from 'react-native';

/* ── 색 ──
   브랜드색 하나 + 중립색. 의미색(초과·경고)은 꼭 필요할 때만. */
export const light = {
  dark:false,
  bg:'#FFFFFF',        // 화면 바탕
  surface:'#F7F8FA',   // 묶음 배경, 입력칸, 눌리지 않은 칩
  ink:'#191F28',       // 본문
  ink2:'#4E5968',      // 보조
  ink3:'#8B95A1',      // 설명·비활성
  line:'#F1F3F5',      // 아주 옅은 구분선
  line2:'#E4E8EB',     // 또렷한 구분선
  primary:'#FB6545', primaryPress:'#E24E30', primarySoft:'#FFF0EC', onPrimary:'#FFFFFF',
  danger:'#D0021B', dangerSoft:'#FDECEE',
  shadow:'rgba(25,31,40,0.10)'
};
export const dark = {
  dark:true,
  bg:'#111416',
  surface:'#1A1F22',
  ink:'#EDEFF2',
  ink2:'#A7B0B8',
  ink3:'#6E7880',
  line:'#1F2427',
  line2:'#2C3338',
  primary:'#FB6545', primaryPress:'#E24E30', primarySoft:'#2B1712', onPrimary:'#FFFFFF',
  danger:'#FF7A85', dangerSoft:'#2A1619',
  shadow:'rgba(0,0,0,0.5)'
};
export function useTheme(){ return useColorScheme()==='dark' ? dark : light; }

/* ── 여백 8px 기준 ── */
export const sp = { xs:4, s:8, m:12, l:16, xl:20, xxl:24, xxxl:32 };
export const radius = { sm:8, md:12, lg:16, pill:999 };

/* ── 글자 ──
   시스템 글꼴만 쓴다. 숫자가 줄맞춤돼야 하는 곳에만 num을 얹는다. */
export const type = {
  display:{ fontSize:32, fontWeight:'800', letterSpacing:-0.8 },
  title:  { fontSize:22, fontWeight:'700', letterSpacing:-0.4 },
  subtitle:{ fontSize:17, fontWeight:'600', letterSpacing:-0.2 },
  body:   { fontSize:15.5, fontWeight:'400' },
  label:  { fontSize:14, fontWeight:'500' },
  caption:{ fontSize:13, fontWeight:'400' },
  micro:  { fontSize:12, fontWeight:'400' }
};
export const num = { fontVariant:['tabular-nums'] };
export const mono = num; // 예전 이름 호환
