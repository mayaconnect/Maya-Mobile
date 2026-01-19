import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingScreen } from '@/components/common/loading-screen';

describe('LoadingScreen', () => {
  it('renders with default message', () => {
    render(<LoadingScreen />);

    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders with custom message', () => {
    render(<LoadingScreen message="Connexion en cours..." />);

    expect(screen.getByText('Connexion en cours...')).toBeTruthy();
  });

  it('shows logo by default', () => {
    render(<LoadingScreen />);

    expect(screen.getByText('Maya')).toBeTruthy();
    expect(screen.getByText('Économisez avec vos partenaires')).toBeTruthy();
  });

  it('hides logo when showLogo is false', () => {
    render(<LoadingScreen showLogo={false} />);

    expect(screen.queryByText('Maya')).toBeNull();
    expect(screen.queryByText('Économisez avec vos partenaires')).toBeNull();
  });

  it('always shows footer', () => {
    render(<LoadingScreen />);

    expect(screen.getByText('Fait avec amour pour vous')).toBeTruthy();
  });

  it('renders activity indicator', () => {
    const { UNSAFE_getByType } = render(<LoadingScreen />);
    const { ActivityIndicator } = require('react-native');

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
