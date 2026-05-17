import React, { useEffect, useMemo, useState } from 'react';
import {
  CloudOrnament,
  MountainSilhouette,
  FeaturedCardBg,
  CornerOrnament,
  LotusOrnament,
} from './decorative/ChineseSVGs';

interface DashboardProps {
  onReadBook: () => void;
}

type NavId = 'inicio' | 'biblioteca' | 'favoritos' | 'recentes' | 'anotacoes' | 'configuracoes';
type FilterId = 'Todos' | 'PDF' | 'EPUB' | 'Favoritos';

type Book = {
  id: number;
  title: string;
  author: string;
  progress: number;
  cover: string;
  format: 'PDF' | 'EPUB';
  favorite: boolean;
  completed: boolean;
  pages: number;
  lastRead: string;
  mood: string;
};

type ReaderNote = {
  id: number;
  book: string;
  page: number;
  text: string;
  tag: string;
};

const initialBooks: Book[] = [
  {
    id: 1,
    title: 'A Arte da Serenidade',
    author: 'Mei Lin',
    progress: 82,
    cover: './covers/arte-serenidade.jpg',
    format: 'EPUB',
    favorite: true,
    completed: false,
    pages: 310,
    lastRead: 'Hoje, 09:20',
    mood: 'Serenidade',
  },
  {
    id: 2,
    title: 'Montanhas Silenciosas',
    author: 'Chen Guang',
    progress: 47,
    cover: './covers/montanhas-silenciosas.jpg',
    format: 'PDF',
    favorite: false,
    completed: false,
    pages: 224,
    lastRead: 'Ontem, 21:44',
    mood: 'Contemplação',
  },
  {
    id: 3,
    title: 'Zen e a Arte de Ler o Mundo',
    author: 'Haru Tanaka',
    progress: 64,
    cover: './covers/zen-arte.jpg',
    format: 'EPUB',
    favorite: true,
    completed: false,
    pages: 256,
    lastRead: 'Hoje, 14:12',
    mood: 'Foco',
  },
  {
    id: 4,
    title: 'Sussurros do Lótus',
    author: 'Isabela Qiao',
    progress: 100,
    cover: './covers/sussurros-lotus.jpg',
    format: 'EPUB',
    favorite: false,
    completed: true,
    pages: 188,
    lastRead: 'Segunda, 18:00',
    mood: 'Finalizado',
  },
  {
    id: 5,
    title: 'Crônicas de Jade',
    author: 'Fang He',
    progress: 33,
    cover: './covers/cronicas-jade.jpg',
    format: 'PDF',
    favorite: false,
    completed: false,
    pages: 400,
    lastRead: 'Sexta, 07:30',
    mood: 'Aventura',
  },
  {
    id: 6,
    title: 'O Dragão Adormecido',
    author: 'Tao Yin',
    progress: 12,
    cover: './covers/dragao-adormecido.jpg',
    format: 'EPUB',
    favorite: false,
    completed: false,
    pages: 512,
    lastRead: '12 de maio',
    mood: 'Fantasia',
  },
];

const initialNotes: ReaderNote[] = [
  {
    id: 1,
    book: 'O Caminho do Vazio',
    page: 32,
    text: 'O silêncio não é ausência; é um espaço onde o pensamento aprende a respirar.',
    tag: 'Reflexão',
  },
  {
    id: 2,
    book: 'A Arte da Serenidade',
    page: 108,
    text: 'Rever esse trecho para criar uma coleção de citações favoritas.',
    tag: 'Favorito',
  },
  {
    id: 3,
    book: 'Crônicas de Jade',
    page: 44,
    text: 'Boa referência para capítulo com atmosfera de névoa e templo antigo.',
    tag: 'Ideia',
  },
];

const navItems: Array<{ id: NavId; label: string; icon: string }> = [
  { id: 'inicio', label: 'Início', icon: 'home' },
  { id: 'biblioteca', label: 'Biblioteca', icon: 'book' },
  { id: 'favoritos', label: 'Favoritos', icon: 'heart' },
  { id: 'recentes', label: 'Recentes', icon: 'clock' },
  { id: 'anotacoes', label: 'Anotações', icon: 'pen' },
  { id: 'configuracoes', label: 'Configurações', icon: 'gear' },
];

const filters: FilterId[] = ['Todos', 'PDF', 'EPUB', 'Favoritos'];

const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'home') return <svg {...common}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
  if (name === 'book') return <svg {...common}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
  if (name === 'heart') return <svg {...common}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>;
  if (name === 'clock') return <svg {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
  if (name === 'pen') return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
  if (name === 'gear') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
  if (name === 'upload') return <svg {...common}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
  if (name === 'bell') return <svg {...common}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
  if (name === 'chevron-left') return <svg {...common}><polyline points="15 18 9 12 15 6" /></svg>;
  if (name === 'chevron-right') return <svg {...common}><polyline points="9 18 15 12 9 6" /></svg>;
  if (name === 'plus') return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
  if (name === 'x') return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
};

