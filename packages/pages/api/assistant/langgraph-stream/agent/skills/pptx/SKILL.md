# PowerPoint Presentation Skill

This skill enables AI-powered creation and editing of PowerPoint presentations using pptxgenjs.

## Overview

The PowerPoint skill provides two primary capabilities:

1. **Creation**: Generate new `.pptx` files from natural language descriptions using the `create_file` tool
2. **Editing**: Modify existing presentations (when open in the viewer) using the `pptx_ai` tool

## Architecture

```
User Request → Document Agent → Tool Selection
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              create_file                       pptx_ai
              (new .pptx)                    (edit open pptx)
                    │                               │
                    ▼                               ▼
              pptxgenjs                    PowerPointViewer
              (backend)                      (frontend)
                    │                               │
                    ▼                               ▼
              Upload to S3                 Apply operations
                    │                               │
                    ▼                               ▼
              Auto-open in               User sees changes
                viewer                     immediately
```

## Tool: create_file (for new presentations)

### When to Use
- User asks to "create a presentation" or "make a PowerPoint"
- User wants a new document from scratch
- No existing presentation is currently open

### Input Format

The `create_file` tool accepts content in two formats:

#### JSON Array Format (Recommended)

```json
{
  "fileName": "Company_Overview.pptx",
  "filePath": "presentations/Company_Overview.pptx",
  "content": "[{\"title\":\"Welcome\",\"content\":\"Introduction text\",\"bullets\":[\"Point 1\",\"Point 2\"]},{\"title\":\"Details\",\"content\":\"More information\"}]"
}
```

Slide object properties:
- `title` (string): Slide heading
- `content` (string): Body paragraph text
- `bullets` (string[]): Bullet point items
- `background` (string): Hex color like "#1a365d"

#### Markdown-style Format

```markdown
# First Slide Title
Introduction content here

---

# Second Slide
- Bullet point one
- Bullet point two

---

# Conclusion
Closing remarks
```

### Output
- Creates a `.pptx` file using pptxgenjs
- Uploads to user's cloud storage (S3)
- Dispatches `assistant-file-created` event
- File auto-opens in PowerPointViewer

## Tool: pptx_ai (for editing open presentations)

### When to Use
- User has a presentation open in the viewer
- User asks to "edit", "modify", "update", or "change" slides
- User wants to add/remove/reorder slides or elements

### Operations

#### Slide Operations

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `createSlide` | Add new slide | `slideIndex?`, `layout?`, `background?` |
| `deleteSlide` | Remove slide | `slideIndex` |
| `reorderSlides` | Move slide | `fromIndex`, `toIndex` |
| `setSlideBackground` | Change background | `slideIndex?`, `background` |

#### Element Operations

| Operation | Description | Key Parameters |
|-----------|-------------|----------------|
| `addText` | Add text box | `x`, `y`, `width`, `height`, `content`, `fontSize`, `color`, `align` |
| `addShape` | Add shape | `x`, `y`, `width`, `height`, `shapeType`, `fill`, `stroke` |
| `addImage` | Add image | `x`, `y`, `width`, `height`, `imageUrl`/`driveFileId`/`s3FileId` |
| `updateElement` | Modify element | `elementId`, `element` (properties to update) |
| `deleteElement` | Remove element | `elementId` |
| `highlightText` | Highlight text | `elementId`, `substring`, `color` |

#### Styling Operations

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `applyTheme` | Apply color theme | `theme` (theme name) |
| `applyTemplate` | Apply full template | `templateId`, `scope?` |

### Position & Size System

All coordinates use **percentage values (0-100)**:
- `x`: Horizontal position from left edge
- `y`: Vertical position from top edge
- `width`: Element width
- `height`: Element height

Example: A centered title might use `x: 10, y: 35, width: 80, height: 15`

### Available Themes

Basic: `default`, `dark`, `blue`, `green`, `purple`, `orange`, `red`, `minimal`

