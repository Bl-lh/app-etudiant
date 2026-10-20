import { test, expect } from '@playwright/test';

test.describe('Module Catalogue des Cours & Recherche (ISTQB TC-CAT-01 à 04)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Naviguer vers le Catalogue depuis le menu header
    await page.locator('header').getByRole('button', { name: /Catalogue/i }).click();
    await expect(page.getByRole('heading', { name: /Catalogue des Formations/i })).toBeVisible();
    // Attendre le chargement asynchrone des cours depuis l'API MySQL
    await expect(page.locator('.glass-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-CAT-01: Chargement et affichage des cours disponibles', async ({ page }) => {
    const courseCards = page.locator('.glass-card');
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('TC-CAT-02: Recherche multicritère par mot-clé', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Rechercher par titre, mot-clé, instructeur...');
    await searchInput.fill('Tests Logiciels');

    // Vérifier que la formation apparaît
    await expect(page.getByText(/Processus Complet des Tests Logiciels/i)).toBeVisible();
  });

  test('TC-CAT-03: Filtrage des cours par niveau de difficulté', async ({ page }) => {
    // Sélectionner le filtre Débutant dans le select niveau
    const levelSelect = page.locator('select').first();
    await levelSelect.selectOption('DEBUTANT');

    // Vérifier que les cours filtrés contiennent le badge DEBUTANT
    await expect(page.locator('.badge:has-text("DEBUTANT")').first()).toBeVisible();
  });

  test('TC-CAT-04: Consultation de la fiche détaillée et du syllabus pédagogique', async ({ page }) => {
    // Cliquer sur le bouton Détails du premier cours
    await page.locator('.glass-card').first().getByRole('button', { name: 'Détails' }).click();

    // Vérifier l'affichage de la vue détaillée et du syllabus
    await expect(page.getByRole('heading', { name: /Programme pédagogique/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Retour au catalogue/i })).toBeVisible();

    // Retour au catalogue
    await page.getByRole('button', { name: /Retour au catalogue/i }).click();
    await expect(page.getByRole('heading', { name: /Catalogue des Formations/i })).toBeVisible();
  });
});
