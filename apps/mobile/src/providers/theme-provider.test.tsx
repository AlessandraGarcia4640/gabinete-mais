import { render, screen } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import { AppText } from '../components/app-text';
import { themes, typography } from '../lib/theme';
import { ThemeProvider } from './theme-provider';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ default: jest.fn() }));

const currentColorScheme = jest.mocked(useColorScheme);

it('acompanha mudanças na preferência de cor e aplica a família carregada', () => {
  function Example() {
    return <ThemeProvider fontsLoaded><AppText variant="heading">Registro fictício</AppText></ThemeProvider>;
  }
  currentColorScheme.mockReturnValue('light');
  const { rerender } = render(<Example />);
  expect(screen.getByText('Registro fictício')).toHaveStyle({
    color: themes.light.colors.ink,
    fontFamily: typography.heading.fontFamily,
  });

  currentColorScheme.mockReturnValue('dark');
  rerender(<Example />);
  expect(screen.getByText('Registro fictício')).toHaveStyle({ color: themes.dark.colors.ink });
});

it('usa fontes do sistema quando a família do app não pôde ser carregada', () => {
  currentColorScheme.mockReturnValue(null);
  render(<ThemeProvider fontsLoaded={false}><AppText variant="heading">Registro fictício</AppText></ThemeProvider>);
  const title = screen.getByText('Registro fictício');
  expect(title).toHaveStyle({ color: themes.light.colors.ink, fontWeight: '600' });
  expect(title).not.toHaveStyle({ fontFamily: typography.heading.fontFamily });
});
