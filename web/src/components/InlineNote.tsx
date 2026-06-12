import { useState } from 'react'
import { Box, Button, HStack, Text, Textarea } from '@chakra-ui/react'

interface Props {
  value: string | null
  onSave: (note: string | null) => void
  isPending?: boolean
  placeholder?: string
  isReadOnly?: boolean
}

export function InlineNote({ value, onSave, isPending, placeholder = 'Click to add a note...', isReadOnly }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value ?? '')

  if (isReadOnly) {
    return <Text fontSize="sm" color={value ? 'text.muted' : 'text.subtle'}>{value || placeholder}</Text>
  }

  if (!editing) {
    return (
      <Text
        fontSize="sm"
        color={value ? 'text.muted' : 'text.subtle'}
        cursor="text"
        onClick={() => { setDraft(value ?? ''); setEditing(true) }}
      >
        {value || placeholder}
      </Text>
    )
  }

  return (
    <Box>
      <Textarea value={draft} onChange={e => setDraft(e.target.value)} size="sm" rows={3} autoFocus mb={2} />
      <HStack>
        <Button size="xs" colorScheme="brand" isLoading={isPending}
          onClick={() => { onSave(draft.trim() || null); setEditing(false) }}>
          Save
        </Button>
        <Button size="xs" variant="ghost" color="text.subtle" onClick={() => setEditing(false)}>Cancel</Button>
      </HStack>
    </Box>
  )
}
