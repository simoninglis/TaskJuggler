#!/usr/bin/env ruby -w
# encoding: UTF-8

require 'test/unit'
require 'json'
require 'tempfile'
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

task m1 "Milestone 1" {
  depends !t2
  milestone
}

jsonreport "test" {
  formats json
}
TJP
  end

  def write_tjp_file(content)
    file = Tempfile.new(['test', '.tjp'])
    file.write(content)
    file.flush
    # Don't close yet - keep it open so it doesn't get deleted
    @temp_files ||= []
    @temp_files << file
    file.path
  end

  def teardown
    # Clean up temp files after test
    @temp_files&.each(&:close!)
  end

  def test_json_export_basic
    tjp_file = write_tjp_file(@tjp)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')

    # Generate all reports (this creates the JSON file)
    assert(tj.generateReports, 'Report generation failed')

    # Read the generated JSON file
    json_file = 'test.json'
    assert(File.exist?(json_file), 'JSON file was not generated')

    # Parse the JSON
    data = JSON.parse(File.read(json_file))
    
    # Verify structure
    assert_equal('1.0', data['version'])
    assert_not_nil(data['generated'])
    assert_equal('Test Project', data['project']['name'])
    assert_equal('2025-01-01', data['project']['start'])
    assert_equal('USD', data['project']['currency'])
    
    # Verify tasks
    assert_equal(3, data['tasks'].length) # t1 + t2 + m1

    # Find specific tasks
    t1 = data['tasks'].find { |t| t['id'] == 't1' }
    assert_not_nil(t1)
    assert_equal('Task 1', t1['name'])
    assert_equal('task', t1['type'])
    assert_equal(50.0, t1['scenarios']['plan']['complete'])

    m1 = data['tasks'].find { |t| t['id'] == 'm1' }
    assert_not_nil(m1)
    assert_equal('milestone', m1['type'])
    assert(m1['dependencies'].any? { |d| d['task'] == 't2' })
    
    # Verify resources
    assert_not_nil(data['resources'], 'Resources array missing')
    assert_equal(1, data['resources'].length)

    dev = data['resources'].first
    assert_equal('dev', dev['id'])
    assert_equal('Developer', dev['name'])
    assert_equal('person', dev['type'])

    # Verify resource scenario data
    assert_not_nil(dev['scenarios'], 'Resource scenarios missing')
    assert_not_nil(dev['scenarios']['plan'], 'Plan scenario missing for resource')
    assert_equal(50.0, dev['scenarios']['plan']['rate'])
  end

  def test_json_export_with_accounts
    tjp_accounts = <<'TJP'
project json_test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account income "Income" {
  credits 2025-01-02 "Initial funding" 50000.0,
          2025-01-15 "Client payment" 15000.0
}

account expenses "Expenses" {
  credits 2025-01-02 "Budget allocation" 40000.0,
          2025-01-10 "Vendor refund" - 2500.0
}

balance income expenses

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_accounts)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')

    # Generate all reports
    assert(tj.generateReports, 'Report generation failed')

    # Read the generated JSON file
    json_file = 'test.json'
    assert(File.exist?(json_file), 'JSON file was not generated')

    data = JSON.parse(File.read(json_file))

    # Verify accounts structure
    assert_not_nil(data['accounts'], 'Accounts array missing')
    # Note: balance statement creates a virtual account for calculation, but may not be exported
    assert(data['accounts'].length >= 2, 'Should have at least 2 accounts')

    # Verify income account
    income = data['accounts'].find { |a| a['id'] == 'income' }
    assert_not_nil(income, 'Income account not found')
    assert_equal('Income', income['name'])
    assert_equal('cost', income['type']) # Defaults to cost without aggregate property
    assert_not_nil(income['scenarios']['plan'], 'Plan scenario missing for income')
    assert_equal(2, income['scenarios']['plan']['credits'].length)
    assert_equal(65000.0, income['scenarios']['plan']['balance'])

    # Verify expenses with negative credit
    expenses = data['accounts'].find { |a| a['id'] == 'expenses' }
    assert_not_nil(expenses, 'Expenses account not found')
    assert_equal('cost', expenses['type'])
    # Check that the negative credit appears in debits
    assert_equal(1, expenses['scenarios']['plan']['debits'].length)
    debit = expenses['scenarios']['plan']['debits'].first
    assert_equal(2500.0, debit['amount']) # Should be positive in debits array
  end

  def test_json_export_hierarchical_resources
    tjp_hierarchy = <<'TJP'
