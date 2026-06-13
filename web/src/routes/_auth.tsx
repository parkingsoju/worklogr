import { createFileRoute, isRedirect, Outlet, redirect } from '@tanstack/react-router'
import { Box, Container } from '@chakra-ui/react'
import { queryClient } from '@/lib/queryClient'
import { api } from '@/lib/api'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    // Redirect authenticated users away from auth pages
    try {
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: () => api.get('/api/auth/me'), staleTime: 60_000 })
      throw redirect({ to: '/' })
    } catch (e) {
      if (isRedirect(e)) throw e
      // Not authenticated — allow through to auth pages
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="400px" py={8}>
        <Outlet />
      </Container>
    </Box>
  )
}
