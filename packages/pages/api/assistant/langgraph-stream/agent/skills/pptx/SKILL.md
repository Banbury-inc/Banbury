# PowerPoint Presentation Skill

This skill enables AI-powered creation and editing of PowerPoint presentations using the `pptx_ai` tool with pptxgenjs library.

## Overview

The PowerPoint skill uses a unified approach for both creating and editing presentations:

- **pptx_ai tool**: Uses pptxgenjs to generate professional `.pptx` files that are automatically uploaded to cloud storage

## Architecture

```
User Request → Document Agent → pptx_ai Tool
                                      │
                                      ▼
                                 pptxgenjs
                                 (backend)
                                      │
                                      ▼
                              Generate .pptx file
                                      │
                                      ▼
                              Upload to S3
                                      │
                                      ▼
                          User receives file link
```

## Using pptx_ai Tool

The `pptx_ai` tool creates PowerPoint presentations using pptxgenjs on the backend. All presentations are automatically uploaded to the user's cloud storage.

### Basic Example

```typescript
pptx_ai({
  action: "Create company overview presentation",
  presentationName: "Company Overview",
  operations: [
    // Slide 1: Title Slide
    {
      type: "createSlide",
      background: "#1a365d"
    },
    {
      type: "addText",
      slideIndex: 0,
      element: {
        x: 5,
        y: 35,
        width: 90,
        height: 15,
        content: "Company Overview",
        fontSize: 48,
        color: "FFFFFF",
        bold: true,
        align: "center"
      }
    },
    {
      type: "addText",
      slideIndex: 0,
      element: {
        x: 5,
        y: 55,
        width: 90,
        height: 10,
        content: "Building the Future of Technology",
        fontSize: 24,
        color: "E0E0E0",
        align: "center"
      }
    },
    
    // Slide 2: Content Slide
    {
      type: "createSlide",
      background: "#FFFFFF"
    },
    {
      type: "addText",
      slideIndex: 1,
      element: {
        x: 5,
        y: 10,
        width: 90,
        height: 12,
        content: "Our Services",
        fontSize: 36,
        color: "1a365d",
        bold: true
      }
    },
    {
      type: "addText",
      slideIndex: 1,
      element: {
        x: 10,
        y: 30,
        width: 80,
        height: 50,
        content: "• Strategic Consulting\n• Digital Transformation\n• Cloud Solutions",
        fontSize: 24,
        color: "333333"
      }
    }
  ]
})
```

## Position & Size System

All coordinates use **percentage values (0-100)**:
- `x`: Horizontal position from left edge (0 = left, 100 = right)
- `y`: Vertical position from top edge (0 = top, 100 = bottom)
- `width`: Element width as percentage of slide width
- `height`: Element height as percentage of slide height

**Example positions:**
- Center title: `x: 5, y: 40, width: 90, height: 20`
- Top-left content: `x: 10, y: 10, width: 40, height: 30`
- Bottom-right image: `x: 60, y: 60, width: 35, height: 35`

## Available Operations

### createSlide

Create a new blank slide.

```typescript
{
  type: "createSlide",
  slideIndex: 0,  // Optional: position to insert (0-indexed)
  background: "#1a365d"  // Optional: hex color
}
```

### addText

Add a text box to a slide.

```typescript
{
  type: "addText",
  slideIndex: 0,  // Optional: defaults to last created slide
  element: {
    x: 10,
    y: 20,
    width: 80,
    height: 15,
    content: "Your text here",
    fontSize: 24,  // Optional: points
    fontFace: "Arial",  // Optional: font family
    color: "333333",  // Optional: hex without #
    bold: true,  // Optional
    italic: false,  // Optional
    align: "center",  // Optional: left, center, right
    valign: "middle",  // Optional: top, middle, bottom
    textFill: {  // Optional: background fill
      kind: "solid",
      color: "F0F0F0"
    },
    border: {  // Optional: border
      color: "000000",
      width: 2
    }
  }
}
```

### addShape

Add a shape to a slide.

```typescript
{
  type: "addShape",
  slideIndex: 0,
  element: {
    x: 20,
    y: 30,
    width: 30,
    height: 20,
    shapeType: "rect",  // rect, ellipse, triangle, arrow, line
    fill: "FF5733",  // Optional: hex color or FillStyle object
    stroke: "000000",  // Optional: hex color
    strokeWidth: 2  // Optional: pixels
  }
}
```

**Available shape types:**
- `rect`: Rectangle
- `ellipse`: Circle/Oval
- `triangle`: Triangle
- `arrow`: Right arrow
- `line`: Line

### addImage

Add an image to a slide from a URL.

```typescript
{
  type: "addImage",
  slideIndex: 0,
  element: {
    x: 25,
    y: 25,
    width: 50,
    height: 50,
    imageUrl: "https://example.com/image.jpg"
  }
}
```

### setSlideBackground

Set the background color of a slide.

```typescript
{
  type: "setSlideBackground",
  slideIndex: 0,
  background: "#1a365d"
}
```

## Color Guidelines

