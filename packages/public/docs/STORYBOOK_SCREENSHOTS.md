# Storybook Screenshots

This project uses Storybook Test Runner with Playwright to automatically capture screenshots of all components.

## Setup

All dependencies are already installed. The setup includes:
- `@storybook/test-runner` - Official Storybook test runner
- `playwright` - Browser automation for screenshots
- `jest-image-snapshot` - For visual regression testing

## Taking Screenshots

### Method 1: With Storybook Already Running

If you already have Storybook running on `http://localhost:6006`:

```bash
npm run storybook:screenshots
```

This will visit each story and save a screenshot to the `screenshots/` directory.

### Method 2: Automated (CI-friendly)

This command starts Storybook, waits for it to be ready, captures screenshots, and then stops Storybook:

```bash
npm run storybook:screenshots:ci
```

## Screenshot Output

Screenshots are saved to the `screenshots/` directory with the following naming convention:

```
ComponentName-StoryName.png
```

For example:
- `Button-Primary.png`
- `Card-WithImage.png`
- `LeftPanel-Default.png`

## Configuration

The screenshot behavior can be customized in `.storybook/test-runner.ts`:

```typescript
// Change screenshot options
await page.screenshot({
  path: screenshotPath,
  fullPage: true,  // Capture full scrollable page
  // OR
  clip: { x: 0, y: 0, width: 1280, height: 720 }  // Fixed viewport
})

// Add different viewport sizes
await page.setViewportSize({ width: 375, height: 667 })  // Mobile
```

## Jest Configuration

The Jest configuration for the test runner is in `.storybook/test-runner-jest.config.js`. You can adjust:
- `testTimeout` - Maximum time for each test
- `maxWorkers` - Number of parallel browser instances

## Visual Regression Testing

The setup includes `jest-image-snapshot` which allows you to:

1. Capture baseline screenshots
2. Compare future screenshots against baselines
3. Detect visual changes automatically

To enable visual regression testing, uncomment the snapshot assertion in `.storybook/test-runner.ts`:

```typescript
// Take screenshot for comparison
const screenshot = await page.screenshot()
expect(screenshot).toMatchImageSnapshot({
  customSnapshotIdentifier: `${storyTitle}--${storyName}`,
  failureThreshold: 0.01,
  failureThresholdType: 'percent'
})
```

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Install Playwright dependencies
  run: npx playwright install-deps chromium

- name: Install dependencies
  run: npm ci

- name: Build Storybook
  run: npm run storybook:build

- name: Capture Screenshots
  run: npm run storybook:screenshots:ci
```

## Troubleshooting

### Storybook not starting
If Storybook fails to start on port 6006, make sure no other process is using that port:
```bash
lsof -ti:6006 | xargs kill -9
```

### Screenshots are blank
Increase the wait timeout in `.storybook/test-runner.ts`:
```typescript
await page.waitForTimeout(1000)  // Increase from 500ms to 1000ms
```

### Playwright browser errors
If you see browser launch errors, install system dependencies:
```bash
sudo npx playwright install-deps
```

## Tips

1. **Selective Screenshots**: Run tests for specific stories:
   ```bash
   npm run storybook:screenshots -- --testPathPattern="Button"
   ```

2. **Update Baseline**: To update all baseline snapshots:
   ```bash
   npm run storybook:screenshots -- -u
   ```

3. **Watch Mode**: Re-run on changes during development:
   ```bash
   npm run storybook:screenshots -- --watch
   ```

4. **Debug Mode**: Run with headed browser to see what's happening:
   ```bash
   PWDEBUG=1 npm run storybook:screenshots
   ```

