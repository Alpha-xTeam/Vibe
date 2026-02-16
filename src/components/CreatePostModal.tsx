import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageCompression';
import { API_URL } from '../utils/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, hasCode: boolean, attachedImage?: string | null, codeLanguage?: string, code?: string) => void;
}

const MAX_CHARS = 500;

const EMOJI_LIST = ['🚀', '💡', '🔥', '✨', '🎯', '💻', '🧠', '⚡', '🎨', '🛠️', '📦', '🌟'];

export const CreatePostModal = ({ isOpen, onClose, onSubmit }: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [isDragging, setIsDragging] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Suggestion States
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [suggestionCursor, setSuggestionCursor] = useState(0);
  const [mentionPos, setMentionPos] = useState({ start: 0, end: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const charCount = content.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !uploading;

  // Auto focus & Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setCode('');
      setShowCodeInput(false);
      setShowEmojiPicker(false);
      setAttachedImage(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // Keyboard handling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Prevent Submit if suggestions are open (User might want to select a user with Enter)
      if (showSuggestions) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
        handleSubmit();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, canSubmit, content, code, showCodeInput, showSuggestions]);

  // Scroll suggestion into view when cursor changes
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const activeElement = suggestionsRef.current.children[suggestionCursor] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [suggestionCursor, showSuggestions]);

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    if (!user) return navigate('/login');

    setUploading(true);
    let imageUrl = attachedImage;

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const token = localStorage.getItem('vibe_token');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/uploads/post-image`, {
          method: 'POST',
          body: formData,
          headers,
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          imageUrl = data.url;
        }
      }

      onSubmit(
        showCodeInput && code.trim() ? `${content}\n\nCode:\n${code}` : content,
        showCodeInput && !!code.trim(),
        imageUrl,
        codeLanguage,
        code
      );
      onClose();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  }, [canSubmit, content, code, showCodeInput, onSubmit, onClose, attachedImage, imageFile, codeLanguage, user, API_URL]);

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    // Keep focus
    textareaRef.current?.focus();
  };

  const handleMentionSelect = (handle: string) => {
    const before = content.slice(0, mentionPos.start);
    const after = content.slice(mentionPos.end);
    const newContent = `${before}@${handle} ${after}`;
    setContent(newContent);
    setShowSuggestions(false);
    textareaRef.current?.focus();

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionPos.start + handle.length + 2; // @ + handle + space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setContent(value);

    // Check for @mention
    const lastAt = value.lastIndexOf('@', cursor - 1);
    if (lastAt !== -1) {
      const textAfterAt = value.slice(lastAt + 1, cursor);
      // Valid mention chars: letters, numbers, underscore
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionPos({ start: lastAt, end: cursor });
        fetchSuggestions(textAfterAt);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const fetchSuggestions = async (q: string) => {
    setIsSearchingUsers(true);
    try {
      const token = localStorage.getItem('vibe_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/posts/search/users?q=${q}`, {
        headers,
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.users);
        setShowSuggestions(true); // Always show, empty list means "no users found"
        setSuggestionCursor(0);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file);
        setImageFile(compressed);
        const reader = new FileReader();
        reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
        reader.readAsDataURL(compressed);
      } catch (err) {
        // Fallback to original
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const getCharColor = () => {
    if (charPercentage > 100) return 'text-red-400';
    if (charPercentage > 80) return 'text-yellow-400';
    return 'text-content-muted';
  };

  const getProgressColor = () => {
    if (charPercentage > 100) return 'stroke-red-400';
    if (charPercentage > 80) return 'stroke-yellow-400';
    return 'stroke-neon';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl bg-surface border-x-0 sm:border border-line rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-[60] bg-surface/90 border-2 border-dashed border-neon rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm animate-pulse">
            <div className="w-20 h-20 rounded-full bg-neon/10 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-lg font-bold text-neon">Release to Upload</p>
          </div>
        )}

        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon/60 to-transparent z-10" />

        {/* Header - Fixed on Mobile */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-surface/95 backdrop-blur-sm z-10 shrink-0 border-b border-line/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl hover:bg-line/50 transition-colors text-content-muted hover:text-content"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-bold text-content leading-tight">New Transmission</h2>
              <p className="hidden sm:block text-[10px] text-content-muted font-mono uppercase tracking-wider">
                Broadcasting to the network
              </p>
            </div>
          </div>

          {/* Draft indicator */}
          {content.length > 0 && !uploading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon/5 border border-neon/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
              </span>
              <span className="text-[10px] text-neon font-bold tracking-wide">DRAFT</span>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
          <div className="p-4 sm:p-5">
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="shrink-0 hidden sm:block">
                <div className="relative">
                  <img
                    src={user?.avatar || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='}
                    alt={user?.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-line"
                  />
                  {user && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-neon rounded-full border-2 border-surface flex items-center justify-center">
                      <svg className="w-2 h-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Composer */}
              <div className="flex-1 min-w-0 relative">

                {/* Mobile User Info */}
                <div className="flex sm:hidden items-center gap-2 mb-3">
                  <img
                    src={user?.avatar || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-line"
                  />
                  <div>
                    <span className="block text-sm font-bold text-content">{user?.name || 'Guest'}</span>
                    {user?.handle && <span className="block text-[10px] text-content-muted font-mono">@{user.handle}</span>}
                  </div>
                </div>

                {user ? (
                  <>
                    <textarea
                      ref={textareaRef}
                      placeholder="What are you building? Share your thoughts..."
                      className="w-full bg-transparent text-content placeholder:text-content-muted/50 focus:outline-none resize-none text-base sm:text-[15px] leading-relaxed min-h-[150px] sm:min-h-[120px]"
                      value={content}
                      onChange={handleContentChange}
                      onKeyDown={(e) => {
                        if (showSuggestions) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSuggestionCursor(prev => (prev + 1) % suggestions.length);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSuggestionCursor(prev => (prev - 1 + suggestions.length) % suggestions.length);
                          } else if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            if (suggestions[suggestionCursor]) handleMentionSelect(suggestions[suggestionCursor].handle);
                          } else if (e.key === 'Escape') {
                            setShowSuggestions(false);
                          }
                        }
                      }}
                      maxLength={MAX_CHARS + 50}
                      dir="auto"
                    />

                    {/* --- IMPROVED MENTION SUGGESTIONS --- */}
                    {showSuggestions && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 sm:w-72 overflow-hidden rounded-xl border border-neon/30 bg-surface/95 backdrop-blur-xl shadow-[0_0_30px_-5px_rgba(0,0,0,0.5)] ring-1 ring-neon/20">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-neon/10 to-transparent border-b border-line">
                          <span className="text-[10px] font-bold text-neon font-mono uppercase tracking-widest">
                            {isSearchingUsers ? 'Searching...' : 'Mentions'}
                          </span>
                          <span className="text-[9px] text-content-muted font-mono bg-surface/50 px-1.5 py-0.5 rounded">
                            TAB to select
                          </span>
                        </div>

                        {/* List */}
                        <div ref={suggestionsRef} className="overflow-y-auto max-h-48 custom-scrollbar">
                          {isSearchingUsers && suggestions.length === 0 && (
                            <div className="p-4 text-center">
                              <div className="w-5 h-5 mx-auto border-2 border-neon/30 border-t-neon rounded-full animate-spin" />
                            </div>
                          )}

                          {!isSearchingUsers && suggestions.length === 0 && (
                            <div className="p-4 text-center text-xs text-content-muted">
                              No users found matching input.
                            </div>
                          )}

                          {suggestions.map((s, i) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleMentionSelect(s.handle)}
                              onMouseEnter={() => setSuggestionCursor(i)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 ${i === suggestionCursor
                                  ? 'bg-neon/10 border-l-2 border-neon pl-[10px]'
                                  : 'hover:bg-line/20 border-l-2 border-transparent'
                                }`}
                            >
                              <img
                                src={s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.handle}`}
                                className="w-8 h-8 rounded-lg object-cover bg-black"
                                alt=""
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-bold truncate ${i === suggestionCursor ? 'text-neon' : 'text-content'}`}>
                                    {s.full_name}
                                  </p>
                                  {s.is_ai && (
                                    <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-purple-500/20 text-purple-400 leading-none border border-purple-500/30">
                                      AI
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-content-muted font-mono truncate opacity-80">@{s.handle}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 bg-line/5 rounded-xl border border-line text-center my-4">
                    <p className="mb-3 text-content-muted">You must be signed in to create a post.</p>
                    <button onClick={() => navigate('/login')} className="px-5 py-2 rounded-lg bg-neon text-black font-bold hover:shadow-[0_0_15px_rgba(var(--neon),0.4)] transition-all">Sign in</button>
                  </div>
                )}

                {/* Attached Image Preview */}
                {attachedImage && (
                  <div className="relative mt-4 rounded-xl overflow-hidden border border-line group bg-black/40">
                    <img
                      src={attachedImage}
                      alt="Attached"
                      className="w-full max-h-64 object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <button
                      onClick={() => setAttachedImage(null)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-red-500/80 backdrop-blur-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Code Block */}
                {showCodeInput && (
                  <div className="mt-4 rounded-xl border border-line bg-black/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Code Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-line/10">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                        </div>
                        <select
                          value={codeLanguage}
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          className="bg-transparent text-xs text-neon font-mono uppercase focus:outline-none cursor-pointer hover:bg-white/5 rounded px-1"
                        >
                          {['javascript', 'typescript', 'python', 'rust', 'go', 'css', 'html', 'sql', 'bash'].map(lang => (
                            <option key={lang} value={lang} className="bg-surface text-content">
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => { setShowCodeInput(false); setCode(''); }}
                        className="text-content-muted hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-3">
                      <textarea
                        placeholder="// Paste your code here..."
                        className="w-full bg-transparent text-neon font-mono text-xs sm:text-sm placeholder:text-content-muted/30 focus:outline-none resize-none min-h-[140px] leading-relaxed"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mt-3 p-3 rounded-xl border border-line bg-line/5 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-content-muted font-mono uppercase tracking-wider">Quick Select</span>
                      <button onClick={() => setShowEmojiPicker(false)} className="text-content-muted hover:text-content"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="grid grid-cols-6 sm:flex sm:flex-wrap gap-2">
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="aspect-square sm:w-8 sm:h-8 rounded-lg hover:bg-neon/10 flex items-center justify-center text-xl sm:text-lg transition-transform hover:scale-110 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Spacer to ensure content doesn't get hidden behind fixed footer on mobile */}
          <div className="h-24 sm:h-0"></div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-line w-full" />

        {/* Footer Toolbar - Sticky on Desktop, Fixed bottom on Mobile */}
        <div className="p-3 sm:px-5 sm:py-4 bg-surface sm:bg-transparent z-20 shrink-0 flex items-center gap-3 sm:gap-4 w-full">

          {/* Left Tools (Scrollable on mobile) */}
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-2 pr-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <ToolbarButton
              isActive={!!attachedImage}
              onClick={() => fileInputRef.current?.click()}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              label="Image"
            />

            <ToolbarButton
              isActive={showCodeInput}
              onClick={() => { setShowCodeInput(!showCodeInput); setShowEmojiPicker(false); }}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />}
              label="Code"
            />

            <ToolbarButton
              isActive={showEmojiPicker}
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowCodeInput(false); }}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
              label="Emoji"
            />

            <div className="w-[1px] h-6 bg-line mx-1 shrink-0" />

            <button className="p-2 sm:p-2.5 rounded-xl hover:bg-neon/10 text-content-muted hover:text-neon transition-all shrink-0">
              <span className="text-xs font-bold font-mono">GIF</span>
            </button>

            <button className="p-2 sm:p-2.5 rounded-xl hover:bg-neon/10 text-content-muted hover:text-neon transition-all shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>

          {/* Right: Counter + Submit */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Character Counter (Hidden on very small screens if needed, but flex handles it) */}
            {content.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" className="stroke-line" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      className={getProgressColor()}
                      strokeWidth="3"
                      strokeDasharray={`${Math.min(charPercentage, 100) * 0.942} 94.2`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.2s ease' }}
                    />
                  </svg>
                  {charPercentage > 80 && (
                    <span className={`absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] font-bold ${getCharColor()}`}>
                      {MAX_CHARS - charCount}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed bg-neon text-black shadow-lg shadow-neon/20 hover:shadow-neon/40 hover:scale-105 active:scale-95"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Sending</span>
                </>
              ) : (
                <>
                  <span>Transmit</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for tool buttons to clean up JSX
const ToolbarButton = ({ isActive, onClick, icon, label }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 group ${isActive
        ? 'bg-neon/10 text-neon ring-1 ring-neon/50'
        : 'hover:bg-neon/5 text-content-muted hover:text-neon'
      }`}
    title={label}
  >
    <svg className={`w-5 h-5 sm:w-5 sm:h-5 transition-transform ${!isActive && 'group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {icon}
    </svg>
  </button>
);