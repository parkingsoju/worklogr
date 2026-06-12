import { useState } from 'react'
import {
  Alert, AlertIcon, Button, FormControl, FormLabel, HStack, Input,
  Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, VStack,
} from '@chakra-ui/react'
import { fromZonedTime } from 'date-fns-tz'
import { useDeleteSession } from '@/hooks/useTodayLog'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import type { TodayData } from '@/lib/types'
import { fmtTime } from '@/lib/time'

interface Props {
  staleSession: NonNullable<TodayData['staleSession']>
  timezone: string
  onClose: () => void
}

export function StaleSessionDialog({ staleSession, timezone, onClose }: Props) {
  const [endTime, setEndTime] = useState('17:00')
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deleteSession = useDeleteSession()
  const qc = useQueryClient()

  const handleEnd = async () => {
    setError(null)
    setEnding(true)
    try {
      const endUtc = fromZonedTime(`${staleSession.date}T${endTime}:00`, timezone)
      const startUtc = new Date(staleSession.startTime)
      if (endUtc <= startUtc) { setError('End time must be after start time.'); return }

      await api.put(`/api/work-sessions/${staleSession.id}`, {
        startTime: staleSession.startTime,
        endTime: endUtc.toISOString(),
        locationType: staleSession.locationType,
        note: null,
      })
      qc.invalidateQueries({ queryKey: ['daily-log', 'today'] })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnding(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Unfinished Session</ModalHeader>
        <ModalBody>
          <VStack gap={4} align="stretch">
            <Text fontSize="sm">
              You have an unfinished session from <strong>{staleSession.date}</strong> that
              started at <strong>{fmtTime(staleSession.startTime, timezone)}</strong> ({staleSession.locationType}).
            </Text>

            <FormControl>
              <FormLabel>Set end time for that day</FormLabel>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </FormControl>

            {error && (
              <Alert status="error" borderRadius="md" size="sm">
                <AlertIcon />{error}
              </Alert>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button colorScheme="brand" isLoading={ending} onClick={handleEnd}>
              Save End Time
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              isLoading={deleteSession.isPending}
              onClick={() => deleteSession.mutate(staleSession.id, { onSuccess: onClose })}
            >
              Delete Session
            </Button>
            <Button variant="ghost" onClick={onClose}>Later</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
