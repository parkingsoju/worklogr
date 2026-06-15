import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Alert, AlertIcon, Box, Button, Divider, Flex,
  Skeleton, Text, useDisclosure, VStack,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { PlusCircle } from 'lucide-react'
import { useTodayLog } from '@/hooks/useTodayLog'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useMarkComplete, useReopenLog, useUpdateDailyNote } from '@/hooks/useLogs'
import { InlineNote } from '@/components/InlineNote'
import { WeeklySummaryCard } from '@/components/sessions/WeeklySummaryCard'
import { ActiveSessionCard } from '@/components/sessions/ActiveSessionCard'
import { SessionList } from '@/components/sessions/SessionList'
import { StartSessionForm } from '@/components/sessions/StartSessionForm'
import { SessionFormModal } from '@/components/sessions/SessionFormModal'
import { ConfirmDeleteDialog } from '@/components/sessions/ConfirmDeleteDialog'
import { StaleSessionDialog } from '@/components/sessions/StaleSessionDialog'
import { DailyLogStatusBadge } from '@/components/DailyLogStatusBadge'
import { fmtDuration } from '@/lib/time'
import type { SessionDto } from '@/lib/types'

export const Route = createFileRoute('/_app/')({
  component: TodayPage,
})

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="10px"
      fontWeight="700"
      letterSpacing="0.10em"
      textTransform="uppercase"
      color="text.subtle"
      mb={2}
    >
      {children}
    </Text>
  )
}

function TodayPage() {
  const { data: today, isLoading, isError, error } = useTodayLog()
  const { data: me } = useCurrentUser()
  const timezone = me?.timezone ?? 'UTC'

  const markComplete = useMarkComplete()
  const reopenLog    = useReopenLog()
  const updateNote   = useUpdateDailyNote()
  const startFormDisclosure = useDisclosure()
  const addModalDisclosure  = useDisclosure()
  const [editTarget,   setEditTarget]   = useState<SessionDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SessionDto | null>(null)

  if (isLoading) return (
    <VStack gap={4} align="stretch">
      <Skeleton height="36px" w="200px" />
      <Skeleton height="2px"  />
      <Skeleton height="80px" />
    </VStack>
  )

  if (isError) return (
    <Alert status="error">
      <AlertIcon />{(error as Error).message}
    </Alert>
  )

  const totalMs = (today?.sessions ?? []).reduce(
    (acc, s) => acc + new Date(s.endTime!).getTime() - new Date(s.startTime).getTime(), 0)

  // Parse today's date for display
  const dateObj = today?.date ? new Date(today.date + 'T12:00') : new Date()
  const weekday  = format(dateObj, 'EEEE')
  const fullDate = format(dateObj, 'MMMM d, yyyy')

  return (
    <VStack gap={0} align="stretch" spacing={0}>

      {/* ── Date header ─────────────────────────────── */}
      <Box mb={6}>
        <Text
          fontSize="11px"
          fontWeight="600"
          letterSpacing="0.10em"
          textTransform="uppercase"
          color="text.subtle"
          mb={1}
        >
          {weekday}
        </Text>
        <Text
          fontFamily="'Lora', serif"
          fontStyle="italic"
          fontSize="28px"
          color="text.primary"
          lineHeight={1.1}
        >
          {fullDate}
        </Text>
      </Box>

      {/* ── Totals rule ──────────────────────────────── */}
      <Flex
        align="baseline"
        gap={3}
        py={4}
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="border.default"
        mb={5}
      >
        {totalMs > 0 ? (
          <>
            <Text
              fontFamily="'Lora', serif"
              fontSize="36px"
              color="text.primary"
              lineHeight={1}
              letterSpacing="-0.01em"
            >
              {fmtDuration(new Date(0).toISOString(), new Date(totalMs).toISOString())}
            </Text>
            <Text fontSize="12px" color="text.subtle">logged today</Text>
          </>
        ) : (
          <Text fontSize="sm" color="text.subtle">No hours logged yet</Text>
        )}
        {today?.status && (
          <Box ml="auto">
            <DailyLogStatusBadge status={today.status} />
          </Box>
        )}
      </Flex>

      {/* ── Stale session recovery ───────────────────── */}
      {today?.staleSession && (
        <StaleSessionDialog
          staleSession={today.staleSession}
          timezone={timezone}
          onClose={() => {}}
        />
      )}

      {/* ── Active session ───────────────────────────── */}
      {today?.activeSession && (
        <ActiveSessionCard session={today.activeSession} timezone={timezone} />
      )}

      {/* ── Start session (inline collapse) ─────────── */}
      {!today?.activeSession && (
        <Box mb={4}>
          <StartSessionForm
            isOpen={startFormDisclosure.isOpen}
            onToggle={startFormDisclosure.onToggle}
            onClose={startFormDisclosure.onClose}
            timezone={timezone}
          />
        </Box>
      )}

      {/* ── Completed sessions ───────────────────────── */}
      <Box mb={5}>
        <Flex justify="space-between" align="center" mb={1}>
          <SectionLabel>Completed</SectionLabel>
          {today?.status !== 'Complete' && (
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<PlusCircle size={12} />}
              color="text.subtle"
              _hover={{ color: 'gray.700' }}
              fontWeight="500"
              fontSize="11px"
              onClick={addModalDisclosure.onOpen}
              data-testid="today-add-manually-btn"
            >
              Add manually
            </Button>
          )}
        </Flex>

        {(today?.sessions?.length ?? 0) === 0 && !today?.activeSession ? (
          <Text fontSize="sm" color="text.subtle" py={2}>No completed sessions yet.</Text>
        ) : (
          <SessionList
            sessions={today?.sessions ?? []}
            timezone={timezone}
            onEdit={s => setEditTarget(s)}
            onDelete={s => setDeleteTarget(s)}
            isReadOnly={today?.status === 'Complete'}
          />
        )}
      </Box>

      {/* ── Actions ──────────────────────────────────── */}
      {today?.dailyLogId && (
        <Box mb={6}>
          {today.status === 'Draft'
            ? !today.activeSession && (today.sessions?.length ?? 0) > 0 && (
              <Button
                size="sm"
                bg="ink.primary"
                color="ink.inverted"
                _hover={{ opacity: 0.85 }}
                borderRadius="2px"
                isLoading={markComplete.isPending}
                onClick={() => markComplete.mutate(today.dailyLogId!)}
                data-testid="today-mark-complete-btn"
              >
                Mark today as complete
              </Button>
            )
            : (
              <Button
                size="sm"
                variant="outline"
                borderColor="border.default"
                color="text.muted"
                borderRadius="2px"
                isLoading={reopenLog.isPending}
                onClick={() => reopenLog.mutate(today.dailyLogId!)}
                data-testid="today-reopen-btn"
              >
                Reopen log
              </Button>
            )
          }
        </Box>
      )}

      <Divider mb={5} />

      {/* ── Daily note ───────────────────────────────── */}
      {today?.dailyLogId && (
        <Box mb={7}>
          <SectionLabel>Daily note</SectionLabel>
          <InlineNote
            value={today.note}
            onSave={note => updateNote.mutate({ id: today.dailyLogId!, note })}
            isPending={updateNote.isPending}
            isReadOnly={today.status === 'Complete'}
          />
        </Box>
      )}

      {/* ── Weekly summary ───────────────────────────── */}
      <WeeklySummaryCard timezone={timezone} />

      {/* ── Modals ───────────────────────────────────── */}
      <SessionFormModal
        isOpen={addModalDisclosure.isOpen || editTarget != null}
        onClose={() => { addModalDisclosure.onClose(); setEditTarget(null) }}
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
