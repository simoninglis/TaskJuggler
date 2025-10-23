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
        'generator' => "TaskJuggler 3.8.1-DEV",
        'project' => generateProjectData,
        'scenarios' => generateScenariosData,
        'tasks' => generateTasksData,
        'resources' => generateResourcesData,
        'accounts' => generateAccountsData
      }

      JSON.pretty_generate(data)
    end

    private

    def generateProjectData
      project = @report.project
      {
        'id' => project['projectid'],
        'name' => project['name'],
        'version' => project['version'],
        'start' => project['start'].to_s('%Y-%m-%d'),
        'end' => project['end'].to_s('%Y-%m-%d'),
        'now' => project['now'].to_s('%Y-%m-%d'),
        'timezone' => project['timezone'],
        'currency' => project['currency']
      }
    end

    def generateScenariosData
      scenarios = []
      idx = 0
      @report.project.scenarios.each do |scenario|
        if @scenarioList.include?(idx)
        
          scenarios << {
            'id' => scenario.id,
            'name' => scenario.name,
            'enabled' => true,
            'baseline' => nil
          }
        end
        idx += 1
      end
      scenarios
    end

    def generateTasksData
      tasks = []
      taskList = PropertyList.new(@report.project.tasks)
      
      taskList.each do |task|
        taskData = {
          'id' => task.fullId,
          'name' => task.name,
          'type' => task.container? ? 'container' : 
                    (task['milestone', @scenarioList.first] ? 'milestone' : 'task'),
          'scenarios' => {},
          'children' => task.children.map { |child| child.fullId },
          'parent' => task.parent ? task.parent.fullId : nil,
          'dependencies' => []
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
              'type' => 'finish-to-start'
            }
          end
          taskData['dependencies'] = deps if scenarioIdx == @scenarioList.first
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
        'complete' => task['complete', scenarioIdx],
        'status' => task['status', scenarioIdx],
        'priority' => task['priority', scenarioIdx],
        'scheduled' => task['scheduled', scenarioIdx]
      }

      # Remove nil values
      data.compact
    end

    def generateResourcesData
      resources = []
      resourceList = PropertyList.new(@report.project.resources)

      resourceList.each do |resource|
        resourceData = {
          'id' => resource.fullId,
          'name' => resource.name,
          'type' => determineResourceType(resource)
        }

        # Add optional non-scenario attributes (use rescue for undefined attributes)
        begin
          email = resource.get('email')
          resourceData['email'] = email if email
        rescue
          # Attribute not defined, skip it
        end

        begin
          phone = resource.get('phone')
          resourceData['phone'] = phone if phone
        rescue
          # Attribute not defined, skip it
        end

        # Add hierarchical information
        resourceData['children'] = resource.children.map { |child| child.fullId }
        resourceData['parent'] = resource.parent ? resource.parent.fullId : nil

        # Add scenario-specific data
        resourceData['scenarios'] = {}
        @scenarioList.each do |scenarioIdx|
          scenario = @report.project.scenario(scenarioIdx)
          resourceData['scenarios'][scenario.id] = generateResourceScenarioData(resource, scenarioIdx)
        end

        resources << resourceData
      end

      resources
    end

    def generateResourceScenarioData(resource, scenarioIdx)
      data = {}

      # Add rate and efficiency if available
      data['rate'] = resource['rate', scenarioIdx] if resource['rate', scenarioIdx]
      data['efficiency'] = resource['efficiency', scenarioIdx] if resource['efficiency', scenarioIdx]

      # Add limits if available
      limits = resource['limits', scenarioIdx]
      if limits
        limitsData = {}
        limitsData['dailyMax'] = limits.dailymax if limits.dailymax
        limitsData['weeklyMax'] = limits.weeklymax if limits.weeklymax
        limitsData['monthlyMax'] = limits.monthlymax if limits.monthlymax
        data['limits'] = limitsData unless limitsData.empty?
      end

      # Add leaves/vacations if available
      leaves = resource['leaves', scenarioIdx]
      if leaves && !leaves.empty?
        data['vacations'] = leaves.map do |leave|
          {
            'start' => leave.interval.start.to_s('%Y-%m-%d'),
            'end' => leave.interval.end.to_s('%Y-%m-%d'),
            'name' => leave.name
          }
        end
      end

      data
    end

    def determineResourceType(resource)
      resource.container? ? 'group' : 'person'
    end

    def generateAccountsData
      accounts = []
      accountList = PropertyList.new(@report.project.accounts)

      accountList.each do |account|
        accountData = {
          'id' => account.fullId,
          'name' => account.name,
          'type' => determineAccountType(account)
        }

        # Add hierarchical information
        accountData['children'] = account.children.map { |child| child.fullId }
        accountData['parent'] = account.parent ? account.parent.fullId : nil

        # Add scenario-specific data
        accountData['scenarios'] = {}
        @scenarioList.each do |scenarioIdx|
          scenario = @report.project.scenario(scenarioIdx)
          accountData['scenarios'][scenario.id] = generateAccountScenarioData(account, scenarioIdx)
        end

        accounts << accountData
      end

      accounts
    end

    def generateAccountScenarioData(account, scenarioIdx)
      data = {}

      # Calculate balance from project start to end
      startIdx = 0
      endIdx = @report.project.dateToIdx(@report.project['end'])
      data['balance'] = account.turnover(scenarioIdx, startIdx, endIdx)

      # Extract credits and debits from the credits list
      data['credits'] = []
      data['debits'] = []

      credits = account['credits', scenarioIdx]
      if credits && !credits.empty?
        credits.each do |credit|
          transaction = {
            'date' => credit.date.to_s('%Y-%m-%d'),
            'amount' => credit.amount.abs,
            'description' => credit.description || ''
          }

          if credit.amount >= 0
            data['credits'] << transaction
          else
            data['debits'] << transaction
          end
        end
      end

      data
    end

    def determineAccountType(account)
      # Determine account type based on aggregate property
      aggregate = account.get('aggregate')
      case aggregate
      when :costs, :tasks
        'cost'
      when :revenues, :resources
        'revenue'
      else
        # For container accounts or unspecified, default to 'cost'
        'cost'
      end
    end

  end

end