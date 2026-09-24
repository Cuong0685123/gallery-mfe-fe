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
    <div className="w-full max-w-full flex-1 flex flex-col items-center">
      {/* Khung chuyển chế độ & Input */}
      <div className="w-full max-w-xl mx-auto mb-6 px-1 flex flex-col items-center">
        {/* Tab 2 nút chia 50/50 */}
        <div className="grid grid-cols-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full mb-3">
          <button
            type="button"
            onClick={() => setMode('keyword')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'keyword' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search size={14} />
            Từ khóa
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'url' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon size={14} />
            Bóc từ Link Web
          </button>
        </div>

        {/* Khung nhập liệu */}
        {mode === 'keyword' ? (
          <div className="w-full">
            <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
              <Search 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                size={18} 
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập từ khóa hình ảnh..."
                style={{ 
                  color: '#0f172a', 
                  backgroundColor: '#ffffff',
                  WebkitTextFillColor: '#0f172a' 
                }}
                className="w-full pl-10 pr-20 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Tìm'}
              </button>
            </form>

            {/* 2 nút nguồn chia đều 50/50 */}
            <div className="grid grid-cols-2 gap-2 mt-3.5 w-full">
              <button
                type="button"
                onClick={() => handleEngineChange('bing')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  engine === 'bing'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Globe size={13} />
                Nguồn 1
              </button>
              <button
                type="button"
                onClick={() => handleEngineChange('yandex')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  engine === 'yandex'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Layers size={13} />
                Nguồn 2
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExtractFromUrl} className="w-full relative flex items-center">
            <LinkIcon 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
              size={18} 
            />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Dán link website (VD: https://vnexpress.net)..."
              style={{ 
                color: '#0f172a', 
                backgroundColor: '#ffffff',
                WebkitTextFillColor: '#0f172a' 
              }}
              className="w-full pl-10 pr-24 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Bóc ảnh'}
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