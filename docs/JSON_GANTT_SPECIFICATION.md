# TaskJuggler JSON Export Specification for Web UI

## Overview

This document defines the JSON format for exporting TaskJuggler project data to be consumed by web-based Gantt chart applications. The format is designed to be comprehensive, including all necessary project data while remaining efficient and easy to parse.

## Schema Version

Current Version: 1.0

## Root Structure

```json
{
  "version": "1.0",
  "generated": "2025-01-23T10:30:00Z",
  "generator": "TaskJuggler 3.8.1-DEV",
  "project": { ... },
  "scenarios": [ ... ],
  "tasks": [ ... ],
  "resources": [ ... ],
  "accounts": [ ... ],
  "timesheet": { ... },
  "config": { ... }
}
```

## Project Object

Contains project-level metadata and configuration.

```json
{
  "project": {
    "id": "project_id",
    "name": "Project Name",
    "version": "1.0.0",
    "description": "Project description",
    "start": "2025-01-01",
    "end": "2025-12-31",
    "now": "2025-01-23",
    "timezone": "UTC",
    "currency": "USD",
    "currencyFormat": "$ %0.2f",
    "workingHours": {
      "default": {
        "monday": [{"start": "09:00", "end": "17:00"}],
        "tuesday": [{"start": "09:00", "end": "17:00"}],
        "wednesday": [{"start": "09:00", "end": "17:00"}],
        "thursday": [{"start": "09:00", "end": "17:00"}],
        "friday": [{"start": "09:00", "end": "17:00"}],
        "saturday": [],
        "sunday": []
      }
    },
    "holidays": [
      {
        "date": "2025-01-01",
        "name": "New Year's Day"
      }
    ]
  }
}
```

## Scenarios Array

Supports multiple project scenarios (plan, actual, baseline, etc.).

```json
{
  "scenarios": [
    {
      "id": "plan",
      "name": "Plan",
      "enabled": true,
      "baseline": null
    },
    {
      "id": "actual",
      "name": "Actual",
      "enabled": true,
      "baseline": "plan"
    }
  ]
}
```

## Tasks Array

Hierarchical task structure with comprehensive scheduling information.

```json
{
  "tasks": [
    {
      "id": "project",
      "name": "Project Name",
      "type": "container",
      "wbs": "1",
      "scenarios": {
        "plan": {
          "start": "2025-01-01",
          "end": "2025-12-31",
          "duration": 365,
          "effort": 0,
          "cost": 0,
          "revenue": 0,
          "complete": 0,
          "status": "green",
          "priority": 500,
          "responsible": "resource.manager",
          "flags": ["critical", "customer_visible"],
          "note": "Task note or description"
        }
      },
      "children": ["project.phase1", "project.phase2"],
      "parent": null,
      "dependencies": [],
      "allocations": []
    },
    {
      "id": "project.phase1.task1",
      "name": "Implementation Task",
      "type": "task",
      "wbs": "1.1.1",
      "scenarios": {
        "plan": {
          "start": "2025-01-15",
          "end": "2025-02-15",
          "duration": 32,
          "effort": 160,
          "cost": 8000,
          "revenue": 0,
          "complete": 75,
          "status": "yellow",
          "priority": 800,
          "responsible": "resource.developer1",
          "scheduled": true,
          "milestone": false,
          "flags": ["frontend"],
          "note": "Implement user interface"
        }
      },
      "children": [],
      "parent": "project.phase1",
      "dependencies": [
        {
          "task": "project.phase1.design",
          "type": "finish-to-start",
          "gapDuration": 0,
          "gapUnit": "days"
        }
      ],
      "allocations": [
        {
          "resource": "resource.developer1",
          "scenario": "plan",
          "effort": 160,
          "persistent": true,
          "mandatory": true
        }
      ]
    },
    {
      "id": "project.milestone1",
      "name": "Phase 1 Complete",
      "type": "milestone",
      "wbs": "1.2",
      "scenarios": {
        "plan": {
          "start": "2025-02-15",
          "end": "2025-02-15",
          "duration": 0,
          "complete": 0,
          "status": "green",
          "milestone": true
        }
      },
      "children": [],
      "parent": "project",
      "dependencies": [
        {
          "task": "project.phase1.task1",
          "type": "finish-to-start"
        }
      ]
    }
  ]
}
```

### Task Types

- `container`: Summary task that contains other tasks
- `task`: Leaf task that represents actual work
- `milestone`: Zero-duration marker event

### Dependency Types

