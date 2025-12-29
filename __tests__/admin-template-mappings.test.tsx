/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the admin API
jest.mock('../src/lib/adminApi', () => ({
  getMappings: jest.fn(async () => [{ id: '1', activity: 'payment_succeeded', template_key: 'payment_success', template_language: 'en' }]),
  createMapping: jest.fn(async (p) => ({ ...p, id: '2' })),
  updateMapping: jest.fn(async () => ({})),
  deleteMapping: jest.fn(async () => ({}))
}));

import AdminPage from '../src/pages/admin-template-mappings';

describe('Admin Template Mappings page', () => {
  it('renders existing mappings and allows create', async () => {
    render(<AdminPage />);
    expect(await screen.findByText('Activity → Template mappings')).toBeInTheDocument();
    // existing row
    expect(await screen.findByText('payment_succeeded')).toBeInTheDocument();

    // create new mapping
    fireEvent.change(screen.getByPlaceholderText('activity'), { target: { value: 'reminder' } });
    fireEvent.change(screen.getByPlaceholderText('template_key'), { target: { value: 'payment_reminder' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(screen.queryByDisplayValue('')).toBeNull(), { timeout: 2000 });
  });
});
