import { useEffect, useState } from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'

// A single monoline cat, drawn in the live accent color (currentColor) so it
// follows the user's theme in both light and dark. Motion is deliberately
// minimal — a slow blink and a tail swish — so it reads as alive, not busy.
function CatLoader() {
  return (
    <Box as="svg" viewBox="0 0 100 100" w="104px" h="104px" color="brand.500" aria-hidden>
      <style>{`
        @keyframes bp-blink { 0%,88%,100%{transform:scaleY(1)} 94%{transform:scaleY(0.12)} }
        @keyframes bp-swish { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(9deg)} }
        .bp-eye  { transform-box:fill-box; transform-origin:center;  animation:bp-blink 4.2s ease-in-out infinite }
        .bp-tail { transform-box:fill-box; transform-origin:0% 100%; animation:bp-swish 2.8s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .bp-eye,.bp-tail { animation:none } }
      `}</style>
      <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        {/* tail (drawn first so it sits behind the body) */}
        <path className="bp-tail" d="M64 86 C 86 86 92 63 81 55" strokeWidth={4} />
        {/* sitting body */}
        <path d="M50 50 C 33 50 27 92 38 96 L62 96 C 73 92 67 50 50 50 Z" fill="currentColor" fillOpacity={0.12} />
        {/* paws */}
        <ellipse cx="43" cy="94" rx="5" ry="4" fill="currentColor" fillOpacity={0.12} />
        <ellipse cx="57" cy="94" rx="5" ry="4" fill="currentColor" fillOpacity={0.12} />
        {/* ears */}
        <path d="M34 26 L29 9 L47 21 Z" fill="currentColor" />
        <path d="M66 26 L71 9 L53 21 Z" fill="currentColor" />
        {/* head */}
        <circle cx="50" cy="40" r="20" fill="currentColor" fillOpacity={0.12} />
        {/* eyes */}
        <ellipse className="bp-eye" cx="42" cy="40" rx="2.6" ry="3.6" fill="currentColor" stroke="none" />
        <ellipse className="bp-eye" cx="58" cy="40" rx="2.6" ry="3.6" fill="currentColor" stroke="none" />
        {/* nose + mouth */}
        <path d="M47 47 L53 47 L50 51 Z" fill="currentColor" stroke="none" />
        <path d="M50 51 q-3 3 -6 1 M50 51 q3 3 6 1" strokeWidth={2} />
        {/* whiskers */}
        <g strokeWidth={1.5}>
          <path d="M24 42 L37 44 M24 48 L37 48" />
          <path d="M76 42 L63 44 M76 48 L63 48" />
        </g>
      </g>
    </Box>
  )
}

// Router-wide pending fallback. Without it, a route's `beforeLoad` (the `me`
// probe) blocks rendering — so a cold-started backend left a blank screen for
// the whole wake. Shows the cat, then owns up to the wait after a few seconds
// rather than looking frozen.
export function BootPending() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={8}>
      <VStack gap={5} textAlign="center">
        <CatLoader />
        <VStack gap={1}>
          <Text fontWeight="600" color="text.primary">Loading worklogr…</Text>
          {slow && (
            <Text fontSize="sm" color="text.muted" maxW="2xs">
              Waking the server up — the first load after a quiet spell can take ~30s.
            </Text>
          )}
        </VStack>
      </VStack>
    </Box>
  )
}
