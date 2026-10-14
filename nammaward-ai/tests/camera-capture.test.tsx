import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CameraCapture from '../src/components/CameraCapture';

describe('photo evidence validation', () => {
  it('rejects a non-image file even if selected through a crafted input event', () => {
    const onCapture = vi.fn();
    render(<CameraCapture onCapture={onCapture} onRemove={vi.fn()} />);
    const file = new File(['not an image'], 'report.pdf', { type: 'application/pdf' });

    fireEvent.change(screen.getByLabelText(/choose from gallery/i), { target: { files: [file] } });

    expect(screen.getByRole('alert')).toHaveTextContent(/valid image file/i);
    expect(onCapture).not.toHaveBeenCalled();
  });

  it('rejects images larger than the documented 5 MB maximum before decoding', () => {
    const onCapture = vi.fn();
    render(<CameraCapture onCapture={onCapture} onRemove={vi.fn()} />);
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText(/choose from gallery/i), { target: { files: [file] } });

    expect(screen.getByRole('alert')).toHaveTextContent(/5 MB or smaller/i);
    expect(onCapture).not.toHaveBeenCalled();
  });
});
