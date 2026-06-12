import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, AlertIcon, Box, Button, Collapse, FormControl, FormErrorMessage,
  FormLabel, HStack, Radio, RadioGroup, Stack, Textarea, VStack,
} from '@chakra-ui/react'
import { Plus } from 'lucide-react'
import { startSessionSchema, type StartSessionInput } from '@/lib/validations/session'
import { useStartSession } from '@/hooks/useTodayLog'

interface Props {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function StartSessionForm({ isOpen, onToggle, onClose }: Props) {
  const startSession = useStartSession()
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StartSessionInput>({
    resolver: zodResolver(startSessionSchema),
    defaultValues: { locationType: 'Office' },
  })
  const locationType = watch('locationType')
  const firstFocusRef = useRef<HTMLInputElement>(null)

  const onSubmit = (data: StartSessionInput) => {
    startSession.mutate(data, {
      onSuccess: () => { reset(); onClose() },
    })
  }

  return (
    <VStack gap={3} align="stretch">
      <Button
        leftIcon={<Plus size={16} />}
        colorScheme="brand"
        onClick={onToggle}
        data-testid="today-start-session-btn"
      >
        Start Session
      </Button>

      <Collapse in={isOpen} animateOpacity>
        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          borderWidth={1}
          borderRadius="2px"
          borderColor="border.default"
         
          p={4}
          mt={1}
        >
          <VStack gap={4} align="stretch">
            <FormControl isInvalid={!!errors.locationType}>
              <FormLabel>Where are you working?</FormLabel>
              <RadioGroup
                value={locationType}
                onChange={v => setValue('locationType', v as StartSessionInput['locationType'])}
              >
                <Stack direction="row">
                  {(['Office', 'Remote', 'Other'] as const).map(loc => (
                    <Radio key={loc} value={loc} ref={loc === 'Office' ? firstFocusRef : undefined}>
                      {loc}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
              <FormErrorMessage>{errors.locationType?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Any notes? (optional)</FormLabel>
              <Textarea {...register('note')} size="sm" rows={2} placeholder="e.g. Morning focus block" />
            </FormControl>

            {startSession.isError && (
              <Alert status="error" borderRadius="md" size="sm">
                <AlertIcon />
                {(startSession.error as Error).message}
              </Alert>
            )}

            <HStack>
              <Button type="submit" colorScheme="brand" size="sm" isLoading={startSession.isPending}>
                Start
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { reset(); onClose() }}>
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Collapse>
    </VStack>
  )
}
