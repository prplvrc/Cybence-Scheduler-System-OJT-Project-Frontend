import React, { useState } from "react";
import {
  MessageSquare as MessageSquareIcon,
  Send as SendIcon,
  X as XIcon,
  Inbox as InboxIcon,
  Hash as HashIcon,
  AtSign as AtSignIcon,
  Bell as BellIcon,
  CalendarDays as CalendarDaysIcon,
  Info as InfoIcon,
  FileText as FileTextIcon,
} from "lucide-react";

// --- Types ---
export interface AppUser {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface AppMessage {
  id: string;
  senderId: string;
  recipientId: string;
  type: "message" | "remark" | "mention";
  content: string;
  read: boolean;
  timestamp: string;
  taskId?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "task" | "system" | "mention" | "request";
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
}

type CommTab = "inbox" | "remarks" | "mentions" | "notifications";

// Helper utilities / mock helpers
const USERS: AppUser[] = [
  { id: "u1", name: "Perpaulo Varca", role: "Intern" },
  { id: "u2", name: "Daniel", role: "Developer" },
  { id: "u3", name: "Mae", role: "Designer" },
  { id: "u4", name: "Janina", role: "Manager" },
];

function getUserById(id: string) {
  return USERS.find((u) => u.id === id);
}

function formatRelative(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function AvatarEl({ user }: { user?: AppUser; size?: string }) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
    : "U";
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#106fb8]/10 text-xs font-bold text-[#106fb8]">
      {initials}
    </div>
  );
}

