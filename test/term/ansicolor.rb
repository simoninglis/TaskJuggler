module Term
  module ANSIColor
    @coloring = true
    class << self
      attr_accessor :coloring
      [:red, :magenta, :blue, :green, :reset].each do |m|
        define_method(m) { |*args| '' }
      end
    end
    [:red, :magenta, :blue, :green, :reset].each do |m|
      define_method(m) { |*args| '' }
    end
  end
end