Colors should be specified as **hex values WITHOUT the # symbol**:
- ✅ Correct: `"1a365d"`, `"FFFFFF"`, `"FF5733"`
- ❌ Incorrect: `"#1a365d"`, `"#FFFFFF"`, `"#FF5733"`

### Recommended Color Palettes

**Professional:**
- Classic Blue: `1C2833`, `2E4053`, `AAB7B8`, `F4F6F6`
- Corporate Gray: `2C3E50`, `34495E`, `BDC3C7`, `ECF0F1`
- Business Teal: `16A085`, `1ABC9C`, `D5F4E6`, `FDFEFE`

**Creative:**
- Teal & Coral: `5EA8A7`, `277884`, `FE4447`, `FFFFFF`
- Warm Blush: `A49393`, `EED6D3`, `E8B4B8`, `FAF7F2`
- Deep Purple: `B165FB`, `181B24`, `40695B`, `FFFFFF`

**Modern:**
- Forest Green: `191A19`, `4E9F3D`, `1E5128`, `FFFFFF`
- Black & Gold: `BF9A4A`, `000000`, `F4F6F6`
- Ocean Blue: `003366`, `0055A4`, `87CEEB`, `FFFFFF`

## Typography Guidelines

### Font Sizes

- **Title slides**: 44-60pt for main title, 24-32pt for subtitle
- **Content slides**: 32-40pt for headings, 18-24pt for body text
- **Footnotes**: 12-14pt

### Web-Safe Fonts

Use these fonts for cross-platform compatibility:
- Arial (default)
- Calibri
- Times New Roman
- Georgia
- Courier New
- Verdana
- Tahoma
- Trebuchet MS
- Impact

## Complete Example: Multi-Slide Presentation

```typescript
pptx_ai({
  action: "Create product launch presentation",
  presentationName: "Product Launch 2024",
  operations: [
    // Slide 1: Title
    {
      type: "createSlide",
      background: "#1a365d"
    },
    {
      type: "addText",
      slideIndex: 0,
      element: {
        x: 5,
        y: 30,
        width: 90,
        height: 15,
        content: "Product Launch 2024",
        fontSize: 54,
        color: "FFFFFF",
        bold: true,
        align: "center"
      }
    },
    {
      type: "addText",
      slideIndex: 0,
      element: {
        x: 5,
        y: 50,
        width: 90,
        height: 10,
        content: "Revolutionizing the Industry",
        fontSize: 28,
        color: "E0E0E0",
        align: "center"
      }
    },
    {
      type: "addText",
      slideIndex: 0,
      element: {
        x: 5,
        y: 75,
        width: 90,
        height: 5,
        content: "January 15, 2024",
        fontSize: 18,
        color: "E0E0E0",
        align: "center"
      }
    },
    
    // Slide 2: Agenda
    {
      type: "createSlide",
      background: "#FFFFFF"
    },
    {
      type: "addText",
      slideIndex: 1,
      element: {
        x: 5,
        y: 10,
        width: 90,
        height: 12,
        content: "Agenda",
        fontSize: 40,
        color: "1a365d",
        bold: true
      }
    },
    {
      type: "addText",
      slideIndex: 1,
      element: {
        x: 10,
        y: 30,
        width: 80,
        height: 50,
        content: "• Market Overview\n• Product Features\n• Competitive Analysis\n• Go-to-Market Strategy\n• Financial Projections",
        fontSize: 24,
        color: "333333"
      }
    },
    
    // Slide 3: Key Features with Boxes
    {
      type: "createSlide",
      background: "#FFFFFF"
    },
    {
      type: "addText",
      slideIndex: 2,
      element: {
        x: 5,
        y: 10,
        width: 90,
        height: 12,
        content: "Key Features",
        fontSize: 40,
        color: "1a365d",
        bold: true
      }
    },
    
    // Feature 1: Fast
    {
      type: "addShape",
      slideIndex: 2,
      element: {
        x: 5,
        y: 35,
        width: 28,
        height: 45,
        shapeType: "rect",
        fill: "2d5a8c",
        stroke: "1a365d",
        strokeWidth: 2
      }
    },
    {
      type: "addText",
      slideIndex: 2,
      element: {
        x: 5,
        y: 42,
        width: 28,
        height: 10,
        content: "Fast",
        fontSize: 24,
        color: "FFFFFF",
        bold: true,
        align: "center"
      }
    },
    {
      type: "addText",
      slideIndex: 2,
      element: {
        x: 7,
        y: 55,
        width: 24,
        height: 15,
        content: "Lightning-quick performance",
        fontSize: 16,
        color: "E0E0E0",
        align: "center"
      }
    },
    
    // Feature 2: Secure
    {
      type: "addShape",
      slideIndex: 2,
      element: {
        x: 36,
        y: 35,
        width: 28,
        height: 45,
        shapeType: "rect",
        fill: "2d5a8c",
        stroke: "1a365d",
        strokeWidth: 2
      }
    },
    {
      type: "addText",
      slideIndex: 2,
      element: {
        x: 36,
        y: 42,
        width: 28,
        height: 10,
        content: "Secure",
        fontSize: 24,
        color: "FFFFFF",
        bold: true,
        align: "center"
      }
    },
    {
      type: "addText",
      slideIndex: 2,
      element: {
        x: 38,
        y: 55,
        width: 24,
        height: 15,
        content: "Enterprise-grade security",
        fontSize: 16,
        color: "E0E0E0",
        align: "center"
      }
    },
    
    // Feature 3: Scalable
    {
      type: "addShape",
      slideIndex: 2,
      element: {
        x: 67,
        y: 35,
        width: 28,
        height: 45,
        shapeType: "rect",
        fill: "2d5a8c",
        stroke: "1a365d",
        strokeWidth: 2
      }
    },
    {
      type: "addText",
      slideIndex: 2,
      element: {
        x: 67,
        y: 42,
        width: 28,
        height: 10,
        content: "Scalable",
        fontSize: 24,
        color: "FFFFFF",
        bold: true,
        align: "center"
      }
    },
    {
      type: "addText",
      slideIndex: 2,
      element: {
        x: 69,
        y: 55,
        width: 24,
        height: 15,
        content: "Grows with your business",
        fontSize: 16,
        color: "E0E0E0",
        align: "center"
      }
    },
    
    // Slide 4: Closing
    {
      type: "createSlide",
      background: "#1a365d"
    },
    {
      type: "addText",
      slideIndex: 3,
      element: {
        x: 5,
        y: 35,
        width: 90,
        height: 15,
        content: "Thank You",
        fontSize: 54,
        color: "FFFFFF",
        bold: true,
        align: "center"
      }
    },
    {
      type: "addText",
      slideIndex: 3,
      element: {
        x: 5,
        y: 55,
        width: 90,
        height: 10,
        content: "Questions?",
        fontSize: 32,
        color: "E0E0E0",
        align: "center"
      }
    }
  ]
})
```

