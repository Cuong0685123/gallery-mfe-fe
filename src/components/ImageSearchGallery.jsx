import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, Download, ExternalLink, Plus, Globe, Layers, Link as LinkIcon } from 'lucide-react';

// Component từng ô ảnh: Tự ẩn hoàn toàn khi ảnh chết, không bao giờ để lại ô trắng
function ImageCard({ item }) {
  const [hasError, setHasError] = useState(false);
  const [retried, setRetried] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(item.thumbnailUrl || item.imageUrl);

  if (hasError) {
    return null;
  }

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
    <div className="rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex flex-col hover:shadow-md transition duration-200">
      <div className="relative w-full h-44 bg-slate-200 overflow-hidden">
        <img
          src={currentSrc}
          alt={item.title || 'Image'}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover hover:scale-105 transition duration-300"
          onError={handleError}
        />
        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
          {item.domain}
        </span>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed" title={item.title}>
          {item.title}
        </p>
        <div className="flex justify-end gap-1.5 items-center">
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Website nguồn"
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <a
            href={item.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            title="Tải ảnh gốc"
            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ImageSearchGallery() {
  // Tab chế độ: 'keyword' (Tìm kiếm từ khóa) hoặc 'url' (Bóc ảnh từ trang web)
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

  // Xử lý tìm kiếm bằng từ khóa
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

  // Xử lý bóc tách ảnh từ link web
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
    setHasMore(false); // Bóc theo link trang là lấy toàn bộ ảnh của trang đó

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
    <div className="w-full flex-1 flex flex-col">
      {/* Tab chuyển đổi chế độ */}
      <div className="max-w-xl mx-auto w-full mb-4">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('keyword')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              mode === 'keyword' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search size={14} />
            Tìm theo từ khóa
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              mode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon size={14} />
            Bóc ảnh từ Link Web
          </button>
        </div>
      </div>

      {/* Khu vực input */}
      <div className="max-w-xl mx-auto w-full mb-6">
        {mode === 'keyword' ? (
          <>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Tìm'}
              </button>
            </form>

            {/* Nguồn 1 & Nguồn 2 */}
            <div className="flex justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleEngineChange('bing')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                  engine === 'bing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Globe size={13} />
                Nguồn 1
              </button>
              <button
                type="button"
                onClick={() => handleEngineChange('yandex')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                  engine === 'yandex'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers size={13} />
                Nguồn 2
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleExtractFromUrl} className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Dán link website vào đây (VD: https://vnexpress.net)..."
                style={{ 
    color: '#0f172a', 
    backgroundColor: '#ffffff',
    WebkitTextFillColor: '#0f172a' 
  }}
  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Bóc ảnh'}
            </button>
          </form>
        )}
      </div>

      {/* Thông tin số lượng */}
      {images.length > 0 && (
        <div className="flex justify-between items-center text-xs text-slate-500 pb-3 border-b border-slate-100 mb-4">
          <span>
            Tìm thấy: <strong className="text-slate-800">{images.length}</strong> ảnh
          </span>
          <span>
            {mode === 'keyword'
              ? `Trang: ${page} • ${engine === 'bing' ? 'Nguồn 1' : 'Nguồn 2'}`
              : 'Trích xuất từ URL'}
          </span>
        </div>
      )}

      {/* Lưới 4 cột: Ảnh chết tự động biến mất, không có ô trắng */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {images.map((item, idx) => (
          <ImageCard key={`${item.imageUrl}-${idx}`} item={item} />
        ))}
      </div>

      {/* Nút bấm tải thêm (Chỉ có ở chế độ tìm kiếm từ khóa) */}
      {mode === 'keyword' && images.length > 0 && hasMore && (
        <div className="text-center my-8">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 transition inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 size={14} className="animate-spin text-blue-600" />
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

      {/* Thông báo rỗng */}
      {!loading && hasSearched && images.length === 0 && (
        <div className="py-20 text-center text-slate-400 text-sm">
          Không tìm thấy hình ảnh phù hợp.
        </div>
      )}

      {!hasSearched && (
        <div className="py-20 text-center text-slate-400 text-sm">
          {mode === 'keyword'
            ? 'Nhập từ khóa phía trên để bắt đầu tìm ảnh.'
            : 'Dán link trang web phía trên để quét và tải toàn bộ ảnh.'}
        </div>
      )}
    </div>
  );
}