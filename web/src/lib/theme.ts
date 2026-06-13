import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { accents, type AccentScale } from './accents'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const gray = {
  50:  '#FAFAF8',
  100: '#F0EDE8',
  200: '#E5E0D8',
  300: '#D0C9C0',
  400: '#B0A89E',
  500: '#8C8278',
  600: '#6A6058',
  700: '#4A4440',
  800: '#2E2A26',
  900: '#1A1714',
}

// Semantic tokens — single source for light/dark color pairs
const semanticTokens = {
  colors: {
    'text.primary':    { default: 'gray.900', _dark: 'gray.50'  },
    'text.secondary':  { default: 'gray.700', _dark: 'gray.200' },
    'text.muted':      { default: 'gray.500', _dark: 'gray.400' },
    'text.subtle':     { default: 'gray.400', _dark: 'gray.500' },
    'surface.base':    { default: 'gray.50',  _dark: 'gray.900' },
    'surface.raised':  { default: 'white',    _dark: 'gray.800' },
    'surface.overlay': { default: 'white',    _dark: 'gray.800' },
    'border.default':  { default: 'gray.200', _dark: 'gray.700' },
    'border.strong':   { default: 'gray.300', _dark: 'gray.600' },
    'ink.primary':     { default: 'gray.900', _dark: 'white'    },
    'ink.inverted':    { default: 'white',    _dark: 'gray.900' },
  },
}

const radii = {
  none: '0px',
  sm:   '2px',
  base: '2px',
  md:   '2px',
  lg:   '3px',
  xl:   '4px',
  '2xl':'6px',
  '3xl':'8px',
  full: '9999px',
}

const fonts = {
  body:    "'Inter', system-ui, sans-serif",
  heading: "'Inter', system-ui, sans-serif",
}

const styles = {
  global: {
    'html, body': {
      bg:    'surface.base',
      color: 'text.primary',
    },
  },
}

const components = {
  Button: {
    baseStyle: { borderRadius: '2px', fontWeight: '500' },
    defaultProps: { size: 'sm' },
  },
  Badge:    { baseStyle: { borderRadius: '2px' } },
  Divider:  { baseStyle: { borderColor: 'border.default' } },
  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: '2px',
          borderColor: 'border.default',
          _focus: { borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' },
        },
      },
    },
  },
  Textarea: {
    variants: {
      outline: {
        borderRadius: '2px',
        borderColor: 'border.default',
        _focus: { borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' },
      },
    },
  },
  Select: {
    variants: {
      outline: {
        field: {
          borderRadius: '2px',
          borderColor: 'border.default',
        },
      },
    },
  },
}

// Theme factory — the accent (`brand`) scale is injected so the app can re-theme
// per user (see ThemedChakraProvider in main.tsx). Everything else is fixed.
export function makeTheme(brand: AccentScale) {
  return extendTheme({ config, colors: { brand, gray }, semanticTokens, radii, fonts, styles, components })
}

// Default theme (teal) — used pre-auth and by the standalone toast in queryClient.ts.
export const theme = makeTheme(accents.teal)
