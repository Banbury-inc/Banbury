import type { TestRunnerConfig } from '@storybook/test-runner'
import { toMatchImageSnapshot } from 'jest-image-snapshot'
import path from 'path'
import fs from 'fs'

// ============================================
// SCREENSHOT CONFIGURATION
// ============================================

// 1. VIEWPORT CONFIGURATION
// Uncomment and modify the viewports you want to capture
const VIEWPORTS = [
  { width: 1920, height: 1080, name: 'desktop' },
  // { width: 1280, height: 720, name: 'laptop' },
  // { width: 768, height: 1024, name: 'tablet' },
  // { width: 375, height: 667, name: 'mobile' },
]

// 2. SCREENSHOT OPTIONS
const SCREENSHOT_OPTIONS = {
  // Wait time for components to fully render (in milliseconds)
  waitTimeout: 500,
  
  // Screenshot format: 'png' or 'jpeg'
  type: 'png' as const,
  
  // Quality (0-100, only for jpeg)
  quality: 100,
  
  // Capture full scrollable page or just viewport
  fullPage: true,
  
  // Output directory
  outputDir: 'screenshots',
  
  // Omit background (transparent PNG)
  omitBackground: true,
}

// 3. THEME CONFIGURATION
// Capture screenshots in different themes
const THEMES = [
  'dark',
  // 'light', // Uncomment to capture both themes
]

// 4. CUSTOM WAIT CONDITIONS
// Uncomment to wait for specific selectors or network idle
const WAIT_CONDITIONS = {
  // Wait for specific selector to be visible
  // selector: '[data-testid="component-loaded"]',
  
  // Wait for network to be idle
  // networkIdle: true,
  
  // Wait for fonts to load
  // fonts: true,
}

// ============================================
// TEST RUNNER CONFIGURATION
// ============================================

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot })
  },
  
  async postVisit(page, context) {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(process.cwd(), SCREENSHOT_OPTIONS.outputDir)
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }

    // Get story information from context
    const storyTitle = context.title.replace(/\//g, '-')
    const storyName = context.name.replace(/\s+/g, '-')
    
    // Wait for custom conditions
    if (WAIT_CONDITIONS.selector) {
      await page.waitForSelector(WAIT_CONDITIONS.selector, { timeout: 5000 }).catch(() => {})
    }
    
    if (WAIT_CONDITIONS.networkIdle) {
      await page.waitForLoadState('networkidle').catch(() => {})
    }
    
    if (WAIT_CONDITIONS.fonts) {
      await page.evaluate(() => document.fonts.ready)
    }
    
    // Wait for the story to fully render
    await page.waitForTimeout(SCREENSHOT_OPTIONS.waitTimeout)
    
    // Capture screenshots for each viewport
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      
      // Wait a bit after viewport change
      await page.waitForTimeout(100)
      
      // Capture screenshots for each theme
      for (const theme of THEMES) {
        // Switch theme if multiple themes are configured
        if (THEMES.length > 1) {
          await page.evaluate((themeValue) => {
            const root = document.documentElement
            if (themeValue === 'dark') {
              root.classList.add('dark')
            } else {
              root.classList.remove('dark')
            }
          }, theme)
          
          await page.waitForTimeout(100)
        }
        
        // Build filename based on configuration
        let filename = `${storyTitle}--${storyName}`
        
        // Add viewport suffix if capturing multiple viewports
        if (VIEWPORTS.length > 1) {
          filename += `-${viewport.name}`
        }
        
        // Add theme suffix if capturing multiple themes
        if (THEMES.length > 1) {
          filename += `-${theme}`
        }
        
        filename += `.${SCREENSHOT_OPTIONS.type}`
        
        const screenshotPath = path.join(screenshotsDir, filename)
        
        // Take screenshot with configured options
        await page.screenshot({
          path: screenshotPath,
          type: SCREENSHOT_OPTIONS.type,
          quality: SCREENSHOT_OPTIONS.type === 'jpeg' ? SCREENSHOT_OPTIONS.quality : undefined,
          fullPage: SCREENSHOT_OPTIONS.fullPage,
          omitBackground: SCREENSHOT_OPTIONS.omitBackground,
        })
        
        console.log(`📸 Screenshot saved: ${filename}`)
      }
    }
    
    // ============================================
    // OPTIONAL: VISUAL REGRESSION TESTING
    // ============================================
    // Uncomment to enable visual regression testing (compares against baseline)
    /*
    const screenshot = await page.screenshot()
    expect(screenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: `${storyTitle}--${storyName}`,
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
    })
    */
  }
}

export default config

