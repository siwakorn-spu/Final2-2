"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/ui/empty-state"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Send, Search, MessageSquare, Menu } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"

interface ChatInterfaceProps {
  currentUserId: string
  initialConversations: any[]
  initialConversationId?: string | null // Added prop for initial conversation selection
}

export function ChatInterface({ currentUserId, initialConversations, initialConversationId }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialConversationId || null)
  const [messages, setMessages] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileConversationsOpen, setMobileConversationsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const selectedChat = conversations.find((c) => c.id === selectedConversation)
  const otherParticipant =
    selectedChat?.participant1_id === currentUserId ? selectedChat.participant2 : selectedChat?.participant1

  useEffect(() => {
    const loadConversation = async () => {
      if (!initialConversationId) return

      const existingConv = conversations.find((c) => c.id === initialConversationId)
      if (existingConv) {
        setSelectedConversation(initialConversationId)
        return
      }

      setIsLoading(true)

      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          participant1:profiles!participant1_id(id, full_name, avatar_url),
          participant2:profiles!participant2_id(id, full_name, avatar_url)
        `)
        .eq("id", initialConversationId)
        .single()

      if (conversation) {
        setConversations((prev) => [conversation, ...prev])
        setSelectedConversation(initialConversationId)
      }

      setIsLoading(false)
    }

    loadConversation()
  }, [initialConversationId, currentUserId])

  useEffect(() => {
    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_conversations",
        },
        async (payload) => {
          const newConv = payload.new as any

          if (newConv.participant1_id !== currentUserId && newConv.participant2_id !== currentUserId) {
            return
          }

          const { data: conversationWithProfiles } = await supabase
            .from("chat_conversations")
            .select(`
              *,
              participant1:profiles!participant1_id(id, full_name, avatar_url),
              participant2:profiles!participant2_id(id, full_name, avatar_url)
            `)
            .eq("id", newConv.id)
            .single()

          if (conversationWithProfiles) {
            setConversations((prev) => [conversationWithProfiles, ...prev])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  useEffect(() => {
    if (!selectedConversation) return

    loadMessages()

    // Subscribe to all new messages in this conversation
    const channel = supabase
      .channel(`chat:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMsg = payload.new as any
          // Only add message if it belongs to this conversation
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === otherParticipant?.id) ||
            (newMsg.sender_id === otherParticipant?.id && newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            scrollToBottom()

            // Mark as read if from other participant
            if (newMsg.sender_id === otherParticipant?.id) {
              supabase
                .from("chat_messages")
                .update({ is_read: true })
                .eq("id", newMsg.id)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, currentUserId, otherParticipant?.id])

  const loadMessages = async () => {
    if (!selectedConversation || !otherParticipant) return

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherParticipant.id}),and(sender_id.eq.${otherParticipant.id},receiver_id.eq.${currentUserId})`,
      )
      .order("created_at", { ascending: true })

    setMessages(data || [])
    scrollToBottom()

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("receiver_id", currentUserId)
      .eq("sender_id", otherParticipant.id)
  }

  const sendMessage = async () => {
    if (!message.trim() || !otherParticipant) return

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherParticipant.id,
          message: message.trim(),
          conversationId: selectedConversation,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const { message: newMessage } = await response.json()

      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
      setMessage("")
      scrollToBottom()

      // Update conversation timestamp
      if (selectedConversation) {
        await supabase
          .from("chat_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", selectedConversation)

        // Update local conversations list
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation
              ? { ...conv, last_message_at: new Date().toISOString() }
              : conv
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete message")

      // ลบออกจาก state ทันที
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch (error) {
      console.error("Error deleting message:", error)
      alert("Failed to delete message. Please try again.")
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const filteredConversations = conversations.filter((conv) => {
    const participant = conv.participant1_id === currentUserId ? conv.participant2 : conv.participant1
    return participant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Start connecting with other users by messaging them from their profiles or posts in the community section."
          action={{
            label: "Explore Community",
            href: "/community",
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop: Fixed sidebar, Mobile: Hidden */}
      <div className="hidden md:flex md:w-80 border-r flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No conversations found</p>
              {searchQuery && (
                <Button variant="link" size="sm" onClick={() => setSearchQuery("")} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const participant = conv.participant1_id === currentUserId ? conv.participant2 : conv.participant1
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors ${selectedConversation === conv.id ? "bg-muted" : ""
                    }`}
                >
                  <Avatar>
                    <AvatarImage src={participant?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{participant?.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{participant?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </ScrollArea>
      </div>

      {/* Mobile: Sheet for conversations */}
      <Sheet open={mobileConversationsOpen} onOpenChange={setMobileConversationsOpen}>
        <SheetContent side="left" className="w-80 p-0 md:hidden">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filteredConversations.map((conv) => {
                const participant = conv.participant1_id === currentUserId ? conv.participant2 : conv.participant1
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv.id)
                      setMobileConversationsOpen(false)
                    }}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors ${selectedConversation === conv.id ? "bg-muted" : ""
                      }`}
                  >
                    <Avatar>
                      <AvatarImage src={participant?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{participant?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm md:text-base">{participant?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                )
              })}
            </ScrollArea>
          </div>
        </SheetContent>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedConversation && otherParticipant ? (
            <>
              {/* Chat Header with mobile menu trigger */}
              <div className="p-4 border-b flex items-center gap-3 flex-shrink-0">
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <Avatar>
                  <AvatarImage src={otherParticipant.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{otherParticipant.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm md:text-base">{otherParticipant.full_name}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === currentUserId
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 ${isOwn ? "bg-[#A07850] text-white" : "bg-[#F5EDE2] border border-[#D4B896]"
                              }`}
                          >
                            <p className="text-sm break-words">{msg.message}</p>
                            {isOwn && (
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="text-xs mt-1 text-white/50 hover:text-white/90"
                              >
                                ลบ
                              </button>
                            )}
                            <p
                              className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-[#6B4C30]"}`}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 md:p-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    className="text-sm md:text-base"
                  />
                  <Button onClick={sendMessage} disabled={!message.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <SheetTrigger asChild className="md:hidden mb-4">
                <Button>
                  <Menu className="mr-2 h-4 w-4" />
                  View Conversations
                </Button>
              </SheetTrigger>
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  )
}
