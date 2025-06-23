#!/usr/bin/env ruby -w
# encoding: UTF-8

require 'test/unit'
require 'json'
require 'taskjuggler/TaskJuggler'

class TestJsonExport < Test::Unit::TestCase

  def setup
    @tjp = <<'TJP'
project json_test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
  now 2025-01-15
}

resource dev "Developer" {
  rate 50.0
}

task project "Project" {
  task t1 "Task 1" {
    start 2025-01-01
    duration 5d
    allocate dev
    complete 50
  }
  
  task t2 "Task 2" {
    depends !t1
    duration 3d
    allocate dev
  }
  
  milestone m1 "Milestone 1" {
    depends !t2
  }
}

jsonreport "test" {
  formats json
}
TJP
  end

  def test_json_export_basic
    tj = TaskJuggler.new
    assert(tj.parse([ @tjp ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    
    # Find the JSON report
    report = nil
    tj.project.reports.each do |r|
      if r.typeSpec == :jsonreport
        report = r
        break
      end
    end
    
    assert_not_nil(report, 'JSON report not found')
    
    # Generate the report
    report.generate([:json])
    
    # Get the JSON content
    json_content = report.content.to_json
    assert_not_nil(json_content, 'JSON content is nil')
    
    # Parse the JSON
    data = JSON.parse(json_content)
    
    # Verify structure
    assert_equal('1.0', data['version'])
    assert_not_nil(data['generated'])
    assert_equal('Test Project', data['project']['name'])
    assert_equal('2025-01-01', data['project']['start'])
    assert_equal('USD', data['project']['currency'])
    
    # Verify tasks
    assert_equal(4, data['tasks'].length) # project + t1 + t2 + m1
    
    # Find specific tasks
    t1 = data['tasks'].find { |t| t['id'] == 'project.t1' }
    assert_not_nil(t1)
    assert_equal('Task 1', t1['name'])
    assert_equal('task', t1['type'])
    assert_equal(50.0, t1['scenarios']['plan']['complete'])
    
    m1 = data['tasks'].find { |t| t['id'] == 'project.m1' }
    assert_not_nil(m1)
    assert_equal('milestone', m1['type'])
    assert(m1['dependencies'].any? { |d| d['task'] == 'project.t2' })
    
    # Verify resources  
    assert_equal(1, data['resources'].length)
    dev = data['resources'].first
    assert_equal('dev', dev['id'])
    assert_equal(50.0, dev['rate'])
  end

  def test_json_export_with_gantt_chart
    tjp_gantt = <<'TJP'
project json_test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
}

task t1 "Task 1" {
  start 2025-01-01
  duration 5d
}

taskreport gantt "Gantt" {
  formats json
  columns name, start, end, chart { scale day }
}
TJP

    tj = TaskJuggler.new
    assert(tj.parse([ tjp_gantt ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    
    # Find the task report
    report = nil
    tj.project.reports.each do |r|
      if r.typeSpec == :taskreport
        report = r
        break
      end
    end
    
    assert_not_nil(report, 'Task report not found')
    
    # Generate the report
    report.generate([:json])
    
    # Get the JSON content  
    json_content = report.content.to_json
    assert_not_nil(json_content, 'JSON content is nil')
    
    # Parse the JSON
    data = JSON.parse(json_content)
    
    # Verify it has enhanced Gantt chart data
    assert_equal('1.0', data['version'])
    assert_not_nil(data['view'])
    assert_equal('day', data['view']['scale'])
  end

end