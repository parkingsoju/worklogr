import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, AlertIcon, Button, FormControl, FormErrorMessage, FormLabel,
  HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Stack,
  Textarea, VStack,
} from '@chakra-ui/react'
import { sessionFormSchema, type SessionFormInput } from '@/lib/validations/session'
import { useAddManualSession, useEditSession } from '@/hooks/useTodayLog'
import { toLocalDate, toLocalTime, todayLocal } from '@/lib/time'
import type { SessionDto } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  timezone: string
  editSession?: SessionDto | null  // null = add mode, SessionDto = edit mode
}

export function SessionFormModal({ isOpen, onClose, timezone, editSession }: Props) {
  const isEdit = editSession != null
  const addSession = useAddManualSession(timezone)
  const editSessionMutation = useEditSession(timezone)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SessionFormInput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      date: todayLocal(timezone),
      locationType: 'Office',
    },
  })
  const locationType = watch('locationType')

  useEffect(() => {
    if (isOpen) {
      if (editSession) {
        reset({
          date: toLocalDate(editSession.startTime, timezone),
          startTime: toLocalTime(editSession.startTime, timezone),
          endTime: toLocalTime(editSession.endTime!, timezone),
          locationType: editSession.locationType,
          note: editSession.note ?? '',
        })
      } else {
        reset({ date: todayLocal(timezone), locationType: 'Office', startTime: '', endTime: '', note: '' })
      }
    }
  }, [isOpen, editSession, timezone, reset])

  const mutation = isEdit ? editSessionMutation : addSession
  const onSubmit = (data: SessionFormInput) => {
    if (isEdit) {
      editSessionMutation.mutate({ id: editSession!.id, data }, { onSuccess: onClose })
    } else {
      addSession.mutate(data, { onSuccess: onClose })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} data-testid="session-form-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? 'Edit Session' : 'Add Session'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack gap={4} as="form" id="session-form" onSubmit={handleSubmit(onSubmit)}>
            {!isEdit && (
              <FormControl isInvalid={!!errors.date}>
                <FormLabel>Which day?</FormLabel>
                <Input type="date" {...register('date')} data-testid="session-form-date-input" />
                <FormErrorMessage>{errors.date?.message}</FormErrorMessage>
              </FormControl>
            )}

            <HStack w="full">
              <FormControl isInvalid={!!errors.startTime}>
                <FormLabel>When did the session start?</FormLabel>
                <Input type="time" {...register('startTime')} data-testid="session-form-start-time-input" />
                <FormErrorMessage>{errors.startTime?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.endTime}>
                <FormLabel>When did it end?</FormLabel>
                <Input type="time" {...register('endTime')} data-testid="session-form-end-time-input" />
                <FormErrorMessage>{errors.endTime?.message}</FormErrorMessage>
              </FormControl>
            </HStack>

            <FormControl isInvalid={!!errors.locationType}>
              <FormLabel>Where did you work?</FormLabel>
              <RadioGroup
                value={locationType}
                onChange={v => setValue('locationType', v as SessionFormInput['locationType'])}
              >
                <Stack direction="row">
                  {(['Office', 'Remote', 'Other'] as const).map(loc => (
                    <Radio key={loc} value={loc}>{loc}</Radio>
                  ))}
                </Stack>
              </RadioGroup>
              <FormErrorMessage>{errors.locationType?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Any notes? (optional)</FormLabel>
              <Textarea {...register('note')} size="sm" rows={2} />
            </FormControl>

            {mutation.isError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {(mutation.error as Error).message}
              </Alert>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button
              type="submit"
              form="session-form"
              colorScheme="brand"
              isLoading={mutation.isPending}
              data-testid="session-form-save-btn"
            >
              Save
            </Button>
            <Button variant="ghost" onClick={onClose} data-testid="session-form-cancel-btn">
              Cancel
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
