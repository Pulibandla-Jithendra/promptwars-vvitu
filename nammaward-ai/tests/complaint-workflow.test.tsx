import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import ComplaintDetail from '../src/components/ComplaintDetail';
import { AuthProvider } from '../src/context/AuthContext';
import { ComplaintProvider } from '../src/context/ComplaintContext';
import { Complaint } from '../src/types';

const resolutionPhoto = 'data:image/png;base64,aGVsbG8=';

function makeComplaint(overrides: Partial<Complaint> = {}): Complaint {
  return {
    id: 'NW-2026-777',
    title: 'Pothole near the bus stop',
    description: 'A deep pothole has been present near the bus stop for several days.',
    category: 'pothole',
    locality: 'Ward 12',
    status: 'submitted',
    priority: 'high',
    createdAt: '2026-01-01T10:00:00.000Z',
    upvotes: 1,
    submittedBy: 'citizen-1',
    staffNotes: [],
    ...overrides,
  };
}

function mountApp(role: 'citizen' | 'staff', complaint = makeComplaint()) {
  localStorage.setItem('nammaward_complaints', JSON.stringify([complaint]));
  sessionStorage.setItem('nammaward_user', JSON.stringify({
    id: role === 'staff' ? 'staff-1' : 'citizen-1',
    name: role === 'staff' ? 'Officer Priya S.' : 'Ravi Kumar',
    role,
    email: role === 'staff' ? 'staff@demo.com' : 'citizen@demo.com',
  }));
  return render(<AuthProvider><ComplaintProvider><App /></ComplaintProvider></AuthProvider>);
}

