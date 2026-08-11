import { useState } from "react";
import { MessageSquare } from "lucide-react";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CommunicationCenter, {
  type AppMessage,
  type AppNotification,
  type AppUser,
} from "./pages/CommunicationCenter";
import type { AuditEntry } from "./pages/AuditLogs";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("token");
  });
  const [isCommOpen, setIsCommOpen] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AppUser;
    } catch {
      return null;
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [messages, setMessages] = useState<AppMessage[]>([
    {
      id: "m1",
      senderId: "u2",
      recipientId: "u1",
      type: "message",
      content: "Please review the Cybence scheduler tasks.",
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: "m2",
      senderId: "u4",
      recipientId: "u1",
      type: "remark",
      content: "Great progress on the UI task!",
      read: false,
      timestamp: new Date().toISOString(),
      taskId: "1",
    },
  ]);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "n1",
      userId: "u1",
      type: "task",
      title: "New Task Assigned",
      body: "You have been assigned to 'Payment Gateway Implementation'",
      read: false,
      timestamp: new Date().toISOString(),
    },
  ]);

  const handleSendMessage = (recipientId: string, content: string) => {
    if (!currentUser) return;
    setMessages((prev) => [
      {
        id: `m_${Date.now()}`,
        senderId: currentUser.id,
        recipientId,
        type: "message",
        content,
        read: true,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleMarkRead = (id: string) => {
    setMessages((prev) => prev.map((message) =>
      message.id === id ? { ...message, read: true } : message
    ));
    setNotifications((prev) => prev.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const unreadCount =
    messages.filter((message) => message.recipientId === currentUser?.id && !message.read).length +
    notifications.filter((notification) => notification.userId === currentUser?.id && !notification.read).length;

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setAuditLogs((prev) => [
      {
        id: `a_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.name,
        action: "User Login",
        entity: "User",
        details: `Login as ${user.name}`,
      },
      ...prev,
    ]);
  };

  const handleLogout = () => {
    if (currentUser) {
      setAuditLogs((prev) => [
        {
          id: `a_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: "User Logout",
          entity: "User",
          details: `Signed out ${currentUser.name}`,
        },
        ...prev,
      ]);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setIsCommOpen(false);
    setHighlightedTaskId(null);
    setCurrentUser(null);
  };

  if (!isLoggedIn || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderCurrentPage = () => (
    <Dashboard
      onLogout={handleLogout}
      highlightedTaskId={highlightedTaskId}
      onTaskHighlightHandled={() => setHighlightedTaskId(null)}
      currentUser={currentUser}
      auditLogs={auditLogs}
    />
  );

  return (
    <div className="app-shell relative min-h-screen">
      <div className="app-quick-actions fixed right-4 top-4 z-60 md:right-6 md:top-6">
        <button
          type="button"
          onClick={() => setIsCommOpen(true)}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
          aria-label="Open communication center"
          title="Communication Center"
        >
          <MessageSquare className="h-4 w-4 text-[#106fb8]" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        </div>

      {isCommOpen && (
        <CommunicationCenter
          messages={messages}
          notifications={notifications}
          currentUser={currentUser}
          onClose={() => setIsCommOpen(false)}
          onSend={handleSendMessage}
          onMarkRead={handleMarkRead}
        />
      )}

      {renderCurrentPage()}
    </div>
  );
}

export default App;