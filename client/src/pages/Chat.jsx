// client/src/pages/Chat.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { chatService } from '../services/chat.service';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

const DEFAULT_TITLE = 'LunaAssist';

function createNewConversation() {
  const id = 'c_' + Date.now();
  return {
    id,
    title: DEFAULT_TITLE,
    messages: [{ sender: 'bot', text: 'Xin chào, mình là LunaAssist! Mình có thể giúp gì? 🤖' }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function Chat() {
  const { user } = useAuth();

  const STORAGE_KEY = useMemo(
    () => `conversations_v1_${user?.id || user?.email || 'guest'}`,
    [user?.id, user?.email]
  );
  const SIDEBAR_KEY = useMemo(
    () => `chat_sidebar_open_v1_${user?.id || user?.email || 'guest'}`,
    [user?.id, user?.email]
  );

  const [conversations, setConversations] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch {}
    return [createNewConversation()];
  });

  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY);
      if (raw !== null) return JSON.parse(raw);
    } catch {}
    return true;
  });

  // FIX: thêm state để không bị ReferenceError
  const [focusSearchSignal, setFocusSearchSignal] = useState(0);

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 992px)').matches
      : true
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 992px)');
    const handler = (e) => {
      const matches = typeof e.matches === 'boolean' ? e.matches : mq.matches;
      setIsDesktop(matches);
      if (!matches) setSidebarOpen(false);
    };
    handler(mq);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  // WebSocket connect (ưu tiên WS)
  useEffect(() => {
    const s = connectSocket();
    const onConnect = () => console.log('[WS] connected', s.id);
    const onDisconnect = () => console.log('[WS] disconnected');
    const onError = (e) => console.warn('[WS] error:', e?.message || e);
    const onReconnectError = (e) => console.warn('[WS] reconnect_error:', e?.message || e);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('error', onError);
    s.on('connect_error', onError);
    s.on('reconnect_error', onReconnectError);
    // test ping
    s.emit('ping', Date.now(), (ack) => console.log('[WS] ping ack', ack));

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('error', onError);
      s.off('connect_error', onError);
      s.off('reconnect_error', onReconnectError);
      disconnectSocket();
    };
  }, []);

  // Ẩn sidebar mặc định trên mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 992px)').matches) {
      setSidebarOpen(false);
    }
  }, []);

  const endRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) {
          setConversations(arr);
          setActiveId(arr[0].id);
          return;
        }
      }
    } catch {}
    const conv = createNewConversation();
    setConversations([conv]);
    setActiveId(conv.id);
  }, [STORAGE_KEY]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY);
      if (raw !== null) setSidebarOpen(JSON.parse(raw));
      else setSidebarOpen(true);
    } catch {}
  }, [SIDEBAR_KEY]);

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, STORAGE_KEY]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen, SIDEBAR_KEY]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) || conversations[0],
    [conversations, activeId]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const setActiveConv = (conv) => {
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? conv : c)));
  };

  const newChat = () => {
    const conv = createNewConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setInput('');
  };

  const deleteChat = (id) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const conv = createNewConversation();
        setActiveId(conv.id);
        return [conv];
      }
      if (id === activeId) setActiveId(filtered[0].id);
      return filtered;
    });
  };

  const renameChat = (id) => {
    const name = window.prompt('Đặt tên cuộc trò chuyện:');
    if (name && name.trim()) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, title: name.trim(), updatedAt: Date.now() } : c
        )
      );
    }
  };

  const clearAll = () => {
    if (!window.confirm('Xóa toàn bộ lịch sử?')) return;
    const conv = createNewConversation();
    setConversations([conv]);
    setActiveId(conv.id);
  };

  // Gửi text: ưu tiên WebSocket, fallback REST
  const sendText = async (text) => {
    const t = (text || '').trim();
    if (!t) return;
    const cur = activeConv || createNewConversation();
    if (!activeConv) {
      setConversations([cur, ...conversations]);
      setActiveId(cur.id);
    }
    const convUser = {
      ...cur,
      messages: [...cur.messages, { sender: 'me', text: t }],
      title: cur.title === DEFAULT_TITLE || !cur.title ? t.slice(0, 40) : cur.title,
      updatedAt: Date.now(),
    };
    setActiveConv(convUser);

    const s = getSocket?.();
    if (s?.connected) {
      s.emit('chat:send', { message: t }, (ack) => {
        const replyText = (ack && ack.reply) || 'Có lỗi. Thử lại sau.';
        const convBot = {
          ...convUser,
          messages: [...convUser.messages, { sender: 'bot', text: replyText }],
          updatedAt: Date.now(),
        };
        setActiveConv(convBot);
      });
      return;
    }

    try {
      const data = await chatService.send(t);
      const convBot = {
        ...convUser,
        messages: [...convUser.messages, { sender: 'bot', text: data.reply }],
        updatedAt: Date.now(),
      };
      setActiveConv(convBot);
    } catch {
      const convErr = {
        ...convUser,
        messages: [...convUser.messages, { sender: 'bot', text: 'Có lỗi. Thử lại sau.' }],
        updatedAt: Date.now(),
      };
      setActiveConv(convErr);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!activeConv) return;
    const txt = input.trim();
    if (!txt) return;
    setInput('');
    await sendText(txt);
  };

  const formatTime = (ts) => new Date(ts).toLocaleString();
  const layoutCls = `chat-shell ${isDesktop ? (sidebarOpen ? 'sidebar-open' : 'sidebar-closed') : ''}`;

  return (
    <div className="row g-0">
      <div className={`col-12 px-0 ${layoutCls}`} style={{ minHeight: '70vh' }}>
        <ChatSidebar
          open={sidebarOpen}
          onToggle={setSidebarOpen}
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            if (!isDesktop) setSidebarOpen(false);
          }}
          onNew={() => {
            newChat();
            if (!isDesktop) setSidebarOpen(false);
          }}
          onRename={renameChat}
          onDelete={deleteChat}
          onClear={clearAll}
          formatTime={formatTime}
          fallbackTitle={DEFAULT_TITLE}
          onOpenSearch={() => {
            setSidebarOpen(true);
            setFocusSearchSignal((s) => s + 1);
          }}
          focusSearchSignal={focusSearchSignal}
        />

        <div className="chat-center-col">
          <div className="card chat-card p-3">
            <div className="d-flex align-items-center justify-content-start px-2">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-inline-flex d-lg-none"
                  onClick={() => setSidebarOpen((s) => !s)}
                  title={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
                >
                  <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-layout-sidebar'}`}></i>
                </button>

                <h4 className="section-title d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-stars text-primary d-none d-lg-inline"></i>
                  {activeConv?.title || DEFAULT_TITLE}
                </h4>
              </div>
            </div>

            <div className="section-underline mb-3"></div>

            <ChatMessages messages={activeConv?.messages || []} endRef={endRef} />
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              showSuggest={(activeConv?.messages?.length || 0) <= 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}