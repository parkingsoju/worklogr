import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import {
  Box, Drawer, DrawerBody, DrawerContent, DrawerOverlay,
  Flex, VStack, Text, Button, IconButton, useDisclosure, useColorMode, Divider,
} from '@chakra-ui/react'
import { Menu as MenuIcon, LayoutDashboard, List, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'
import { api, isApiError } from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useSetTheme } from '@/hooks/useTheme'
import { useLogout } from '@/hooks/useAuth'

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    try {
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: () => api.get('/api/auth/me'), staleTime: 60_000 })
    } catch (e) {
      if (isApiError(e) && e.status === 401) throw redirect({ to: '/login' })
      throw e
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const navigate = useNavigate()
  const { colorMode } = useColorMode()
  const setTheme = useSetTheme()
  const mobileNav = useDisclosure()
  const { data: me } = useCurrentUser()
  const logout = useLogout()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => { queryClient.clear(); navigate({ to: '/login' }) },
    })
  }

  const navItems = [
    { to: '/' as const,        label: 'Today',    icon: <LayoutDashboard size={18} />, testId: 'menu-item-today'    },
    { to: '/logs' as const,    label: 'Logs',     icon: <List size={18} />,            testId: 'menu-item-logs'     },
    { to: '/settings' as const,label: 'Settings', icon: <Settings size={18} />,        testId: 'menu-item-settings' },
  ]

  const navBtn = {
    variant: 'ghost' as const,
    justifyContent: 'flex-start',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '2px',
    h: '36px',
    px: 2,
    color: 'text.muted',
    _hover: { bg: 'surface.raised', color: 'text.primary' },
    _activeLink: { color: 'text.primary', fontWeight: '600' },
  }

  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Box
        w="200px"
        flexShrink={0}
        borderRight="1px solid"
        borderColor="border.default"
        display={{ base: 'none', md: 'flex' }}
        flexDirection="column"
        py={8} px={5}
        position="fixed"
        h="100vh"
        bg="surface.base"
      >
        <Text fontFamily="'Lora', serif" fontStyle="italic" fontSize="16px" color="text.secondary" mb={10}>
          worklogr.
        </Text>

        <VStack gap={0} align="stretch" flex={1}>
          {navItems.map(item => (
            <Button key={item.to} as={Link} to={item.to} leftIcon={item.icon} data-testid={item.testId} {...navBtn}>
              {item.label}
            </Button>
          ))}
        </VStack>

        <VStack gap={3} align="stretch">
          <Divider />
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" color="text.subtle" noOfLines={1} flex={1}>{me?.name}</Text>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              size="xs" variant="ghost" color="text.subtle"
              _hover={{ color: 'text.primary' }}
              onClick={() => setTheme(colorMode === 'dark' ? 'light' : 'dark')}
            />
          </Flex>
          <Button
            size="xs" variant="ghost" justifyContent="flex-start"
            leftIcon={<LogOut size={13} />}
            color="text.subtle" fontWeight="400" fontSize="12px" borderRadius="2px"
            _hover={{ color: 'text.muted' }}
            onClick={handleLogout}
            data-testid="menu-item-logout"
          >
            Log out
          </Button>
        </VStack>
      </Box>

      {/* Mobile top bar */}
      <Box
        display={{ base: 'flex', md: 'none' }}
        position="fixed" top={0} left={0} right={0}
        h="56px" bg="surface.base" borderBottom="1px solid" borderColor="border.default"
        px={4} alignItems="center" justifyContent="space-between" zIndex={10}
      >
        <Text fontFamily="'Lora', serif" fontStyle="italic" fontSize="15px" color="text.secondary">worklogr.</Text>
        <IconButton aria-label="Open menu" icon={<MenuIcon size={20} />} variant="ghost" size="sm" onClick={mobileNav.onOpen} />
      </Box>

      {/* Mobile drawer */}
      <Drawer isOpen={mobileNav.isOpen} onClose={mobileNav.onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent bg="surface.base">
          <DrawerBody pt={6}>
            <VStack gap={2} align="stretch">
              <Text fontFamily="'Lora', serif" fontStyle="italic" fontSize="16px" color="text.secondary" mb={4}>worklogr.</Text>
              {navItems.map(item => (
                <Button key={item.to} as={Link} to={item.to} leftIcon={item.icon} onClick={mobileNav.onClose} data-testid={item.testId} {...navBtn}>
                  {item.label}
                </Button>
              ))}
              <Divider my={2} />
              <Button variant="ghost" justifyContent="flex-start" leftIcon={<LogOut size={18} />}
                colorScheme="red" onClick={() => { mobileNav.onClose(); handleLogout() }} data-testid="menu-item-logout">
                Log out
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box ml={{ base: 0, md: '200px' }} flex={1} p={8} pt={{ base: '72px', md: 10 }}>
        <Box maxW="720px" mx="auto">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}
