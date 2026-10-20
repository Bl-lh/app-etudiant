import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

/**
 * Fabrique standardisée pour initialiser une instance de Chrome WebDriver
 * configurée pour l'environnement de test headless.
 */
export async function createDriver() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1280,800');

  // Utiliser le binaire Chromium téléchargé dans l'environnement
  options.setChromeBinaryPath('/home/bilal/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  // Configuration des timeouts par défaut (alignés sur les normes ISTQB)
  await driver.manage().setTimeouts({
    implicit: 0, // Bonnes pratiques : éviter de mixer implicit et explicit wait
    pageLoad: 30000,
    script: 30000
  });

  return driver;
}
