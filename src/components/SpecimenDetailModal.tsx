import React, { useState, useRef } from 'react';
import {
  X,
  MapPin,
  Calendar,
  BookOpen,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserCheck,
  Compass,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
  MessageSquare,
} from 'lucide-react';
import { Specimen, SpecimenComment, SpecimenLike } from '../types';
import { SpecimenImage } from './SpecimenImage';

interface SpecimenDetailModalProps {
  specimen: Specimen | null;
  onClose: () => void;
  currentUserId?: string | null;
  isFollowingCollector: boolean;
  onToggleFollow: (targetUid: string) => void;
  onSelectCollector: (targetUid: string) => void;
  onDeleteSpecimen?: (specimenId: string) => void;
  likes: SpecimenLike[];
  comments: SpecimenComment[];
  isSavedBookmark: boolean;
  onToggleLike: (specimenId: string) => void;
  onAddComment: (specimenId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onToggleBookmark: (specimenId: string) => void;
  onStartChat?: (targetUid: string) => void;
}

export const SpecimenDetailModal: React.FC<SpecimenDetailModalProps> = ({
  specimen,
  onClose,
  currentUserId,
  isFollowingCollector,
  onToggleFollow,
  onSelectCollector,
  onDeleteSpecimen,
  likes,
  comments,
  isSavedBookmark,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  onToggleBookmark,
  onStartChat,
}) => {
  const [commentText, setCommentText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  if (!specimen) return null;

  const isOwnSpecimen = currentUserId && specimen.ownerId === currentUserId;
  const specimenLikes = likes.filter((l) => l.specimenId === specimen.id);
  const specimenComments = comments.filter((c) => c.specimenId === specimen.id);
  const isLikedByMe = specimenLikes.some((l) => l.userId === currentUserId);

  const categoryLabel =
    specimen.category === 'plant'
      ? 'Plantae · Flora'
      : specimen.category === 'animal'
        ? 'Animalia · Fauna'
        : 'Fungi · Micología';

  const handleDoubleTapPhoto = () => {
    setShowHeartBurst(true);
    if (!isLikedByMe) {
      onToggleLike(specimen.id);
    }
    setTimeout(() => setShowHeartBurst(false), 750);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(specimen.id, commentText.trim());
    setCommentText('');
  };

  const handleShare = async () => {
    const shareText = `${specimen.scientificName} (${specimen.commonName}) en la colección de @${specimen.ownerHandle} · Biofolio`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: specimen.scientificName,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#F7F6F2] text-[#141E19] border border-[#141E19]/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile bottom sheet grab handle */}
        <div className="w-10 h-1.5 bg-[#141E19]/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Top Collector Attribution Header (Instagram Post Header) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#141E19]/8 shrink-0">
          <button
            onClick={() => {
              onSelectCollector(specimen.ownerId);
              onClose();
            }}
            className="flex items-center gap-3 text-left group min-h-[44px] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#329F6B] text-white flex items-center justify-center font-serif font-semibold text-sm shrink-0">
              {specimen.ownerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-[#141E19] group-hover:underline">
                {specimen.ownerHandle}
              </div>
              <div className="text-xs text-[#526058]">
                {specimen.locationName || 'Registro de campo'}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {!isOwnSpecimen && (
              <>
                {onStartChat && (
                  <button
                    onClick={() => {
                      onStartChat(specimen.ownerId);
                      onClose();
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#EFECE6] text-[#141E19] hover:bg-[#E2DDD3] text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                    title="Chatear con el coleccionista"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#0F291E]" />
                    <span>Mensaje</span>
                  </button>
                )}
                <button
                  onClick={() => onToggleFollow(specimen.ownerId)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    isFollowingCollector
                      ? 'bg-[#EFECE6] text-[#141E19] hover:bg-[#E2DDD3]'
                      : 'bg-[#0F291E] text-white hover:bg-[#173D2D]'
                  }`}
                >
                  {isFollowingCollector ? (
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
              </>
            )}

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[#526058] hover:text-[#141E19] hover:bg-[#EFECE6] transition-colors cursor-pointer"
              aria-label="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Square Herbarium Specimen Photography (Double-tap to Like like Instagram) */}
        <div
          onDoubleClick={handleDoubleTapPhoto}
          className="relative aspect-square w-full bg-[#141E19] overflow-hidden select-none cursor-pointer shrink-0"
          title="Doble toque para dar Me gusta"
        >
          <SpecimenImage
            src={specimen.photoDataUrl}
            alt={specimen.scientificName}
            category={specimen.category}
            className="w-full h-full object-cover"
          />

          {/* Instagram Double-Tap Heart Animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/15">
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl scale-110 transition-transform" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 pt-14 text-white pointer-events-none">
            <div className="text-xs text-white/80 tracking-wide">
              {categoryLabel} · Familia <span className="italic">{specimen.family}</span>
              {specimen.confidence > 0 && (
                <>
                  {' '}
                  · <span className="font-mono tabular-nums">{specimen.confidence}%</span> certeza
                </>
              )}
            </div>
            <h2 className="font-serif italic text-3xl sm:text-4xl font-semibold tracking-tight mt-0.5 text-white">
              {specimen.scientificName}
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium">
              {specimen.commonName}
            </p>
          </div>
        </div>

        {/* Instagram Action Bar: Like, Comment, Share, Bookmark */}
        <div className="px-5 pt-3.5 pb-2 flex items-center justify-between border-b border-[#141E19]/8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleLike(specimen.id)}
              className="min-h-[40px] flex items-center gap-1.5 text-sm font-medium text-[#141E19] hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Me gusta"
            >
              <Heart
                className={`w-6 h-6 transition-transform active:scale-125 ${
                  isLikedByMe ? 'fill-red-500 text-red-500' : 'text-[#141E19]'
                }`}
              />
              <span className="font-mono tabular-nums font-semibold">
                {specimenLikes.length}
              </span>
            </button>

            <button
              onClick={() => commentInputRef.current?.focus()}
              className="min-h-[40px] flex items-center gap-1.5 text-sm font-medium text-[#141E19] hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Comentar"
            >
              <MessageCircle className="w-6 h-6 text-[#141E19]" />
              <span className="font-mono tabular-nums font-semibold">
                {specimenComments.length}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="min-h-[40px] flex items-center gap-1.5 text-xs font-medium text-[#141E19] hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Compartir hallazgo"
            >
              <Share2 className="w-5 h-5 text-[#141E19]" />
              {shareFeedback && (
                <span className="text-[#329F6B] font-medium">¡Enlace copiado!</span>
              )}
            </button>
          </div>

          <button
            onClick={() => onToggleBookmark(specimen.id)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-end text-[#141E19] hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Guardar en favoritos"
            title="Guardar en favoritos"
          >
            <Bookmark
              className={`w-6 h-6 ${
                isSavedBookmark ? 'fill-[#0F291E] text-[#0F291E]' : 'text-[#141E19]'
              }`}
            />
          </button>
        </div>

        {/* Liked by summary + Caption + Comments Section */}
        <div className="p-5 space-y-4">
          {/* Likes summary line */}
          <div className="text-xs text-[#141E19]">
            {specimenLikes.length === 0 ? (
              <span className="text-[#526058]">
                Sé el primero en darle <strong>Me gusta</strong> a este hallazgo
              </span>
            ) : (
              <span>
                Les gusta a{' '}
                <strong>@{specimenLikes[0].userHandle}</strong>
                {specimenLikes.length > 1 && (
                  <>
                    {' '}
                    y{' '}
                    <strong className="font-mono tabular-nums">
                      {specimenLikes.length - 1} persona(s) más
                    </strong>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Caption / Field Notes in Instagram format */}
          <div className="text-sm leading-relaxed text-[#141E19]">
            <button
              onClick={() => {
                onSelectCollector(specimen.ownerId);
                onClose();
              }}
              className="font-semibold mr-2 hover:underline cursor-pointer"
            >
              @{specimen.ownerHandle}
            </button>
            <span className="font-serif italic font-semibold mr-1.5">
              {specimen.scientificName}
            </span>
            <span>{specimen.notes || `Registro de ${specimen.commonName} en ${specimen.habitat}.`}</span>
          </div>

          {/* Unboxed clean scientific metadata */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#526058] pt-1 border-t border-[#141E19]/8">
            <span className="inline-flex items-center gap-1 text-[#141E19] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#329F6B]" />
              {specimen.conservationStatus || 'Preocupación menor (LC)'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Calendar className="w-3.5 h-3.5" />
              {specimen.observedDate}
            </span>
            {specimen.coordinates && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Compass className="w-3.5 h-3.5" />
                  {specimen.coordinates}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#329F6B]" />
              {specimen.habitat}
            </span>
          </div>

          {/* Comments List */}
          <div className="pt-3 border-t border-[#141E19]/8 space-y-2.5">
            <h3 className="text-xs font-semibold text-[#526058] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#329F6B]" />
              <span>Comentarios y notas de la comunidad ({specimenComments.length})</span>
            </h3>

            {specimenComments.length === 0 ? (
              <p className="text-xs text-[#526058] italic">
                Aún no hay comentarios. Agrega una observación o pregunta sobre esta especie.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {specimenComments.map((comment) => {
                  const canDelete =
                    currentUserId && comment.authorId === currentUserId;
                  return (
                    <div
                      key={comment.id}
                      className="flex items-start justify-between gap-2 text-xs sm:text-sm bg-[#EFECE6]/55 px-3 py-2 rounded-xl"
                    >
                      <div className="min-w-0">
                        <button
                          onClick={() => {
                            onSelectCollector(comment.authorId);
                            onClose();
                          }}
                          className="font-semibold text-[#141E19] hover:underline mr-2 cursor-pointer"
                        >
                          @{comment.authorHandle}
                        </button>
                        <span className="text-[#141E19] break-words">{comment.text}</span>
                      </div>
                      {canDelete && onDeleteComment && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-[#526058] hover:text-red-700 p-1 shrink-0 cursor-pointer"
                          title="Eliminar comentario"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Comment Input Bar */}
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2 pt-2">
              <input
                ref={commentInputRef}
                type="text"
                maxLength={400}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Agrega un comentario o identificación..."
                className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#141E19]/15 text-xs sm:text-sm text-[#141E19] focus:outline-none focus:border-[#329F6B]"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0F291E] text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 hover:bg-[#173D2D] transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar</span>
              </button>
            </form>
          </div>

          {/* Delete button if owned by user */}
          {isOwnSpecimen && onDeleteSpecimen && (
            <div className="pt-3 border-t border-[#141E19]/8 flex justify-end">
              <button
                onClick={() => {
                  onDeleteSpecimen(specimen.id);
                  onClose();
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar de mi colección</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
