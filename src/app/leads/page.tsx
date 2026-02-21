"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  RefreshCcw,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
  _id: string;
  title?: string;
  query?: string;
  position?: number | string;
  snippet?: string;
  link?: string;
}

interface PaginationData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);

  const observerTarget = useRef(null);

  const fetchLeads = useCallback(async (pageNum: number, isAppend: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const url = new URL('/api/leads', window.location.origin);
      url.searchParams.append('page', pageNum.toString());
      url.searchParams.append('pageSize', '24');
      url.searchParams.append('query', search);

      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (res.ok) {
        setLeads(prev => isAppend ? [...prev, ...data.leads] : data.leads);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch leads');
      }
    } catch {
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchLeads(1, false);
  }, [search, fetchLeads]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && pagination && page < pagination.totalPages && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchLeads(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [pagination, page, loadingMore, loading, fetchLeads]);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-indigo-600 transition-colors">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none">Transmission Log</h1>
            <p className="text-muted-foreground font-medium italic">Deep-space gathering of business opportunities.</p>
          </div>
          <button 
            onClick={() => { setPage(1); fetchLeads(1, false); }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground border border-primary rounded-2xl hover:opacity-90 transition-all font-bold shadow-premium active:scale-95"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Archive
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 sticky top-6 z-20">
          <div className="relative flex-1 shadow-premium rounded-3xl overflow-hidden glass">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="text" 
              placeholder="Query the database..."
              className="w-full pl-14 pr-6 py-5 bg-card/80 border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-3 px-8 py-5 bg-card border border-border rounded-3xl hover:bg-muted transition-all text-sm font-black uppercase tracking-widest shadow-soft">
            <Filter size={20} /> Advanced Filter
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 bg-card border border-border rounded-[2.5rem] animate-pulse shadow-soft" />
            ))}
          </div>
        ) : error ? (
          <div className="p-16 text-center bg-destructive/5 text-destructive border-2 border-dashed border-destructive/20 rounded-[3rem]">
            <p className="text-xl font-black uppercase tracking-tighter">Connection Error</p>
            <p className="text-sm font-medium mt-2 opacity-80">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {leads.map((lead: Lead) => (
              <div key={lead._id} className="group relative bg-card border border-border rounded-[2.5rem] p-8 hover:shadow-premium hover:-translate-y-2 transition-all duration-500 ease-out shadow-soft overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="absolute top-6 right-8 text-[10px] font-black text-indigo-500/40 uppercase tracking-widest">
                  #{lead.position}
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{lead.query}</span>
                    <h3 className="text-xl font-black line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">{lead.title || 'No Title'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium line-clamp-3 italic leading-relaxed">
                    &quot;{lead.snippet}&quot;
                  </p>
                  <div className="pt-6 border-t border-border flex items-center justify-between">
                    <a 
                      href={lead.link || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-black uppercase tracking-tighter inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                    >
                      Access Source <ExternalLink size={14} />
                    </a>
                    <button className="text-[10px] font-black bg-indigo-500/10 text-indigo-600 px-3 py-1.5 rounded-xl uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                      Scan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Observer Target */}
        <div ref={observerTarget} className="py-20 flex flex-col items-center gap-4">
          {loadingMore && (
            <>
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 animate-pulse">Syncing Archive...</p>
            </>
          )}
          {!loadingMore && pagination && page >= pagination.totalPages && leads.length > 0 && (
            <div className="w-full flex items-center gap-8">
              <div className="flex-1 h-px bg-linear-to-r from-transparent via-border to-transparent" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/20">Boundary Reached</p>
              <div className="flex-1 h-px bg-linear-to-r from-transparent via-border to-transparent" />
            </div>
          )}
        </div>

        {leads.length === 0 && !loading && (
          <div className="text-center py-32 bg-muted/20 border-4 border-dashed border-border rounded-[4rem]">
            <Loader2 className="mx-auto text-muted-foreground/30 mb-6" size={48} />
            <p className="text-xl font-black text-muted-foreground/60 uppercase tracking-widest">Null Transmission</p>
            <p className="text-sm font-medium text-muted-foreground/40 mt-2">Adjust your frequency to find new leads.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
