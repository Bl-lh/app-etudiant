import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ReceiptModal from '../ReceiptModal';

describe('Unit Tests - Component ReceiptModal', () => {
  const mockReceipt = {
    receiptNumber: 'REC-2026-0042',
    transactionId: 'TXN-987654321',
    date: '2026-10-06T14:30:00Z',
    student: {
      name: 'Bilal Lahyani',
      email: 'bilal@campus.ma',
      phone: '+212 600-000000'
    },
    course: {
      title: 'Automatisation ISTQB & Playwright',
      instructor_name: 'Dr. Karim Alami',
      category_name: 'Tests Logiciels'
    },
    billing: {
      originalAmount: 1000.00,
      discountAmount: 200.00,
      couponCode: 'ETUDIANT20',
      finalPaidAmount: 800.00,
      paymentMethod: 'CARTE BANCAIRE (VISA)'
    },
    institution: {
      name: 'Campus Online EMI',
      address: 'Agdal, Rabat',
      email: 'contact@campus.ma'
    }
  };

  it('TC-FE-REC-01 : Retourne null et ne monte aucun élément si receipt est nul', () => {
    const { container } = render(<ReceiptModal receipt={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('TC-FE-REC-02 : Affiche toutes les métadonnées officielles du reçu', () => {
    render(<ReceiptModal receipt={mockReceipt} onClose={vi.fn()} />);

    expect(screen.getByText(/REC-2026-0042/)).toBeInTheDocument();
    expect(screen.getByText(/TXN-987654321/)).toBeInTheDocument();
    expect(screen.getByText('Bilal Lahyani')).toBeInTheDocument();
    expect(screen.getByText('bilal@campus.ma')).toBeInTheDocument();
    expect(screen.getByText('Automatisation ISTQB & Playwright')).toBeInTheDocument();
    expect(screen.getByText('800.00 DH')).toBeInTheDocument();
  });

  it('TC-FE-REC-03 : Affiche la ligne du coupon de réduction si une remise existe', () => {
    render(<ReceiptModal receipt={mockReceipt} onClose={vi.fn()} />);

    expect(screen.getByText(/Remise Code Promo/i)).toBeInTheDocument();
    expect(screen.getByText(/ETUDIANT20/)).toBeInTheDocument();
    expect(screen.getByText(/-200.00 DH/)).toBeInTheDocument();
  });

  it('TC-FE-REC-04 : Déclenche window.print lors du clic sur le bouton Imprimer', async () => {
    const user = userEvent.setup();
    render(<ReceiptModal receipt={mockReceipt} onClose={vi.fn()} />);

    const printBtn = screen.getByRole('button', { name: /Imprimer/i });
    await user.click(printBtn);

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('TC-FE-REC-05 : Déclenche onClose lors du clic sur le bouton de fermeture', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<ReceiptModal receipt={mockReceipt} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: 'Fermer' });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