- `finish-to-start`: Default dependency type (FS)
- `start-to-start`: Task starts when predecessor starts (SS)
- `finish-to-finish`: Task finishes when predecessor finishes (FF)
- `start-to-finish`: Task finishes when predecessor starts (SF)

### Task Status Values

- `green`: On track
- `yellow`: At risk
- `red`: Critical/delayed
- `blue`: Completed
- `grey`: Not started

## Resources Array

Resource hierarchy with allocation and availability information.

```json
{
  "resources": [
    {
      "id": "resource.team",
      "name": "Development Team",
      "type": "group",
      "email": null,
      "phone": null,
      "children": ["resource.developer1", "resource.developer2"],
      "parent": null,
      "efficiency": 1.0,
      "rate": 0,
      "scenarios": {
        "plan": {
          "limits": {
            "dailyMax": null,
            "weeklyMax": null,
            "monthlyMax": null
          },
          "vacations": []
        }
      }
    },
    {
      "id": "resource.developer1",
      "name": "John Doe",
      "type": "person",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "children": [],
      "parent": "resource.team",
      "efficiency": 1.0,
      "rate": 50.0,
      "currency": "USD",
      "skills": ["javascript", "react", "nodejs"],
      "roles": ["developer", "technical_lead"],
      "scenarios": {
        "plan": {
          "limits": {
            "dailyMax": 8,
            "weeklyMax": 40,
            "monthlyMax": 160
          },
          "vacations": [
            {
              "start": "2025-07-01",
              "end": "2025-07-14",
              "name": "Summer vacation"
            }
          ],
          "workingHours": "default"
        }
      },
      "allocations": [
        {
          "task": "project.phase1.task1",
          "scenario": "plan",
          "start": "2025-01-15",
          "end": "2025-02-15",
          "effort": 160,
          "load": 100
        }
      ]
    }
  ]
}
```

### Resource Types

- `group`: Resource group/team
- `person`: Individual resource
- `equipment`: Non-human resource

## Accounts Array (Optional)

Financial accounts for cost tracking.

```json
{
  "accounts": [
    {
      "id": "account.development",
      "name": "Development Costs",
      "type": "cost",
      "children": [],
      "parent": null,
      "scenarios": {
        "plan": {
          "balance": -45000,
          "credits": [],
          "debits": [
            {
              "date": "2025-01-31",
              "amount": 25000,
              "description": "January development costs",
              "task": "project.phase1"
            }
          ]
        }
      }
    }
  ]
}
```

## Timesheet Object (Optional)

Time tracking information if available.

```json
{
  "timesheet": {
    "entries": [
      {
        "resource": "resource.developer1",
        "task": "project.phase1.task1",
        "date": "2025-01-15",
        "hours": 8,
        "remaining": 152,
        "status": "approved",
        "comment": "Implemented login module"
      }
    ]
  }
}
```

## Configuration Object

View and display configuration for the web UI.

```json
{
  "config": {
    "defaultScenario": "plan",
    "defaultScale": "week",
    "scales": ["hour", "day", "week", "month", "quarter", "year"],
    "columns": [
      {
        "id": "name",
        "title": "Task Name",
        "width": 300,
        "show": true
      },
      {
        "id": "resources",
        "title": "Resources",
        "width": 200,
        "show": true
      },
      {
        "id": "duration",
        "title": "Duration",
        "width": 80,
        "show": true
      }
    ],
    "filters": {
      "hideCompleted": false,
      "hideMilestones": false,
      "hideContainers": false,
      "showCriticalPath": true
    },
    "theme": "light",
    "locale": "en-US"
  }
}
```

## Date Format

All dates should be in ISO 8601 format:
- Date only: `YYYY-MM-DD` (e.g., "2025-01-23")
- Date and time: `YYYY-MM-DDTHH:mm:ssZ` (e.g., "2025-01-23T14:30:00Z")
- Duration: Number of days (integer or float)
- Effort: Number of hours (integer or float)

## Number Format

- Currency: Float with 2 decimal places
- Percentage: Integer 0-100
- Priority: Integer 0-1000 (500 is default)
- Effort/Duration: Float in hours/days respectively

## Optional Fields

Fields marked as optional can be omitted if not applicable. The web UI should handle missing optional fields gracefully.

## Extensibility

The format is designed to be extensible. Additional fields can be added to any object without breaking compatibility. Unknown fields should be preserved but ignored by parsers.

## Example Usage in TaskJuggler

```
report "gantt" {
  formats json
  loadunit days
  hideresource 0
  hidetask 0
  scenarios plan, actual
}
```

## Version History

- 1.0 (2025-01-23): Initial specification