Professional: `professional-blue-gradient`, `modern-minimal`, `warm-sunset`, `dark-modern`, `ocean-breeze`, `forest-green`, `royal-purple`, `corporate-gray`

Creative: `sunrise-orange`, `tech-blue`, `elegant-gold`, `fresh-mint`, `fire-red`, `cloud-white`, `midnight-blue`, `pastel-dream`, `neon-cyber`, `spring-garden`

### Available Templates

- `professional`: Clean business style with structured layouts
- `creative`: Bold, vibrant design with dynamic elements
- `minimal`: Elegant minimalist with ample whitespace

### Shape Types

`rect`, `ellipse`, `triangle`, `arrow`, `line`

### Example: Complete Presentation Edit

```json
{
  "action": "Create company introduction slides",
  "presentationName": "Company Overview",
  "operations": [
    {
      "type": "createSlide",
      "slideIndex": 0,
      "layout": "title",
      "background": "#1e3a5f"
    },
    {
      "type": "addText",
      "slideIndex": 0,
      "element": {
        "x": 10,
        "y": 30,
        "width": 80,
        "height": 20,
        "content": "Company Overview",
        "fontSize": 48,
        "fontFace": "Arial",
        "color": "FFFFFF",
        "bold": true,
        "align": "center"
      }
    },
    {
      "type": "addText",
      "slideIndex": 0,
      "element": {
        "x": 10,
        "y": 55,
        "width": 80,
        "height": 10,
        "content": "Building the Future of Technology",
        "fontSize": 24,
        "color": "E0E0E0",
        "align": "center"
      }
    },
    {
      "type": "createSlide",
      "slideIndex": 1,
      "layout": "content"
    },
    {
      "type": "addText",
      "slideIndex": 1,
      "element": {
        "x": 5,
        "y": 5,
        "width": 90,
        "height": 12,
        "content": "Our Services",
        "fontSize": 36,
        "bold": true,
        "color": "1e3a5f"
      }
    },
    {
      "type": "addText",
      "slideIndex": 1,
      "element": {
        "x": 5,
        "y": 20,
        "width": 90,
        "height": 60,
        "content": "• Strategic Consulting\n• Digital Transformation\n• Cloud Solutions\n• Data Analytics",
        "fontSize": 24,
        "color": "333333"
      }
    }
  ]
}
```

## Text Formatting

### Font Options
- `fontSize`: Points (e.g., 18, 24, 36, 48)
- `fontFace`: Font family (e.g., "Arial", "Times New Roman", "Helvetica")
- `color`: Hex without # (e.g., "363636", "FFFFFF")
- `bold`: Boolean
- `italic`: Boolean

### Alignment
- `align`: "left" | "center" | "right"
- `valign`: "top" | "middle" | "bottom"

### Advanced Text Features
- `textFill`: Background fill for text box (solid or gradient)
- `border`: Border around text box `{ color, width }`
- `highlights`: Array of `{ start, end, color }` for text highlighting

## Fill Styles

### Solid Fill
```json
{ "kind": "solid", "color": "#1e3a5f" }
```

### Gradient Fill
```json
{
  "kind": "linearGradient",
  "startColor": "#1e3a5f",
  "endColor": "#4a90d9",
  "angleDeg": 45
}
```

## Best Practices

1. **Complete in one call**: Make all changes in a single `pptx_ai` call
2. **Use professional layouts**: Title at top, content below, consistent margins
3. **Color consistency**: Use theme colors or coordinated palette
4. **Readable fonts**: 24-48pt for titles, 18-24pt for body text
5. **Whitespace**: Leave margins (5-10%) on all sides
6. **Visual hierarchy**: Larger, bolder text for important content

## Error Handling

The skill handles common errors gracefully:
- Invalid slide indices are adjusted to valid range
- Missing optional parameters use sensible defaults
- Font/color format variations are normalized
- Element IDs that don't exist are logged but don't crash

## Dependencies

- **pptxgenjs** (^3.12.0): Core PowerPoint generation library
- **jszip**: For parsing existing PPTX files
- Browser APIs for frontend editing operations
