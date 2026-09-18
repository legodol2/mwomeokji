/**
 * expo-notifications를 넣으면 푸시(aps-environment) 권한이 따라붙는데,
 * 이 앱은 기기 안에서만 뜨는 로컬 알림만 쓴다. 푸시 권한이 있으면
 * 프로비저닝 프로파일에 Push 기능이 등록돼야 해서 빌드가 막히므로 빼 준다.
 */
const { withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