describe('complaint resolution workflow', () => {
  it('lets staff update progress, propose resolution, and returns a citizen dispute to the review queue with history intact', async () => {
    const user = userEvent.setup();
    const view = mountApp('staff');

    await user.click(screen.getByRole('button', { name: /view complaint NW-2026-777/i }));
    await user.selectOptions(screen.getByLabelText('New complaint status'), 'in-progress');
    await user.type(screen.getByLabelText('Add a review note'), 'Crew inspected the road.');
    await user.click(screen.getByRole('button', { name: /update status/i }));
    expect(await screen.findByText('Crew inspected the road.')).toBeVisible();

    await user.type(screen.getByLabelText('Resolution note (required)'), 'The pothole was filled and compacted.');
    await user.click(screen.getByRole('button', { name: /send to citizen for review/i }));
    expect(await screen.findByText(/waiting for the reporting citizen/i)).toBeVisible();
    expect(screen.getAllByText('Awaiting Citizen Review').length).toBeGreaterThan(0);
    expect(screen.getByText('Awaiting Citizen Review', { selector: '.stat-label' }).closest('.stat-card')).toHaveTextContent('1');

    const storedAfterProposal = JSON.parse(localStorage.getItem('nammaward_complaints') || '[]') as Complaint[];
    expect(storedAfterProposal[0].status).toBe('awaiting-confirmation');
    expect(storedAfterProposal[0].staffNotes?.map((event) => event.kind)).toEqual(['staff-update', 'resolution-proposal']);
    view.unmount();

    const citizenView = mountApp('citizen', storedAfterProposal[0]);
    const card = screen.getByRole('button', { name: /open complaint NW-2026-777/i });
    await user.click(card);
    await user.click(screen.getByRole('button', { name: /it still exists/i }));
    expect(await screen.findByText(/please describe why the issue still exists/i)).toBeVisible();

    await user.type(screen.getByLabelText('Review note'), 'Water still pools in the hole after rain.');
    await user.click(screen.getByRole('button', { name: /it still exists/i }));
    expect(await screen.findByText(/sent back to the staff review queue/i)).toBeVisible();
    expect(screen.getAllByText('Citizen Disputed').length).toBeGreaterThan(0);
    expect(screen.getByText('Citizen Disputed', { selector: '.stat-label' }).closest('.stat-card')).toHaveTextContent('1');
    expect(screen.getByText('Water still pools in the hole after rain.')).toBeVisible();

    const storedAfterDispute = JSON.parse(localStorage.getItem('nammaward_complaints') || '[]') as Complaint[];
    expect(storedAfterDispute[0].status).toBe('disputed');
    expect(storedAfterDispute[0].staffNotes?.map((event) => event.kind)).toEqual([
      'staff-update', 'resolution-proposal', 'citizen-dispute',
    ]);
    expect(storedAfterDispute[0].staffNotes?.[1].note).toBe('The pothole was filled and compacted.');
    citizenView.unmount();

    mountApp('staff', storedAfterDispute[0]);
    expect(screen.getAllByText('Citizen Disputed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Awaiting Citizen Review').length).toBeGreaterThan(0);
    expect(within(screen.getByRole('row', { name: /NW-2026-777/i })).getByText('Citizen Disputed')).toBeVisible();
  });

  it('records citizen confirmation as resolved, retains resolution evidence, and updates dashboard counts', async () => {
    const user = userEvent.setup();
    mountApp('citizen', makeComplaint({
      status: 'awaiting-confirmation',
      staffNotes: [{
        note: 'The drain was cleared.', by: 'Officer Priya S.', at: '2026-01-02T10:00:00.000Z',
        statusChange: 'awaiting-confirmation', kind: 'resolution-proposal', photoDataUrl: resolutionPhoto,
      }],
    }));

    expect(screen.getAllByText('Awaiting Citizen Review').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /open complaint NW-2026-777/i }));
    expect(screen.getByAltText(/photo attached to this complaint history event/i)).toHaveAttribute('src', resolutionPhoto);
    await user.click(screen.getByRole('button', { name: /confirm it appears fixed/i }));

    expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0);
    expect(screen.getByText('Resolved', { selector: '.stat-label' }).closest('.stat-card')).toHaveTextContent('1');
    expect(screen.getByText('Your confirmation has been added to the complaint history.')).toBeVisible();
    const stored = JSON.parse(localStorage.getItem('nammaward_complaints') || '[]') as Complaint[];
    expect(stored[0].status).toBe('resolved');
    expect(stored[0].staffNotes?.map((event) => event.kind)).toEqual(['resolution-proposal', 'citizen-confirmation']);
    const photos = JSON.parse(localStorage.getItem('nammaward_photos') || '{}') as Record<string, string>;
    expect(photos['NW-2026-777:note:0']).toBe(resolutionPhoto);
  });

  it('does not show citizen review actions for a complaint filed by another account', () => {
    sessionStorage.setItem('nammaward_user', JSON.stringify({ email: 'citizen@demo.com' }));
    const complaint = makeComplaint({ status: 'awaiting-confirmation', submittedBy: 'different-citizen' });
    render(<AuthProvider><ComplaintProvider><ComplaintDetail complaint={complaint} onClose={() => undefined} /></ComplaintProvider></AuthProvider>);

    expect(screen.queryByRole('button', { name: /confirm it appears fixed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /it still exists/i })).not.toBeInTheDocument();
  });

  it('closes a complaint dialog with Escape and restores focus to the opened complaint', async () => {
    const user = userEvent.setup();
    mountApp('citizen', makeComplaint({ status: 'resolved' }));
    const card = screen.getByRole('button', { name: /open complaint NW-2026-777/i });
    await user.click(card);
    const dialog = screen.getByRole('dialog', { name: 'Complaint details' });
    expect(within(dialog).getAllByRole('button')[0]).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(card).toHaveFocus();
  });

  it('creates a complaint from the form and displays it in the citizen dashboard', async () => {
    const user = userEvent.setup();
    mountApp('citizen', makeComplaint({ status: 'resolved' }));
    await user.click(screen.getByRole('button', { name: /report/i }));
    await user.type(screen.getByLabelText(/issue title/i), 'Overflowing waste bin');
    await user.type(screen.getByLabelText(/locality/i), 'Gandhi Nagar');
    await user.type(screen.getByLabelText(/description/i), 'The waste bin near the market has overflowed for two days.');
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      const records = JSON.parse(localStorage.getItem('nammaward_complaints') || '[]') as Complaint[];
      expect(records).toHaveLength(2);
    }, { timeout: 4000 });
    const createdCard = screen.getByRole('button', { name: /open complaint NW-2026-.*Overflowing waste bin/i });
    expect(createdCard).toHaveTextContent('Gandhi Nagar');
    const records = JSON.parse(localStorage.getItem('nammaward_complaints') || '[]') as Complaint[];
    expect(records).toHaveLength(2);
    expect(records[0].title).toBe('Overflowing waste bin');
  });

  it('recovers from malformed saved session and complaint data', async () => {
    localStorage.setItem('nammaward_complaints', '{invalid-json');
    sessionStorage.setItem('nammaward_user', '{invalid-json');
    render(<AuthProvider><ComplaintProvider><App /></ComplaintProvider></AuthProvider>);

    expect(screen.getByText('Choose Your Role')).toBeVisible();
  });
});
