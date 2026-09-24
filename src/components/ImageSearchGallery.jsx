import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, Download, ExternalLink, Plus, Globe, Layers, Link as LinkIcon } from 'lucide-react';

function ImageCard({ item }) {
  const [hasError, setHasError] = useState(false);
  const [retried, setRetried] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(item.thumbnailUrl || item.imageUrl);

  if (hasError) return null;

  const handleError = () => {
    if (!retried) {
      setRetried(true);
      const originalSrc = item.thumbnailUrl || item.imageUrl;
      setCurrentSrc(`https://omnisearch-backend-fxr7.onrender.com/api/proxy-image?url=${encodeURIComponent(originalSrc)}`);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/60 flex flex-col hover:border-slate-700 transition duration-200">
      <div className="relative w-full aspect-square sm:h-44 bg-slate-800 overflow-hidden">
        <img
          src={currentSrc}
          alt={item.title || 'Image'}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover hover:scale-105 transition duration-300"
          onError={handleError}
        />
        <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded truncate max-w-[85%]">
          {item.domain}
        </span>
      </div>

      <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between gap-1.5">
        <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 leading-tight sm:leading-relaxed" title={item.title}>
          {item.title}
        </p>
        <div className="flex justify-end gap-1.5 items-center mt-1">
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Website nguồn"
              className="p-1 sm:p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <ExternalLink size={12} />
            </a>
          )}
          <a
            href={item.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            title="Tải ảnh gốc"
            className="p-1 sm:p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ImageSearchGallery() {
  const [mode, setMode] = useState('keyword');
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [engine, setEngine] = useState('bing');

  const executeSearch = async (searchQuery, targetEngine) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setPage(1);
    setHasMore(true);

    try {
      const res = await axios.get(
        `https://omnisearch-backend-fxr7.onrender.com/api/search?q=${encodeURIComponent(searchQuery)}&page=1&engine=${targetEngine}`
      );
      const data = res.data.data || [];
      setImages(data);
      if (data.length === 0 || res.data.hasMore === false) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractFromUrl = async (e) => {
    e?.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    let finalUrl = cleanUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    setLoading(true);
    setHasSearched(true);
    setHasMore(false);

    try {
      const res = await axios.get(
        `https://omnisearch-backend-fxr7.onrender.com/api/extract-images?url=${encodeURIComponent(finalUrl)}`
      );
      const data = res.data.data || [];
      setImages(data);
    } catch (err) {
      console.error('Lỗi trích xuất ảnh:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    executeSearch(query, engine);
  };

  const handleEngineChange = (newEngine) => {
    if (newEngine === engine) return;
    setEngine(newEngine);
    if (query.trim()) {
      executeSearch(query, newEngine);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || mode === 'url') return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const res = await axios.get(
        `https://omnisearch-backend-fxr7.onrender.com/api/search?q=${encodeURIComponent(query)}&page=${nextPage}&engine=${engine}`
      );
      const newImages = res.data.data || [];

      if (newImages.length === 0 || res.data.hasMore === false) {
        setHasMore(false);
      }

      setImages((prev) => {
        const existingUrls = new Set(prev.map((img) => img.imageUrl));
        const filteredNew = newImages.filter((img) => !existingUrls.has(img.imageUrl));
        return [...prev, ...filteredNew];
      });

      setPage(nextPage);
    } catch (err) {
      console.error('Lỗi khi tải thêm ảnh:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Khung chuyển chế độ & Input */}
      <div style={{ width: '100%', maxWidth: '32rem', margin: '0 auto 1.5rem', padding: '0 0.5rem' }}>
        
        {/* Tab 2 nút chia 50/50 cố định layout */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          marginBottom: '14px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setMode('keyword')}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: mode === 'keyword' ? '#2563eb' : 'transparent',
              color: mode === 'keyword' ? '#ffffff' : '#94a3b8'
            }}
          >
            <Search size={14} />
            Từ khóa
          </button>
          
          <button
            type="button"
            onClick={() => setMode('url')}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: mode === 'url' ? '#2563eb' : 'transparent',
              color: mode === 'url' ? '#ffffff' : '#94a3b8'
            }}
          >
            <LinkIcon size={14} />
            Bóc từ Link Web
          </button>
        </div>

        {/* Khung nhập liệu */}
        {mode === 'keyword' ? (
          <div>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <Search 
                  size={18} 
                  style={{ position: 'absolute', left: '12px', color: '#94a3b8', pointerEvents: 'none' }} 
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập từ khóa hình ảnh..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    WebkitTextFillColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Tìm'}
              </button>
            </form>

            {/* 2 nút nguồn chia đều 50/50 trên cùng 1 hàng */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', width: '100%' }}>
              <button
                type="button"
                onClick={() => handleEngineChange('bing')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: engine === 'bing' ? '#2563eb' : '#0f172a',
                  color: engine === 'bing' ? '#ffffff' : '#94a3b8',
                  border: engine === 'bing' ? '1px solid #3b82f6' : '1px solid #1e293b'
                }}
              >
                <Globe size={13} />
                Nguồn 1
              </button>

              <button
                type="button"
                onClick={() => handleEngineChange('yandex')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: engine === 'yandex' ? '#2563eb' : '#0f172a',
                  color: engine === 'yandex' ? '#ffffff' : '#94a3b8',
                  border: engine === 'yandex' ? '1px solid #3b82f6' : '1px solid #1e293b'
                }}
              >
                <Layers size={13} />
                Nguồn 2
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExtractFromUrl} style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <LinkIcon 
                size={18} 
                style={{ position: 'absolute', left: '12px', color: '#94a3b8', pointerEvents: 'none' }} 
              />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Dán link website (VD: https://vnexpress.net)..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  WebkitTextFillColor: '#0f172a',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 16px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flexShrink: 0
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Bóc ảnh'}
            </button>
          </form>
        )}
      </div>

      {/* Thông tin số lượng */}
      {images.length > 0 && (
        <div className="w-full flex justify-between items-center text-xs text-slate-400 pb-2.5 border-b border-slate-800/80 mb-4 px-1">
          <span>
            Tìm thấy: <strong className="text-slate-200">{images.length}</strong> ảnh
          </span>
          <span>
            {mode === 'keyword'
              ? `Trang: ${page} • ${engine === 'bing' ? 'Nguồn 1' : 'Nguồn 2'}`
              : 'Trích xuất từ URL'}
          </span>
        </div>
      )}

      {/* Lưới ảnh */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 w-full">
        {images.map((item, idx) => (
          <ImageCard key={`${item.imageUrl}-${idx}`} item={item} />
        ))}
      </div>

      {/* Tải thêm */}
      {mode === 'keyword' && images.length > 0 && hasMore && (
        <div className="text-center my-6">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl border border-slate-800 transition inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? (
              <>
                <Loader2 size={14} className="animate-spin text-blue-500" />
                Đang quét thêm...
              </>
            ) : (
              <>
                <Plus size={14} />
                Tải thêm kết quả
              </>
            )}
          </button>
        </div>
      )}

      {/* Trạng thái rỗng */}
      {!loading && hasSearched && images.length === 0 && (
        <div className="py-16 text-center text-slate-500 text-xs sm:text-sm">
          Không tìm thấy hình ảnh phù hợp.
        </div>
      )}

      {!hasSearched && (
        <div className="py-16 text-center text-slate-500 text-xs sm:text-sm px-4">
          {mode === 'keyword'
            ? 'Nhập từ khóa phía trên để bắt đầu tìm ảnh.'
            : 'Dán link trang web phía trên để quét và tải toàn bộ ảnh.'}
        </div>
      )}
    </div>
  );
}