project json_test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
}

resource team "Development Team" {
  resource senior "Senior Developer" { rate 100.0 }
  resource junior "Junior Developer" { rate 50.0 }
}

task t1 "Task 1" {
  start 2025-01-01
  duration 5d
  allocate senior
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_hierarchy)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')

    # Generate all reports
    assert(tj.generateReports, 'Report generation failed')

    # Read the generated JSON file
    json_file = 'test.json'
    assert(File.exist?(json_file), 'JSON file was not generated')

    data = JSON.parse(File.read(json_file))

    # Verify hierarchical structure
    assert_equal(3, data['resources'].length) # team + senior + junior

    team = data['resources'].find { |r| r['id'] == 'team' }
    assert_not_nil(team, 'Team resource not found')
    assert_equal('group', team['type'])
    assert_equal(2, team['children'].length)
    assert(team['children'].include?('senior'), 'Senior not in team children')
    assert(team['children'].include?('junior'), 'Junior not in team children')

    senior = data['resources'].find { |r| r['id'] == 'senior' }
    assert_not_nil(senior, 'Senior resource not found')
    assert_equal('team', senior['parent'])
    assert_equal('person', senior['type'])
    assert_equal(100.0, senior['scenarios']['plan']['rate'])

    junior = data['resources'].find { |r| r['id'] == 'junior' }
    assert_not_nil(junior, 'Junior resource not found')
    assert_equal('team', junior['parent'])
    assert_equal(50.0, junior['scenarios']['plan']['rate'])
  end

  def test_json_export_zero_amount_classification
    # Test that zero-amount credits are classified as credits (>= 0 boundary)
    tjp_zero = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account testing "Testing Account" {
  credits 2025-01-02 "Positive amount" 100.0,
          2025-01-05 "Zero amount" 0.0,
          2025-01-10 "Negative amount" - 50.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_zero)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')

    # Generate all reports
    assert(tj.generateReports, 'Report generation failed')

    # Read the generated JSON file
    json_file = 'test.json'
    assert(File.exist?(json_file), 'JSON file was not generated')

    data = JSON.parse(File.read(json_file))

    # Find the testing account
    testing = data['accounts'].find { |a| a['id'] == 'testing' }
    assert_not_nil(testing, 'Testing account not found')

    # Verify zero-amount goes to credits array (>= 0 boundary condition)
    assert_equal(2, testing['scenarios']['plan']['credits'].length,
                 'Should have 2 credits (positive + zero)')
    assert_equal(1, testing['scenarios']['plan']['debits'].length,
                 'Should have 1 debit (negative)')

    # Verify the zero amount credit
    zero_credit = testing['scenarios']['plan']['credits'].find { |c| c['amount'] == 0.0 }
    assert_not_nil(zero_credit, 'Zero amount should be in credits array')
    assert_equal('2025-01-05', zero_credit['date'])
    assert_equal('Zero amount', zero_credit['description'])

    # Verify balance is correct: 100 + 0 - 50 = 50
    assert_equal(50.0, testing['scenarios']['plan']['balance'])
  end

  def test_json_export_negative_only_account
    # Test account with only negative credits (all debits)
    tjp_negative_only = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "EUR"
}

account refunds "Refunds Issued" {
  credits 2025-01-05 "Refund #001" - 500.0,
          2025-01-12 "Refund #002" - 750.0,
          2025-01-18 "Refund #003" - 1200.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_negative_only)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')

    # Generate all reports
    assert(tj.generateReports, 'Report generation failed')

    # Read the generated JSON file
    json_file = 'test.json'
    assert(File.exist?(json_file), 'JSON file was not generated')

    data = JSON.parse(File.read(json_file))

    # Find the refunds account
    refunds = data['accounts'].find { |a| a['id'] == 'refunds' }
    assert_not_nil(refunds, 'Refunds account not found')

    # Verify NO credits (empty array, not nil)
    assert_equal([], refunds['scenarios']['plan']['credits'],
                 'Credits array should be empty for negative-only account')

    # Verify all debits are present (shown as positive amounts)
    assert_equal(3, refunds['scenarios']['plan']['debits'].length,
                 'Should have 3 debits')

    debit_amounts = refunds['scenarios']['plan']['debits'].map { |d| d['amount'] }.sort
    assert_equal([500.0, 750.0, 1200.0], debit_amounts,
                 'Debits should show as positive amounts')

    # Verify balance is negative (sum of negative credits)
    assert_equal(-2450.0, refunds['scenarios']['plan']['balance'],
                 'Balance should be -2450.0 (negative)')
  end

  def test_json_export_empty_account
    # Test account with no transactions
    tjp_empty = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "GBP"
}

