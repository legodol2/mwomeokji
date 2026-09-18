import { Platform } from 'react-native';
import { WHEN } from './engine';

let storage = null;
try {
  // 위젯 확장과 같은 App Group을 통해 값을 넘긴다
  const { ExtensionStorage } = require('@bacons/apple-targets');
  if(Platform.OS === 'ios') storage = new ExtensionStorage('group.com.mwomeokji.app');
} catch(e){ /* 위젯이 없는 빌드에서는 그냥 넘어간다 */ }

/** 오늘(1일차) 먹을 메뉴를 위젯에 써 둔다 */
export function pushToWidget({ meals, mpd, empty }){
  if(!storage) return;
  try {
    const labels = WHEN[mpd] || [];
    const today = (meals || []).filter(m => m.day === 0);
    const body = empty || !today.length
      ? '앱에서 식단을 짜면 여기 뜹니다'
      : today.map(m => `${labels[m.mi] || ''} ${m.r.n}`.trim()).join('\n');
    storage.set('widgetTitle', '오늘 뭐먹고');
    storage.set('widgetBody', body);
    const { ExtensionStorage } = require('@bacons/apple-targets');
    ExtensionStorage.reloadWidget();
  } catch(e){ /* 위젯 갱신 실패가 앱을 막지 않게 */ }
}
