import { useEffect, useState } from 'react'
import { Alert, AlertIcon, Box, Button, Divider, Flex, HStack, Text } from '@chakra-ui/react'
import type { SessionDto } from '@/lib/types'
import { fmtTime } from '@/lib/time'
import { useEndSession } from '@/hooks/useTodayLog'

interface Props { session: SessionDto; timezone: string }

export function ActiveSessionCard({ session, timezone }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const endSession = useEndSession()

  useEffect(() => {
    const startMs = new Date(session.startTime).getTime()
    const tick = () => setElapsed(Date.now() - startMs)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session.id, session.startTime])

  const h = Math.floor(elapsed / 3600000)
  const m = Math.floor((elapsed % 3600000) / 60000)
  const s = Math.floor((elapsed % 60000) / 1000)
  const timer = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`

  return (
    <Box>
      <Flex align="center" gap={3} py={3}>
        <Box
          w="6px" h="6px" borderRadius="full" bg="brand.400" flexShrink={0}
          sx={{ '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } }, animation: 'blink 2s ease-in-out infinite' }}
        />
        <Text fontSize="sm" fontWeight="500" color="text.primary" flex={1}>
          Started {fmtTime(session.startTime, timezone)}
        </Text>
        <Text fontSize="sm" color="text.subtle">{session.locationType}</Text>
        <Text fontFamily="'Inter', monospace" fontSize="sm" fontWeight="600" color="brand.500" minW="72px" textAlign="right">
          {timer}
        </Text>
      </Flex>

      {endSession.isError && (
        <Alert status="error" size="sm" mb={2}><AlertIcon />{(endSession.error as Error).message}</Alert>
      )}

      <HStack mb={2}>
        <Button
          size="sm" bg="ink.primary" color="ink.inverted" borderRadius="2px"
          _hover={{ opacity: 0.85 }}
          isLoading={endSession.isPending}
          onClick={() => endSession.mutate(session.id)}
          data-testid="today-end-session-btn"
        >
          End session
        </Button>
      </HStack>
      <Divider />
    </Box>
  )
}
