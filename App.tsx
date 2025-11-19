import React, { useState } from 'react';
import { Board, Card, DragItem } from './types';
import CardModal from './components/CardModal';
import { 
    PlusIcon, MenuIcon, ClockIcon, CheckSquareIcon, SearchIcon, 
    TrelloIcon, UserIcon, PaperClipIcon, ListBulletIcon 
} from './components/Icons';

// --- Mock Data ---
const MOCK_USERS = [
  { id: 'u1', name: 'Alice', avatar: 'https://ui-avatars.com/api/?name=Alice&background=a855f7&color=fff' },
  { id: 'u2', name: 'Bob', avatar: 'https://ui-avatars.com/api/?name=Bob&background=7c3aed&color=fff' },
  { id: 'u3', name: 'Charlie', avatar: 'https://ui-avatars.com/api/?name=Charlie&background=c084fc&color=fff' },
];

const CURRENT_USER = MOCK_USERS[0];

const INITIAL_DATA: Board = {
  id: 'b1',
  title: 'Lançamento de Produto 🚀',
  listOrder: ['l1', 'l2', 'l3', 'l4'],
  lists: {
    'l1': { id: 'l1', title: 'A Fazer', cardIds: ['c1', 'c2'] },
    'l2': { id: 'l2', title: 'Em Progresso', cardIds: ['c3'] },
    'l3': { id: 'l3', title: 'Revisão', cardIds: ['c4'] },
    'l4': { id: 'l4', title: 'Concluído', cardIds: ['c5'] },
  },
  cards: {
    'c1': { 
      id: 'c1', listId: 'l1', title: 'Pesquisar Concorrentes', 
      description: 'Analisar os 3 principais concorrentes do mercado. Focar em preços e UX.', 
      labels: [{ id: 'lb1', name: 'Estratégia', color: 'bg-yellow-600' }], 
      members: [MOCK_USERS[0]], 
      comments: [], 
      checklist: [], 
      attachments: [],
      activity: [{id: 'a1', userId: 'u2', text: 'moveu este cartão do Backlog', createdAt: '2023-10-01T10:00:00Z', type: 'action'}],
      dueDate: '2023-11-25'
    },
    'c2': { 
      id: 'c2', listId: 'l1', title: 'Rascunhar Mockups de UI', 
      description: 'Usar Figma para criar wireframes iniciais.', 
      labels: [{ id: 'lb2', name: 'Design', color: 'bg-purple-600' }], 
      members: [MOCK_USERS[1]], 
      comments: [], 
      checklist: [], 
      attachments: [
        {id: 'att-img-1', name: 'Wireframe_v1.png', type: 'image', url: 'https://picsum.photos/seed/ui_wireframe/800/600', createdAt: '2023-10-22T10:00:00Z'}
      ],
      activity: [],
      coverUrl: 'https://picsum.photos/seed/ui/300/150'
    },
    'c3': { 
      id: 'c3', listId: 'l2', title: 'Configurar Repositório React', 
      description: 'Inicializar projeto Vite com TypeScript.', 
      labels: [{ id: 'lb3', name: 'Dev', color: 'bg-blue-600' }], 
      members: [MOCK_USERS[1], MOCK_USERS[2]], 
      comments: [], 
      checklist: [
        { id: 'ck1', text: 'Instalar Tailwind', checked: true },
        { id: 'ck2', text: 'Configurar Eslint', checked: false }
      ], 
      attachments: [],
      activity: []
    },
    'c4': { 
      id: 'c4', listId: 'l3', title: 'Reunião com Cliente', 
      description: 'Fase de descoberta inicial.', 
      labels: [], 
      members: [MOCK_USERS[0], MOCK_USERS[1]], 
      comments: [{id: 'cm1', userId: 'u2', text: 'Reunião reagendada para sexta-feira', createdAt: '2023-10-20T14:30:00Z'}], 
      checklist: [], 
      attachments: [{id: 'at1', name: 'Requisitos.pdf', type: 'file', url: '#', createdAt: '2023-10-19T09:00:00Z'}],
      activity: [
          {id: 'a2', userId: 'u2', text: 'Reunião reagendada para sexta-feira', createdAt: '2023-10-20T14:30:00Z', type: 'comment'}
      ]
    },
    'c5': { 
      id: 'c5', listId: 'l4', title: 'Assinar Contrato', 
      description: 'Assinado e armazenado no Drive.', 
      labels: [{ id: 'lb4', name: 'Jurídico', color: 'bg-red-600' }], 
      members: [], 
      comments: [], 
      checklist: [], 
      attachments: [],
      activity: [] 
    },
  }
};

