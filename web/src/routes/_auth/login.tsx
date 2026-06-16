import { createFileRoute, Link as RouterLink, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, AlertIcon, Box, Button, FormControl, FormErrorMessage, FormLabel,
  Heading, Input, Link, Text, VStack, HStack,
} from '@chakra-ui/react'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { useLogin } from '@/hooks/useAuth'
import { queryClient } from '@/lib/queryClient'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: localStorage.getItem('worklogr:lastEmail') ?? '' },
  })

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onSuccess: (user) => {
        queryClient.setQueryData(['me'], user)
        navigate({ to: '/' })
      },
    })
  }

  return (
    <VStack gap={6} align="stretch">
      <Heading
        textAlign="center"
        fontFamily="'Lora', serif"
        fontStyle="italic"
        fontWeight="400"
        fontSize="24px"
        color="text.secondary"
       
      >
        worklogr.
      </Heading>

      <Box borderWidth={1} borderRadius="2px" p={6} bg="surface.raised">
        <VStack gap={4} as="form" onSubmit={handleSubmit(onSubmit)}>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>What's your email?</FormLabel>
            <Input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              data-testid="login-email-input"
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>What's your password?</FormLabel>
            <Input
              {...register('password')}
              type="password"
              data-testid="login-password-input"
            />
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          {login.isError && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {(login.error as Error).message}
            </Alert>
          )}

          <Button
            type="submit"
            colorScheme="brand"
            w="full"
            isLoading={login.isPending}
            data-testid="login-submit-btn"
          >
            Log In
          </Button>
        </VStack>
      </Box>

      <HStack justify="center" gap={4}>
        <Link as={RouterLink} to="/register" color="brand.500" fontSize="sm">
          Create account
        </Link>
        <Text fontSize="sm" color="text.subtle">·</Text>
        <Link as={RouterLink} to="/forgot-password" color="brand.500" fontSize="sm">
          Forgot password?
        </Link>
      </HStack>
    </VStack>
  )
}
