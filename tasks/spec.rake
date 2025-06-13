require 'rake'

begin
  require 'rspec/core/rake_task'
  
  # Simple RSpec task without the problematic last_comment check
  task :spec do
    require 'rspec/core'
    RSpec::Core::Runner.run(['spec'])
  end
  
  desc 'Run all RSpec tests in the spec directory'
  task :spec
  
rescue LoadError
  desc 'RSpec not available'
  task :spec do
    puts "RSpec is not available. Install it with: gem install rspec"
  end
end