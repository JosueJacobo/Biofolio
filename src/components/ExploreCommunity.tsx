import React, { useState } from 'react';
import {
  UserPlus,
  UserCheck,
  MapPin,
  Search,
  Compass,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  CollectorProfile,
  Specimen,
  SpecimenCategory,
  SpecimenComment,
  SpecimenLike,
} from '../types';
import { SpecimenImage } from './SpecimenImage';

interface ExploreCommunityProps {
  profiles: CollectorProfile[];
  specimens: Specimen[];
  currentUserId?: string | null;
  followingIds: string[];
  onToggleFollow: (targetUid: string) => void;
  onSelectCollector: (uid: string) => void;
  onSelectSpecimen: (specimen: Specimen) => void;
  likes: SpecimenLike[];
  comments: SpecimenComment[];
  savedBookmarkIds: string[];
  onToggleLike: (specimenId: string) => void;
  onAddComment: (specimenId: string, text: string) => void;
  onToggleBookmark: (specimenId: string) => void;
  onStartChat: (targetUid: string) => void;
}

export const ExploreCommunity: React.FC<ExploreCommunityProps> = ({
  profiles,
  specimens,
  currentUserId,
  followingIds,
  onToggleFollow,
  onSelectCollector,
  onSelectSpecimen,
  likes,
  comments,
  savedBookmarkIds,
  onToggleLike,
  onAddComment,
  onToggleBookmark,
  onStartChat,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'following' | SpecimenCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inlineComments, setInlineComments] = useState<Record<string, string>>({});
  const [heartBurstId, setHeartBurstId] = useState<string | null>(null);

  const visibleSpecimens = specimens.filter((sp) => {
    if (filterMode === 'following') {
      if (!followingIds.includes(sp.ownerId)) return false;
    } else if (
      filterMode === 'plant' ||
      filterMode === 'animal' ||
      filterMode === 'fungi'
    ) {
      if (sp.category !== filterMode) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sp.scientificName.toLowerCase().includes(q) ||
        sp.commonName.toLowerCase().includes(q) ||
        sp.ownerName.toLowerCase().includes(q) ||
        sp.ownerHandle.toLowerCase().includes(q) ||
        sp.family.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDoubleTapCard = (specimenId: string, isLiked: boolean) => {
    setHeartBurstId(specimenId);
    if (!isLiked) {
      onToggleLike(specimenId);
    }
    setTimeout(() => setHeartBurstId(null), 700);
  };

  const handleInlineCommentSubmit = (e: React.FormEvent, specimenId: string) => {
    e.preventDefault();
    const text = (inlineComments[specimenId] || '').trim();
    if (!text) return;
    onAddComment(specimenId, text);
    setInlineComments((prev) => ({ ...prev, [specimenId]: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 pb-24 space-y-8">
      {/* Section 1: Featured Naturalist Collectors to Follow */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#141E19]">
              Coleccionistas y Herbarios Activos
            </h2>
            <p className="text-xs text-[#526058]">
              Sigue perfiles para explorar únicamente sus colecciones de plantas y animales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {profiles.map((collector) => {
            const collectorSpecimens = specimens.filter((s) => s.ownerId === collector.uid);
            const isFollowing = followingIds.includes(collector.uid);
            const isMe = currentUserId === collector.uid;

            return (
              <div
                key={collector.uid}
                className="p-4 rounded-2xl bg-[#EFECE6]/75 border border-[#141E19]/8 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onSelectCollector(collector.uid)}
                    className="flex items-center gap-3 text-left group min-w-0 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0F291E] text-white shrink-0 border border-[#141E19]/10">
                      {collector.avatarUrl ? (
                        <SpecimenImage
                          src={collector.avatarUrl}
                          alt={collector.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif font-bold">
                          {collector.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#141E19] group-hover:underline truncate">
                        {collector.displayName}
                      </h3>
                      <p className="text-xs font-mono text-[#526058] truncate">
                        @{collector.handle}
                      </p>
                      <p className="text-xs text-[#0F291E] truncate mt-0.5">
                        {collector.specialty}
                      </p>
                    </div>
                  </button>

                  {!isMe && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onStartChat(collector.uid)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white text-[#141E19] border border-[#141E19]/15 text-xs font-medium flex items-center gap-1.5 hover:bg-[#EFECE6] transition-colors whitespace-nowrap cursor-pointer"
                        title="Enviar mensaje directo"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#0F291E]" />
                        <span>Chatear</span>
                      </button>
                      <button
                        onClick={() => onToggleFollow(collector.uid)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                          isFollowing
                            ? 'bg-white text-[#141E19] border border-[#141E19]/15'
                            : 'bg-[#0F291E] text-white hover:bg-[#173D2D]'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Siguiendo</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Seguir</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Mini 3-specimen preview strip */}
                {collectorSpecimens.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {collectorSpecimens.slice(0, 3).map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => onSelectSpecimen(sp)}
                        className="aspect-square rounded-lg overflow-hidden bg-white relative group cursor-pointer"
                      >
                        <SpecimenImage
                          src={sp.photoDataUrl}
                          alt={sp.scientificName}
                          category={sp.category}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                          <span className="block font-serif italic text-[11px] text-white truncate">
                            {sp.scientificName}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#526058] pt-1">
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {collector.location}
                  </span>
                  <button
                    onClick={() => onSelectCollector(collector.uid)}
                    className="font-medium text-[#0F291E] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Ver {collectorSpecimens.length} especies →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Instagram Feed of Recent Findings (Like, Comment, Bookmark) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#141E19]">
              Feed de Hallazgos Recientes
            </h2>
            <p className="text-xs text-[#526058]">
              Dale Me gusta, comenta identificaciones y guarda especímenes en tu colección
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#526058] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Especie, familia o coleccionista..."
              className="w-full min-h-[40px] pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#141E19]/15 text-xs text-[#141E19] focus:outline-none focus:border-[#0F291E]"
            />
          </div>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-xl mb-6 overflow-x-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            Todos los hallazgos
          </button>
          <button
            onClick={() => setFilterMode('following')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filterMode === 'following'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            Perfiles seguidos ({followingIds.length})
          </button>
          <button
            onClick={() => setFilterMode('plant')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filterMode === 'plant'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            Flora (Plantae)
          </button>
          <button
            onClick={() => setFilterMode('animal')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filterMode === 'animal'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            Fauna (Animalia)
          </button>
          <button
            onClick={() => setFilterMode('fungi')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filterMode === 'fungi'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            Hongos (Fungi)
          </button>
        </div>

        {visibleSpecimens.length === 0 ? (
          <div className="py-12 text-center bg-[#EFECE6]/50 rounded-2xl border border-[#141E19]/8">
            <Compass className="w-8 h-8 text-[#526058] mx-auto mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-[#141E19]">
              {filterMode === 'following'
                ? 'Aún no sigues a ningún perfil con especímenes en esta vista.'
                : 'No se encontraron especímenes con ese criterio.'}
            </p>
            {filterMode === 'following' && (
              <button
                onClick={() => setFilterMode('all')}
                className="mt-3 text-xs font-medium text-[#0F291E] underline cursor-pointer"
              >
                Ver todos los coleccionistas
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {visibleSpecimens.map((specimen) => {
              const spLikes = likes.filter((l) => l.specimenId === specimen.id);
              const spComments = comments.filter((c) => c.specimenId === specimen.id);
              const isLiked = spLikes.some((l) => l.userId === currentUserId);
              const isSaved = savedBookmarkIds.includes(specimen.id);

              return (
                <article
                  key={specimen.id}
                  className="rounded-2xl overflow-hidden bg-white border border-[#141E19]/10 flex flex-col justify-between"
                >
                  <div>
                    {/* Instagram Post Header */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <button
                        onClick={() => onSelectCollector(specimen.ownerId)}
                        className="flex items-center gap-2.5 text-left group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#329F6B] text-white flex items-center justify-center font-serif font-semibold text-xs">
                          {specimen.ownerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#141E19] group-hover:underline">
                            @{specimen.ownerHandle}
                          </div>
                          <div className="text-[11px] text-[#526058] truncate max-w-[180px]">
                            {specimen.locationName}
                          </div>
                        </div>
                      </button>

                      <span className="text-xs italic text-[#526058]">
                        {specimen.family}
                      </span>
                    </div>

                    {/* Square Photo with Double-Tap to Like */}
                    <div
                      onDoubleClick={() => handleDoubleTapCard(specimen.id, isLiked)}
                      className="relative aspect-square w-full overflow-hidden bg-[#EFECE6] cursor-pointer select-none"
                    >
                      <SpecimenImage
                        src={specimen.photoDataUrl}
                        alt={specimen.scientificName}
                        category={specimen.category}
                        className="w-full h-full object-cover"
                      />
                      {heartBurstId === specimen.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                          <Heart className="w-20 h-20 text-white fill-white drop-shadow-xl" />
                        </div>
                      )}
                      <button
                        onClick={() => onSelectSpecimen(specimen)}
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 pt-10 text-left cursor-pointer"
                      >
                        <h3 className="font-serif italic text-xl font-semibold text-white leading-tight">
                          {specimen.scientificName}
                        </h3>
                        <p className="text-xs text-white/85">{specimen.commonName}</p>
                      </button>
                    </div>

                    {/* Instagram Action Row */}
                    <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => onToggleLike(specimen.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#141E19] hover:opacity-75 transition-opacity cursor-pointer"
                          aria-label="Me gusta"
                        >
                          <Heart
                            className={`w-5 h-5 transition-transform active:scale-125 ${
                              isLiked ? 'fill-red-500 text-red-500' : 'text-[#141E19]'
                            }`}
                          />
                          <span className="font-mono tabular-nums font-semibold">
                            {spLikes.length}
                          </span>
                        </button>

                        <button
                          onClick={() => onSelectSpecimen(specimen)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#141E19] hover:opacity-75 transition-opacity cursor-pointer"
                          aria-label="Ver comentarios"
                        >
                          <MessageCircle className="w-5 h-5 text-[#141E19]" />
                          <span className="font-mono tabular-nums font-semibold">
                            {spComments.length}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => onToggleBookmark(specimen.id)}
                        className="text-[#141E19] hover:opacity-75 transition-opacity cursor-pointer"
                        aria-label="Guardar espécimen"
                      >
                        <Bookmark
                          className={`w-5 h-5 ${
                            isSaved ? 'fill-[#0F291E] text-[#0F291E]' : 'text-[#141E19]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Caption & Latest Comments Preview */}
                    <div className="px-4 pb-2 space-y-1 text-xs">
                      <p className="text-[#141E19] line-clamp-2">
                        <button
                          onClick={() => onSelectCollector(specimen.ownerId)}
                          className="font-semibold mr-1.5 hover:underline cursor-pointer"
                        >
                          @{specimen.ownerHandle}
                        </button>
                        {specimen.notes}
                      </p>

                      {spComments.length > 0 && (
                        <div className="pt-1 space-y-1">
                          {spComments.slice(-2).map((c) => (
                            <div key={c.id} className="text-[#526058] truncate">
                              <span className="font-semibold text-[#141E19] mr-1.5">
                                @{c.authorHandle}
                              </span>
                              <span>{c.text}</span>
                            </div>
                          ))}
                          {spComments.length > 2 && (
                            <button
                              onClick={() => onSelectSpecimen(specimen)}
                              className="text-[11px] text-[#526058] hover:underline cursor-pointer"
                            >
                              Ver los {spComments.length} comentarios...
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Inline Comment Form */}
                  <form
                    onSubmit={(e) => handleInlineCommentSubmit(e, specimen.id)}
                    className="px-4 py-2.5 border-t border-[#141E19]/8 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      maxLength={400}
                      value={inlineComments[specimen.id] || ''}
                      onChange={(e) =>
                        setInlineComments((prev) => ({
                          ...prev,
                          [specimen.id]: e.target.value,
                        }))
                      }
                      placeholder="Agregar un comentario..."
                      className="flex-1 text-xs bg-transparent text-[#141E19] placeholder:text-[#526058] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!(inlineComments[specimen.id] || '').trim()}
                      className="text-xs font-semibold text-[#329F6B] disabled:opacity-35 hover:text-[#0F291E] flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar</span>
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