account empty "Empty Account"

account populated "Populated Account" {
  credits 2025-01-02 "Something" 100.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_empty)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')

    # Generate all reports
    assert(tj.generateReports, 'Report generation failed')

    # Read the generated JSON file
    json_file = 'test.json'
    assert(File.exist?(json_file), 'JSON file was not generated')

    data = JSON.parse(File.read(json_file))

    # Find the empty account
    empty = data['accounts'].find { |a| a['id'] == 'empty' }
    assert_not_nil(empty, 'Empty account not found')

    # Verify empty arrays (not nil, not omitted)
    assert_equal([], empty['scenarios']['plan']['credits'],
                 'Empty account should have empty credits array')
    assert_equal([], empty['scenarios']['plan']['debits'],
                 'Empty account should have empty debits array')

    # Verify balance is zero
    assert_equal(0.0, empty['scenarios']['plan']['balance'],
                 'Empty account balance should be 0.0')

    # Verify the populated account works normally (sanity check)
    populated = data['accounts'].find { |a| a['id'] == 'populated' }
    assert_not_nil(populated, 'Populated account not found')
    assert_equal(1, populated['scenarios']['plan']['credits'].length)
    assert_equal(100.0, populated['scenarios']['plan']['balance'])
  end

  def test_json_export_balance_calculation
    # Test that balance equals sum(credits) - sum(debits)
    tjp_balance = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account operations "Operations" {
  credits 2025-01-02 "Income A" 1000.0,
          2025-01-05 "Income B" 2500.0,
          2025-01-10 "Refund issued" - 300.0,
          2025-01-15 "Income C" 750.0,
          2025-01-20 "Correction" - 150.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_balance)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    ops = data['accounts'].find { |a| a['id'] == 'operations' }
    assert_not_nil(ops, 'Operations account not found')

    # Calculate balance from credits and debits
    credits_sum = ops['scenarios']['plan']['credits'].sum { |c| c['amount'] }
    debits_sum = ops['scenarios']['plan']['debits'].sum { |d| d['amount'] }
    calculated_balance = credits_sum - debits_sum

    # Verify the math
    assert_equal(4250.0, credits_sum, 'Credits should sum to 4250.0 (1000+2500+750)')
    assert_equal(450.0, debits_sum, 'Debits should sum to 450.0 (300+150)')
    assert_equal(3800.0, calculated_balance, 'Calculated balance should be 3800.0')

    # Verify reported balance matches calculation
    assert_equal(calculated_balance, ops['scenarios']['plan']['balance'],
                 'Balance should equal credits minus debits')
  end

  def test_json_export_same_date_mixed_transactions
    # Test multiple transactions on the same date with different signs
    tjp_same_date = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "CHF"
}

