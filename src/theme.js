import { useColorScheme, Platform } from 'react-native';

export const light = {
  dark:false,
  bg:'#FAF8F2', card:'#FFFFFF', sunk:'#F2EFE6',
  ink:'#16201A', ink2:'#4C574F', ink3:'#7E8A81',
  line:'#E1DED1', line2:'#CFCBBA',
  accent:'#1E6B4A', accentSoft:'#E6EFE9', onAccent:'#FFFFFF',
  warm:'#B8541C', warmSoft:'#F8EBE0',
  danger:'#A62B21', dangerSoft:'#F8E6E3'
};
export const dark = {
  dark:true,
  bg:'#11150F', card:'#1A201A', sunk:'#151A15',
  ink:'#ECEFE8', ink2:'#B3BDB2', ink3:'#828D82',
  line:'#2B332B', line2:'#3B453B',
  accent:'#67C295', accentSoft:'#1B2A22', onAccent:'#0E1710',
  warm:'#E39468', warmSoft:'#2C211A',
  danger:'#EE8A7F', dangerSoft:'#2E1B18'
};
export function useTheme(){ return useColorScheme()==='dark' ? dark : light; }

/* 숫자만 담는 자리 — 자릿수가 흔들리지 않게 */
export const mono = {
  fontFamily: Platform.select({ ios:'Menlo', android:'monospace', default:'monospace' }),
  fontVariant:['tabular-nums']
};
