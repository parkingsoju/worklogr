import { createFileRoute, Link as RouterLink, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, AlertIcon, Box, Button, FormControl, FormErrorMessage, FormLabel,
  Heading, Input, Link, VStack,
} from '@chakra-ui/react'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { useRegister } from '@/hooks/useAuth'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const register_ = useRegister()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterInput) => {
    register_.mutate(data, {
      onSuccess: () => {
        // Registration succeeded — send to login to complete the flow
        navigate({ to: '/login' })
      },
    })
  }

  return (
    <VStack gap={6} align="stretch">
      <Heading textAlign="center" fontFamily="'Lora', serif" fontStyle="italic" fontWeight="400" fontSize="24px" color="text.secondary">worklogr.</Heading>

      <Box borderWidth={1} borderRadius="2px" p={6} bg="surface.raised">
        <VStack gap={4} as="form" onSubmit={handleSubmit(onSubmit)}>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>What's your name?</FormLabel>
            <Input
              {...register('name')}
              placeholder="Jane Smith"
              data-testid="register-name-input"
            />
            <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.email}>
            <FormLabel>What's your email?</FormLabel>
            <Input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              data-testid="register-email-input"
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Choose a password</FormLabel>
            <Input
              {...register('password')}
              type="password"
              data-testid="register-password-input"
            />
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm your password</FormLabel>
            <Input
              {...register('confirmPassword')}
              type="password"
              data-testid="register-confirm-password-input"
            />
            <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
          </FormControl>

          {register_.isError && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {(register_.error as Error).message}
            </Alert>
          )}

          <Button
            type="submit"
            colorScheme="brand"
            w="full"
            isLoading={register_.isPending}
            data-testid="register-submit-btn"
          >
            Create Account
          </Button>
        </VStack>
      </Box>

      <Link as={RouterLink} to="/login" color="brand.500" fontSize="sm" textAlign="center">
        Already have an account? Log in
      </Link>
    </VStack>
  )
}
