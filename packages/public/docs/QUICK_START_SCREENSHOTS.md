# Quick Start: Taking Screenshots of Your Storybook Components

## 🚀 Quick Start (Recommended)

### Option 1: With Storybook Already Running

**Step 1:** Start Storybook in one terminal:
```bash
npm run storybook
```

**Step 2:** In another terminal, capture screenshots:
```bash
npm run storybook:screenshots
```

Screenshots will be saved to the `screenshots/` folder! 📸

---

### Option 2: Automated (One Command)

This command does everything automatically:
```bash
npm run storybook:screenshots:ci
```

It will:
1. Start Storybook
2. Wait for it to be ready
3. Capture all screenshots
4. Stop Storybook

---

## 📁 Where Are the Screenshots?

All screenshots are saved in the `screenshots/` directory with names like:
- `components-LeftPanel-LeftPanel--Default.png`
- `components-ui-button--Primary.png`
- `components-RightPanel-Thread--Default.png`

## 🎨 Current Stories

You have **12 story files** ready for screenshots:
1. LeftPanel.stories.tsx
2. Thread.stories.tsx
3. Composer.stories.tsx
4. DocumentViewer.stories.tsx
5. SpreadsheetViewer.stories.tsx
6. button.stories.tsx
7. ToolCallCard.stories.tsx
8. And 5 more AI Tool stories...

## 🔧 Configuration

### Change Screenshot Quality

Edit `.storybook/test-runner.ts`:
```typescript
await page.screenshot({
  path: screenshotPath,
  fullPage: true,
  type: 'png',  // or 'jpeg'
  quality: 90   // for jpeg only, 0-100
})
```

### Change Viewport Size

Add this before taking screenshots:
```typescript
await page.setViewportSize({ 
  width: 1920,  // default is 1280
  height: 1080 
})
```

### Add Multiple Viewports

You can capture screenshots at different sizes:
```typescript
const viewports = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1920, height: 1080, name: 'desktop' }
]

for (const viewport of viewports) {
  await page.setViewportSize(viewport)
  await page.screenshot({
    path: `${screenshotsDir}/${storyTitle}--${storyName}-${viewport.name}.png`
  })
}
```

## 💡 Pro Tips

### 1. Capture Only Specific Stories
```bash
npm run storybook:screenshots -- --testPathPattern="Button"
```

### 2. Run in Watch Mode (Development)
```bash
npm run storybook:screenshots -- --watch
```

### 3. Increase Wait Time for Slow Components
In `.storybook/test-runner.ts`, change:
```typescript
await page.waitForTimeout(1000)  // from 500ms
```

### 4. Debug with Visible Browser
```bash
PWDEBUG=1 npm run storybook:screenshots
```

## 🐛 Troubleshooting

### "Connection refused" Error
Make sure Storybook is running on port 6006:
```bash
npm run storybook
```
Then check `http://localhost:6006` in your browser.

### Blank Screenshots
Your components might need more time to render. Increase the timeout in `.storybook/test-runner.ts`.

### Port Already in Use
```bash
lsof -ti:6006 | xargs kill -9
npm run storybook
```

## 📚 Full Documentation

For advanced usage, visual regression testing, and CI/CD integration, see `STORYBOOK_SCREENSHOTS.md`.

---

**That's it!** You're ready to capture screenshots of your Storybook components! 🎉

