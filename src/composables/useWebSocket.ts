import { ref, onUnmounted } from 'vue'

export interface WebSocketConfig {
  url: string
  topics: string[]
  onMessage?: (data: any) => void
}

export function useWebSocket(config: WebSocketConfig) {
  let ws: WebSocket | null = null
  const reconnectAttempts = ref(0)
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const { url, topics, onMessage } = config
  const autoReconnect = true
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const subscribe = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }

    const subscribeMessage = {
      op: 'subscribe',
      args: topics,
    }

    ws.send(JSON.stringify(subscribeMessage))
  }

  const connect = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      ws = new WebSocket(url)

      ws.onopen = () => {
        reconnectAttempts.value = 0
        subscribe()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (onMessage) {
            onMessage(data)
          }
        } catch (err) {}
      }

      ws.onerror = () => {}

      ws.onclose = () => {
        ws = null

        if (autoReconnect && reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++

          reconnectTimer = setTimeout(() => {
            connect()
          }, reconnectDelay)
        }
      }
    } catch (err) {}
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (ws) {
      ws.close()
      ws = null
    }

    reconnectAttempts.value = 0
  }

  const reconnect = () => {
    disconnect()
    reconnectAttempts.value = 0
    connect()
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
  }
}
