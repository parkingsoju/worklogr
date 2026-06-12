import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react'

function RootErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={8}>
      <VStack gap={4} maxW="md" textAlign="center">
        <Heading size="lg">Something went wrong</Heading>
        <Text color="gray.500">{message}</Text>
        <Button colorScheme="brand" onClick={resetErrorBoundary}>Try again</Button>
      </VStack>
    </Box>
  )
}

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary FallbackComponent={RootErrorFallback}>
      <Outlet />
    </ErrorBoundary>
  ),
})
