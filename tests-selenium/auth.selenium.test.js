import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { By, until } from 'selenium-webdriver';
import { createDriver } from './driverHelper.js';

describe('Selenium WebDriver • Module Authentification (ISTQB TC-AUTH)', () => {
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
  });

  it('TC-AUTH-01: Vérification du titre et de la présence du logo CampusEnroll', async () => {
    const title = await driver.getTitle();
    assert.match(title, /CampusEnroll/i);

    // Recherche de l'en-tête via XPath W3C
    const header = await driver.wait(
      until.elementLocated(By.xpath("//header")),
      5000
    );
    const headerText = await header.getText();
    assert.ok(headerText.includes('CampusEnroll'));
  });

  it('TC-AUTH-02: Connexion rapide avec le compte Étudiant démo', async () => {
    // 1. Cliquer sur le bouton "Comptes Démo"
    const demoButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Comptes Démo')]")),
      5000
    );
    await demoButton.click();

    // 2. Cliquer sur l'élément Étudiant Bilal
    const studentItem = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Bilal (Étudiant)')]")),
      5000
    );
    await studentItem.click();

    // 3. Vérifier que l'utilisateur est connecté (présence de son nom dans le header)
    const userBadge = await driver.wait(
      until.elementLocated(By.xpath("//header//*[contains(text(), 'Bilal Mansouri')]")),
      5000
    );
    assert.ok(await userBadge.isDisplayed());

    // 4. Déconnexion
    const logoutBtn = await driver.findElement(By.xpath("//header//button[@title='Se déconnecter']"));
    await logoutBtn.click();

    // Vérifier le retour au bouton "Connexion / Inscription"
    const loginBtn = await driver.wait(
      until.elementLocated(By.xpath("//header//button[contains(., 'Connexion')]")),
      5000
    );
    assert.ok(await loginBtn.isDisplayed());
  });

  it('TC-AUTH-03: Connexion manuelle via la Modale d\'Authentification', async () => {
    const openModalBtn = await driver.wait(
      until.elementLocated(By.xpath("//header//button[contains(., 'Connexion')]")),
      5000
    );
    await openModalBtn.click();

    // Attente explicite de l'ouverture de la modale
    const emailInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='etudiant@campus-online.ma']")),
      5000
    );
    await emailInput.clear();
    await emailInput.sendKeys('etudiant@campus-online.ma');

    const passInput = await driver.findElement(By.xpath("//input[@type='password']"));
    await passInput.clear();
    await passInput.sendKeys('Password123!');

    const submitBtn = await driver.findElement(By.xpath("//button[@type='submit'][contains(., 'Se Connecter')]"));
    await submitBtn.click();

    // Vérifier la session active
    const userName = await driver.wait(
      until.elementLocated(By.xpath("//header//*[contains(text(), 'Bilal Mansouri')]")),
      5000
    );
    assert.ok(await userName.isDisplayed());

    // Nettoyage : déconnexion
    const logoutBtn = await driver.findElement(By.xpath("//header//button[@title='Se déconnecter']"));
    await logoutBtn.click();
  });

  it('TC-AUTH-04 [Test Négatif ISTQB]: Rejet lors d\'une saisie de mot de passe invalide', async () => {
    const openModalBtn = await driver.wait(
      until.elementLocated(By.xpath("//header//button[contains(., 'Connexion')]")),
      5000
    );
    await openModalBtn.click();

    const emailInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='etudiant@campus-online.ma']")),
      5000
    );
    await emailInput.sendKeys('etudiant@campus-online.ma');

    const passInput = await driver.findElement(By.xpath("//input[@type='password']"));
    await passInput.sendKeys('FauxMotDePasse999!');

    const submitBtn = await driver.findElement(By.xpath("//button[@type='submit'][contains(., 'Se Connecter')]"));
    await submitBtn.click();

    // Oracle Selenium : Attente du message d'erreur d'authentification
    const errorAlert = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class, 'modal-content')]//*[contains(text(), 'invalide') or contains(text(), 'erreur') or contains(text(), 'Incorrect')]")),
      5000
    );
    assert.ok(await errorAlert.isDisplayed());

    // Fermer la modale
    const closeBtn = await driver.findElement(By.xpath("//div[contains(@class, 'modal-content')]//button[contains(@class, 'btn-outline')]"));
    await closeBtn.click();
  });
});
