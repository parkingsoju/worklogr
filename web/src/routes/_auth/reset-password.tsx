import { createFileRoute, Link as RouterLink, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert, AlertIcon, Box, Button, FormControl, FormErrorMessage, FormLabel,
  Heading, Input, Link, VStack,
} from '@chakra-ui/react'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { useResetPassword } from '@/hooks/useAuth'

export const Route = createFileRoute('/_auth/reset-password')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const reset = useResetPassword()
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = (data: ResetPasswordInput) => {
    if (!token) return
    reset.mutate({ ...data, token }, {
      onSuccess: () => navigate({ to: '/login' }),
    })
  }

  if (!token) {
    return (
      <VStack gap={6} align="stretch">
        <Heading size="lg" textAlign="center">Worklogr</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          This reset link is invalid. Please request a new one.
        </Alert>
        <Link as={RouterLink} to="/forgot-password" color="brand.500" fontSize="sm" textAlign="center">
          Request a new link
        </Link>
      </VStack>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      <Heading size="lg" textAlign="center">Worklogr</Heading>

      <Box borderWidth={1} borderRadius="2px" p={6} bg="surface.raised">
        <VStack gap={4} as="form" onSubmit={handleSubmit(onSubmit)}>
          <FormControl isInvalid={!!errors.newPassword}>
            <FormLabel>Choose a new password</FormLabel>
            <Input
              {...register('newPassword')}
              type="password"
              data-testid="reset-password-new-input"
            />
            <FormErrorMessage>{errors.newPassword?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm your new password</FormLabel>
            <Input
              {...register('confirmPassword')}
              type="password"
              data-testid="reset-password-confirm-input"
            />
            <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
          </FormControl>

          {reset.isError && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {(reset.error as Error).message}
            </Alert>
          )}

          <Button
            type="submit"
            colorScheme="brand"
            w="full"
            isLoading={reset.isPending}
            data-testid="reset-password-submit-btn"
          >
            Reset Password
          </Button>
        </VStack>
      </Box>
    </VStack>
  )
}
