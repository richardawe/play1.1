import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeScreenshot() {
  // Create screenshot directory if it doesn't exist
  const screenshotDir = path.join(__dirname, '..', 'screenshot');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Set to true if you want headless mode
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Navigate to the app (adjust port if needed)
    const port = process.env.TAURI_DEV_PORT || '1420';
    await page.goto(`http://localhost:${port}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait a bit for the page to fully render
    await page.waitForTimeout(2000);

    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotDir, `main-page-${timestamp}.png`);

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log(`✅ Screenshot saved to: ${screenshotPath}`);
  } catch (error) {
    console.error('❌ Error taking screenshot:', error);
    console.log('\n💡 Make sure the Tauri app is running in dev mode:');
    console.log('   npm run tauri dev');
  } finally {
    await browser.close();
  }
}

takeScreenshot();

