'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'
import { useCallback, useState } from 'react'

export function SendPushCampaignButton() {
  const { id, collectionSlug } = useDocumentInfo()
  const [isSending, setIsSending] = useState(false)

  const onSend = useCallback(async () => {
    if (collectionSlug !== 'push-campaigns' || !id) {
      return
    }

    setIsSending(true)
    try {
      const response = await fetch(`/api/push-campaigns/${id}/send`, {
        method: 'POST',
        credentials: 'include',
      })

      const body = (await response.json()) as { message?: string; queued?: boolean }

      if (!response.ok) {
        throw new Error(body.message ?? 'Send failed')
      }

      toast.success(body.message ?? 'Campaign queued for delivery')
      window.location.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed'
      toast.error(message)
    } finally {
      setIsSending(false)
    }
  }, [collectionSlug, id])

  if (collectionSlug !== 'push-campaigns' || !id) {
    return null
  }

  return (
    <Button buttonStyle="primary" disabled={isSending} onClick={onSend} size="small">
      {isSending ? 'Sending…' : 'Send campaign'}
    </Button>
  )
}
