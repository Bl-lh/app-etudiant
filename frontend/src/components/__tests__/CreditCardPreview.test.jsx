import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CreditCardPreview from '../CreditCardPreview';

describe('Unit Tests - Component CreditCardPreview', () => {
  it('TC-FE-CC-01 : Affiche les valeurs par défaut si aucune prop n\'est fournie', () => {
    render(<CreditCardPreview />);

    expect(screen.getByText('•••• •••• •••• ••••')).toBeInTheDocument();
    expect(screen.getByText('NOM DU TITULAIRE')).toBeInTheDocument();
    expect(screen.getByText('MM/AA')).toBeInTheDocument();
    expect(screen.getByText('VISA')).toBeInTheDocument();
  });

  it('TC-FE-CC-02 : Formate un numéro de 16 chiffres par blocs de 4 avec espaces', () => {
    render(
      <CreditCardPreview
        cardNumber="4532123456789010"
        cardHolder="Bilal Lahyani"
        expiryMonth="09"
        expiryYear="2027"
        cardType="VISA"
      />
    );

    expect(screen.getByText('4532 1234 5678 9010')).toBeInTheDocument();
  });

  it('TC-FE-CC-03 : Formate un numéro partiel en complétant avec des puces (•)', () => {
    render(
      <CreditCardPreview
        cardNumber="4532"
        cardHolder="Sara Test"
      />
    );

    expect(screen.getByText('4532 •••• •••• ••••')).toBeInTheDocument();
  });

  it('TC-FE-CC-04 : Transforme le nom du titulaire en majuscules', () => {
    render(
      <CreditCardPreview
        cardHolder="mohamed el amrani"
      />
    );

    expect(screen.getByText('MOHAMED EL AMRANI')).toBeInTheDocument();
  });

  it('TC-FE-CC-05 : Formate la date d\'expiration au format MM/AA (sur 2 chiffres pour l\'année)', () => {
    render(
      <CreditCardPreview
        expiryMonth="11"
        expiryYear="2029"
      />
    );

    expect(screen.getByText('11/29')).toBeInTheDocument();
  });

  it('TC-FE-CC-06 : Affiche correctement le badge MASTERCARD', () => {
    render(
      <CreditCardPreview
        cardNumber="5100123456789999"
        cardType="MASTERCARD"
      />
    );

    const badge = screen.getByText('MASTERCARD');
    expect(badge).toBeInTheDocument();
  });
});
