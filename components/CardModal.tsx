import React, { useState, useEffect } from 'react';
import { Card, ChecklistItem, User, Activity } from '../types';
import { 
    XIcon, SparklesIcon, ClockIcon, CheckSquareIcon, UserIcon, 
    PlusIcon, PaperClipIcon, ListBulletIcon, TagIcon, EyeIcon 
} from './Icons';
import { generateCardDescription, suggestChecklist } from '../services/geminiService';

interface CardModalProps {
  card: Card;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<Card>) => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, currentUser, isOpen, onClose, onUpdate }) => {
  const [description, setDescription] = useState(card.description);
  const [title, setTitle] = useState(card.title);
  const [newComment, setNewComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sync local state when card data changes (e.g. external updates or self updates)
  useEffect(() => {
    if (isOpen) {
      setDescription(card.description);
      setTitle(card.title);
    }
  }, [card.description, card.title, isOpen]);

  // Reset ephemeral state only when opening a new card or reopening modal
  useEffect(() => {
    if (isOpen) {
      setNewComment("");
      setPreviewImage(null);
    }
  }, [card.id, isOpen]);

  if (!isOpen) return null;

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    const newDesc = await generateCardDescription(title, description);
    setDescription(newDesc);
    // Auto save generated description
    onUpdate(card.id, { description: newDesc });
    setIsGenerating(false);
  };

  const handleSuggestChecklist = async () => {
    setIsGeneratingChecklist(true);
    const suggestions = await suggestChecklist(title, description);
    const newItems: ChecklistItem[] = suggestions.map((text, index) => ({
      id: `gen-${Date.now()}-${index}`,
      text,
      checked: false
    }));
    
    const activityLog: Activity = {
        id: `act-${Date.now()}`,
        userId: currentUser.id,
        text: `adicionou ${newItems.length} itens de checklist via IA`,
        createdAt: new Date().toISOString(),
        type: 'action'
    };

    onUpdate(card.id, { 
        checklist: [...card.checklist, ...newItems],
        activity: [activityLog, ...card.activity] 
    });
    setIsGeneratingChecklist(false);
  };

  const toggleCheckItem = (itemId: string) => {
    const updatedChecklist = card.checklist.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    onUpdate(card.id, { checklist: updatedChecklist });
  };

  const handleTitleBlur = () => {
    if (title !== card.title) {
        onUpdate(card.id, { title });
    }
  };

  const handleDescriptionBlur = () => {
      if (description !== card.description) {
          onUpdate(card.id, { description });
      }
  }

  const postComment = () => {
      if (!newComment.trim()) return;
      const commentActivity: Activity = {
          id: `cm-${Date.now()}`,
          userId: currentUser.id,
          text: newComment,
          createdAt: new Date().toISOString(),
          type: 'comment'
      };
      onUpdate(card.id, { 
          activity: [commentActivity, ...card.activity] 
      });
      setNewComment("");
  };

  // Helper to find user details for activity log
  const getUser = (userId: string) => {
      const found = card.members.find(m => m.id === userId);
      return found || currentUser; // Fallback for demo
  }

  return (
    <>
        {/* Lightbox Preview Overlay */}
        {previewImage && (
            <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
                <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <XIcon className="w-8 h-8" />
                </button>
                <img 
                    src={previewImage} 
                    alt="Visualização" 
                    className="max-w-full max-h-[90vh] rounded shadow-2xl border border-zinc-800 object-contain" 
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        )}

        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
        <div 
            className="bg-zinc-900 w-full max-w-4xl rounded-lg shadow-2xl shadow-black border border-zinc-800 overflow-hidden flex flex-col max-h-[95vh] text-gray-200"
            onClick={(e) => e.stopPropagation()}
        >
            
            {/* Modal Header */}
            <div className="pt-5 px-6 pb-2 flex justify-between items-start relative">
                <div className="absolute left-6 top-6 mt-1">
                    <div className="w-6 h-6 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></svg>
                    </div>
                </div>
                <div className="flex-1 ml-10 mr-8">
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        className="text-xl font-bold text-gray-100 w-full bg-transparent border-2 border-transparent focus:border-purple-500 focus:bg-zinc-950 rounded px-2 py-1 -ml-2 transition-all outline-none"
                    />
                    <div className="text-sm text-gray-500 mt-0.5 pl-0.5">
                        na lista <span className="underline decoration-dotted cursor-pointer text-gray-400 hover:text-purple-300">Tarefas</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:bg-zinc-800 hover:text-white rounded-full p-1.5 transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col md:flex-row gap-6 custom-scrollbar">
                
                {/* Main Content Column */}
                <div className="flex-1 space-y-8 min-w-0">
                    
                    {/* Members & Labels Metadata */}
                    <div className="pl-10 flex flex-wrap gap-6">
                        {card.members.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Membros</h4>
                                <div className="flex gap-1">
                                    {card.members.map(m => (
                                        <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full ring-2 ring-transparent hover:ring-purple-500 cursor-pointer" title={m.name}/>
                                    ))}
                                    <button className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-gray-400 hover:text-purple-400 transition-colors">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                        {card.labels.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Etiquetas</h4>
                                <div className="flex flex-wrap gap-1">
                                    {card.labels.map(l => (
                                        <span key={l.id} className={`h-8 px-3 rounded flex items-center font-medium text-sm min-w-[40px] ${l.color} bg-opacity-80 hover:bg-opacity-100 cursor-pointer transition-opacity text-white shadow-sm`}>
                                            {l.name}
                                        </span>
                                    ))}
                                    <button className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-gray-400 hover:text-purple-400 transition-colors">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description Section */}
                    <div className="relative group">
                        <div className="absolute left-0 top-0 mt-0.5">
                            <ListBulletIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="pl-10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-semibold text-gray-300">Descrição</h3>
                                <button 
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating}
                                    className="text-xs flex items-center gap-1.5 bg-purple-900/30 text-purple-300 border border-purple-500/30 px-2 py-1 rounded font-medium hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                                >
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    {isGenerating ? 'Melhorando...' : 'IA Melhorar'}
                                </button>
                            </div>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleDescriptionBlur}
                                placeholder="Adicione uma descrição mais detalhada..."
                                className="w-full min-h-[120px] p-3 bg-zinc-950 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded transition-all text-sm leading-relaxed resize-none shadow-inner text-gray-300 placeholder-gray-600"
                            />
                        </div>
                    </div>

                    {/* Attachments Section */}
                    {card.attachments.length > 0 && (
                        <div className="relative">
                            <div className="absolute left-0 top-0 mt-0.5">
                                <PaperClipIcon className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="pl-10">
                                <h3 className="text-base font-semibold text-gray-300 mb-3">Anexos</h3>
                                <div className="space-y-3">
                                    {card.attachments.map(att => (
                                        <div key={att.id} className="flex gap-3 group">
                                            <div 
                                                className="w-28 h-20 bg-zinc-800 rounded flex items-center justify-center overflow-hidden font-bold text-gray-500 uppercase text-xs cursor-pointer hover:opacity-90 transition-opacity relative border border-zinc-700"
                                                onClick={() => att.type === 'image' && setPreviewImage(att.url)}
                                            >
                                                {att.type === 'image' ? (
                                                    <>
                                                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span>ARQ</span>
                                                )}
                                            </div>
                                            <div className="flex-1 py-1">
                                                <div className="font-bold text-sm text-gray-200">{att.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex gap-1">
                                                    <span>Adicionado em {new Date(att.createdAt).toLocaleDateString('pt-BR')}</span>
                                                    <span>-</span>
                                                    <span className="underline hover:text-gray-300 cursor-pointer">Comentar</span>
                                                    <span>-</span>
                                                    <span className="underline hover:text-gray-300 cursor-pointer">Excluir</span>
                                                    {att.type === 'image' && (
                                                        <>
                                                            <span>-</span>
                                                            <span 
                                                                className="underline hover:text-purple-400 cursor-pointer font-medium" 
                                                                onClick={() => setPreviewImage(att.url)}
                                                            >
                                                                Visualizar
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs font-medium mt-1 border px-1 py-0.5 rounded inline-block border-zinc-700 text-gray-400 hover:bg-zinc-800 cursor-pointer">
                                                    {att.type === 'image' ? 'Tornar capa' : 'Editar'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Checklist Section */}
                    <div className="relative">
                        <div className="absolute left-0 top-0 mt-0.5">
                            <CheckSquareIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="pl-10">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-semibold text-gray-300">Checklist</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleSuggestChecklist}
                                        disabled={isGeneratingChecklist}
                                        className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-gray-300 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                    >
                                        {isGeneratingChecklist ? 'Pensando...' : 'IA Sugerir Itens'}
                                    </button>
                                    <button className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-gray-300 px-2 py-1 rounded transition-colors">
                                        Excluir
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                {card.checklist.length > 0 && (
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xs w-8 text-right text-gray-500">{Math.round((card.checklist.filter(i => i.checked).length / card.checklist.length) * 100)}%</span>
                                        <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                                            <div 
                                                className="bg-purple-500 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                                                style={{ width: `${(card.checklist.filter(i => i.checked).length / card.checklist.length) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {card.checklist.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 group hover:bg-zinc-800/50 p-1.5 -mx-1.5 rounded cursor-pointer transition-colors" onClick={() => toggleCheckItem(item.id)}>
                                        <input 
                                            type="checkbox" 
                                            checked={item.checked}
                                            readOnly
                                            className="w-4 h-4 rounded border-gray-600 bg-zinc-800 text-purple-600 focus:ring-purple-500 pointer-events-none accent-purple-500"
                                        />
                                        <span className={`text-sm transition-all ${item.checked ? 'text-gray-500 line-through decoration-gray-600' : 'text-gray-200'}`}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                                
                                <div className="pl-7 pt-1">
                                    <button className="text-sm text-gray-500 hover:bg-zinc-800 hover:text-gray-300 px-2 py-1 rounded -ml-2 transition-colors">Adicionar um item</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Section */}
                    <div className="relative">
                        <div className="absolute left-0 top-0 mt-0.5">
                            <ListBulletIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="pl-10">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-semibold text-gray-300">Atividade</h3>
                                <button className="text-sm text-gray-400 bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded border border-zinc-700 transition-colors">Mostrar Detalhes</button>
                            </div>
                            
                            {/* Comment Input */}
                            <div className="flex gap-3 mb-6">
                                <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt={currentUser.name} />
                                <div className="flex-1 relative bg-zinc-950 rounded-md shadow-sm border border-zinc-700 focus-within:border-purple-500 transition-colors">
                                    <textarea 
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Escreva um comentário..." 
                                        className="w-full p-3 text-sm bg-transparent border-none focus:ring-0 rounded-md resize-none h-12 focus:h-20 transition-all text-gray-200 placeholder-gray-600"
                                    />
                                    {newComment.length > 0 && (
                                        <div className="p-2 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center rounded-b-md">
                                            <div className="flex gap-2 text-gray-500">
                                                <PaperClipIcon className="w-4 h-4 hover:text-gray-300 cursor-pointer" />
                                                <span className="w-4 h-4 hover:text-gray-300 cursor-pointer font-bold">@</span>
                                            </div>
                                            <button 
                                                onClick={postComment}
                                                className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/20"
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Activity List */}
                            <div className="space-y-4">
                                {card.activity.map(act => {
                                    const user = getUser(act.userId);
                                    return (
                                        <div key={act.id} className="flex gap-3">
                                            <img src={user.avatar} className="w-8 h-8 rounded-full mt-0.5" alt={user.name} />
                                            <div className="flex-1">
                                                <div className="text-sm">
                                                    <span className="font-bold text-gray-200 mr-1">{user.name}</span>
                                                    {act.type === 'comment' ? (
                                                        <div className="bg-zinc-800 p-2 rounded shadow-sm border border-zinc-700 mt-1 text-gray-200">
                                                            {act.text}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">{act.text}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1 flex gap-2">
                                                    <span>{new Date(act.createdAt).toLocaleString('pt-BR')}</span>
                                                    {act.type === 'comment' && <span className="underline cursor-pointer hover:text-gray-400">Responder</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>
                    </div>

                </div>

                {/* Sidebar Column */}
                <div className="w-full md:w-48 space-y-6 shrink-0">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Adicionar ao cartão</h4>
                        <div className="flex flex-col gap-2">
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <UserIcon className="w-4 h-4" /> Membros
                            </button>
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <TagIcon className="w-4 h-4" /> Etiquetas
                            </button>
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <CheckSquareIcon className="w-4 h-4" /> Checklist
                            </button>
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <ClockIcon className="w-4 h-4" /> Datas
                            </button>
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <PaperClipIcon className="w-4 h-4" /> Anexo
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Ações</h4>
                        <div className="flex flex-col gap-2">
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                Mover
                            </button>
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Copiar
                            </button>
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-purple-300 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <EyeIcon className="w-4 h-4" /> Seguir
                            </button>
                            <hr className="border-zinc-700 my-1"/>
                            <button className="flex items-center gap-2 w-full bg-zinc-800 hover:bg-red-900/30 text-gray-300 hover:text-red-400 text-sm py-1.5 px-3 rounded transition-colors text-left">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Arquivar
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        </div>
    </>
  );
};

export default CardModal;