const Dashboard: React.FC<DashboardProps> = ({ onReadBook }) => {
  const [activeNav, setActiveNav] = useState<NavId>('inicio');
  const [activeFilter, setActiveFilter] = useState<FilterId>('Todos');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [notes, setNotes] = useState<ReaderNote[]>(initialNotes);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('lume-sidebar') === 'collapsed');

  useEffect(() => {
    localStorage.setItem('lume-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded');
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 980) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesFilter = activeFilter === 'Todos' || (activeFilter === 'Favoritos' ? book.favorite : book.format === activeFilter);
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || `${book.title} ${book.author} ${book.format}`.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, books, search]);

  const favoriteBooks = books.filter((book) => book.favorite);
  const recentBooks = [...books].sort((a, b) => b.progress - a.progress).slice(0, 5);
  const completedCount = books.filter((book) => book.completed).length;
  const averageProgress = Math.round(books.reduce((sum, book) => sum + book.progress, 0) / books.length);

  const toggleFavorite = (id: number) => {
    setBooks((current) => current.map((book) => (book.id === id ? { ...book, favorite: !book.favorite } : book)));
  };

  const handleImportBook = () => {
    if (!selectedFile) return;
    const extension = selectedFile.name.split('.').pop()?.toUpperCase();
    const format: 'PDF' | 'EPUB' = extension === 'EPUB' ? 'EPUB' : 'PDF';
    const title = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const coverPool = ['./covers/caminho-vazio.jpg', './covers/cronicas-jade.jpg', './covers/montanhas-silenciosas.jpg'];

    setBooks((current) => [
      {
        id: Date.now(),
        title: title || 'Livro Importado',
        author: 'Autor desconhecido',
        progress: 0,
        cover: coverPool[current.length % coverPool.length],
        format,
        favorite: false,
        completed: false,
        pages: 0,
        lastRead: 'Novo',
        mood: 'Importado',
      },
      ...current,
    ]);

    setSelectedFile(null);
    setImportOpen(false);
    setActiveNav('biblioteca');
  };

  const addNote = () => {
    if (!noteDraft.trim()) return;
    setNotes((current) => [
      {
        id: Date.now(),
        book: 'O Caminho do Vazio',
        page: 32,
        text: noteDraft.trim(),
        tag: 'Nova nota',
      },
      ...current,
    ]);
    setNoteDraft('');
  };

  const openReader = () => {
    setOpenMenu(null);
    onReadBook();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#0d0d0f' }}>
      <Sidebar
        activeNav={activeNav}
        collapsed={sidebarCollapsed}
        onNavigate={setActiveNav}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute top-0 right-0 w-1/2 h-full" style={{ background: 'radial-gradient(ellipse at top right, rgba(139,26,26,0.08), transparent 50%)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 opacity-25">
            <MountainSilhouette className="w-full h-full" />
          </div>
        </div>

        <TopBar
          search={search}
          activeNav={activeNav}
          onSearchChange={setSearch}
          onImport={() => setImportOpen(true)}
        />

        <section className="flex-1 overflow-y-auto px-5 md:px-7 lg:px-9 pb-10 relative z-10">
          {activeNav === 'inicio' && (
            <HomeSection
              books={filteredBooks}
              allBooks={books}
              averageProgress={averageProgress}
              completedCount={completedCount}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
              onRead={openReader}
              onToggleFavorite={toggleFavorite}
              onImport={() => setImportOpen(true)}
              notes={notes}
            />
          )}

          {activeNav === 'biblioteca' && (
            <LibrarySection
              books={filteredBooks}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
              onRead={openReader}
              onToggleFavorite={toggleFavorite}
              onImport={() => setImportOpen(true)}
            />
          )}

          {activeNav === 'favoritos' && (
            <CollectionSection
              title="Favoritos"
              subtitle="Os livros que você separou para voltar com calma."
              books={favoriteBooks}
              empty="Nenhum favorito ainda. Use a estrela nos cards para salvar seus livros preferidos."
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
              onRead={openReader}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {activeNav === 'recentes' && (
            <CollectionSection
              title="Recentes"
              subtitle="Continue pelos livros que você abriu por último."
              books={recentBooks}
              empty="Quando você abrir livros, eles aparecem aqui."
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
              onRead={openReader}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {activeNav === 'anotacoes' && (
            <NotesSection notes={notes} noteDraft={noteDraft} onDraftChange={setNoteDraft} onAddNote={addNote} />
          )}

          {activeNav === 'configuracoes' && <SettingsSection collapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />}
        </section>
      </main>

      {importOpen && (
        <ImportModal
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
          onClose={() => setImportOpen(false)}
          onConfirm={handleImportBook}
        />
      )}
    </div>
  );
};

const Sidebar: React.FC<{
  activeNav: NavId;
  collapsed: boolean;
  onNavigate: (id: NavId) => void;
  onToggle: () => void;
}> = ({ activeNav, collapsed, onNavigate, onToggle }) => {
  return (
    <aside
      className="relative flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-out"
      style={{
        width: collapsed ? '84px' : '270px',
        background: 'linear-gradient(180deg, #101014 0%, #0d0b10 58%, #08070c 100%)',
        borderRight: '1px solid rgba(200,169,110,0.12)',
        boxShadow: collapsed ? '8px 0 30px rgba(0,0,0,0.25)' : '14px 0 50px rgba(0,0,0,0.32)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(139,26,26,0.16), transparent 70%)' }} />
      <div className="absolute top-3 right-3 z-30">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className="flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            width: '34px',
            height: '34px',
            color: '#d4b87a',
            background: 'rgba(255,255,255,0.045)',
            border: '1px solid rgba(200,169,110,0.16)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={17} />
        </button>
      </div>

      <div className={`relative z-10 px-5 pt-6 pb-5 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: '40px',
            height: '40px',
            background: 'radial-gradient(circle at 35% 25%, #e6b35f, #8b1a1a 48%, #4a0b0b 100%)',
            boxShadow: '0 0 22px rgba(139,26,26,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 C12 2 8 6 8 10 C8 10 6 8 7 6 C4 9 3 13 5 16 C7 19 10 21 12 22 C14 21 17 19 19 16 C21 13 20 9 17 6 C18 8 16 10 16 10 C16 6 12 2 12 2Z" fill="rgba(240,232,216,0.92)" />
            <path d="M12 8 C12 8 10 11 10 13 C10 14.5 11 16 12 16 C13 16 14 14.5 14 13 C14 11 12 8 12 8Z" fill="rgba(242,190,93,0.72)" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0 pr-8">
            <h1 className="font-garamond text-xl leading-tight truncate" style={{ color: '#d4b87a', letterSpacing: '0.04em' }}>Lume Reader</h1>
            <div className="flex items-center gap-1 mt-0.5" style={{ color: 'rgba(200,169,110,0.42)', fontSize: '9px', letterSpacing: '0.16em' }}>
              <span>❧</span><span className="font-inter">PREMIUM</span><span>❧</span>
            </div>
          </div>
        )}
      </div>

      <div className="mx-5 mb-4" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(200,169,110,0.24), transparent)' }} />

      <nav className="relative z-10 flex flex-col gap-1 px-3 flex-1">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-2xl transition-all duration-200 text-left w-full group relative ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3'}`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(139,26,26,0.92), rgba(107,16,16,0.95))',
                      boxShadow: '0 4px 20px rgba(139,26,26,0.34), inset 0 1px 0 rgba(255,255,255,0.07)',
                      color: '#f0e8d8',
                    }
                  : { color: 'rgba(200,180,150,0.66)', background: 'transparent' }
              }
            >
              <span style={{ color: isActive ? '#f0e8d8' : 'rgba(200,169,110,0.58)' }}><Icon name={item.icon} /></span>
              {!collapsed && (
                <span className="text-sm font-inter flex-1" style={{ fontWeight: isActive ? 600 : 400, letterSpacing: '0.01em' }}>{item.label}</span>
              )}
              {!collapsed && isActive && <CloudOrnament className="w-7 h-4 opacity-60" />}
            </button>
          );
        })}
      </nav>

      <div className="relative mt-auto overflow-hidden transition-all duration-300" style={{ height: collapsed ? '120px' : '230px' }}>
        <div className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0d0b10, transparent)' }} />
        <MountainSilhouette className="w-full h-full" />
        {!collapsed && (
          <div className="absolute top-7 left-4 z-20 font-noto-serif" style={{ color: 'rgba(200,169,110,0.42)', writingMode: 'vertical-rl', letterSpacing: '0.18em', fontSize: '13px' }}>
            靜讀如山
          </div>
        )}
      </div>
    </aside>
  );
};

