import WidgetKit
import SwiftUI

private let APP_GROUP = "group.com.mwomeokji.app"

struct MealEntry: TimelineEntry {
  let date: Date
  let title: String
  let body: String
}

struct MealProvider: TimelineProvider {
  func read() -> MealEntry {
    let d = UserDefaults(suiteName: APP_GROUP)
    return MealEntry(
      date: Date(),
      title: d?.string(forKey: "widgetTitle") ?? "오늘 뭐먹고",
      body: d?.string(forKey: "widgetBody") ?? "앱에서 식단을 짜면 여기 뜹니다"
    )
  }
  func placeholder(in context: Context) -> MealEntry {
    MealEntry(date: Date(), title: "오늘 뭐먹고", body: "점심 김치볶음밥 · 저녁 된장찌개")
  }
  func getSnapshot(in context: Context, completion: @escaping (MealEntry) -> Void) {
    completion(read())
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<MealEntry>) -> Void) {
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
    completion(Timeline(entries: [read()], policy: .after(next)))
  }
}

struct MealWidgetView: View {
  var entry: MealEntry
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(entry.title)
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(Color(red: 0.98, green: 0.40, blue: 0.27))
      Text(entry.body)
        .font(.system(size: 15, weight: .semibold))
        .foregroundColor(.primary)
        .lineLimit(4)
        .minimumScaleFactor(0.8)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(for: .widget) { Color(UIColor.systemBackground) }
  }
}

@main
struct MealWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "MealWidget", provider: MealProvider()) { entry in
      MealWidgetView(entry: entry)
    }
    .configurationDisplayName("오늘 뭐먹고")
    .description("그날 먹을 메뉴를 보여 줍니다.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
