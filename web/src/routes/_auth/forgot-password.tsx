import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, AlertIcon, Box, Button, FormControl, FormErrorMessage, FormLabel,
  Heading, Input, Link, Text, VStack,
} from '@chakra-ui/react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { useForgotPassword } from '@/hooks/useAuth'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordInput) => {
    forgot.mutate(data)
  }

  return (
    <VStack gap={6} align="stretch">
      <Heading textAlign="center" fontFamily="'Lora', serif" fontStyle="italic" fontWeight="400" fontSize="24px" color="text.secondary">worklogr.</Heading>

      <Box borderWidth={1} borderRadius="2px" p={6} bg="surface.raised">
        {forgot.isSuccess ? (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            If an account exists for this email, a reset link has been sent.
          </Alert>
        ) : (
          <VStack gap={4} as="form" onSubmit={handleSubmit(onSubmit)}>
            <Text fontSize="sm" color="text.muted">
              Enter your email and we'll send you a reset link.
            </Text>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>What's your email?</FormLabel>
              <Input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                data-testid="forgot-password-email-input"
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            {forgot.isError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {(forgot.error as Error).message}
              </Alert>
            )}

            <Button
              type="submit"
              colorScheme="brand"
              w="full"
              isLoading={forgot.isPending}
              data-testid="forgot-password-submit-btn"
            >
              Send Reset Link
            </Button>
          </VStack>
        )}
      </Box>

      <Link as={RouterLink} to="/login" color="brand.500" fontSize="sm" textAlign="center">
        Back to login
      </Link>
    </VStack>
  )
}