const TopBar: React.FC<{
  search: string;
  activeNav: NavId;
  onSearchChange: (value: string) => void;
  onImport: () => void;
}> = ({ search, activeNav, onSearchChange, onImport }) => {
  const title = navItems.find((item) => item.id === activeNav)?.label ?? 'Início';
  return (
    <header
      className="relative z-20 shrink-0 flex items-center justify-between gap-4 px-5 md:px-7 lg:px-9"
      style={{ height: '78px', borderBottom: '1px solid rgba(200,169,110,0.08)', background: 'rgba(13,13,15,0.84)', backdropFilter: 'blur(18px)' }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="font-garamond text-2xl md:text-3xl truncate" style={{ color: '#f0e8d8', letterSpacing: '0.02em' }}>{title}</h2>
          <CloudOrnament className="hidden sm:block w-9 h-5 opacity-55" />
        </div>
        <p className="hidden md:block font-inter" style={{ color: 'rgba(200,180,150,0.45)', fontSize: '12px' }}>
          Biblioteca web sem instalação, pronta para PC bloqueado e celular.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
        <div
          className="hidden sm:flex items-center gap-3 rounded-2xl px-4 flex-1 max-w-xl"
          style={{ height: '44px', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(200,169,110,0.14)' }}
        >
          <span style={{ color: '#c8a96e' }}><Icon name="search" size={18} /></span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar livros"
            className="bg-transparent outline-none flex-1 font-inter min-w-0"
            style={{ color: '#f0e8d8', fontSize: '14px' }}
          />
          <span className="hidden md:inline-flex rounded-lg px-2 py-1 font-inter" style={{ color: 'rgba(200,180,150,0.45)', fontSize: '10px', border: '1px solid rgba(200,169,110,0.12)' }}>⌘ K</span>
        </div>

        <button onClick={onImport} className="hidden md:flex items-center gap-2 rounded-2xl px-4 transition-all hover:scale-[1.02]" style={{ height: '44px', background: 'linear-gradient(135deg, rgba(26,92,72,0.9), rgba(18,54,45,0.95))', border: '1px solid rgba(200,169,110,0.22)', color: '#f0e8d8' }}>
          <Icon name="upload" size={17} />
          <span className="font-inter text-sm">Importar</span>
        </button>

        <button className="relative flex items-center justify-center rounded-2xl shrink-0" style={{ width: '44px', height: '44px', color: '#c8a96e', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(200,169,110,0.13)' }}>
          <Icon name="bell" size={18} />
          <span className="absolute top-2 right-2 rounded-full" style={{ width: '7px', height: '7px', background: '#c0392b' }} />
        </button>

        <div className="hidden lg:flex items-center gap-3 pl-1">
          <div className="rounded-full overflow-hidden" style={{ width: '42px', height: '42px', border: '1px solid rgba(200,169,110,0.35)', backgroundImage: 'url(./sidebar-art.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div>
            <p className="font-inter" style={{ color: '#f0e8d8', fontSize: '13px', fontWeight: 600 }}>Jade Cruz</p>
            <p className="font-inter" style={{ color: 'rgba(200,180,150,0.45)', fontSize: '11px' }}>Plano local</p>
          </div>
        </div>
      </div>
    </header>
  );
};

const HomeSection: React.FC<{
  books: Book[];
  allBooks: Book[];
  averageProgress: number;
  completedCount: number;
  activeFilter: FilterId;
  onFilterChange: (filter: FilterId) => void;
  openMenu: number | null;
  onOpenMenu: (id: number | null) => void;
  onRead: () => void;
  onToggleFavorite: (id: number) => void;
  onImport: () => void;
  notes: ReaderNote[];
}> = ({ books, allBooks, averageProgress, completedCount, activeFilter, onFilterChange, openMenu, onOpenMenu, onRead, onToggleFavorite, onImport, notes }) => (
  <div className="space-y-8 pt-8">
    <FeaturedHero onRead={onRead} />

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Livros na biblioteca" value={allBooks.length.toString()} detail="PDF e EPUB" icon="book" />
      <StatCard label="Progresso médio" value={`${averageProgress}%`} detail="Leitura geral" icon="clock" />
      <StatCard label="Favoritos" value={allBooks.filter((book) => book.favorite).length.toString()} detail="Separados por você" icon="heart" />
      <StatCard label="Concluídos" value={completedCount.toString()} detail="Jornada finalizada" icon="gear" />
    </div>

    <SectionHeader title="Minha biblioteca" subtitle="Tudo organizado com o visual premium do Lume Reader." actionLabel="Importar livro" onAction={onImport} />
    <FilterBar activeFilter={activeFilter} onFilterChange={onFilterChange} />
    <BookGrid books={books.slice(0, 8)} openMenu={openMenu} onOpenMenu={onOpenMenu} onRead={onRead} onToggleFavorite={onToggleFavorite} />

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <ReadingPlan />
      <div className="xl:col-span-2">
        <NotesPreview notes={notes} />
      </div>
    </div>
  </div>
);

const FeaturedHero: React.FC<{ onRead: () => void }> = ({ onRead }) => (
  <section className="relative overflow-hidden rounded-[28px] p-5 md:p-7" style={{ background: 'linear-gradient(135deg, rgba(25,20,20,0.94), rgba(107,16,16,0.5))', border: '1px solid rgba(200,169,110,0.18)', boxShadow: '0 28px 90px rgba(0,0,0,0.42)' }}>
    <FeaturedCardBg className="absolute inset-0 w-full h-full opacity-70" />
    <CornerOrnament position="tr" className="absolute top-4 right-4 text-gold opacity-45" />
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[190px_1fr_auto] gap-6 items-center">
      <div className="relative mx-auto lg:mx-0">
        <img src="./covers/caminho-vazio.jpg" alt="O Caminho do Vazio" className="w-40 md:w-48 aspect-[3/4] object-cover rounded-2xl" style={{ boxShadow: '0 22px 45px rgba(0,0,0,0.55)', border: '1px solid rgba(200,169,110,0.25)' }} />
        <div className="absolute -top-2 -left-2 rounded-xl px-2 py-3" style={{ background: 'linear-gradient(180deg, #1a7a58, #0e4635)', color: '#f0e8d8', boxShadow: '0 10px 24px rgba(0,0,0,0.35)' }}>✦</div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-inter uppercase" style={{ color: '#c8a96e', fontSize: '11px', letterSpacing: '0.18em' }}>Continue lendo</span>
          <div className="gold-divider flex-1 max-w-[160px]" />
        </div>
        <h3 className="font-garamond text-4xl md:text-5xl leading-none" style={{ color: '#f0e8d8' }}>O Caminho do Vazio</h3>
        <p className="font-inter mt-2" style={{ color: '#d4b87a', fontSize: '14px' }}>Lúcio Mendes</p>
        <p className="font-eb-garamond mt-5 max-w-xl" style={{ color: 'rgba(240,232,216,0.72)', fontSize: '18px', lineHeight: 1.55 }}>
          A verdadeira sabedoria está em compreender o vazio que nos conecta.
        </p>
        <div className="mt-6 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="font-inter" style={{ color: 'rgba(240,232,216,0.68)', fontSize: '12px' }}>Progresso da leitura</span>
            <span className="font-inter font-semibold" style={{ color: '#2ecc8a', fontSize: '14px' }}>64%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill progress-fill-jade" style={{ width: '64%' }} /></div>
          <div className="flex flex-wrap gap-4 mt-4 font-inter" style={{ color: 'rgba(200,180,150,0.58)', fontSize: '12px' }}>
            <span>▣ 256 de 400 páginas</span>
            <span>◷ 4h 32m restantes</span>
          </div>
        </div>
      </div>
      <button onClick={onRead} className="rounded-2xl px-6 py-4 font-inter transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #8b1a1a, #651010)', color: '#f0e8d8', border: '1px solid rgba(212,184,122,0.4)', boxShadow: '0 18px 40px rgba(139,26,26,0.35)' }}>
        Continuar leitura →
      </button>
    </div>
  </section>
);

const SectionHeader: React.FC<{ title: string; subtitle: string; actionLabel?: string; onAction?: () => void }> = ({ title, subtitle, actionLabel, onAction }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <div className="flex items-center gap-3">
        <h3 className="font-garamond text-3xl" style={{ color: '#f0e8d8' }}>{title}</h3>
        <CloudOrnament className="w-10 h-5 opacity-50" />
      </div>
      <p className="font-inter mt-1" style={{ color: 'rgba(200,180,150,0.48)', fontSize: '13px' }}>{subtitle}</p>
    </div>
    {actionLabel && onAction && (
      <button onClick={onAction} className="flex items-center gap-2 self-start md:self-auto rounded-2xl px-4 py-3 font-inter text-sm transition-all hover:scale-[1.02]" style={{ color: '#f0e8d8', background: 'linear-gradient(135deg, rgba(26,92,72,0.92), rgba(12,45,36,0.95))', border: '1px solid rgba(200,169,110,0.22)' }}>
        <Icon name="upload" size={16} /> {actionLabel}
      </button>
    )}
  </div>
);

const FilterBar: React.FC<{ activeFilter: FilterId; onFilterChange: (filter: FilterId) => void }> = ({ activeFilter, onFilterChange }) => (
  <div className="flex flex-wrap gap-2">
    {filters.map((filter) => {
      const active = activeFilter === filter;
      return (
        <button key={filter} onClick={() => onFilterChange(filter)} className="rounded-full px-4 py-2 font-inter text-sm transition-all" style={active ? { color: '#f0e8d8', background: 'rgba(26,92,72,0.75)', border: '1px solid rgba(46,204,138,0.45)' } : { color: 'rgba(200,180,150,0.62)', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(200,169,110,0.12)' }}>
          {filter}
        </button>
      );
    })}
  </div>
);

const LibrarySection: React.FC<{
  books: Book[];
  activeFilter: FilterId;
  onFilterChange: (filter: FilterId) => void;
  openMenu: number | null;
  onOpenMenu: (id: number | null) => void;
  onRead: () => void;
  onToggleFavorite: (id: number) => void;
  onImport: () => void;
}> = ({ books, activeFilter, onFilterChange, openMenu, onOpenMenu, onRead, onToggleFavorite, onImport }) => (
  <div className="space-y-6 pt-8">
    <SectionHeader title="Biblioteca" subtitle="Gerencie PDFs, EPUBs, favoritos e livros importados." actionLabel="Importar livro" onAction={onImport} />
    <FilterBar activeFilter={activeFilter} onFilterChange={onFilterChange} />
    <BookGrid books={books} openMenu={openMenu} onOpenMenu={onOpenMenu} onRead={onRead} onToggleFavorite={onToggleFavorite} />
  </div>
);

const CollectionSection: React.FC<{
  title: string;
  subtitle: string;
  empty: string;
  books: Book[];
  openMenu: number | null;
  onOpenMenu: (id: number | null) => void;
  onRead: () => void;
  onToggleFavorite: (id: number) => void;
}> = ({ title, subtitle, empty, books, openMenu, onOpenMenu, onRead, onToggleFavorite }) => (
  <div className="space-y-6 pt-8">
    <SectionHeader title={title} subtitle={subtitle} />
    {books.length ? <BookGrid books={books} openMenu={openMenu} onOpenMenu={onOpenMenu} onRead={onRead} onToggleFavorite={onToggleFavorite} /> : <EmptyState message={empty} />}
  </div>
);

const BookGrid: React.FC<{
  books: Book[];
  openMenu: number | null;
  onOpenMenu: (id: number | null) => void;
  onRead: () => void;
  onToggleFavorite: (id: number) => void;
}> = ({ books, openMenu, onOpenMenu, onRead, onToggleFavorite }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 xl:gap-5">
    {books.map((book) => <BookCard key={book.id} book={book} menuOpen={openMenu === book.id} onOpenMenu={onOpenMenu} onRead={onRead} onToggleFavorite={onToggleFavorite} />)}
  </div>
);

const BookCard: React.FC<{
  book: Book;
  menuOpen: boolean;
  onOpenMenu: (id: number | null) => void;
  onRead: () => void;
  onToggleFavorite: (id: number) => void;
}> = ({ book, menuOpen, onOpenMenu, onRead, onToggleFavorite }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <article onDoubleClick={onRead} className="book-card relative overflow-hidden rounded-2xl cursor-pointer" style={{ background: 'linear-gradient(180deg, rgba(31,31,39,0.9), rgba(13,13,15,0.98))', border: '1px solid rgba(200,169,110,0.13)', minHeight: 318 }}>
      <div className="relative aspect-[3/4] overflow-hidden">
        {!imgError ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover" onError={() => setImgError(true)} /> : <div className="w-full h-full flex items-center justify-center font-garamond text-3xl" style={{ background: 'linear-gradient(135deg, #111, #1a5c48)', color: '#d4b87a' }}>書</div>}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.75))' }} />
        <button onClick={(event) => { event.stopPropagation(); onToggleFavorite(book.id); }} className="absolute top-2 right-2 rounded-xl flex items-center justify-center" style={{ width: '30px', height: '30px', background: 'rgba(10,8,10,0.72)', color: book.favorite ? '#d4b87a' : 'rgba(240,232,216,0.5)', border: '1px solid rgba(200,169,110,0.18)' }}>★</button>
        <span className="absolute left-2 bottom-2 rounded-full px-2 py-1 font-inter" style={{ color: '#f0e8d8', fontSize: '10px', background: book.format === 'PDF' ? 'rgba(139,26,26,0.72)' : 'rgba(26,92,72,0.75)', border: '1px solid rgba(200,169,110,0.2)' }}>{book.format}</span>
      </div>
      <div className="p-3">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-garamond text-lg leading-tight line-clamp-2" style={{ color: '#f0e8d8' }}>{book.title}</h4>
            <p className="font-inter truncate mt-1" style={{ color: 'rgba(200,180,150,0.5)', fontSize: '11px' }}>{book.author}</p>
          </div>
          <button onClick={(event) => { event.stopPropagation(); onOpenMenu(menuOpen ? null : book.id); }} className="rounded-lg shrink-0" style={{ color: '#c8a96e', width: '28px', height: '28px' }}><Icon name="dots" size={17} /></button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="font-inter" style={{ color: book.completed ? '#2ecc8a' : '#8ee6bd', fontSize: '11px', minWidth: 34 }}>{book.completed ? '100%' : `${book.progress}%`}</span>
          <div className="progress-bar flex-1"><div className="progress-fill progress-fill-jade" style={{ width: `${book.progress}%` }} /></div>
        </div>
        <div className="mt-3 flex items-center justify-between font-inter" style={{ color: 'rgba(200,180,150,0.42)', fontSize: '10px' }}>
          <span>{book.lastRead}</span><span>{book.mood}</span>
        </div>
      </div>
      {menuOpen && (
        <div className="absolute right-3 bottom-20 z-20 rounded-2xl overflow-hidden" style={{ width: '150px', background: 'rgba(12,10,12,0.96)', border: '1px solid rgba(200,169,110,0.18)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}>
          <button onClick={onRead} className="w-full text-left px-3 py-2 font-inter" style={{ color: '#f0e8d8', fontSize: '12px' }}>Abrir leitor</button>
          <button onClick={() => onToggleFavorite(book.id)} className="w-full text-left px-3 py-2 font-inter" style={{ color: '#d4b87a', fontSize: '12px' }}>{book.favorite ? 'Remover favorito' : 'Favoritar'}</button>
          <button className="w-full text-left px-3 py-2 font-inter" style={{ color: 'rgba(200,180,150,0.55)', fontSize: '12px' }}>Detalhes</button>
        </div>
      )}
    </article>
  );
};

const StatCard: React.FC<{ label: string; value: string; detail: string; icon: string }> = ({ label, value, detail, icon }) => (
  <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.12)' }}>
    <div className="absolute -right-8 -bottom-8 opacity-10" style={{ color: '#d4b87a' }}><Icon name={icon} size={110} /></div>
    <div className="flex items-center gap-3">
      <div className="rounded-2xl flex items-center justify-center" style={{ width: '42px', height: '42px', color: '#d4b87a', background: 'rgba(200,169,110,0.08)' }}><Icon name={icon} size={18} /></div>
      <div>
        <p className="font-inter" style={{ color: 'rgba(200,180,150,0.52)', fontSize: '12px' }}>{label}</p>
        <p className="font-garamond text-3xl" style={{ color: '#f0e8d8' }}>{value}</p>
      </div>
    </div>
    <p className="font-inter mt-3" style={{ color: 'rgba(200,180,150,0.42)', fontSize: '11px' }}>{detail}</p>
  </div>
);

const ReadingPlan: React.FC = () => (
  <div className="rounded-3xl p-5 h-full" style={{ background: 'linear-gradient(135deg, rgba(26,92,72,0.18), rgba(255,255,255,0.035))', border: '1px solid rgba(200,169,110,0.12)' }}>
    <div className="flex items-center justify-between"><h3 className="font-garamond text-2xl" style={{ color: '#f0e8d8' }}>Plano de leitura</h3><LotusOrnament size={34} /></div>
    <p className="font-inter mt-2" style={{ color: 'rgba(200,180,150,0.52)', fontSize: '12px' }}>Meta sugerida para manter o ritmo.</p>
    <div className="mt-5 space-y-4">
      {['Ler 18 páginas hoje', 'Revisar 2 anotações', 'Finalizar capítulo 8'].map((task, index) => (
        <div key={task} className="flex items-center gap-3"><span className="rounded-full flex items-center justify-center font-inter" style={{ width: '26px', height: '26px', background: index === 0 ? '#1a5c48' : 'rgba(255,255,255,0.05)', color: '#f0e8d8', fontSize: '11px' }}>{index + 1}</span><span className="font-inter" style={{ color: 'rgba(240,232,216,0.72)', fontSize: '13px' }}>{task}</span></div>
      ))}
    </div>
  </div>
);

const NotesPreview: React.FC<{ notes: ReaderNote[] }> = ({ notes }) => (
  <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.12)' }}>
    <h3 className="font-garamond text-2xl" style={{ color: '#f0e8d8' }}>Anotações recentes</h3>
    <div className="grid md:grid-cols-3 gap-3 mt-4">
      {notes.slice(0, 3).map((note) => <NoteCard key={note.id} note={note} />)}
    </div>
  </div>
);

const NotesSection: React.FC<{
  notes: ReaderNote[];
  noteDraft: string;
  onDraftChange: (value: string) => void;
  onAddNote: () => void;
}> = ({ notes, noteDraft, onDraftChange, onAddNote }) => (
  <div className="space-y-6 pt-8">
    <SectionHeader title="Anotações" subtitle="Guarde pensamentos, trechos importantes e ideias de leitura." />
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
      <div className="grid md:grid-cols-2 gap-4">
        {notes.map((note) => <NoteCard key={note.id} note={note} large />)}
      </div>
      <div className="rounded-3xl p-5 sticky top-4 self-start" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.13)' }}>
        <h3 className="font-garamond text-2xl" style={{ color: '#f0e8d8' }}>Nova anotação</h3>
        <p className="font-inter mt-1" style={{ color: 'rgba(200,180,150,0.46)', fontSize: '12px' }}>Crie uma nota rápida para o livro atual.</p>
        <textarea value={noteDraft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Escreva sua anotação..." className="mt-4 w-full h-40 rounded-2xl p-4 outline-none resize-none font-inter" style={{ background: 'rgba(0,0,0,0.22)', color: '#f0e8d8', border: '1px solid rgba(200,169,110,0.13)', fontSize: '13px' }} />
        <button onClick={onAddNote} className="mt-4 w-full rounded-2xl py-3 font-inter" style={{ color: '#f0e8d8', background: 'linear-gradient(135deg, #8b1a1a, #651010)', border: '1px solid rgba(212,184,122,0.35)' }}>Salvar anotação</button>
      </div>
    </div>
  </div>
);

const NoteCard: React.FC<{ note: ReaderNote; large?: boolean }> = ({ note, large }) => (
  <article className="rounded-3xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))', border: '1px solid rgba(200,169,110,0.12)' }}>
    <span className="inline-flex rounded-full px-3 py-1 font-inter" style={{ color: '#d4b87a', background: 'rgba(200,169,110,0.08)', fontSize: '10px', letterSpacing: '0.08em' }}>{note.tag}</span>
    <p className="font-eb-garamond mt-3" style={{ color: '#e8dcc8', fontSize: large ? '18px' : '15px', lineHeight: 1.55 }}>“{note.text}”</p>
    <div className="flex items-center justify-between mt-4 font-inter" style={{ color: 'rgba(200,180,150,0.42)', fontSize: '11px' }}><span>{note.book}</span><span>Pág. {note.page}</span></div>
  </article>
);

const SettingsSection: React.FC<{ collapsed: boolean; onToggleSidebar: () => void }> = ({ collapsed, onToggleSidebar }) => (
  <div className="space-y-6 pt-8 max-w-5xl">
    <SectionHeader title="Configurações" subtitle="Ajuste leitura, aparência, armazenamento local e navegação." />
    <div className="grid md:grid-cols-2 gap-5">
      <SettingCard title="Menu lateral recolhível" description="O menu lateral agora abre e fecha para o lado, mantendo mais espaço para a biblioteca." action={<button onClick={onToggleSidebar} className="rounded-2xl px-4 py-2 font-inter text-sm" style={{ color: '#f0e8d8', background: 'rgba(26,92,72,0.75)', border: '1px solid rgba(46,204,138,0.24)' }}>{collapsed ? 'Expandir menu' : 'Recolher menu'}</button>} />
      <SettingCard title="Tema premium" description="Tema escuro chinês moderno com vermelho imperial, jade e dourado suave." badge="Ativo" />
      <SettingCard title="Leitura offline" description="Estrutura pronta para salvar biblioteca e progresso localmente no navegador." badge="Preparado" />
      <SettingCard title="Formatos" description="Interface preparada para importar e organizar livros em PDF e EPUB." badge="PDF / EPUB" />
    </div>
  </div>
);

const SettingCard: React.FC<{ title: string; description: string; badge?: string; action?: React.ReactNode }> = ({ title, description, badge, action }) => (
  <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.12)' }}>
    <div className="flex items-start justify-between gap-4">
      <div><h3 className="font-garamond text-2xl" style={{ color: '#f0e8d8' }}>{title}</h3><p className="font-inter mt-2" style={{ color: 'rgba(200,180,150,0.52)', fontSize: '13px', lineHeight: 1.6 }}>{description}</p></div>
      {badge && <span className="rounded-full px-3 py-1 font-inter shrink-0" style={{ color: '#2ecc8a', background: 'rgba(46,204,138,0.08)', fontSize: '11px' }}>{badge}</span>}
    </div>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const ImportModal: React.FC<{
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ selectedFile, onFileChange, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(12px)' }}>
    <div className="relative rounded-[28px] p-6 w-full max-w-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #111116, #16120f)', border: '1px solid rgba(200,169,110,0.2)', boxShadow: '0 35px 100px rgba(0,0,0,0.65)' }}>
      <button onClick={onClose} className="absolute top-4 right-4 rounded-xl flex items-center justify-center" style={{ width: '34px', height: '34px', color: '#c8a96e', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.12)' }}><Icon name="x" size={17} /></button>
      <div className="flex items-center gap-3"><div className="rounded-2xl flex items-center justify-center" style={{ width: 48, height: 48, color: '#d4b87a', background: 'rgba(200,169,110,0.08)' }}><Icon name="upload" /></div><div><h3 className="font-garamond text-3xl" style={{ color: '#f0e8d8' }}>Importar livro</h3><p className="font-inter" style={{ color: 'rgba(200,180,150,0.48)', fontSize: '12px' }}>Adicione PDF ou EPUB à biblioteca local.</p></div></div>
      <label className="mt-6 flex flex-col items-center justify-center rounded-3xl p-8 text-center cursor-pointer transition-all hover:scale-[1.01]" style={{ border: '1px dashed rgba(200,169,110,0.32)', background: 'rgba(255,255,255,0.035)' }}>
        <Icon name="upload" size={34} />
        <span className="font-garamond text-2xl mt-3" style={{ color: '#f0e8d8' }}>{selectedFile ? selectedFile.name : 'Escolha um arquivo'}</span>
        <span className="font-inter mt-2" style={{ color: 'rgba(200,180,150,0.48)', fontSize: '12px' }}>Formatos aceitos: PDF e EPUB</span>
        <input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" className="hidden" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
      </label>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="rounded-2xl px-4 py-3 font-inter text-sm" style={{ color: 'rgba(240,232,216,0.72)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,110,0.12)' }}>Cancelar</button>
        <button onClick={onConfirm} disabled={!selectedFile} className="rounded-2xl px-5 py-3 font-inter text-sm disabled:opacity-40" style={{ color: '#f0e8d8', background: 'linear-gradient(135deg, #8b1a1a, #651010)', border: '1px solid rgba(212,184,122,0.34)' }}>Adicionar à biblioteca</button>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-3xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(200,169,110,0.12)' }}>
    <LotusOrnament size={44} />
    <p className="font-eb-garamond mt-4" style={{ color: '#e8dcc8', fontSize: '19px' }}>{message}</p>
  </div>
);

export default Dashboard;