## Design Best Practices

### 1. Plan Before Creating

Before calling `pptx_ai`, consider:
- **Subject matter**: What's the presentation about?
- **Audience**: Who will view it?
- **Tone**: Professional, creative, minimal?
- **Color palette**: Choose 3-5 complementary colors
- **Typography**: Select appropriate font sizes for hierarchy

### 2. Layout Guidelines

- **Margins**: Leave at least 5-10% margins on all sides
- **Alignment**: Use consistent alignment throughout
- **Whitespace**: Don't overcrowd slides - use plenty of whitespace
- **Consistency**: Keep fonts, colors, and layouts consistent
- **Contrast**: Ensure text is readable against backgrounds

### 3. Content Structure

**Title Slide:**
- Main title (centered, large: 48-60pt)
- Subtitle or date (centered, smaller: 24-32pt)
- Optional company logo or image

**Content Slides:**
- Clear heading at top (32-40pt)
- 3-5 bullet points maximum (18-24pt)
- Supporting visuals (charts, images)
- White space for breathing room

**Closing Slide:**
- Thank you message (48-60pt)
- Contact information or call to action (18-24pt)

### 4. Common Patterns

**Two-Column Layout:**
```typescript
// Left column text
{
  type: "addText",
  element: {
    x: 5,
    y: 25,
    width: 42,
    height: 60,
    content: "Left column content...",
    fontSize: 20
  }
}
// Right column text
{
  type: "addText",
  element: {
    x: 53,
    y: 25,
    width: 42,
    height: 60,
    content: "Right column content...",
    fontSize: 20
  }
}
```

**Image with Caption:**
```typescript
{
  type: "addImage",
  element: {
    x: 25,
    y: 20,
    width: 50,
    height: 50,
    imageUrl: "https://example.com/image.jpg"
  }
},
{
  type: "addText",
  element: {
    x: 25,
    y: 72,
    width: 50,
    height: 8,
    content: "Image caption here",
    fontSize: 14,
    align: "center",
    italic: true
  }
}
```

## Important Notes

1. **Call Once**: Call `pptx_ai` only ONCE per user request with all operations
2. **Empty Slides**: New slides start completely empty - you must add all content
3. **Slide Indexing**: Slides are 0-indexed (first slide is 0, second is 1, etc.)
4. **Percentage Coordinates**: All positions and sizes are percentages (0-100)
5. **Color Format**: Use hex colors WITHOUT # symbol
6. **Auto-Upload**: Generated presentations are automatically uploaded to cloud storage

## Limitations

The following operations are not currently supported in the pptxgenjs backend:
- `deleteSlide`: Cannot delete slides from existing presentations
- `reorderSlides`: Cannot reorder slides
- `updateElement`: Cannot update existing elements
- `deleteElement`: Cannot delete existing elements
- `applyTheme`: Cannot apply themes
- `applyTemplate`: Cannot apply templates
- `highlightText`: Cannot highlight text

For now, `pptx_ai` focuses on creating new presentations from scratch. Editing existing presentations will be supported in a future update.

## Dependencies

- **pptxgenjs** (^3.12.0): Core PowerPoint generation library
