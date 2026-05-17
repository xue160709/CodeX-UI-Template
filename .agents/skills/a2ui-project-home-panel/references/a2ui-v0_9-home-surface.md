# A2UI v0.9 Home Surface Reference

Use A2UI v0.9 messages only.

Required surface:

- `surfaceId`: `project-home`
- `catalogId`: `https://a2ui.org/specification/v0_9/basic_catalog.json`

Required message sequence:

```json
[
  {
    "version": "v0.9",
    "createSurface": {
      "surfaceId": "project-home",
      "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json"
    }
  },
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "project-home",
      "components": []
    }
  },
  {
    "version": "v0.9",
    "updateDataModel": {
      "surfaceId": "project-home",
      "path": "/",
      "value": {}
    }
  }
]
```

Core rules:

- Components are a flat array. Do not inline child component objects.
- The root component id must be `root`.
- Containers reference children by ID strings.
- `Card` has exactly one `child`; wrap multiple elements in a `Column` or `Row`.
- `Text` uses `text`, never `content`.
- Dynamic text uses JSON Pointer bindings such as `{ "path": "/metrics/paperCount" }`.
- `Button.action` should use `{ "event": { "name": "...", "context": { ... } } }`.

Basic Catalog components available in this host:

- Layout: `Row`, `Column`, `List`, `Card`, `Tabs`, `Modal`, `Divider`
- Content: `Text`, `Image`, `Icon`, `Video`, `AudioPlayer`
- Input/action: `Button`, `TextField`, `CheckBox`, `ChoicePicker`, `Slider`, `DateTimeInput`

Known host actions:

- `open_file`: open a project-relative file path. Use `context.path`.
- `refresh_home`: refresh the home plugin output.
- `customize_home`: open the customization thread.

Example action:

```json
{
  "id": "open-latest-report",
  "component": "Button",
  "child": "open-latest-report-label",
  "variant": "borderless",
  "action": {
    "event": {
      "name": "open_file",
      "context": {
        "path": { "path": "/latestReport/path" }
      }
    }
  }
}
```
