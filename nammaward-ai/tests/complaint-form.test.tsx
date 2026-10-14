import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { AuthProvider } from '../src/context/AuthContext';
import ComplaintForm from '../src/components/ComplaintForm';

function renderForm(onSubmit = vi.fn()) {
  const onClose = vi.fn();
  render(
    <AuthProvider>
      <ComplaintForm onSubmit={onSubmit} onClose={onClose} />
    </AuthProvider>,
  );
  return { onSubmit, onClose };
}

describe('complaint form', () => {
  it('shows linked validation errors and does not submit incomplete reports', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: /submit report/i }));

    expect(await screen.findByText('Please enter a title')).toBeVisible();
    expect(screen.getByText('Please describe the issue')).toBeVisible();
    expect(screen.getByText('Please enter the locality')).toBeVisible();
    expect(screen.getByLabelText(/issue title/i)).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('creates a complaint from valid fields with the selected category and locality', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/issue title/i), 'Broken street light');
    await user.selectOptions(screen.getByLabelText(/category/i), 'streetlight');
    await user.type(screen.getByLabelText(/locality/i), 'Ward 12');
    await user.type(screen.getByLabelText(/description/i), 'The street light has been out for several days near the bus stop.');
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1), { timeout: 2500 });
    const created = onSubmit.mock.calls[0][0];
    expect(created).toMatchObject({
      title: 'Broken street light',
      category: 'streetlight',
      locality: 'Ward 12',
      status: 'submitted',
      description: 'The street light has been out for several days near the bus stop.',
    });
    expect(created.id).toMatch(/^NW-2026-/);
  });

  it('rejects short text before creating a record', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.type(screen.getByLabelText(/issue title/i), 'Short');
    await user.type(screen.getByLabelText(/locality/i), 'Ward 12');
    await user.type(screen.getByLabelText(/description/i), 'Too brief');
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    expect(await screen.findByText('Title must be at least 10 characters')).toBeVisible();
    expect(screen.getByText('Description must be at least 20 characters')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no automated axe-core violations in the report form', async () => {
    const { container } = renderForm();
    const results = await axe.run(container);
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});