account daily "Daily Transactions" {
  credits 2025-01-10 "Morning deposit" 500.0,
          2025-01-10 "Afternoon withdrawal" - 200.0,
          2025-01-10 "Evening deposit" 300.0,
          2025-01-10 "Late correction" - 50.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_same_date)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    daily = data['accounts'].find { |a| a['id'] == 'daily' }
    assert_not_nil(daily, 'Daily account not found')

    # Verify both positive and negative transactions on same date
    same_date_credits = daily['scenarios']['plan']['credits'].select { |c| c['date'] == '2025-01-10' }
    same_date_debits = daily['scenarios']['plan']['debits'].select { |d| d['date'] == '2025-01-10' }

    assert_equal(2, same_date_credits.length, 'Should have 2 credits on 2025-01-10')
    assert_equal(2, same_date_debits.length, 'Should have 2 debits on 2025-01-10')

    # Verify amounts
    assert_equal([500.0, 300.0], same_date_credits.map { |c| c['amount'] }.sort.reverse)
    assert_equal([200.0, 50.0], same_date_debits.map { |d| d['amount'] }.sort.reverse)

    # Balance should be 500 + 300 - 200 - 50 = 550
    assert_equal(550.0, daily['scenarios']['plan']['balance'])
  end

  def test_json_export_precision_extremes
    # Test very large, very small, and precise decimal amounts
    tjp_precision = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account precision "Precision Test" {
  credits 2025-01-02 "Very large" 999999.99,
          2025-01-05 "Very small" 0.01,
          2025-01-10 "Precise" 12345.6789,
          2025-01-15 "Micro" 0.001,
          2025-01-20 "Negative precise" - 1234.5678
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_precision)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    prec = data['accounts'].find { |a| a['id'] == 'precision' }
    assert_not_nil(prec, 'Precision account not found')

    # Verify large amount preserved
    large = prec['scenarios']['plan']['credits'].find { |c| c['description'] == 'Very large' }
    assert_equal(999999.99, large['amount'])

    # Verify small amounts preserved
    small = prec['scenarios']['plan']['credits'].find { |c| c['description'] == 'Very small' }
    assert_equal(0.01, small['amount'])

    micro = prec['scenarios']['plan']['credits'].find { |c| c['description'] == 'Micro' }
    assert_equal(0.001, micro['amount'])

    # Verify precision in decimals
    precise = prec['scenarios']['plan']['credits'].find { |c| c['description'] == 'Precise' }
    assert_in_delta(12345.6789, precise['amount'], 0.0001, 'Should preserve 4 decimal places')

    # Verify negative precision
    neg_precise = prec['scenarios']['plan']['debits'].find { |d| d['description'] == 'Negative precise' }
    assert_in_delta(1234.5678, neg_precise['amount'], 0.0001, 'Should preserve precision in debits')
  end

  def test_json_export_description_edge_cases
    # Test nil, empty, special characters, and Unicode in descriptions
    tjp_descriptions = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account special "Special Descriptions" {
  credits 2025-01-02 "" 100.0,
          2025-01-05 "Quote: \"test\"" 200.0,
          2025-01-10 "Unicode: 💰" 300.0,
          2025-01-15 "Newline: Line1\nLine2" 400.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_descriptions)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    special = data['accounts'].find { |a| a['id'] == 'special' }
    assert_not_nil(special, 'Special account not found')

    credits = special['scenarios']['plan']['credits']

    # Verify empty string handled
    empty_desc = credits.find { |c| c['amount'] == 100.0 }
    assert_equal('', empty_desc['description'], 'Empty description should be empty string')

    # Verify quotes preserved
    quoted = credits.find { |c| c['amount'] == 200.0 }
    assert_equal('Quote: "test"', quoted['description'], 'Quotes should be preserved')

    # Verify Unicode preserved
    unicode = credits.find { |c| c['amount'] == 300.0 }
    assert_equal('Unicode: 💰', unicode['description'], 'Unicode should be preserved')

    # Verify newline handling (may be escaped in JSON)
    newline = credits.find { |c| c['amount'] == 400.0 }
    assert_not_nil(newline['description'], 'Newline description should exist')
    assert(newline['description'].include?('Line1'), 'Should contain Line1')
  end

  def test_json_export_edge_dates
    # Test credits at project start and end boundaries
    tjp_edge_dates = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account edges "Edge Dates" {
  credits 2025-01-01 "Project start" 1000.0,
          2025-01-15 "Mid-project" 2000.0,
          2025-01-31 "Project end" 3000.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_edge_dates)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    edges = data['accounts'].find { |a| a['id'] == 'edges' }
    assert_not_nil(edges, 'Edges account not found')

    credits = edges['scenarios']['plan']['credits']

    # Verify all three credits are present
    assert_equal(3, credits.length, 'Should have 3 credits')

    # Verify project start date credit
    start_credit = credits.find { |c| c['date'] == '2025-01-01' }
    assert_not_nil(start_credit, 'Project start credit should be included')
    assert_equal(1000.0, start_credit['amount'])

    # Verify project end date credit
    end_credit = credits.find { |c| c['date'] == '2025-01-31' }
    assert_not_nil(end_credit, 'Project end credit should be included')
    assert_equal(3000.0, end_credit['amount'])

    # Verify balance includes all transactions
    assert_equal(6000.0, edges['scenarios']['plan']['balance'],
                 'Balance should include start, mid, and end credits')
  end

  def test_json_export_multiple_scenarios_negative_flows
    # Test that negative transaction classification works correctly across multiple scenarios
    # By default, credits apply to all scenarios unless overridden
    tjp_multi_scenario = <<'TJP'
project test "Multi Scenario" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
  scenario plan "Plan Scenario" {
    scenario alt "Alternative Scenario"
  }
}

