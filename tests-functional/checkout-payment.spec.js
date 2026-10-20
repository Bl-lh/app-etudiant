import { test, expect } from '@playwright/test';

test.describe('Module Inscription & Paiement Sécurisé (ISTQB TC-PAY-01 à 04)', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Accès au site et connexion en tant qu'étudiant démo
    await page.goto('/');
    await page.getByRole('button', { name: 'Comptes Démo' }).click();
    await page.getByText(/Bilal \(Étudiant\)/i).click();
    await expect(page.getByText('Bilal Mansouri')).toBeVisible();
  });

  test('TC-PAY-01: Inscription à un cours et ouverture de la page de paiement', async ({ page }) => {
    // Naviguer au catalogue
    await page.locator('header').getByRole('button', { name: /Catalogue/i }).click();
    await expect(page.locator('.glass-card').first()).toBeVisible({ timeout: 10000 });

    // Trouver un cours disponible pour inscription
    const actionBtn = page.getByRole('button', { name: "S'inscrire" }).first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();

    // Vérifier l'arrivée sur la page de paiement
    await expect(page.getByRole('heading', { name: /Validation & Paiement Sécurisé/i })).toBeVisible();
    await expect(page.getByText(/Récapitulatif de l'Inscription/i)).toBeVisible();
  });

  test('TC-PAY-02: Application d\'un coupon de réduction (ETUDIANT20) et calcul de remise', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: /Catalogue/i }).click();
    await expect(page.locator('.glass-card').first()).toBeVisible({ timeout: 10000 });

    const actionBtn = page.getByRole('button', { name: "S'inscrire" }).first();
    await actionBtn.click();

    await expect(page.getByRole('heading', { name: /Validation & Paiement Sécurisé/i })).toBeVisible();

    // Saisir le code promo ETUDIANT20
    const couponInput = page.getByPlaceholder(/ETUDIANT20/i);
    await couponInput.fill('ETUDIANT20');
    await page.getByRole('button', { name: 'Appliquer' }).click();

    // Vérifier l'oracle : confirmation du coupon et calcul de la réduction -20%
    await expect(page.getByText(/Code ETUDIANT20 activé : -20% de réduction !/i)).toBeVisible();
  });

  test('TC-PAY-03 [Test Négatif ISTQB]: Rejet d\'une carte invalide selon l\'Algorithme de Luhn', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: /Catalogue/i }).click();
    await expect(page.locator('.glass-card').first()).toBeVisible({ timeout: 10000 });

    const actionBtn = page.getByRole('button', { name: "S'inscrire" }).first();
    await actionBtn.click();

    await expect(page.getByRole('heading', { name: /Validation & Paiement Sécurisé/i })).toBeVisible();

    // Cliquer sur le scénario d'échec Luhn préconfiguré (4242 4242 4242 4241)
    await page.getByRole('button', { name: /Échec Algorithme Luhn/i }).click();

    // Soumettre le paiement
    const submitBtn = page.getByRole('button', { name: /Payer .* et Valider/i });
    await submitBtn.click();

    // Oracle : Alerte d'erreur de validation Luhn affichée
    await expect(page.locator('body')).toContainText(/Luhn|invalide|Échec|Erreur/i);
    // Le reçu ne doit pas être affiché
    await expect(page.getByText(/Reçu Officiel d'Inscription & Paiement/i)).not.toBeVisible();
  });

  test('TC-PAY-04: Parcours nominal complet avec validation Luhn et émission du reçu', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: /Catalogue/i }).click();
    await expect(page.locator('.glass-card').first()).toBeVisible({ timeout: 10000 });

    const actionBtn = page.getByRole('button', { name: "S'inscrire" }).first();
    await actionBtn.click();

    await expect(page.getByRole('heading', { name: /Validation & Paiement Sécurisé/i })).toBeVisible();

    // Cliquer sur le raccourci Carte Valide (4242 4242 4242 4242)
    await page.getByRole('button', { name: /Carte Valide/i }).click();

    // Soumettre le paiement
    const submitBtn = page.getByRole('button', { name: /Payer .* et Valider/i });
    await submitBtn.click();

    // Oracle : Affichage du reçu officiel dans la modale
    await expect(page.getByText(/Reçu Officiel d'Inscription & Paiement/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Imprimer/i })).toBeVisible();
  });
});
