import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

async function run() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');

  // Utiliser le binaire Chrome déjà installé par Playwright
  options.setChromeBinaryPath('/home/bilal/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');

  console.log('Initialisation du Driver Selenium...');
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('Navigation vers http://localhost:5173...');
    await driver.get('http://localhost:5173');

    const title = await driver.getTitle();
    console.log('Titre récupéré via Selenium :', title);

    // Attente explicite (WebDriverWait) - Spécificité de Selenium
    const headerTitle = await driver.wait(
      until.elementLocated(By.xpath("//h1")),
      10000
    );
    const text = await headerTitle.getText();
    console.log('Titre H1 récupéré :', text);
  } finally {
    await driver.quit();
    console.log('Session Selenium fermée proprement.');
  }
}

run().catch(err => {
  console.error('Erreur Selenium :', err);
  process.exit(1);
});