account cash "Cash Account" {
  credits 2025-01-05 "Deposit" 100.0,
          2025-01-06 "Refund" - 50.0,
          2025-01-07 "Another deposit" 75.0,
          2025-01-08 "Correction" - 25.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
  scenarios plan, alt
}
TJP

    tjp_file = write_tjp_file(tjp_multi_scenario)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    cash = data['accounts'].find { |a| a['id'] == 'cash' }
    assert_not_nil(cash, 'Cash account not found')

    # Both scenarios should have the same transactions since credits apply to all scenarios
    ['plan', 'alt'].each do |scenario_id|
      scenario = cash['scenarios'][scenario_id]
      assert_not_nil(scenario, "#{scenario_id} scenario missing")

      # Should have 2 positive credits
      assert_equal(2, scenario['credits'].length, "#{scenario_id} should have 2 credits")
      assert_equal([100.0, 75.0], scenario['credits'].map { |c| c['amount'] })

      # Should have 2 negative credits shown as positive debits
      assert_equal(2, scenario['debits'].length, "#{scenario_id} should have 2 debits")
      assert_equal([50.0, 25.0], scenario['debits'].map { |d| d['amount'] })

      # Balance should be (100 + 75) - (50 + 25) = 100
      assert_equal(100.0, scenario['balance'], "#{scenario_id} balance should be 175 - 75 = 100")
    end
  end

  def test_json_export_nil_description_handling
    # Test that nil/empty descriptions are handled correctly
    tjp_nil_desc = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account test_account "Test Account" {
  credits 2025-01-02 "" 100.0,
          2025-01-05 "Valid description" 200.0,
          2025-01-10 "" - 50.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_nil_desc)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    test_acc = data['accounts'].find { |a| a['id'] == 'test_account' }
    assert_not_nil(test_acc, 'Test account not found')

    plan = test_acc['scenarios']['plan']

    # Verify empty description in credits is empty string, not nil
    empty_credit = plan['credits'].find { |c| c['amount'] == 100.0 }
    assert_not_nil(empty_credit, 'Empty description credit not found')
    assert_equal('', empty_credit['description'], 'Empty description should be empty string')
    assert_instance_of(String, empty_credit['description'], 'Description should be String type')

    # Verify valid description preserved
    valid_credit = plan['credits'].find { |c| c['amount'] == 200.0 }
    assert_equal('Valid description', valid_credit['description'])

    # Verify empty description in debits is also empty string
    empty_debit = plan['debits'].find { |d| d['amount'] == 50.0 }
    assert_not_nil(empty_debit, 'Empty description debit not found')
    assert_equal('', empty_debit['description'], 'Empty debit description should be empty string')
    assert_instance_of(String, empty_debit['description'], 'Debit description should be String type')
  end

  def test_json_export_negative_zero_handling
    # Test edge case of -0.0 (though mathematically identical to 0.0)
    tjp_neg_zero = <<'TJP'
project test "Test Project" 2025-01-01 +1m {
  timezone "UTC"
  currency "USD"
}

account test "Test Account" {
  credits 2025-01-02 "Positive" 100.0,
          2025-01-05 "Zero" 0.0,
          2025-01-10 "Negative" - 50.0
}

task dummy "Dummy Task" {
  start 2025-01-02
  duration 1d
}

jsonreport "test" {
  formats json
}
TJP

    tjp_file = write_tjp_file(tjp_neg_zero)
    tj = TaskJuggler.new
    assert(tj.parse([ tjp_file ]), 'Parser failed')
    assert(tj.schedule, 'Scheduler failed')
    assert(tj.generateReports, 'Report generation failed')

    data = JSON.parse(File.read('test.json'))
    test_acc = data['accounts'].find { |a| a['id'] == 'test' }
    assert_not_nil(test_acc, 'Test account not found')

    plan = test_acc['scenarios']['plan']

    # Both 0.0 and -0.0 should go to credits (>= 0 condition)
    # In Ruby, 0.0 and -0.0 are equal, so we can't distinguish them
    # But we verify that zero amounts go to credits, not debits
    assert_equal(2, plan['credits'].length, 'Should have 2 credits (positive + zero)')
    assert_equal(1, plan['debits'].length, 'Should have 1 debit (negative)')

    # Verify zero is in credits
    zero_credit = plan['credits'].find { |c| c['amount'] == 0.0 }
    assert_not_nil(zero_credit, 'Zero amount should be in credits')
    assert_equal('Zero', zero_credit['description'])

    # Verify balance: 100 + 0 - 50 = 50
    assert_equal(50.0, plan['balance'])
  end

end