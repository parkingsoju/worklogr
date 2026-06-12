import { Box, Divider, Text, VStack } from '@chakra-ui/react'
import type { SessionDto } from '@/lib/types'
import { SessionItem } from './SessionItem'

interface Props {
  sessions: SessionDto[]
  timezone: string
  onEdit: (session: SessionDto) => void
  onDelete: (session: SessionDto) => void
}

export function SessionList({ sessions, timezone, onEdit, onDelete }: Props) {
  if (sessions.length === 0) {
    return <Text fontSize="sm" color="gray.500">No completed sessions yet.</Text>
  }

  return (
    <VStack gap={0} align="stretch" data-testid="session-list">
      {sessions.map((s, i) => (
        <Box key={s.id}>
          {i > 0 && <Divider />}
          <SessionItem session={s} timezone={timezone} onEdit={onEdit} onDelete={onDelete} />
        </Box>
      ))}
    </VStack>
  )
}
