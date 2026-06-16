import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Alert, AlertIcon, Box, Button, Divider, Flex, Heading,
  HStack, Skeleton, Text, VStack,
} from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { useLogByDate, useMarkComplete, useReopenLog, useDeleteLog } from '@/hooks/useLogs'
import { useCurrentUser } from '@/hooks/useCurrentUser'

import { SessionList } from '@/components/sessions/SessionList'
import { SessionFormModal } from '@/components/sessions/SessionFormModal'
import { ConfirmDeleteDialog } from '@/components/sessions/ConfirmDeleteDialog'
import { DailyLogStatusBadge } from '@/components/DailyLogStatusBadge'
import { formatDisplayDate, fmtDuration, browserTz } from '@/lib/time'
import type { SessionDto } from '@/lib/types'

export const Route = createFileRoute('/_app/logs_/$date')({
  component: DailyLogDetailPage,
})

function DailyLogDetailPage() {
  const { date } = Route.useParams()
  const navigate = useNavigate()
  const { data: log, isLoading, isError, error } = useLogByDate(date)
  const { data: me } = useCurrentUser()
  const timezone = me?.timezone ?? browserTz()

  const markComplete = useMarkComplete()
  const reopenLog = useReopenLog()
  const deleteLog = useDeleteLog()
  const [editTarget, setEditTarget] = useState<SessionDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SessionDto | null>(null)

  const totalMs = (log?.sessions ?? []).reduce(
    (acc, s) => acc + new Date(s.endTime!).getTime() - new Date(s.startTime).getTime(), 0)

  if (isLoading) return (
    <VStack gap={4} align="stretch">
      <Skeleton height="32px" w="200px" />
      <Skeleton height="120px" />
    </VStack>
  )

  if (isError) return (
    <Alert status="error" borderRadius="md">
      <AlertIcon />{(error as Error).message}
    </Alert>
  )

  return (
    <VStack gap={6} align="stretch">
      {/* Back link */}
      <Box>
        <Button
          as={Link}
          to="/logs"
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={14} />}
          px={0}
        >
          Back to Logs
        </Button>
      </Box>

      {/* Header */}
      <Box>
        <Flex justify="space-between" align="center">
          <Heading size="md">{formatDisplayDate(date)}</Heading>
          {log?.status && <DailyLogStatusBadge status={log.status} />}
        </Flex>
        {totalMs > 0 && (
          <Text fontSize="sm" color="text.muted" mt={1}>
            Total: {fmtDuration(new Date(0).toISOString(), new Date(totalMs).toISOString())}
          </Text>
        )}
      </Box>

      {/* Sessions */}
      <Box>
        <Text fontWeight="semibold" fontSize="sm" mb={3}>Sessions</Text>
        {(log?.sessions?.length ?? 0) === 0 ? (
          <Text fontSize="sm" color="text.muted">No sessions recorded.</Text>
        ) : (
          <SessionList
            sessions={log?.sessions ?? []}
            timezone={timezone}
            onEdit={s => setEditTarget(s)}
            onDelete={s => setDeleteTarget(s)}
            isReadOnly={log?.status === 'Complete'}
          />
        )}
      </Box>

      {log?.status === 'Complete' && (
        <Alert status="info" borderRadius="md" size="sm">
          <AlertIcon />
          This log is marked complete. Reopen it to make changes.
        </Alert>
      )}

      <Divider />

      {/* Actions */}
      <HStack>
        {log?.dailyLogId && (
          log.status === 'Draft'
            ? (log.sessions?.length ?? 0) > 0 && (
              <Button
                colorScheme="brand"
                variant="outline"
                size="sm"
                isLoading={markComplete.isPending}
                onClick={() => markComplete.mutate(log.dailyLogId!)}
              >
                Mark Complete
              </Button>
            )
            : (
              <Button
                variant="outline"
                size="sm"
                isLoading={reopenLog.isPending}
                onClick={() => reopenLog.mutate(log.dailyLogId!)}
              >
                Reopen Log
              </Button>
            )
        )}

        {/* Empty Draft day can be removed entirely (server guards: no sessions + not Complete). */}
        {log?.dailyLogId && log.status === 'Draft' && (log.sessions?.length ?? 0) === 0 && (
          <Button
            colorScheme="red"
            variant="outline"
            size="sm"
            isLoading={deleteLog.isPending}
            onClick={() => deleteLog.mutate(log.dailyLogId!, { onSuccess: () => navigate({ to: '/logs' }) })}
          >
            Delete day
          </Button>
        )}
      </HStack>

      {/* Modals */}
      <SessionFormModal
        isOpen={editTarget != null}
        onClose={() => setEditTarget(null)}
        timezone={timezone}
        editSession={editTarget}
      />
      <ConfirmDeleteDialog
        session={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </VStack>
  )
}
