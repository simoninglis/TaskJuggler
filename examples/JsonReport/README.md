# JSON Export Example

This example demonstrates the new JSON export functionality in TaskJuggler that generates comprehensive project data for web-based Gantt chart applications.

## Files

- `project.tjp` - Example project with tasks, resources, and cost accounts
- `project_data.json` - Generated JSON file (created when you run tj3)

## Running the Example

```bash
tj3 project.tjp
```

This will generate:
1. `TaskReport.html` - Traditional HTML Gantt chart
2. `project_data.json` - Comprehensive JSON export

## JSON Export Features

The JSON export includes:
- Complete task hierarchy with scheduling results
- Resource assignments and allocation data  
- Task dependencies with relationship types
- Cost and effort information
- Project metadata (timezone, currency, working hours)
- Support for multiple scenarios

## Using the JSON Data

The generated JSON file can be:
- Loaded directly into the TaskJuggler Web UI
- Processed by custom scripts for reporting
- Imported into other project management tools
- Used as a data source for web dashboards

## JSON Format

The JSON follows the TaskJuggler JSON Specification v1.0. See `/docs/JSON_GANTT_SPECIFICATION.md` for complete documentation of the format.

## Customizing the Export

You can control what data is included using standard TaskJuggler report attributes:

```
jsonreport custom_export "filtered_data.json" {
  formats json
  scenarios plan, actual
  hidetask plan.isleaf() & (plan.complete = 100)
  hideresource ~isleaf()
  sortTasks tree, start.up
}
```