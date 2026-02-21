"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  RefreshCcw, 
  ExternalLink, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  User,
  Link as LinkIcon,
  Info,
  Layers
} from 'lucide-react';

interface Lead {
  _id: string;
  title?: string;
  query?: string;
  position?: number | string;
  snippet?: string;
  link?: string;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive states
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'title'>('position');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (res.ok) {
        const sortedLeads = Array.isArray(data) ? data : [];
        setLeads(sortedLeads);
        if (sortedLeads.length > 0 && !selectedLead) {
          setSelectedLead(sortedLeads[0]);
        }
      } else {
        setError(data?.error || 'Failed to fetch leads');
      }
    } catch (err) {
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [selectedLead]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Memoize filtered, sorted and paginated results
  const pagination = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = leads.filter((l: Lead) => {
      if (!q) return true;
      return [l.title, l.query, l.snippet, l.link].some((s: string | number | undefined) => 
        (s || '').toString().toLowerCase().includes(q)
      );
    });

    if (sortBy === 'position') {
      filtered.sort((a: Lead, b: Lead) => (Number(a.position) || 0) - (Number(b.position) || 0));
    } else {
      filtered.sort((a: Lead, b: Lead) => ((a.title || '') > (b.title || '') ? 1 : -1));
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    return { total, totalPages, currentPage, pageItems };
  }, [leads, query, sortBy, page, pageSize]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
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
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="position">Sort: Position</option>
              <option value="title">Sort: Title</option>
            </select>
            <button 
              onClick={fetchLeads}
              className="p-2 bg-muted border border-border rounded-lg hover:bg-accent transition-colors"
              title="Refresh leads"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Leads List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center space-y-3">
              <RefreshCcw className="mx-auto animate-spin text-muted-foreground" size={24} />
              <p className="text-sm text-muted-foreground">Fetching leads...</p>
            </div>
          ) : pagination.pageItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No leads found</p>
            </div>
          ) : (
            pagination.pageItems.map((lead: Lead) => (
              <div 
                key={lead._id} 
                onClick={() => {
                  setSelectedLead(lead);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`
                  p-4 rounded-xl cursor-pointer transition-all duration-200 group
                  ${selectedLead?._id === lead._id 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'hover:bg-muted text-foreground'}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm line-clamp-1">{lead.title || 'Untitled Lead'}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedLead?._id === lead._id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    #{lead.position}
                  </span>
                </div>
                <p className={`text-xs line-clamp-2 ${selectedLead?._id === lead._id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {lead.snippet}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{pagination.total} results</span>
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex-1 py-2 bg-muted border border-border rounded-lg disabled:opacity-50 hover:bg-accent flex justify-center items-center gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex-1 py-2 bg-muted border border-border rounded-lg disabled:opacity-50 hover:bg-accent flex justify-center items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {selectedLead ? (
          <>
            {/* Content Header */}
            <header className="p-6 lg:p-10 border-b border-border bg-card/30 backdrop-blur-xl sticky top-0 z-10">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 space-y-4">
                  {!isSidebarOpen && (
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden flex items-center gap-2 text-sm font-bold text-primary hover:text-indigo-600 transition-colors"
                    >
                      <ChevronLeft size={20} /> Back to List
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Lead Details
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-muted-foreground text-xs">{selectedLead.query}</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{selectedLead.title}</h2>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <a 
                    href={selectedLead.link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Open Lead <ExternalLink size={18} />
                  </a>
                  <button 
                    onClick={() => copyToClipboard(selectedLead.link || '')}
                    className="p-3 bg-muted border border-border rounded-xl hover:bg-accent transition-colors"
                    title="Copy Link"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
              <div className="max-w-4xl mx-auto space-y-10">
                {/* Stats/Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Search Position</p>
                    <p className="text-2xl font-bold">#{selectedLead.position}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Source Query</p>
                    <p className="text-lg font-bold truncate">{selectedLead.query}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Actions</p>
                    <div className="flex gap-2 mt-1">
                      <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                        <LinkIcon size={14} />
                      </span>
                      <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                        <User size={14} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Snippet Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Info size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Description</h3>
                  </div>
                  <div className="p-6 bg-card border border-border rounded-2xl shadow-sm text-lg leading-relaxed italic text-foreground/90">
                    &quot;{selectedLead.snippet}&quot;
                  </div>
                </section>

                {/* Raw Data Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Layers size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Metadata Analysis</h3>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-linear-to-b from-indigo-500/5 to-purple-500/5 rounded-2xl pointer-events-none" />
                    <pre className="p-6 bg-muted/30 border border-border rounded-2xl overflow-x-auto text-xs font-mono text-muted-foreground">
                      {JSON.stringify(selectedLead, null, 2)}
                    </pre>
                  </div>
                </section>

                <div className="h-20" /> {/* Spacer */}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground border-4 border-dashed border-border">
              <User size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No Lead Selected</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Choose a lead from the sidebar to view detailed information and take action.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
