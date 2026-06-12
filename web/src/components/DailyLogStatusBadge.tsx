import { Box } from '@chakra-ui/react'
import type { DailyLogStatus } from '@/lib/types'

export function DailyLogStatusBadge({ status }: { status: DailyLogStatus }) {
  const isDone = status === 'Complete'
  return (
    <Box
      as="span" display="inline-block"
      fontSize="10px" fontWeight="600" letterSpacing="0.10em" textTransform="uppercase"
      color={isDone ? 'brand.500' : 'text.subtle'}
      border="1px solid" borderColor={isDone ? 'brand.300' : 'border.default'}
      px={2} py="2px" borderRadius="2px"
      data-testid="daily-log-status-badge"
    >
      {status}
    </Box>
  )
}
