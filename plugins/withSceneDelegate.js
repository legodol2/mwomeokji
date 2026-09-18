/**
 * iOS 27 SDK부터 앱이 UIScene 생명주기를 채택하지 않으면 실행 즉시 종료된다.
 * React Native 0.87 / Expo SDK 57까지는 기본 템플릿에 Scene 지원이 없어서
 * AppDelegate에 SceneDelegate를 직접 붙인다. (prebuild 때마다 자동 적용)
 */
const { withAppDelegate } = require('@expo/config-plugins');

const SCENE_DELEGATE = `

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      return
    }
    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)

    for context in connectionOptions.urlContexts {
      RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
    for activity in connectionOptions.userActivities {
      RCTLinkingManager.application(
        UIApplication.shared, continue: activity, restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

module.exports = function withSceneDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (src.includes('class SceneDelegate')) return cfg;

    // 1) 루트 뷰를 Scene이 만들 때까지 launchOptions를 들고 있는다
    src = src.replace(
      /(class AppDelegate: ExpoAppDelegate \{\s*\n\s*var window: UIWindow\?)/,
      '$1\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?'
    );

    // 2) 창 생성과 RN 시작은 SceneDelegate로 옮긴다
    src = src.replace(
      /#if os\(iOS\) \|\| os\(tvOS\)\s*\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\s*\n\s*factory\.startReactNative\([\s\S]*?\)\s*\n#endif/,
      'self.launchOptions = launchOptions'
    );

    if (!src.includes('self.launchOptions = launchOptions')) {
      throw new Error('withSceneDelegate: AppDelegate에서 창 생성 부분을 찾지 못했습니다.');
    }

    cfg.modResults.contents = src.trimEnd() + '\n' + SCENE_DELEGATE;
    return cfg;
  });
};
