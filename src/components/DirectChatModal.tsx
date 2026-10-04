import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Search,
  User,
  ExternalLink,
} from 'lucide-react';
import { CollectorProfile, DirectMessage } from '../types';
import { SpecimenImage } from './SpecimenImage';

export function buildChatRoomId(uidA: string, uidB: string): string {
  const cleanA = uidA.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanB = uidB.replace(/[^a-zA-Z0-9_-]/g, '_');
  return [cleanA, cleanB].sort().join('__').slice(0, 120);
}

interface DirectChatModalProps {
  currentUserProfile: CollectorProfile;
  profiles: CollectorProfile[];
  messages: DirectMessage[];
  onlineUserIds: string[];
  selectedPartnerUid: string | null;
  onSelectPartner: (uid: string | null) => void;
  onSendMessage: (recipientId: string, text: string) => void;
  onOpenCollectorProfile: (uid: string) => void;
}

export const DirectChatView: React.FC<DirectChatModalProps> = ({
  currentUserProfile,
  profiles,
  messages,
  onlineUserIds,
  selectedPartnerUid,
  onSelectPartner,
  onSendMessage,
  onOpenCollectorProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [draftText, setDraftText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Other collectors available to chat with
  const availablePartners = profiles.filter(
    (p) => p.uid !== currentUserProfile.uid
  );

  const activePartner = availablePartners.find(
    (p) => p.uid === selectedPartnerUid
  ) || null;

  const activeRoomId = activePartner
    ? buildChatRoomId(currentUserProfile.uid, activePartner.uid)
    : null;

  const roomMessages = activeRoomId
    ? messages.filter((m) => m.roomId === activeRoomId)
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length, activeRoomId]);

  const filteredPartners = availablePartners.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.handle.toLowerCase().includes(q) ||
      p.specialty.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner || !draftText.trim()) return;
    onSendMessage(activePartner.uid, draftText.trim());
    setDraftText('');
  };

  return (
    <div className="max-w-5xl mx-auto px-0 sm:px-8 py-0 sm:py-6 pb-20">
      <div className="bg-white sm:rounded-3xl border-y sm:border border-[#141E19]/10 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-8.5rem)] sm:min-h-[620px] shadow-xs">
        {/* Left Column: Conversations & Collectors List (Instagram Direct Inbox) */}
        <div
          className={`md:col-span-5 border-r border-[#141E19]/10 flex flex-col bg-[#F7F6F2]/60 ${
            activePartner ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-[#141E19]/8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[#141E19]">
                  Mensajes Directos
                </h1>
                <p className="text-xs text-[#526058]">
                  Conversa con otros coleccionistas sobre especies y hallazgos
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#526058] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar coleccionista (@handle)..."
                className="w-full min-h-[40px] pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#141E19]/12 text-xs text-[#141E19] focus:outline-none focus:border-[#0F291E]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#141E19]/6">
            {filteredPartners.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#526058]">
                No se encontraron coleccionistas con ese nombre.
              </div>
            ) : (
              filteredPartners.map((partner) => {
                const rId = buildChatRoomId(currentUserProfile.uid, partner.uid);
                const thread = messages.filter((m) => m.roomId === rId);
                const lastMessage = thread[thread.length - 1];
                const isSelected = activePartner?.uid === partner.uid;
                const isOnline =
                  onlineUserIds.includes(partner.uid) ||
                  partner.uid.startsWith('curator_');

                return (
                  <button
                    key={partner.uid}
                    onClick={() => onSelectPartner(partner.uid)}
                    className={`w-full p-4 flex items-center gap-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#329F6B]/12'
                        : 'hover:bg-[#EFECE6]/70'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#0F291E] text-white shrink-0 border border-[#141E19]/10">
                      {partner.avatarUrl ? (
                        <SpecimenImage
                          src={partner.avatarUrl}
                          alt={partner.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif font-bold">
                          {partner.displayName.charAt(0)}
                        </div>
                      )}
                      {isOnline && (
                        <span
                          className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[#10B981] ring-2 ring-white"
                          title="Activo"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#141E19] truncate">
                          {partner.displayName}
                        </span>
                        <span className="text-[11px] font-mono text-[#526058] shrink-0">
                          @{partner.handle}
                        </span>
                      </div>

                      {lastMessage ? (
                        <p className="text-xs text-[#526058] truncate mt-0.5">
                          {lastMessage.senderId === currentUserProfile.uid
                            ? 'Tú: '
                            : ''}
                          {lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-xs text-[#329F6B] truncate mt-0.5">
                          {partner.specialty} · Iniciar chat
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Thread */}
        <div
          className={`md:col-span-7 flex flex-col bg-white ${
            !activePartner ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activePartner ? (
            <>
              {/* Conversation Header */}
              <div className="px-4 py-3 border-b border-[#141E19]/10 flex items-center justify-between bg-[#F7F6F2]/50">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onSelectPartner(null)}
                    className="md:hidden min-h-[40px] min-w-[40px] -ml-2 rounded-full flex items-center justify-center text-[#141E19] hover:bg-[#EFECE6] cursor-pointer"
                    aria-label="Volver a bandeja de mensajes"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => onOpenCollectorProfile(activePartner.uid)}
                    className="flex items-center gap-3 text-left group min-w-0 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0F291E] text-white shrink-0">
                      {activePartner.avatarUrl ? (
                        <SpecimenImage
                          src={activePartner.avatarUrl}
                          alt={activePartner.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif font-bold">
                          {activePartner.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#141E19] group-hover:underline truncate">
                        {activePartner.displayName}
                      </div>
                      <div className="text-xs text-[#526058] truncate">
                        @{activePartner.handle} · {activePartner.specialty}
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => onOpenCollectorProfile(activePartner.uid)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EFECE6] text-[#141E19] text-xs font-medium flex items-center gap-1.5 hover:bg-[#E2DDD3] transition-colors shrink-0 cursor-pointer"
                >
                  <span>Ver colección</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#F7F6F2]/30">
                {/* Collector Mini Card at Top of Thread */}
                <div className="text-center py-4 mb-2 border-b border-[#141E19]/8">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0F291E] text-white mx-auto mb-2">
                    {activePartner.avatarUrl ? (
                      <SpecimenImage
                        src={activePartner.avatarUrl}
                        alt={activePartner.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif text-xl font-bold">
                        {activePartner.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="font-serif text-lg font-semibold text-[#141E19]">
                    {activePartner.displayName}
                  </p>
                  <p className="text-xs font-mono text-[#526058]">
                    @{activePartner.handle} · {activePartner.location}
                  </p>
                  <p className="text-xs text-[#526058] max-w-sm mx-auto mt-1">
                    {activePartner.bio}
                  </p>
                </div>

                {roomMessages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#526058]">
                    Envía el primer mensaje a @{activePartner.handle} para conversar sobre sus
                    especímenes de plantas o animales.
                  </div>
                ) : (
                  roomMessages.map((msg) => {
                    const isMine = msg.senderId === currentUserProfile.uid;
                    const timeStr = (() => {
                      try {
                        const d = new Date(msg.timestamp);
                        if (isNaN(d.getTime())) return '';
                        return d.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } catch {
                        return '';
                      }
                    })();

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-[#0F291E] text-white rounded-br-xs'
                              : 'bg-[#EFECE6] text-[#141E19] rounded-bl-xs'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                        </div>
                        {timeStr && (
                          <span className="text-[10px] font-mono text-[#526058] mt-1 px-1">
                            {timeStr}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSubmit}
                className="p-3.5 border-t border-[#141E19]/10 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  maxLength={500}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder={`Enviar mensaje a @${activePartner.handle}...`}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-full bg-[#F7F6F2] border border-[#141E19]/15 text-sm text-[#141E19] focus:outline-none focus:border-[#329F6B]"
                />
                <button
                  type="submit"
                  disabled={!draftText.trim()}
                  className="min-h-[44px] px-5 py-2 rounded-full bg-[#0F291E] text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 hover:bg-[#173D2D] transition-colors shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#EFECE6] text-[#0F291E] flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#141E19]">
                Tus Mensajes Directos
              </h2>
              <p className="text-xs text-[#526058] max-w-xs mt-1">
                Selecciona un coleccionista de la lista izquierda para compartir ubicaciones,
                identificaciones taxonómicas o consultar sobre un espécimen.
              </p>
              {availablePartners[0] && (
                <button
                  onClick={() => onSelectPartner(availablePartners[0].uid)}
                  className="mt-5 min-h-[42px] px-5 py-2 rounded-xl bg-[#0F291E] text-white text-xs font-medium inline-flex items-center gap-2 hover:bg-[#173D2D] transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Chatear con {availablePartners[0].displayName}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
