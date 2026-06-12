import { useRef } from 'react'
import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay, Button, HStack,
} from '@chakra-ui/react'
import type { SessionDto } from '@/lib/types'
import { useDeleteSession } from '@/hooks/useTodayLog'

interface Props {
  session: SessionDto | null
  onClose: () => void
}

export function ConfirmDeleteDialog({ session, onClose }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const deleteSession = useDeleteSession()

  const isActive = session?.endTime == null

  const handleConfirm = () => {
    if (!session) return
    deleteSession.mutate(session.id, { onSuccess: onClose })
  }

  return (
    <AlertDialog isOpen={!!session} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogHeader>
          {isActive ? 'Cancel active session?' : 'Delete work session?'}
        </AlertDialogHeader>
        <AlertDialogBody>
          {isActive
            ? 'Your current work time will not be saved.'
            : 'This will update your daily total.'}
        </AlertDialogBody>
        <AlertDialogFooter>
          <HStack>
            <Button
              colorScheme="red"
              isLoading={deleteSession.isPending}
              onClick={handleConfirm}
            >
              {isActive ? 'Cancel Session' : 'Delete'}
            </Button>
            <Button ref={cancelRef} variant="ghost" onClick={onClose}>
              Keep It
            </Button>
          </HStack>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
