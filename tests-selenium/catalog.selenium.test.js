import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { By, until } from 'selenium-webdriver';
import { createDriver } from './driverHelper.js';

describe('Selenium WebDriver • Module Catalogue & Recherche (ISTQB TC-CAT)', () => {
  let driver;
  const BASE_URL = 'http://localhost:5173';

  before(async () => {
    driver = await createDriver();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async () => {
    await driver.get(BASE_URL);
    // Naviguer vers l'onglet Catalogue
    const catalogTab = await driver.wait(
      until.elementLocated(By.xpath("//header//button[contains(., 'Catalogue')]")),
      5000
    );
    await catalogTab.click();

    // Attente explicite du chargement des cours (WebDriverWait standard Selenium)
    await driver.wait(
      until.elementLocated(By.css('.glass-card')),
      10000
    );
  });

  it('TC-CAT-01: Chargement et comptage des cartes de cours disponibles', async () => {
    const courseCards = await driver.findElements(By.css('.glass-card'));
    assert.ok(courseCards.length >= 3, `Attendu au moins 3 cours, obtenu ${courseCards.length}`);
  });

  it('TC-CAT-02: Recherche multicritère par mot-clé', async () => {
    const searchInput = await driver.findElement(By.xpath("//input[contains(@placeholder, 'Rechercher par titre')]"));
    await searchInput.clear();
    await searchInput.sendKeys('Tests Logiciels');

    // Vérifier l'apparition du cours correspondant
    const courseTitle = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Processus Complet des Tests Logiciels')]")),
      5000
    );
    assert.ok(await courseTitle.isDisplayed());
  });

  it('TC-CAT-03: Filtrage par niveau de difficulté via sélecteur', async () => {
    const levelSelect = await driver.findElement(By.xpath("//select[option[@value='DEBUTANT']]"));
    await levelSelect.sendKeys('DEBUTANT');

    // Attendre la mise à jour du DOM et vérifier le badge DEBUTANT
    const badge = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(@class, 'badge') and contains(text(), 'DEBUTANT')]")),
      5000
    );
    assert.ok(await badge.isDisplayed());
  });
});
