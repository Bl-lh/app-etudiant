import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { By, until } from 'selenium-webdriver';
import { createDriver } from './driverHelper.js';

describe('Selenium WebDriver • Module Inscription & Règlement (ISTQB TC-PAY)', () => {
  let driver;
  const BASE_URL = 'http://localhost:5173';

  const resetDbEnrollments = () => {
    try {
      execSync('docker exec -i campus-mysql-db mysql -u campus_user -pcampus_password campus_enrollment_db -e "DELETE FROM payments WHERE user_id = 3 AND id > 2; DELETE FROM enrollments WHERE user_id = 3 AND id > 2;" 2>/dev/null');
    } catch {
      // Ignorer si docker est occupé
    }
  };

  before(async () => {
    resetDbEnrollments();
    driver = await createDriver();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
    resetDbEnrollments();
  });

  beforeEach(async () => {
    resetDbEnrollments();
    await driver.get(BASE_URL);

    // Connexion automatique avec le compte Étudiant démo
    const demoButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Comptes Démo')]")),
      5000
    );
    await demoButton.click();

    const studentItem = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Bilal (Étudiant)')]")),
      5000
    );
    await studentItem.click();

    await driver.wait(
      until.elementLocated(By.xpath("//header//*[contains(text(), 'Bilal Mansouri')]")),
      5000
    );
  });

  it('TC-PAY-01: Sélection d\'un cours payant et navigation vers le tunnel de paiement', async () => {
    const catalogTab = await driver.findElement(By.xpath("//header//button[contains(., 'Catalogue')]"));
    await catalogTab.click();

    // Trouver un cours PAYANT disponible pour inscription (exclut les cours gratuits qui déclenchent une alerte directe)
    const paidEnrollBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class, 'glass-card') and .//*[contains(text(), 'DH') and not(contains(text(), 'Gratuit'))]]//button[contains(., \"S'inscrire\")]")),
      10000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", paidEnrollBtn);
    await paidEnrollBtn.click();

    // Vérifier l'arrivée sur la page de paiement sécurisé
    const checkoutTitle = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., 'Validation & Paiement Sécurisé')]")),
      5000
    );
    assert.ok(await checkoutTitle.isDisplayed());
  });

  it('TC-PAY-02: Application d\'un coupon de réduction (ETUDIANT20) et calcul de remise', async () => {
    const catalogTab = await driver.findElement(By.xpath("//header//button[contains(., 'Catalogue')]"));
    await catalogTab.click();

    const paidEnrollBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class, 'glass-card') and .//*[contains(text(), 'DH') and not(contains(text(), 'Gratuit'))]]//button[contains(., \"S'inscrire\")]")),
      10000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", paidEnrollBtn);
    await paidEnrollBtn.click();

    // Saisie du coupon
    const couponInput = await driver.wait(
      until.elementLocated(By.xpath("//input[contains(@placeholder, 'ETUDIANT20')]")),
      5000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", couponInput);
    await couponInput.clear();
    await couponInput.sendKeys('ETUDIANT20');

    const applyBtn = await driver.findElement(By.xpath("//button[contains(., 'Appliquer')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", applyBtn);
    await applyBtn.click();

    // Oracle : message de confirmation de la remise de 20%
    const successMsg = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(., 'ETUDIANT20 activé') and contains(., '-20%')]")),
      5000
    );
    assert.ok(await successMsg.isDisplayed());
  });

  it('TC-PAY-03 [Test Négatif ISTQB]: Rejet d\'une carte non-conforme à l\'Algorithme de Luhn', async () => {
    const catalogTab = await driver.findElement(By.xpath("//header//button[contains(., 'Catalogue')]"));
    await catalogTab.click();

    const paidEnrollBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class, 'glass-card') and .//*[contains(text(), 'DH') and not(contains(text(), 'Gratuit'))]]//button[contains(., \"S'inscrire\")]")),
      10000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", paidEnrollBtn);
    await paidEnrollBtn.click();

    // Clic sur le scénario de test ISTQB : Échec Algorithme Luhn
    const luhnTestBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Échec Algorithme Luhn')]")),
      5000
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", luhnTestBtn);
    await luhnTestBtn.click();

    // Soumission du paiement
    const payBtn = await driver.findElement(By.xpath("//button[contains(., 'Payer') and contains(., 'Valider')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", payBtn);
    await payBtn.click();

    // Oracle Selenium : Alerte d'erreur de rejet Luhn
    const errorAlert = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Luhn') or contains(text(), 'invalide') or contains(text(), 'Échec')]")),
      5000
    );
    assert.ok(await errorAlert.isDisplayed());
  });
});
