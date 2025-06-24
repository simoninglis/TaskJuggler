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
        'tasks' => generateTasksData
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

  end

end