// --- Component ---
export default function CommunicationCenter({
  messages,
  notifications,
  currentUser,
  onClose,
  onSend,
  onMarkRead,
}: {
  messages: AppMessage[];
  notifications: AppNotification[];
  currentUser: AppUser;
  onClose: () => void;
  onSend: (recipientId: string, content: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const [tab, setTab] = useState<CommTab>("inbox");
  const [composeTo, setComposeTo] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [localReplies, setLocalReplies] = useState<Record<string, AppMessage[]>>({});

  void onMarkRead;

  const inbox = messages.filter(
    (m) => m.recipientId === currentUser.id && m.type === "message"
  );
  const remarks = messages.filter(
    (m) =>
      m.type === "remark" &&
      (m.recipientId === currentUser.id || m.senderId === currentUser.id)
  );
  const mentions = messages.filter(
    (m) => m.type === "mention" && m.recipientId === currentUser.id
  );
  const myNotifs = notifications.filter((n) => n.userId === currentUser.id);

  const counts: Record<CommTab, number> = {
    inbox: inbox.filter((m) => !m.read).length,
    remarks: remarks.filter((m) => !m.read).length,
    mentions: mentions.filter((m) => !m.read).length,
    notifications: myNotifs.filter((n) => !n.read).length,
  };

  const conversationMap = inbox.reduce<Record<string, { sender: AppUser; messages: AppMessage[] }>>(
    (acc, message) => {
      const sender = getUserById(message.senderId) ?? {
        id: message.senderId,
        name: "Unknown",
      };
      if (!acc[message.senderId]) {
        acc[message.senderId] = { sender, messages: [] };
      }
      acc[message.senderId].messages.push(message);
      return acc;
    },
    {}
  );

  const conversations = Object.values(conversationMap).map((conversation) => ({
    ...conversation,
    messages: conversation.messages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
  }));

  const selectedConversation = selectedConversationId
    ? conversations.find((c) => c.sender.id === selectedConversationId) ?? null
    : conversations[0] ?? null;

  const selectedSender = selectedConversation?.sender ?? null;

  const MessageRow = ({ msg }: { msg: AppMessage }) => {
    const sender = getUserById(msg.senderId);
    return (
      <div
        className={cn(
          "p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 border",
          msg.read ? "border-transparent" : "border-blue-100 bg-blue-50/30"
        )}
        onClick={() => {
          onMarkRead(msg.id);
          setSelectedConversationId(msg.senderId);
          setTab("inbox");
        }}
      >
        <div className="flex items-start gap-2.5">
          <AvatarEl user={sender} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">
                {sender?.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatRelative(msg.timestamp)}
              </p>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
              {msg.content}
            </p>
            {msg.taskId && (
              <p className="text-[10px] text-[#106fb8] mt-1 flex items-center gap-1">
                <HashIcon className="w-2.5 h-2.5" />
                Task reference
              </p>
            )}
          </div>
          {!msg.read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
          )}
        </div>
      </div>
    );
  };

  const NotifRow = ({ n }: { n: AppNotification }) => {
    const icons: Record<AppNotification["type"], React.ElementType> = {
      task: CalendarDaysIcon,
      system: InfoIcon,
      mention: AtSignIcon,
      request: FileTextIcon,
    };
    const Icon = icons[n.type];
    return (
      <div
        className={cn(
          "p-3 rounded-xl transition-all border cursor-pointer",
          n.read ? "border-transparent" : "border-blue-100 bg-blue-50/30"
        )}
        onClick={() => onMarkRead(n.id)}
      >
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#106fb8]/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-[#106fb8]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700">{n.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {formatRelative(n.timestamp)}
            </p>
          </div>
          {!n.read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
          )}
        </div>
      </div>
    );
  };

  const TABS: { id: CommTab; label: string; icon: React.ElementType }[] = [
    { id: "inbox", label: "Inbox", icon: InboxIcon },
    { id: "remarks", label: "Remarks", icon: HashIcon },
    { id: "mentions", label: "Mentions", icon: AtSignIcon },
    { id: "notifications", label: "Alerts", icon: BellIcon },
  ];

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeContent.trim()) return;
    onSend(composeTo, composeContent.trim());
    setComposeContent("");
    setComposeTo("");
    setShowCompose(false);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !replyContent.trim()) return;

    const nextReplyIndex = (localReplies[selectedConversation.sender.id] ?? []).length + 1;

    const replyMessage: AppMessage = {
      id: `reply-${selectedConversation.sender.id}-${nextReplyIndex}`,
      senderId: currentUser.id,
      recipientId: selectedConversation.sender.id,
      type: "message",
      content: replyContent.trim(),
      read: true,
      timestamp: new Date().toISOString(),
    };

    onSend(selectedConversation.sender.id, replyContent.trim());
    setLocalReplies((prev) => ({
      ...prev,
      [selectedConversation.sender.id]: [
        ...(prev[selectedConversation.sender.id] ?? []),
        replyMessage,
      ],
    }));
    setReplyContent("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-295 h-[94vh] rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <MessageSquareIcon className="w-4 h-4 text-[#106fb8]" />
            Communication Center
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompose((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Compose"
            >
              <SendIcon className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Compose Form */}
        {showCompose && (
          <form
            onSubmit={handleCompose}
            className="px-4 py-3 border-b border-slate-100 bg-slate-50 space-y-2 shrink-0"
          >
            <select
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#106fb8]/20 focus:border-[#106fb8] bg-white"
            >
              <option value="">Send to…</option>
              {USERS.filter((u) => u.id !== currentUser.id).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#106fb8]/20 focus:border-[#106fb8] bg-white"
              />
              <button
                type="submit"
                className="p-2 bg-[#106fb8] text-white rounded-lg hover:bg-[#0d5d9e] transition-colors cursor-pointer"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-2 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium border-b-2 transition-all relative cursor-pointer",
                tab === t.id
                  ? "border-[#106fb8] text-[#106fb8]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
              {counts[t.id] > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {counts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-3" style={{ scrollbarWidth: "thin" }}>
          {tab === "inbox" && (
            <div className="flex h-full min-h-0 flex-col gap-4 xl:flex-row xl:items-stretch">
              <div className="flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden xl:w-85 xl:min-h-full">
                <div className="px-4 py-3 border-b border-slate-200 bg-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Conversations
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {conversations.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      No messages
                    </div>
                  ) : (
                    conversations.map((conversation) => {
                      const isActive = selectedConversationId === conversation.sender.id;
                      const latest = conversation.messages[conversation.messages.length - 1];
                      const unreadCount = conversation.messages.filter((m) => !m.read).length;
                      return (
                        <button
                          key={conversation.sender.id}
                          onClick={() => {
                            conversation.messages
                              .filter((m) => !m.read)
                              .forEach((m) => onMarkRead(m.id));
                            setSelectedConversationId(conversation.sender.id);
                          }}
                          className={cn(
                            "w-full text-left rounded-2xl p-3 transition-all border flex items-start gap-3",
                            isActive
                              ? "border-[#106fb8] bg-white shadow-sm"
                              : "border-transparent hover:bg-white"
                          )}
                        >
                          <AvatarEl user={conversation.sender} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {conversation.sender.name}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {formatRelative(latest.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {latest.content}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <span className="min-w-[1.35rem] rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white text-center">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-slate-200 bg-white overflow-hidden xl:min-h-full">
                {selectedConversation ? (
                  <>
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <AvatarEl user={selectedSender ?? undefined} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedSender?.name || "Unknown sender"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedConversation.messages.length} messages
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {selectedConversation.messages.map((message) => (
                          <div key={message.id} className="flex flex-col">
                            <div
                              className={cn(
                                "inline-block max-w-[70%] rounded-[20px] p-3 text-sm",
                                message.senderId === currentUser.id
                                  ? "self-end bg-[#106fb8] text-white rounded-tr-sm rounded-bl-[20px] rounded-br-[20px]"
                                    : "self-start bg-slate-100 text-slate-700 rounded-tl-sm rounded-br-[20px] rounded-bl-[20px]"
                              )}
                            >
                              {message.content}
                            </div>
                            <span className="mt-1 text-[10px] text-slate-400">
                              {formatRelative(message.timestamp)}
                            </span>
                          </div>
                        ))}
                        {(localReplies[selectedConversation.sender.id] ?? []).map((message) => (
                          <div key={message.id} className="flex flex-col self-end">
                            <div className="inline-block max-w-[70%] rounded-[20px] bg-[#106fb8] p-3 text-sm text-white rounded-tr-sm rounded-bl-[20px] rounded-br-[20px]">
                              {message.content}
                            </div>
                            <span className="mt-1 text-[10px] text-slate-400 self-end">
                              {formatRelative(message.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-200 p-4">
                        <form onSubmit={handleReply} className="space-y-3">
                          <div className="rounded-3xl border border-slate-200 p-4">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={4}
                              placeholder={`Reply to ${selectedSender?.name}`}
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#106fb8]/20 focus:border-[#106fb8]"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedConversationId(null)}
                              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              Close
                            </button>
                            <button
                              type="submit"
                              className="rounded-2xl bg-[#106fb8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d5d9e] transition-colors"
                            >
                              Send Reply
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-50 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Select a conversation from the left to view the messages.
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === "remarks" && (
            <>
              {remarks.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No task remarks
                </div>
              )}
              {remarks.map((m) => (
                <MessageRow key={m.id} msg={m} />
              ))}
            </>
          )}
          {tab === "mentions" && (
            <>
              {mentions.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No mentions
                </div>
              )}
              {mentions.map((m) => (
                <MessageRow key={m.id} msg={m} />
              ))}
            </>
          )}
          {tab === "notifications" && (
            <>
              {myNotifs.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No notifications
                </div>
              )}
              {myNotifs.map((n) => (
                <NotifRow key={n.id} n={n} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}