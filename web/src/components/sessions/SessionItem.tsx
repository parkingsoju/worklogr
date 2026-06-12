import { Box, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import { Pencil, Trash2 } from 'lucide-react'
import type { SessionDto } from '@/lib/types'
import { fmtTime, fmtDuration } from '@/lib/time'
import { InlineNote } from '@/components/InlineNote'
import { useUpdateSessionNote } from '@/hooks/useTodayLog'

interface Props {
  session: SessionDto; timezone: string
  onEdit: (s: SessionDto) => void; onDelete: (s: SessionDto) => void
  isReadOnly?: boolean
}

export function SessionItem({ session, timezone, onEdit, onDelete, isReadOnly }: Props) {
  const updateNote = useUpdateSessionNote()

  return (
    <Box py={3} data-testid={`session-item-${session.id}`}>
      <Flex align="baseline" gap={3}>
        <Text color="border.strong" fontSize="md" flexShrink={0} mt="1px">—</Text>

        <VStack align="start" gap={1} flex={1} minW={0}>
          <Flex align="baseline" gap={3} w="full" wrap="wrap">
            <Text fontSize="sm" fontWeight="500" color="text.primary" whiteSpace="nowrap">
              {fmtTime(session.startTime, timezone)} – {fmtTime(session.endTime!, timezone)}
            </Text>
            <Text fontSize="xs" color="text.subtle">{session.locationType}</Text>
            <Text fontSize="sm" fontWeight="500" color="text.secondary" ml="auto">
              {fmtDuration(session.startTime, session.endTime!)}
            </Text>
          </Flex>
          <InlineNote
            value={session.note}
            onSave={note => updateNote.mutate({ id: session.id, note })}
            isPending={updateNote.isPending}
            placeholder="Add a note..."
            isReadOnly={isReadOnly}
          />
        </VStack>

        {!isReadOnly && (
          <HStack gap={0} flexShrink={0}>
            <IconButton aria-label="Edit session" icon={<Pencil size={13} />} size="xs" variant="ghost"
              color="text.subtle" _hover={{ color: 'text.primary' }}
              onClick={() => onEdit(session)} data-testid={`session-edit-btn-${session.id}`} />
            <IconButton aria-label="Delete session" icon={<Trash2 size={13} />} size="xs" variant="ghost"
              color="text.subtle" _hover={{ color: 'red.400' }}
              onClick={() => onDelete(session)} data-testid={`session-delete-btn-${session.id}`} />
          </HStack>
        )}
      </Flex>
    </Box>
  )
}
