import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WHEN } from './engine';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: false, shouldSetBadge: false
  })
});

export async function ensurePermission(){
  const { status } = await Notifications.getPermissionsAsync();
  if(status === 'granted') return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted';
}

/* 식단의 하루치를 한 줄로 */
function lineFor(meals, mpd){
  const labels = WHEN[mpd] || [];
  return meals.map(m => `${labels[m.mi] || ''} ${m.r.n}`.trim()).join(' · ');
}

/**
 * 식단 기간만큼 하루 한 번 알림을 예약한다. (오늘이 1일차)
 * 설정이나 식단이 바뀌면 통째로 지우고 다시 예약한다.
 */
export async function syncReminders({ enabled, hour, meals, mpd }){
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if(!enabled || !meals || !meals.length) return 0;
    if(!(await ensurePermission())) return 0;

    if(Platform.OS === 'android'){
      await Notifications.setNotificationChannelAsync('meal', {
        name: '오늘의 식단', importance: Notifications.AndroidImportance.DEFAULT
      });
    }

    const byDay = {};
    meals.forEach(m => { (byDay[m.day] = byDay[m.day] || []).push(m); });

    const now = new Date();
    let count = 0;
    for(const key of Object.keys(byDay).map(Number).sort((a,b)=>a-b)){
      const when = new Date(now);
      when.setDate(now.getDate() + key);
      when.setHours(hour, 0, 0, 0);
      if(when <= now) continue;             // 이미 지난 시각은 건너뛴다
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${key+1}일차 · 오늘 뭐먹고`,
          body: lineFor(byDay[key], mpd),
          sound: false,
          ...(Platform.OS === 'android' ? { channelId:'meal' } : null)
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when }
      });
      count++;
    }
    return count;
  } catch(e){
    return 0;   // 알림이 막혀 있어도 앱은 그대로 동작한다
  }
}
