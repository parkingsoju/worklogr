import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert, AlertIcon, Box, Button, FormControl, FormLabel,
  Heading, HStack, Input, Radio, RadioGroup, Select, Stack, VStack,
} from '@chakra-ui/react'
import { useColorMode } from '@chakra-ui/react'
import { Check } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { api } from '@/lib/api'
import { ACCENTS } from '@/lib/accents'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().min(1),
  defaultLocationType: z.string(),
  weekStartsOn: z.string(),
  theme: z.string(),
  accentColor: z.string(),
})
type SettingsInput = z.infer<typeof settingsSchema>

const TIMEZONES = Intl.supportedValuesOf('timeZone')

function SettingsPage() {
  const { data: me } = useCurrentUser()
  const qc = useQueryClient()
  const { setColorMode } = useColorMode()

  const update = useMutation({
    mutationFn: (data: SettingsInput) => api.patch('/api/users/me', {
      name: data.name,
      timezone: data.timezone,
      defaultLocationType: data.defaultLocationType,
      weekStartsOn: parseInt(data.weekStartsOn),
      theme: data.theme,
      accentColor: data.accentColor,
    }),
    onSuccess: (updated) => {
      qc.setQueryData(['me'], updated)
      setColorMode(updated.theme === 'system' ? 'light' : updated.theme)
    },
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: '', timezone: 'UTC', defaultLocationType: 'None', weekStartsOn: '1', theme: 'system', accentColor: 'teal' },
  })

  useEffect(() => {
    if (me) reset({
      name: me.name,
      timezone: me.timezone,
      defaultLocationType: me.defaultLocationType ?? 'None',
      weekStartsOn: String(me.weekStartsOn),
      theme: me.theme,
      accentColor: me.accentColor,
    })
  }, [me, reset])

  const theme = watch('theme')
  const defaultLoc = watch('defaultLocationType')
  const weekStart = watch('weekStartsOn')
  const accentColor = watch('accentColor')

  return (
    <VStack gap={6} align="stretch">
      <Heading size="md">Settings</Heading>

      <Box
        as="form"
        onSubmit={handleSubmit(d => update.mutate(d))}
        borderWidth={1}
        borderRadius="2px"
        borderColor="border.default"
       
        p={6}
      >
        <VStack gap={5} align="stretch">
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>What's your name?</FormLabel>
            <Input {...register('name')} />
          </FormControl>

          <FormControl>
            <FormLabel>What's your timezone?</FormLabel>
            <Select {...register('timezone')}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>What's your default work location?</FormLabel>
            <RadioGroup value={defaultLoc} onChange={v => setValue('defaultLocationType', v)}>
              <Stack direction="row" wrap="wrap" gap={3}>
                {['Office', 'Remote', 'Other', 'None'].map(loc => (
                  <Radio key={loc} value={loc}>{loc}</Radio>
                ))}
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>When does your week start?</FormLabel>
            <RadioGroup value={weekStart} onChange={v => setValue('weekStartsOn', v)}>
              <Stack direction="row">
                <Radio value="1">Monday</Radio>
                <Radio value="0">Sunday</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Which theme do you prefer?</FormLabel>
            <RadioGroup value={theme} onChange={v => setValue('theme', v)}>
              <Stack direction="row">
                <Radio value="system">System</Radio>
                <Radio value="light">Light</Radio>
                <Radio value="dark">Dark</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Accent color</FormLabel>
            <HStack gap={3} wrap="wrap">
              {ACCENTS.map(a => {
                const selected = accentColor === a.key
                return (
                  <Box
                    key={a.key}
                    as="button"
                    type="button"
                    aria-label={a.label}
                    title={a.label}
                    onClick={() => setValue('accentColor', a.key)}
                    w="28px"
                    h="28px"
                    borderRadius="full"
                    bg={a.swatch}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="box-shadow 0.15s"
                    boxShadow={selected
                      ? `0 0 0 2px var(--chakra-colors-surface-base), 0 0 0 4px ${a.swatch}`
                      : 'none'}
                    data-testid={`accent-swatch-${a.key}`}
                  >
                    {selected && <Check size={14} color="white" />}
                  </Box>
                )
              })}
            </HStack>
          </FormControl>

          {update.isError && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />{(update.error as Error).message}
            </Alert>
          )}

          {update.isSuccess && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />Settings saved.
            </Alert>
          )}

          <Button type="submit" colorScheme="brand" isLoading={update.isPending} alignSelf="flex-start">
            Save Settings
          </Button>
        </VStack>
      </Box>
    </VStack>
  )
}
