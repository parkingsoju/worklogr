import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns'
import { useLogs } from '@/hooks/useLogs'
import { formatInTimeZone } from 'date-fns-tz'

interface Props { timezone: string; weekStartsOn: 0 | 1 }

function fmtSecs(s: number) {
  if (!s) return '—'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function WeeklySummaryCard({ timezone, weekStartsOn }: Props) {
  const todayStr   = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
  const today      = new Date(todayStr + 'T12:00')
  const weekStart  = startOfWeek(today, { weekStartsOn })
  const weekEnd    = endOfWeek(today,   { weekStartsOn })
  const days       = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const { data: logs } = useLogs(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'))
  const byDate  = (logs ?? []).reduce<Record<string,number>>((a, l) => { a[l!.date] = l!.totalSeconds; return a }, {})
  const total   = Object.values(byDate).reduce((a, b) => a + b, 0)
  const maxSecs = Math.max(...Object.values(byDate), 1)

  return (
    <Box data-testid="weekly-summary-card">
      <Flex justify="space-between" align="baseline" mb={3}>
        <Text fontSize="10px" fontWeight="700" letterSpacing="0.10em" textTransform="uppercase" color="text.subtle">
          This week
        </Text>
        <Text fontSize="sm" fontWeight="500" color="text.secondary" data-testid="weekly-summary-total">
          {fmtSecs(total)}
        </Text>
      </Flex>

      <VStack gap="6px" align="stretch">
        {days.map(day => {
          const ds      = format(day, 'yyyy-MM-dd')
          const secs    = byDate[ds] ?? 0
          const pct     = secs > 0 ? (secs / maxSecs) * 100 : 0
          const isToday = ds === todayStr
          return (
            <Flex key={ds} align="center" gap={3}>
              <Text fontSize="11px" color={isToday ? 'text.primary' : 'text.subtle'}
                fontWeight={isToday ? '600' : '400'} w="26px" flexShrink={0}>
                {format(day, 'EEE')}
              </Text>
              <Box flex={1} h="2px" bg="border.default" borderRadius="1px">
                <Box h="100%" w={`${pct}%`} bg={isToday ? 'brand.400' : 'brand.300'} borderRadius="1px" />
              </Box>
              <Text fontSize="11px" color={secs > 0 ? 'text.secondary' : 'text.subtle'}
                w="40px" textAlign="right" fontWeight={isToday ? '600' : '400'}>
                {fmtSecs(secs)}
              </Text>
            </Flex>
          )
        })}
      </VStack>
    </Box>
  )
}
