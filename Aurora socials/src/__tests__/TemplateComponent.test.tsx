import React from 'react';
import { render, screen } from '@testing-library/react';
import TemplateComponent from '../components/TemplateComponent';

describe('TemplateComponent', () => {
  it('renders without crashing', () => {
    render(<TemplateComponent />);
    expect(screen.getByText(/component content/i)).toBeInTheDocument();
  });
});
