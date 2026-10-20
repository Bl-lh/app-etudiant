import { test, expect } from '@playwright/test';

test.describe('Module Authentification & Rôles (ISTQB TC-AUTH-01 à 05)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-AUTH-01: Affichage de la page d\'accueil et branding CampusEnroll', async ({ page }) => {
    await expect(page).toHaveTitle(/CampusEnroll/i);
    // Le logo contient "Campus" et "Enroll" dans deux balises
    await expect(page.locator('header')).toContainText('CampusEnroll');
    await expect(page.getByText('Processus des Tests Logiciels • EMI')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comptes Démo' })).toBeVisible();
  });

  test('TC-AUTH-02: Connexion rapide avec le compte Étudiant démo', async ({ page }) => {
    // Ouvrir le menu des comptes démo
    await page.getByRole('button', { name: 'Comptes Démo' }).click();

    // Cliquer sur le compte Étudiant (div cliquable)
    await page.getByText(/Bilal \(Étudiant\)/i).click();

    // Vérifier l'état connecté dans la Navbar
    await expect(page.getByText('Bilal Mansouri')).toBeVisible();
    await expect(page.locator('header').getByRole('button', { name: /Mes Cours/i })).toBeVisible();

    // Déconnexion
    await page.getByTitle('Se déconnecter').click();
    await expect(page.locator('header').getByRole('button', { name: /Connexion/i })).toBeVisible();
  });

  test('TC-AUTH-03: Connexion manuelle via la Modale d\'Authentification', async ({ page }) => {
    // Ouvrir la modale de connexion
    await page.locator('header').getByRole('button', { name: /Connexion/i }).click();
    await expect(page.getByRole('heading', { name: /Connexion Étudiant \/ Enseignant/i })).toBeVisible();

    // Remplir les identifiants
    await page.getByPlaceholder('etudiant@campus-online.ma').fill('etudiant@campus-online.ma');
    await page.getByPlaceholder('••••••••').fill('Password123!');

    // Soumettre le formulaire
    await page.getByRole('button', { name: 'Se Connecter' }).click();

    // Vérifier la session active
    await expect(page.getByText('Bilal Mansouri')).toBeVisible();
  });

  test('TC-AUTH-04 [Test Négatif]: Échec de connexion avec mot de passe invalide', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: /Connexion/i }).click();
    await page.getByPlaceholder('etudiant@campus-online.ma').fill('etudiant@campus-online.ma');
    await page.getByPlaceholder('••••••••').fill('MotDePasseFaux999!');
    await page.getByRole('button', { name: 'Se Connecter' }).click();

    // Oracle : message d'erreur visible
    await expect(page.locator('.modal-content')).toContainText(/invalide|erreur|échec/i);
    await expect(page.getByRole('button', { name: 'Se Connecter' })).toBeVisible();
  });

  test('TC-AUTH-05: Connexion Administrateur et accès au portail d\'administration', async ({ page }) => {
    await page.getByRole('button', { name: 'Comptes Démo' }).click();
    await page.getByText(/Prof. Karim \(Admin\)/i).click();

    // Vérifier le nom et l'onglet Administration
    await expect(page.getByText('Prof. Karim Alami')).toBeVisible();
    await expect(page.locator('header').getByRole('button', { name: /Administration/i })).toBeVisible();

    // Accéder au tableau de bord administrateur
    await page.locator('header').getByRole('button', { name: /Administration/i }).click();
    await expect(page.getByText(/Tableau de Bord Administratif/i)).toBeVisible();
  });
});
