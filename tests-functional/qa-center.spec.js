import { test, expect } from '@playwright/test';

test.describe('Module Centre d\'Assurance Qualité & Traçabilité (ISTQB TC-QA-01 & 02)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Accéder au Centre QA depuis la Navbar
    await page.locator('header').getByRole('button', { name: /Centre QA/i }).click();
  });

  test('TC-QA-01: Visualisation de la Pyramide des Tests et de la Matrice ISTQB', async ({ page }) => {
    // Vérifier les titres clés du centre d'assurance qualité
    await expect(page.getByText(/Centre d'Assurance Qualité & Tests Logiciels/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pyramide des Tests/i })).toBeVisible();
    await expect(page.getByText(/Matrice d'Exécution & Catalogue des 81 Tests/i)).toBeVisible();

    // Vérifier les badges ISTQB
    await expect(page.getByText(/81 \/ 81 Tests Réussis/i)).toBeVisible();
  });

  test('TC-QA-02: Exécution du Diagnostic en direct et vérification d\'audit MySQL', async ({ page }) => {
    // Bouton de diagnostic en direct
    const diagBtn = page.getByRole('button', { name: /Lancer le Diagnostic en Direct/i });
    await expect(diagBtn).toBeVisible();

    await diagBtn.click();

    // Vérifier que le message de succès apparaît
    await expect(page.getByText(/Base MySQL connectée, 81 tests opérationnels/i)).toBeVisible();
  });
});
