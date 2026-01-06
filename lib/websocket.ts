"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { getAuthToken } from "./auth"

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || "", {
      auth: { token },
      transports: ["websocket"],
    })

    socket.on("connect", () => {
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
  }
}
