// Premade accent presets. Each is a full Chakra 50–900 scale used as the `brand`
// color. Stored on the user as a key string (User.AccentColor); the backend never
// sees the hex. All scales are muted to match the editorial palette, and every
// `500` is dark enough to carry white button text (`colorScheme="brand"` solid).
//
// Ballet pink's identity lives in the pale tints (50–300) + focus ring (400); its
// 500–600 is a confident rose so buttons and the active-timer text stay legible.

export type AccentScale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>

export const accents: Record<string, AccentScale> = {
  teal: {
    50:  '#F0F7F6', 100: '#D5EBE8', 200: '#B8DAD6', 300: '#97C8C2', 400: '#7BB3AC',
    500: '#5E9E97', 600: '#4A8880', 700: '#3A706A', 800: '#2B5955', 900: '#1C403C',
  },
  ballet: {
    50:  '#FBF1F3', 100: '#F6E0E5', 200: '#EFC9D2', 300: '#E3A9B7', 400: '#D08498',
    500: '#BC6177', 600: '#A44E64', 700: '#883E52', 800: '#6B3140', 900: '#4E232E',
  },
  slate: {
    50:  '#F1F4F8', 100: '#DEE6F0', 200: '#C2D0E2', 300: '#9DB2CE', 400: '#7592B5',
    500: '#547399', 600: '#435E7E', 700: '#354A64', 800: '#28384C', 900: '#1B2533',
  },
  clay: {
    50:  '#FAF2EE', 100: '#F2DFD5', 200: '#E6C4B2', 300: '#D6A187', 400: '#C57E5E',
    500: '#B0633F', 600: '#934F31', 700: '#743E27', 800: '#562E1D', 900: '#3A1F14',
  },
  plum: {
    50:  '#F6F1F7', 100: '#E9DCEC', 200: '#D6C0DB', 300: '#BC9BC5', 400: '#A079AC',
    500: '#835A90', 600: '#6B4877', 700: '#543A5E', 800: '#3F2C46', 900: '#2A1D2F',
  },
  moss: {
    50:  '#F4F6EE', 100: '#E5EAD6', 200: '#CFD8B4', 300: '#B2BF8A', 400: '#94A365',
    500: '#76854A', 600: '#5E6B3A', 700: '#49532E', 800: '#363E22', 900: '#242916',
  },
}

export const DEFAULT_ACCENT = 'teal'

// Ordered list for the settings swatch row. `swatch` is the 500 step (the chip color).
export const ACCENTS: { key: string; label: string; swatch: string }[] = [
  { key: 'teal',   label: 'Teal',        swatch: accents.teal[500] },
  { key: 'ballet', label: 'Ballet pink', swatch: accents.ballet[500] },
  { key: 'slate',  label: 'Slate',       swatch: accents.slate[500] },
  { key: 'clay',   label: 'Clay',        swatch: accents.clay[500] },
  { key: 'plum',   label: 'Plum',        swatch: accents.plum[500] },
  { key: 'moss',   label: 'Moss',        swatch: accents.moss[500] },
]

export function accentScale(key: string | undefined): AccentScale {
  return accents[key ?? DEFAULT_ACCENT] ?? accents[DEFAULT_ACCENT]
}
