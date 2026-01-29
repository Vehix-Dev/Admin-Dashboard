"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, X, User, Shield, Paperclip, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
    id: string
    senderId: string
    senderName: string
    content: string
    timestamp: number
    isStaff: boolean
}

export function AdminMessenger() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const { user } = useAuth()
    const scrollRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<BroadcastChannel | null>(null)

    useEffect(() => {
        // Initial load from API
        const loadInitialMessages = async () => {
            try {
                const res = await fetch('/api/admin/messenger')
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data)
                }
            } catch (e) {
                console.error("Failed to load messages", e)
            }
        }

        loadInitialMessages()

        // Initialize BroadcastChannel for same-user tab syncing
        if (typeof window !== 'undefined') {
            channelRef.current = new BroadcastChannel('admin_chat_channel')
            channelRef.current.onmessage = (event) => {
                if (event.data.type === 'NEW_MESSAGE') {
                    setMessages(prev => {
                        if (prev.some(m => m.id === event.data.message.id)) return prev
                        return [...prev, event.data.message]
                    })
                }
            }
        }

        // Set up polling for cross-user updates (every 5 seconds)
        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/admin/messenger')
                if (res.ok) {
                    const data = await res.json()
                    // Deduplicate by ID
                    setMessages(prev => {
                        const newOnes = data.filter((m: Message) => !prev.some(p => p.id === m.id))
                        if (newOnes.length === 0) return prev
                        return [...prev, ...newOnes]
                    })
                }
            } catch (e) {
                console.warn("Messenger poll failed", e)
            }
        }, 5000)

        return () => {
            channelRef.current?.close()
            clearInterval(pollInterval)
        }
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || !user) return

        const messageData = {
            senderId: user.id,
            senderName: user.username || 'Admin',
            content: input,
            timestamp: Date.now(),
            isStaff: true
        }

        try {
            const res = await fetch('/api/admin/messenger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            })

            if (res.ok) {
                const newMessage = await res.json()
                setMessages(prev => [...prev, newMessage])
                channelRef.current?.postMessage({ type: 'NEW_MESSAGE', message: newMessage })
                setInput("")
            }
        } catch (error) {
            console.error("Message send failed", error)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            {/* Messenger Window */}
            {isOpen && (
                <div className="w-80 h-[450px] glass-card flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-500 rounded-3xl overflow-hidden border-primary/20">
                    {/* Header */}
                    <div className="p-4 bg-primary text-white flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest">Team Comms</h3>
                                <div className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                                    <span className="text-[10px] opacity-80 font-bold uppercase">Online Now</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-md transition-colors">
                                <Minimize2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/40 scrollbar-hide">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 grayscale opacity-40">
                                <Shield className="h-10 w-10 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">Encrypted Tunnel</p>
                                <p className="text-[10px] mt-1">Start a secure internal discussion with other active admins.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={cn("flex flex-col gap-1", msg.senderId === user?.id ? "items-end" : "items-start")}>
                                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                                        {msg.senderId !== user?.id && <span className="text-[9px] font-black uppercase text-primary/70">{msg.senderName}</span>}
                                        <span className="text-[8px] text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={cn(
                                        "max-w-[85%] p-3 rounded-2xl text-xs font-medium shadow-sm",
                                        msg.senderId === user?.id
                                            ? "bg-primary text-white rounded-tr-none premium-shadow"
                                            : "bg-card border border-border rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-muted/30 border-t border-border/40 backdrop-blur-xl">
                        <div className="flex gap-2 bg-background border border-border/40 rounded-xl p-1.5 shadow-inner">
                            <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                <Paperclip className="h-4 w-4" />
                            </button>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Secure message..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-xs font-medium px-1"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim()}
                                className="p-1.5 bg-primary text-white rounded-lg disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-3.5 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 relative group",
                    isOpen ? "bg-destructive text-white rotate-90" : "bg-primary text-white"
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background animate-bounce">
                        1
                    </div>
                )}
            </button>
        </div>
    )
}
