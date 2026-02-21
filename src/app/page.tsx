"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  Search, 
  RefreshCcw, 
  ExternalLink, 
  Copy, 
  ChevronLeft, 
  Menu, 
  X,
  User,
  Link as LinkIcon,
  Info,
  Layers,
  Loader2
} from 'lucide-react';

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

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  // Interactive states
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'title'>('position');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20); // Larger page size for better infinite scroll
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Ref for intersection observer
  const observerTarget = useRef(null);

  const fetchLeads = useCallback(async (pageNum: number, isAppend: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    setError('');
    try {
      const url = new URL('/api/leads', window.location.origin);
      url.searchParams.append('page', pageNum.toString());
      url.searchParams.append('pageSize', pageSize.toString());
      url.searchParams.append('query', query);
      url.searchParams.append('sortBy', sortBy);

      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (res.ok) {
        const newLeads = Array.isArray(data.leads) ? data.leads : [];
        if (isAppend) {
          setLeads(prev => [...prev, ...newLeads]);
        } else {
          setLeads(newLeads);
          if (newLeads.length > 0 && !selectedLead) {
            setSelectedLead(newLeads[0]);
          }
        }
        setPagination(data.pagination);
      } else {
        setError(data?.error || 'Failed to fetch leads');
      }
    } catch {
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, sortBy, pageSize, selectedLead]);

  // Initial fetch and fetch on query/sort change
  useEffect(() => {
    setPage(1);
    fetchLeads(1, false);
  }, [query, sortBy, fetchLeads]);

  // Infinite scroll observer
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

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [pagination, page, loadingMore, loading, fetchLeads]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchLeads(1, false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar - Mobile Toggle Overlay */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-foreground rounded-full shadow-2xl lg:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Main Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-40 w-full sm:w-80 lg:relative lg:translate-x-0
        transition-transform duration-300 ease-in-out
        bg-card border-r border-border flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">Leads Pro</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Lead Management</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-md text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'position' | 'title')}
            >
              <option value="position">Sort: Position</option>
              <option value="title">Sort: Title</option>
            </select>
            <button 
              onClick={handleRefresh}
              className="p-2 bg-muted border border-border rounded-lg hover:bg-accent transition-colors"
              title="Refresh leads"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Leads List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center space-y-4">
              <Loader2 className="mx-auto animate-spin text-indigo-500" size={32} />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Waking up database...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 rounded-2xl m-2 border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground font-medium">No leads found in orbit.</p>
            </div>
          ) : (
            <>
              {leads.map((lead: Lead) => (
                <div 
                  key={lead._id} 
                  onClick={() => {
                    setSelectedLead(lead);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all duration-200 group relative
                    ${selectedLead?._id === lead._id 
                      ? 'bg-primary text-primary-foreground shadow-premium ring-2 ring-primary/10' 
                      : 'hover:bg-muted text-foreground'}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm line-clamp-1">{lead.title || 'Untitled Lead'}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${selectedLead?._id === lead._id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {lead.position}
                    </span>
                  </div>
                  <p className={`text-xs line-clamp-2 ${selectedLead?._id === lead._id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {lead.snippet}
                  </p>
                </div>
              ))}
              
              {/* Observer Target for Infinite Scroll */}
              <div ref={observerTarget} className="p-6 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                    <Loader2 className="animate-spin" size={16} /> Loading more leads
                  </div>
                )}
                {!loadingMore && pagination && page >= pagination.totalPages && leads.length > 0 && (
                  <p className="text-[10px] font-black uppercase text-muted-foreground/30 py-4">End of the line</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Info Footer */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>{pagination?.total || 0} results</span>
            <span>{leads.length} loaded</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {selectedLead ? (
          <>
            {/* Content Header */}
            <header className="p-6 lg:p-10 border-b border-border bg-card/30 backdrop-blur-xl sticky top-0 z-10 glass">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 space-y-4">
                  {!isSidebarOpen && (
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-500 transition-colors uppercase tracking-tight"
                    >
                      <ChevronLeft size={20} /> Back to List
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Lead Details
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-muted-foreground text-xs font-medium">{selectedLead.query}</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">{selectedLead.title}</h2>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <a 
                    href={selectedLead.link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-premium"
                  >
                    Open Lead <ExternalLink size={18} />
                  </a>
                  <button 
                    onClick={() => copyToClipboard(selectedLead.link || '')}
                    className="p-3 bg-card border border-border rounded-2xl hover:bg-muted transition-all active:scale-90 shadow-soft"
                    title="Copy Link"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-10">
                {/* Stats/Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 bg-card rounded-3xl border border-border shadow-soft group hover:border-indigo-500/50 transition-colors">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-3 italic">Search Position</p>
                    <p className="text-4xl font-black text-indigo-600 group-hover:scale-110 transition-transform origin-left">#{selectedLead.position}</p>
                  </div>
                  <div className="p-6 bg-card rounded-3xl border border-border shadow-soft">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-3 italic">Source Query</p>
                    <p className="text-base font-bold truncate text-foreground">{selectedLead.query}</p>
                  </div>
                  <div className="p-6 bg-card rounded-3xl border border-border shadow-soft">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-3 italic">Actions</p>
                    <div className="flex gap-3 mt-1">
                      <span className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                        <LinkIcon size={18} />
                      </span>
                      <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <User size={18} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Snippet Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground/60">
                    <Info size={18} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Contextual Snippet</h3>
                  </div>
                  <div className="p-8 bg-card border border-border rounded-[2rem] shadow-premium text-xl leading-relaxed font-medium text-foreground/80 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    &quot;{selectedLead.snippet}&quot;
                  </div>
                </section>

                {/* Raw Data Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground/60">
                    <Layers size={18} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Deep Scan Results</h3>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-linear-to-b from-indigo-500/5 to-purple-500/5 rounded-[2rem] pointer-events-none" />
                    <pre className="p-8 bg-muted/20 border border-border rounded-[2rem] overflow-x-auto text-xs font-mono text-muted-foreground leading-loose">
                      {JSON.stringify(selectedLead, null, 2)}
                    </pre>
                  </div>
                </section>

                <div className="h-20" /> {/* Spacer */}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 animate-pulse" />
              <div className="relative w-32 h-32 bg-card rounded-full flex items-center justify-center text-muted-foreground border-4 border-dashed border-border shadow-premium">
                <User size={64} className="opacity-20" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">System Idle</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-medium">
                Scanning for leads... Select an entry from the transmission log to begin analysis.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
