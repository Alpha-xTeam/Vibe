import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageCompression';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !uploading;

  // Auto focus
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setCode('');
      setShowCodeInput(false);
      setShowEmojiPicker(false);
      setAttachedImage(null);
    }
  }, [isOpen]);

  // Keyboard shortcut: Cmd+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
  }, [isOpen, canSubmit, content, code, showCodeInput]);

  const navigate = useNavigate();
  const { user } = useAuth();
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    if (!user) return navigate('/login');
    
    setUploading(true);
    let imageUrl = attachedImage;

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const res = await fetch(`${API_URL}/uploads/post-image`, {
          method: 'POST',
          body: formData,
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
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file);
        setImageFile(compressed);
        const reader = new FileReader();
        reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
        reader.readAsDataURL(compressed);
      } catch (err) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file);
        setImageFile(compressed);
        const reader = new FileReader();
        reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
        reader.readAsDataURL(compressed);
      } catch (err) {
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
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <div
            className="relative w-full sm:max-w-xl bg-surface border border-line rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden h-[92vh] sm:h-auto sm:min-h-0"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-50 bg-neon/5 border-2 border-dashed border-neon/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-neon/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-neon">Drop your image here</p>
                </div>
              </div>
            )}

            {/* Top Neon Line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-xl hover:bg-line/50 transition-colors text-content-muted hover:text-content"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-base font-bold text-content">New Transmission</h2>
                  <p className="text-[10px] text-content-muted font-mono uppercase tracking-wider mt-0.5">
                    Broadcasting to the network
                  </p>
                </div>
              </div>

              {/* Draft indicator */}
              {content.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon/5 border border-neon/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon" />
                  <span className="text-[10px] text-neon font-medium">Draft</span>
                </div>
              )}
            </div>

            {/* Composer Body */}
            <div className="px-5 pb-4">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={user?.avatar || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='}
                    alt={user?.name || 'Guest'}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-line"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-surface flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-content">{user?.name || 'Sign in to post'}</span>
                    <span className="text-xs text-content-muted">{user?.handle || ''}</span>
                  </div>

                  {user ? (
                    <textarea
                      ref={textareaRef}
                      placeholder="What are you building? Share your thoughts..."
                      className="w-full bg-transparent text-content placeholder:text-content-muted/50 focus:outline-none resize-none text-[15px] leading-relaxed min-h-[120px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={MAX_CHARS + 50}
                    />
                  ) : (
                    <div className="p-6 bg-background rounded-xl border border-line text-center">
                      <p className="mb-3 text-content-muted">You must be signed in to create a post.</p>
                      <div className="flex justify-center">
                        <button onClick={() => navigate('/login')} className="px-4 py-2 rounded bg-neon text-black font-bold">Sign in</button>
                      </div>
                    </div>
                  )}

                  {/* Attached Image Preview */}
                  {attachedImage && (
                    <div className="relative mt-3 rounded-xl overflow-hidden border border-line group">
                      <img
                        src={attachedImage}
                        alt="Attached"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <button
                        onClick={() => setAttachedImage(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Code Block */}
                    {showCodeInput && (
                      <div className="overflow-hidden">
                        <div className="mt-4 rounded-xl border border-line bg-background overflow-hidden">
                          {/* Code Header */}
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-surface/50">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                              </div>
                              <select
                                value={codeLanguage}
                                onChange={(e) => setCodeLanguage(e.target.value)}
                                className="bg-transparent text-[10px] text-content-muted font-mono uppercase tracking-wider focus:outline-none cursor-pointer"
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
                              className="p-1 rounded-md hover:bg-line text-content-muted hover:text-content transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Code Input */}
                          <div className="p-4">
                            <textarea
                              placeholder="// Paste your code here..."
                              className="w-full bg-transparent text-neon font-mono text-sm placeholder:text-content-muted/30 focus:outline-none resize-none min-h-[120px] leading-relaxed"
                              value={code}
                              onChange={(e) => setCode(e.target.value)}
                              spellCheck={false}
                            />
                          </div>

                          {/* Code Stats */}
                          {code.length > 0 && (
                            <div className="px-4 py-2 border-t border-line flex items-center gap-4">
                              <span className="text-[10px] text-content-muted font-mono">
                                {code.split('\n').length} lines
                              </span>
                              <span className="text-[10px] text-content-muted font-mono">
                                {code.length} chars
                              </span>
                              <span className="text-[10px] text-neon font-mono uppercase">
                                {codeLanguage}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="overflow-hidden">
                        <div className="mt-3 p-3 rounded-xl border border-line bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-content-muted font-mono uppercase tracking-wider">Quick Emoji</span>
                            <button
                              onClick={() => setShowEmojiPicker(false)}
                              className="p-1 rounded-md hover:bg-line text-content-muted"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {EMOJI_LIST.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => insertEmoji(emoji)}
                                className="w-9 h-9 rounded-lg hover:bg-neon/10 flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-line to-transparent" />

            {/* Footer Toolbar */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              {/* Left Tools */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                {/* Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl transition-all group shrink-0 ${
                    attachedImage
                      ? 'bg-neon/10 text-neon'
                      : 'hover:bg-neon/10 text-content-muted hover:text-neon'
                  }`}
                  title="Add image"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Code Toggle */}
                <button
                  onClick={() => { setShowCodeInput(!showCodeInput); setShowEmojiPicker(false); }}
                  className={`p-2.5 rounded-xl transition-all group shrink-0 ${
                    showCodeInput
                      ? 'bg-neon/10 text-neon'
                      : 'hover:bg-neon/10 text-content-muted hover:text-neon'
                  }`}
                  title="Add code"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>

                {/* Emoji Toggle */}
                <button
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowCodeInput(false); }}
                  className={`p-2.5 rounded-xl transition-all group shrink-0 ${
                    showEmojiPicker
                      ? 'bg-neon/10 text-neon'
                      : 'hover:bg-neon/10 text-content-muted hover:text-neon'
                  }`}
                  title="Add emoji"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Separator */}
                <div className="w-[1px] h-6 bg-line mx-1" />

                {/* GIF */}
                <button
                  className="p-2.5 rounded-xl hover:bg-neon/10 text-content-muted hover:text-neon transition-all group shrink-0"
                  title="Add GIF"
                >
                  <span className="text-xs font-bold font-mono group-hover:scale-110 transition-transform inline-block">GIF</span>
                </button>

                {/* Poll */}
                <button
                  className="p-2.5 rounded-xl hover:bg-neon/10 text-content-muted hover:text-neon transition-all group shrink-0"
                  title="Create poll"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>

              {/* Right: Counter + Submit */}
              <div className="flex items-center gap-3">
                {/* Character Counter */}
                {content.length > 0 && (
                  <div className="flex items-center gap-2">
                    {/* Circular Progress */}
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18" cy="18" r="15"
                          fill="none"
                          className="stroke-line"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="18" cy="18" r="15"
                          fill="none"
                          className={getProgressColor()}
                          strokeWidth="2.5"
                          strokeDasharray={`${Math.min(charPercentage, 100) * 0.942} 94.2`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.3s ease' }}
                        />
                      </svg>
                      {charPercentage > 80 && (
                        <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${getCharColor()}`}>
                          {MAX_CHARS - charCount}
                        </span>
                      )}
                    </div>

                    {/* Separator */}
                    <div className="w-[1px] h-6 bg-line" />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="group relative px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none bg-neon text-black hover:shadow-lg hover:shadow-neon/25 active:scale-95"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit</span>
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="px-5 pb-3 flex items-center justify-end">
              <div className="flex items-center gap-1.5 text-[10px] text-content-muted">
                <kbd className="px-1.5 py-0.5 rounded bg-line font-mono text-[9px]">⌘</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-line font-mono text-[9px]">Enter</kbd>
                <span className="ml-1">to transmit</span>
              </div>
            </div>

            {/* Bottom Neon Line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
          </div>
        </div>
  );
};