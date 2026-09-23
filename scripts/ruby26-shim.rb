# macOS 기본 Ruby(2.6)로 pod install을 돌리기 위한 임시 보정.
#   - Enumerable#filter_map 은 Ruby 2.7부터라 Expo의 CocoaPods 스크립트가 멈춘다
#   - 경로에 한글이 있으면 명령 출력(ASCII-8BIT)과 섞이며 인코딩 오류가 난다
# 쓰는 법:  RUBYOPT="-r$(pwd)/scripts/ruby26-shim.rb" pod install
# Ruby 3.x를 쓰면 이 파일은 필요 없다.
module Enumerable
  unless method_defined?(:filter_map)
    def filter_map
      return to_enum(:filter_map) unless block_given?
      out = []
      each { |*a| v = yield(*a); out << v if v }
      out
    end
  end
end

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8
