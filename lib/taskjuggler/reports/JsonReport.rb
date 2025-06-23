#!/usr/bin/env ruby -w
# frozen_string_literal: true
# encoding: UTF-8
#
# = JsonReport.rb -- The TaskJuggler III Project Management Software
#
# Copyright (c) 2025 by Chris Schlaeger <cs@taskjuggler.org>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of version 2 of the GNU General Public License as
# published by the Free Software Foundation.
#

require 'json'
require 'taskjuggler/reports/ReportBase'

class TaskJuggler

  # This class generates comprehensive JSON reports for web UI consumption.
  # It exports all project data including tasks, resources, dependencies,
  # and financial information in a structured JSON format.
  class JsonReport < ReportBase

    # Create a new JsonReport object.
    def initialize(report)
      super
      @scenarioList = []
    end

    # Generate the JSON report
    def generateIntermediateFormat
      super

      # Get list of scenarios to include
      scenarioList = @report.get('scenarios')
      @scenarioList = scenarioList.empty? ? [ 0 ] : scenarioList

      # No specific intermediate format needed for JSON
    end

    # Convert the report to JSON format
    def to_json
      data = {
        'version' => '1.0',
        'generated' => TjTime.new.to_s,
        'generator' => "TaskJuggler #{@report.project.version}",
        'project' => generateProjectData,
        'scenarios' => generateScenariosData,
        'tasks' => generateTasksData,
        'resources' => generateResourcesData,
        'accounts' => generateAccountsData,
        'config' => generateConfigData
      }

      # Add timesheet data if available
      if @report.project['trackingScenarioIdx']
        data['timesheet'] = generateTimesheetData
      end

      JSON.pretty_generate(data)
    end

    private

    def generateProjectData
      project = @report.project
      {
        'id' => project['projectid'],
        'name' => project['name'],
        'version' => project['version'],
        'description' => project.get('description'),
        'start' => project['start'].to_s('%Y-%m-%d'),
        'end' => project['end'].to_s('%Y-%m-%d'),
        'now' => project['now'].to_s('%Y-%m-%d'),
        'timezone' => project['timezone'].name,
        'currency' => project['currency'],
        'currencyFormat' => project.get('currencyFormat'),
        'workingHours' => generateWorkingHours(project),
        'holidays' => generateHolidays(project)
      }
    end

    def generateWorkingHours(project)
      wh = project['workinghours']
      default_hours = {}
      
      %w[monday tuesday wednesday thursday thursday friday saturday sunday].each do |day|
        slots = wh.getWorkingHours(TjTime::MON + %w[monday tuesday wednesday thursday friday saturday sunday].index(day))
        default_hours[day] = slots.map do |slot|
          {
            'start' => "#{slot[0] / 3600}:#{(slot[0] % 3600) / 60}",
            'end' => "#{slot[1] / 3600}:#{(slot[1] % 3600) / 60}"
          }
        end
      end
      
      { 'default' => default_hours }
    end

    def generateHolidays(project)
      holidays = []
      project.holidays.each do |holiday|
        holidays << {
          'date' => holiday.date.to_s('%Y-%m-%d'),
          'name' => holiday.name
        }
      end
      holidays
    end

    def generateScenariosData
      scenarios = []
      @report.project.scenarios.each_with_index do |scenario, idx|
        next unless @scenarioList.include?(idx)
        
        scenarios << {
          'id' => scenario.id,
          'name' => scenario.name,
          'enabled' => scenario.get('enabled'),
          'baseline' => scenario.get('baseline') ? 
            @report.project.scenario(scenario.get('baseline')).id : nil
        }
      end
      scenarios
    end

    def generateTasksData
      tasks = []
      taskList = PropertyList.new(@report.project.tasks)
      taskList.setSorting(@report.get('sortTasks'))
      taskList = filterTaskList(taskList, nil, @report.get('hideTask'),
                               @report.get('rollupTask'), @report.get('openNodes'))
      taskList.sort!

      taskList.each do |task|
        taskData = {
          'id' => task.fullId,
          'name' => task.name,
          'type' => task.container? ? 'container' : 
                    (task.milestone? ? 'milestone' : 'task'),
          'wbs' => task.get('wbs'),
          'scenarios' => {},
          'children' => task.children.map { |child| child.fullId },
          'parent' => task.parent ? task.parent.fullId : nil,
          'dependencies' => [],
          'allocations' => []
        }

        # Add scenario-specific data
        @scenarioList.each do |scenarioIdx|
          scenario = @report.project.scenario(scenarioIdx)
          taskData['scenarios'][scenario.id] = generateTaskScenarioData(task, scenarioIdx)
          
          # Dependencies are scenario-specific
          deps = []
          task['depends', scenarioIdx].each do |dep|
            deps << {
              'task' => dep.task.fullId,
              'type' => convertDependencyType(dep),
              'gapDuration' => dep.gapDuration,
              'gapUnit' => 'days'
            }
          end
          taskData['dependencies'] = deps if scenarioIdx == @scenarioList.first
        end

        # Add resource allocations
        task['assignedresources', @scenarioList.first].each do |resource|
          taskData['allocations'] << {
            'resource' => resource.fullId,
            'scenario' => @report.project.scenario(@scenarioList.first).id,
            'effort' => task['effort', @scenarioList.first],
            'persistent' => task.get('allocate').persistent,
            'mandatory' => task.get('allocate').mandatory
          }
        end

        tasks << taskData
      end

      tasks
    end

    def generateTaskScenarioData(task, scenarioIdx)
      data = {
        'start' => task['start', scenarioIdx].to_s('%Y-%m-%d'),
        'end' => task['end', scenarioIdx].to_s('%Y-%m-%d'),
        'duration' => task['duration', scenarioIdx],
        'effort' => task['effort', scenarioIdx],
        'cost' => task['cost', scenarioIdx],
        'revenue' => task['revenue', scenarioIdx],
        'complete' => task['complete', scenarioIdx],
        'status' => task['status', scenarioIdx],
        'priority' => task['priority', scenarioIdx],
        'responsible' => task['responsible', scenarioIdx].first&.fullId,
        'scheduled' => task['scheduled', scenarioIdx],
        'milestone' => task.milestone?,
        'flags' => task['flags', scenarioIdx].map(&:id),
        'note' => task.get('note')
      }
      
      # Remove nil values
      data.compact
    end

    def generateResourcesData
      resources = []
      resourceList = PropertyList.new(@report.project.resources)
      resourceList.setSorting(@report.get('sortResources'))
      resourceList = filterResourceList(resourceList, nil, @report.get('hideResource'),
                                       @report.get('rollupResource'), @report.get('openNodes'))
      resourceList.sort!

      resourceList.each do |resource|
        resourceData = {
          'id' => resource.fullId,
          'name' => resource.name,
          'type' => resource.container? ? 'group' : 'person',
          'email' => resource.get('email'),
          'phone' => resource.get('phone'),
          'children' => resource.children.map { |child| child.fullId },
          'parent' => resource.parent ? resource.parent.fullId : nil,
          'efficiency' => resource.get('efficiency'),
          'rate' => resource.get('rate'),
          'currency' => @report.project['currency'],
          'skills' => resource['flags', 0].select { |f| f.id.start_with?('skill.') }.map { |f| f.id.sub('skill.', '') },
          'roles' => resource['flags', 0].select { |f| f.id.start_with?('role.') }.map { |f| f.id.sub('role.', '') },
          'scenarios' => {},
          'allocations' => []
        }

        # Add scenario-specific data
        @scenarioList.each do |scenarioIdx|
          scenario = @report.project.scenario(scenarioIdx)
          resourceData['scenarios'][scenario.id] = generateResourceScenarioData(resource, scenarioIdx)
        end

        # Add task allocations
        @report.project.tasks.each do |task|
          if task['assignedresources', @scenarioList.first].include?(resource)
            resourceData['allocations'] << {
              'task' => task.fullId,
              'scenario' => @report.project.scenario(@scenarioList.first).id,
              'start' => task['start', @scenarioList.first].to_s('%Y-%m-%d'),
              'end' => task['end', @scenarioList.first].to_s('%Y-%m-%d'),
              'effort' => task['effort', @scenarioList.first],
              'load' => 100 # TODO: Calculate actual load
            }
          end
        end

        resources << resourceData
      end

      resources
    end

    def generateResourceScenarioData(resource, scenarioIdx)
      data = {
        'limits' => {
          'dailyMax' => resource.get('limits').dailymax,
          'weeklyMax' => resource.get('limits').weeklymax,
          'monthlyMax' => resource.get('limits').monthlymax
        },
        'vacations' => [],
        'workingHours' => resource.get('workinghours') ? 'custom' : 'default'
      }

      # Add vacation data
      resource['vacations', scenarioIdx].each do |vacation|
        data['vacations'] << {
          'start' => vacation.startDate.to_s('%Y-%m-%d'),
          'end' => vacation.endDate.to_s('%Y-%m-%d'),
          'name' => vacation.name
        }
      end

      data
    end

    def generateAccountsData
      accounts = []
      
      @report.project.accounts.each do |account|
        next unless account.container?
        
        accountData = {
          'id' => account.fullId,
          'name' => account.name,
          'type' => account.get('aggregate') == :tasks ? 'cost' : 'revenue',
          'children' => account.children.map { |child| child.fullId },
          'parent' => account.parent ? account.parent.fullId : nil,
          'scenarios' => {}
        }

        @scenarioList.each do |scenarioIdx|
          scenario = @report.project.scenario(scenarioIdx)
          balance = account['balance', scenarioIdx]
          
          accountData['scenarios'][scenario.id] = {
            'balance' => balance,
            'credits' => account.credits(scenarioIdx).map do |credit|
              {
                'date' => credit.date.to_s('%Y-%m-%d'),
                'amount' => credit.amount,
                'description' => credit.description,
                'task' => credit.task&.fullId
              }
            end,
            'debits' => [] # TODO: Implement debits tracking
          }
        end

        accounts << accountData
      end

      accounts
    end

    def generateTimesheetData
      # TODO: Implement timesheet data generation
      { 'entries' => [] }
    end

    def generateConfigData
      {
        'defaultScenario' => @report.project.scenario(@scenarioList.first).id,
        'defaultScale' => 'week',
        'scales' => ['hour', 'day', 'week', 'month', 'quarter', 'year'],
        'columns' => generateColumnConfig,
        'filters' => {
          'hideCompleted' => false,
          'hideMilestones' => false,
          'hideContainers' => false,
          'showCriticalPath' => @report.get('markCriticalTasks')
        },
        'theme' => 'light',
        'locale' => 'en-US'
      }
    end

    def generateColumnConfig
      columns = []
      
      @report.get('columns').each do |col|
        columns << {
          'id' => col.id,
          'title' => col.title || col.id.capitalize,
          'width' => col.width || 100,
          'show' => true
        }
      end

      columns
    end

    def convertDependencyType(dep)
      if dep.onEnd
        'finish-to-start'
      else
        'start-to-start'
      end
    end

    def filterTaskList(list, resource, hideExpr, rollupExpr, openNodes)
      # Implementation borrowed from TableReport
      if hideExpr || rollupExpr
        list.delete_if do |task|
          (hideExpr && hideExpr.eval(task, resource)) ||
          (rollupExpr && rollupExpr.eval(task, resource))
        end
      end
      list
    end

    def filterResourceList(list, task, hideExpr, rollupExpr, openNodes)
      # Implementation borrowed from TableReport
      if hideExpr || rollupExpr
        list.delete_if do |resource|
          (hideExpr && hideExpr.eval(resource, task)) ||
          (rollupExpr && rollupExpr.eval(resource, task))
        end
      end
      list
    end

  end

end