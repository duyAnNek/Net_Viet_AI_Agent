import { useEffect, useMemo, useRef, useState } from 'react';

export default function ChatSidebar({
  open, onToggle,
  conversations, activeId, onSelect,
  onNew, onRename, onDelete, onClear,
  formatTime, fallbackTitle = 'LunaAssist',
  focusSearchSignal = 0,
  onOpenSearch,
}) {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (focusSearchSignal > 0) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusSearchSignal]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.messages || []).some(m => (m.text || '').toLowerCase().includes(q))
    );
  }, [search, conversations]);

  return (
    <>
      <div className="sidebar-rail d-none d-lg-flex">
        <button
          className="btn btn-light btn-rail"
          title={open ? 'Ẩn menu' : 'Mở menu'}
          onClick={() => onToggle(!open)}
        >
          <i className={`bi ${open ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`}></i>
        </button>

        <div className="rail-sep" />

        <button
          className="btn btn-light btn-rail"
          title="Tìm kiếm đoạn chat"
          onClick={() => onOpenSearch?.()}
        >
          <i className="bi bi-search"></i>
        </button>
      </div>

      <aside className={`chat-sidebar-left ${open ? 'open' : 'collapsed'}`}>
        {open && (
          <div className="sidebar-body p-3 d-flex flex-column h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold d-flex align-items-center gap-2 text-primary">
                <i className="bi bi-magic"></i> LunaAssist
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onToggle(false)}
                title="Thu gọn"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </div>

            <div className="sidebar-search mb-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Tìm kiếm đoạn chat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
              onClick={onNew}
            >
              <i className="bi bi-plus-circle"></i> Đoạn chat mới
            </button>

            <div className="chat-history flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
              {list.length === 0 ? (
                <div className="text-muted small text-center py-3">
                  Không tìm thấy đoạn chat phù hợp.
                </div>
              ) : (
                list.map((c) => (
                  <div
                    key={c.id}
                    className={`history-item p-3 rounded-3 mb-2 position-relative ${
                      c.id === activeId ? 'active' : ''
                    }`}
                    onClick={() => onSelect(c.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="flex-grow-1 text-truncate">
                        <div className="d-flex align-items-center gap-1 text-truncate">
                          <i className="bi bi-chat-left-text text-primary"></i>
                          <span className="text-truncate">
                            {c.title || fallbackTitle}
                          </span>
                        </div>
                        <div className="small text-muted mt-1">
                          {formatTime(c.updatedAt || c.createdAt)}
                        </div>
                      </div>

                      <div className="dropdown" ref={menuRef}>
                        <button
                          className="btn btn-sm btn-link text-muted p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === c.id ? null : c.id);
                          }}
                          title="Tùy chọn"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>

                        {menuOpen === c.id && (
                          <div
                            className="dropdown-menu show position-absolute end-0 mt-1 shadow-sm"
                            style={{ zIndex: 1100, minWidth: '140px' }}
                          >
                            <button
                              className="dropdown-item d-flex align-items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRename(c.id);
                                setMenuOpen(null);
                              }}
                            >
                              <i className="bi bi-pencil-square"></i> Đổi tên
                            </button>
                            <button
                              className="dropdown-item d-flex align-items-center gap-2 text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(c.id);
                                setMenuOpen(null);
                              }}
                            >
                              <i className="bi bi-trash3"></i> Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 mt-auto">
              <button className="btn btn-outline-secondary w-100" onClick={onClear}>
                <i className="bi bi-trash me-1"></i> Xóa tất cả
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}