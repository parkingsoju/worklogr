import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Badge, Box, Button, Divider, Flex, Heading, HStack,
  Select, Skeleton, Text, VStack,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { useLogs } from '@/hooks/useLogs'
import { api } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import * as XLSX from 'xlsx'

export const Route = createFileRoute('/_app/logs')({
  component: LogsPage,
})

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function LogsPage() {
  const [status, setStatus] = useState('All')
  const [exporting, setExporting] = useState(false)
  const { data: logs, isLoading } = useLogs(undefined, undefined, status)
  const { data: me } = useCurrentUser()
  const timezone = me?.timezone ?? 'UTC'

  const handleExport = async () => {
    setExporting(true)
    try {
      const sessions = await api.get('/api/reports/sessions')
      const rows = sessions.map((s: any) => ({
        Date: s.date,
        'Start Time': formatInTimeZone(new Date(s.startTime), timezone, 'HH:mm'),
        'End Time': formatInTimeZone(new Date(s.endTime), timezone, 'HH:mm'),
        Duration: `${Math.floor(s.durationSeconds / 3600)}h ${Math.floor((s.durationSeconds % 3600) / 60)}m`,
        Location: s.locationType,
        'Session Note': s.sessionNote ?? '',
        'Daily Status': s.dailyStatus,
        'Daily Note': s.dailyNote ?? '',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Work Sessions')
      const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
      XLSX.writeFile(wb, `worklogr-export-${today}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  // Group by month
  const grouped = (logs ?? []).reduce<Record<string, typeof logs>>((acc, log) => {
    const month = format(new Date(log!.date + 'T12:00'), 'MMMM yyyy')
    if (!acc[month]) acc[month] = []
    acc[month]!.push(log)
    return acc
  }, {})

  return (
    <VStack gap={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="md">Logs</Heading>
        <HStack>
          <Select
            size="sm"
            w="130px"
            value={status}
            onChange={e => setStatus(e.target.value)}
            data-testid="logs-status-filter"
          >
            <option value="All">All</option>
            <option value="Draft">Draft</option>
            <option value="Complete">Complete</option>
          </Select>
        </HStack>
      </Flex>

      {isLoading ? (
        <VStack gap={2} align="stretch">
          {[1, 2, 3].map(i => <Skeleton key={i} height="40px" />)}
        </VStack>
      ) : Object.keys(grouped).length === 0 ? (
        <Text color="text.muted" fontSize="sm">No logs yet.</Text>
      ) : (
        Object.entries(grouped).map(([month, monthLogs]) => (
          <Box key={month}>
            <Text fontWeight="semibold" fontSize="sm" color="text.muted" mb={2}>{month}</Text>
            <Box borderWidth={1} borderRadius="2px" overflow="hidden" borderColor="border.default" _dark={{ borderColor: 'gray.700' }}>
              {monthLogs!.map((log, i) => (
                <Box key={log!.id}>
                  {i > 0 && <Divider />}
                  <Flex
                    as={Link}
                    to={`/logs/${log!.date}` as string}
                    px={4}
                    py={3}
                    justify="space-between"
                    align="center"
                    _hover={{ bg: 'gray.100' }} _dark={{ _hover: { bg: 'gray.800' } }}
                    cursor="pointer"
                  >
                    <HStack gap={3}>
                      <Text fontSize="sm" fontWeight="medium">
                        {format(new Date(log!.date + 'T12:00'), 'MMM d')}
                      </Text>
                      <Badge
                        colorScheme={log!.status === 'Complete' ? 'green' : 'gray'}
                        size="sm"
                      >
                        {log!.status}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="text.muted">
                      {log!.totalSeconds > 0 ? formatSeconds(log!.totalSeconds) : '—'}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Box>
          </Box>
        ))
      )}

      {(logs?.length ?? 0) > 0 && (
        <Button
          size="sm"
          variant="outline"
          alignSelf="flex-start"
          isLoading={exporting}
          onClick={handleExport}
          data-testid="logs-export-btn"
        >
          Export Excel
        </Button>
      )}
    </VStack>
  )
}