const App: React.FC = () => {
  const [board, setBoard] = useState<Board>(INITIAL_DATA);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  
  // Drag and Drop Handlers (Native HTML5)
  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    // Transparent ghost image for custom feel
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault(); 
    if (!draggedItem) return;
    setDragOverListId(targetListId);
  };

  const handleDrop = (e: React.DragEvent, targetListId: string, dropIndex?: number) => {
    e.preventDefault();
    setDragOverListId(null);
    if (!draggedItem || draggedItem.type !== 'CARD') return;

    const sourceListId = draggedItem.listId!;
    
    // Safety check
    if (!board.lists[sourceListId]) return;

    const cardId = board.lists[sourceListId].cardIds[draggedItem.index];

    if (!cardId) return;

    // Deep copy board
    const newBoard = { ...board, lists: { ...board.lists } };
    
    // Remove from source
    const sourceCardIds = Array.from(newBoard.lists[sourceListId].cardIds);
    sourceCardIds.splice(draggedItem.index, 1);
    newBoard.lists[sourceListId] = { ...newBoard.lists[sourceListId], cardIds: sourceCardIds };

    // Add to destination
    const destCardIds = Array.from(newBoard.lists[targetListId].cardIds);
    
    // If dropIndex is undefined, append to end
    const finalIndex = dropIndex !== undefined ? dropIndex : destCardIds.length;
    
    destCardIds.splice(finalIndex, 0, cardId);
    newBoard.lists[targetListId] = { ...newBoard.lists[targetListId], cardIds: destCardIds };
    
    // Update card's internal listId ref
    newBoard.cards[cardId] = { ...newBoard.cards[cardId], listId: targetListId };

    // Add activity log for move
    if (sourceListId !== targetListId) {
        const moveActivity = {
            id: `act-${Date.now()}`,
            userId: CURRENT_USER.id,
            text: `moveu este cartão de ${board.lists[sourceListId].title} para ${board.lists[targetListId].title}`,
            createdAt: new Date().toISOString(),
            type: 'action' as const
        };
        newBoard.cards[cardId].activity = [moveActivity, ...newBoard.cards[cardId].activity];
    }

    setBoard(newBoard);
    setDraggedItem(null);
  };

  const handleUpdateCard = (cardId: string, updates: Partial<Card>) => {
    setBoard(prev => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], ...updates }
      }
    }));
  };

  const addNewCard = (listId: string) => {
    const newCardId = `new-${Date.now()}`;
    const newCard: Card = {
        id: newCardId,
        listId,
        title: 'Nova Tarefa',
        description: '',
        labels: [],
        members: [],
        comments: [],
        checklist: [],
        attachments: [],
        activity: [{
            id: `act-${Date.now()}`,
            userId: CURRENT_USER.id,
            text: 'criou este cartão',
            createdAt: new Date().toISOString(),
            type: 'action'
        }]
    };

    setBoard(prev => {
        const newLists = { ...prev.lists };
        newLists[listId] = {
            ...newLists[listId],
            cardIds: [...newLists[listId].cardIds, newCardId]
        };
        return {
            ...prev,
            cards: { ...prev.cards, [newCardId]: newCard },
            lists: newLists
        };
    });
    setTimeout(() => setSelectedCardId(newCardId), 50);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden font-sans text-gray-200">
      
      {/* Navbar */}
      <nav className="h-14 bg-zinc-900/80 border-b border-purple-500/20 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button className="text-purple-300 hover:bg-purple-500/10 p-1.5 rounded-sm transition-colors">
              <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-purple-100 font-bold text-lg opacity-90 hover:opacity-100 cursor-pointer">
            <TrelloIcon className="w-5 h-5 text-purple-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-300">KanbanFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-4">
              <button className="text-gray-300 text-sm font-medium px-3 py-1.5 rounded hover:bg-white/5 transition hover:text-white">Áreas de Trabalho</button>
              <button className="text-gray-300 text-sm font-medium px-3 py-1.5 rounded hover:bg-white/5 transition hover:text-white">Recentes</button>
              <button className="text-gray-300 text-sm font-medium px-3 py-1.5 rounded hover:bg-white/5 transition hover:text-white">Favoritos</button>
              <button className="text-gray-300 text-sm font-medium px-3 py-1.5 rounded hover:bg-white/5 transition hover:text-white">Modelos</button>
          </div>
          <button className="ml-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-1.5 rounded transition shadow shadow-purple-900/50">Criar</button>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative group">
                <SearchIcon className="absolute left-2 top-1.5 w-4 h-4 text-gray-400 group-focus-within:text-purple-400" />
                <input type="text" placeholder="Pesquisar" className="bg-zinc-800 border border-zinc-700 rounded-md pl-8 pr-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:bg-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none w-48 transition-all" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center text-white font-bold border border-zinc-700 hover:border-purple-300 cursor-pointer shadow-lg shadow-purple-900/20">
                {CURRENT_USER.name[0]}
            </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 bg-zinc-900/50 flex-col text-gray-300 border-r border-purple-500/10">
            <div className="p-4">
                <div className="flex items-center gap-3 mb-6 p-2 rounded hover:bg-white/5 cursor-pointer group">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/50">T</div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-200 group-hover:text-white">Espaço Trello</h3>
                        <p className="text-xs text-gray-500">Grátis</p>
                    </div>
                </div>
                
                <div className="space-y-1">
                     <button className="w-full text-left px-3 py-2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium text-sm flex items-center gap-2">
                         <TrelloIcon className="w-4 h-4"/> Quadros
                     </button>
                     <button className="w-full text-left px-3 py-2 rounded hover:bg-white/5 font-medium text-sm flex items-center gap-2 text-gray-400 hover:text-gray-200">
                         <UserIcon className="w-4 h-4"/> Membros
                     </button>
                     <button className="w-full text-left px-3 py-2 rounded hover:bg-white/5 font-medium text-sm flex items-center gap-2 text-gray-400 hover:text-gray-200">
                         <span className="w-4 h-4 flex items-center justify-center font-serif italic font-bold">S</span> Configurações
                     </button>
                </div>
            </div>
            
            <div className="px-4 mt-4">
                <h4 className="text-xs font-bold uppercase mb-2 text-purple-400/70">Seus Quadros</h4>
                <div className="space-y-1">
                    <div className="px-3 py-2 rounded bg-zinc-800/50 text-sm font-medium flex justify-between items-center cursor-pointer border-l-2 border-purple-500">
                        <span className="text-gray-200">Lançamento de Produto 🚀</span>
                    </div>
                     <div className="px-3 py-2 rounded hover:bg-white/5 text-sm font-medium text-gray-500 hover:text-gray-300 cursor-pointer border-l-2 border-transparent">
                        Objetivos Pessoais
                    </div>
                </div>
            </div>
        </aside>

        {/* Board Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-zinc-950 to-[#0a0a0c]">
            
            {/* Board Header */}
            <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-purple-500/5">
                <div className="flex items-center gap-4">
                    <h1 className="text-gray-100 font-bold text-xl px-2 py-1 hover:bg-white/5 rounded cursor-pointer transition">{board.title}</h1>
                    <button className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <div className="h-6 w-[1px] bg-gray-800"></div>
                    <button className="text-purple-300 font-medium text-sm bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/20 px-3 py-1.5 rounded flex items-center gap-2 transition">
                        <span className="bg-purple-500 text-white px-1.5 rounded text-xs font-bold">IA</span> Power-Ups
                    </button>
                    <div className="flex -space-x-2">
                        {MOCK_USERS.map(u => <img key={u.id} src={u.avatar} className="w-7 h-7 rounded-full border-2 border-zinc-900 hover:border-purple-500 cursor-pointer transition-colors" title={u.name}/>)}
                        <button className="w-7 h-7 rounded-full bg-zinc-800 text-purple-400 font-bold text-xs flex items-center justify-center border-2 border-zinc-900 hover:bg-zinc-700 hover:text-white transition">+</button>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition">
                    <MenuIcon className="w-4 h-4" /> Mostrar Menu
                </button>
            </div>

            {/* Lists Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 pt-4">
                <div className="flex h-full gap-3 items-start">
                {board.listOrder.map((listId) => {
                    const list = board.lists[listId];
                    const isOver = dragOverListId === list.id;
                    return (
                    <div 
                        key={list.id}
                        className={`
                            w-72 shrink-0 flex flex-col max-h-full rounded-xl transition-all duration-200 border
                            ${isOver ? 'bg-zinc-800 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-zinc-900 border-zinc-800'}
                        `}
                        onDragOver={(e) => handleDragOver(e, list.id)}
                        onDrop={(e) => handleDrop(e, list.id)}
                    >
                        {/* List Header */}
                        <div className="p-3 px-3 flex items-center justify-between cursor-grab active:cursor-grabbing group">
                             <h3 className="font-semibold text-gray-200 text-sm px-2 py-1 border border-transparent hover:border-zinc-700 rounded bg-transparent focus:bg-zinc-950">{list.title}</h3>
                             <button className="text-gray-500 hover:text-gray-300 hover:bg-zinc-800 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                            </button>
                        </div>

                        {/* List Cards Area */}
                        <div className="flex-1 overflow-y-auto px-2 mx-1 space-y-2 min-h-[10px] custom-scrollbar">
                        {list.cardIds.map((cardId, index) => {
                            const card = board.cards[cardId];
                            const isDragged = draggedItem?.id === card.id;
                            return (
                            <div
                                key={card.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, { id: card.id, index, type: 'CARD', listId: list.id })}
                                onDrop={(e) => {
                                    e.stopPropagation();
                                    handleDrop(e, list.id, index); 
                                }}
                                onClick={() => setSelectedCardId(card.id)}
                                className={`
                                    group relative bg-zinc-800 p-2.5 rounded-lg shadow-sm border border-zinc-700/50
                                    cursor-pointer hover:bg-zinc-700/80 hover:border-purple-500/30 transition-all duration-200 select-none
                                    ${isDragged ? 'opacity-40 rotate-3 scale-105 ring-2 ring-purple-500' : 'opacity-100'}
                                `}
                            >
                                {/* Cover Image */}
                                {card.coverUrl && (
                                    <div className="h-24 -mx-2.5 -mt-2.5 mb-2 rounded-t-lg overflow-hidden bg-zinc-700">
                                        <img src={card.coverUrl} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" alt="Cover" />
                                    </div>
                                )}

                                {/* Labels */}
                                {card.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                        {card.labels.map(l => (
                                            <span key={l.id} className={`h-1.5 w-10 rounded-full ${l.color} opacity-90 group-hover:opacity-100 transition-opacity shadow-[0_0_5px_rgba(0,0,0,0.3)]`} title={l.name}></span>
                                        ))}
                                    </div>
                                )}
                                
                                <h4 className="text-sm text-gray-200 mb-1 leading-snug font-medium">{card.title}</h4>
                                
                                {/* Badges */}
                                <div className="flex items-center flex-wrap gap-3 text-gray-500 mt-2">
                                    {card.dueDate && (
                                        <div className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${new Date(card.dueDate) < new Date() ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'hover:bg-zinc-600 text-gray-400'}`}>
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            <span>{new Date(card.dueDate).toLocaleDateString('pt-BR', {month:'short', day:'numeric'})}</span>
                                        </div>
                                    )}
                                    {card.description && (
                                        <ListBulletIcon className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                    {card.attachments.length > 0 && (
                                        <div className="flex items-center gap-0.5 text-xs text-gray-500">
                                            <PaperClipIcon className="w-3.5 h-3.5 transform rotate-45" />
                                            <span>{card.attachments.length}</span>
                                        </div>
                                    )}
                                    {card.checklist.length > 0 && (
                                        <div className={`flex items-center gap-1 text-xs ${card.checklist.every(c => c.checked) ? 'bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-900/50' : ''}`}>
                                            <CheckSquareIcon className="w-3.5 h-3.5" />
                                            <span>{card.checklist.filter(c => c.checked).length}/{card.checklist.length}</span>
                                        </div>
                                    )}
                                    {card.members.length > 0 && (
                                        <div className="ml-auto flex -space-x-1">
                                            {card.members.map(m => (
                                                <img key={m.id} src={m.avatar} className="w-6 h-6 rounded-full ring-2 ring-zinc-800" alt="member"/>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-600 rounded text-gray-400 hover:text-white">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                </div>
                            </div>
                            );
                        })}
                        </div>

                        {/* List Footer */}
                        <div className="p-2 pt-1 px-3 pb-3">
                            <button 
                                onClick={() => addNewCard(list.id)}
                                className="flex items-center gap-2 text-gray-500 hover:bg-zinc-800 hover:text-purple-300 w-full p-2 rounded text-sm transition-colors text-left group"
                            >
                                <PlusIcon className="w-4 h-4 group-hover:text-purple-400" />
                                <span>Adicionar um cartão</span>
                            </button>
                        </div>
                    </div>
                    );
                })}
                
                {/* Add List Placeholder */}
                <div className="w-72 shrink-0">
                    <button className="w-full bg-white/5 hover:bg-white/10 text-gray-300 p-3 rounded-xl text-left font-medium flex items-center gap-2 backdrop-blur-sm transition border border-dashed border-white/10 hover:border-purple-500/50 hover:text-purple-200">
                        <PlusIcon className="w-5 h-5" />
                        Adicionar outra lista
                    </button>
                </div>

                </div>
            </div>
        </main>
      </div>

      {/* Modals */}
      {selectedCardId && board.cards[selectedCardId] && (
        <CardModal 
            card={board.cards[selectedCardId]} 
            currentUser={CURRENT_USER}
            isOpen={!!selectedCardId} 
            onClose={() => setSelectedCardId(null)} 
            onUpdate={handleUpdateCard}
        />
      )}
    </div>
  );
};

export default App;