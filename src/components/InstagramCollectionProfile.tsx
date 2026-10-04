import React, { useState } from 'react';
import {
  Grid,
  List,
  Plus,
  UserPlus,
  UserCheck,
  Edit3,
  MapPin,
  Search,
  Leaf,
  Bug,
  Compass,
  Check,
  X,
  Heart,
  MessageCircle,
  Bookmark,
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
import { sanitizeHandle } from '../utils/imageUtils';

interface InstagramCollectionProfileProps {
  profile: CollectorProfile;
  specimens: Specimen[];
  allSpecimensForBookmarks: Specimen[];
  followersCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onToggleFollow: (targetUid: string) => void;
  onSelectSpecimen: (specimen: Specimen) => void;
  onOpenAddModal: () => void;
  onUpdateProfile?: (updated: Partial<CollectorProfile>) => Promise<void>;
  likes: SpecimenLike[];
  comments: SpecimenComment[];
  savedBookmarkIds: string[];
  onToggleLike: (specimenId: string) => void;
  onStartChat?: (targetUid: string) => void;
}

export const InstagramCollectionProfile: React.FC<InstagramCollectionProfileProps> = ({
  profile,
  specimens,
  allSpecimensForBookmarks,
  followersCount,
  followingCount,
  isOwnProfile,
  isFollowing,
  onToggleFollow,
  onSelectSpecimen,
  onOpenAddModal,
  onUpdateProfile,
  likes,
  comments,
  savedBookmarkIds,
  onStartChat,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'saved' | SpecimenCategory>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'taxonomy'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState(profile.displayName);
  const [editHandle, setEditHandle] = useState(profile.handle);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editLocation, setEditLocation] = useState(profile.location);
  const [editSpecialty, setEditSpecialty] = useState(profile.specialty);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const plantsCount = specimens.filter((s) => s.category === 'plant').length;
  const animalsCount = specimens.filter((s) => s.category === 'animal').length;
  const fungiCount = specimens.filter((s) => s.category === 'fungi').length;

  const baseList =
    categoryFilter === 'saved'
      ? allSpecimensForBookmarks.filter((s) => savedBookmarkIds.includes(s.id))
      : specimens;

  const filteredSpecimens = baseList.filter((item) => {
    if (
      categoryFilter !== 'all' &&
      categoryFilter !== 'saved' &&
      item.category !== categoryFilter
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.scientificName.toLowerCase().includes(q) ||
        item.commonName.toLowerCase().includes(q) ||
        item.family.toLowerCase().includes(q) ||
        item.locationName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        displayName: editName.trim().slice(0, 80) || profile.displayName,
        handle: sanitizeHandle(editHandle),
        bio: editBio.trim().slice(0, 240),
        location: editLocation.trim().slice(0, 80),
        specialty: editSpecialty.trim().slice(0, 80),
      });
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Instagram-style Profile Header dedicated strictly to the Naturalist Collection */}
      <section className="px-4 sm:px-8 pt-6 pb-6 border-b border-[#141E19]/10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar Ring */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 bg-gradient-to-tr from-[#0F291E] via-[#329F6B] to-[#10B981] shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#EFECE6] border-2 border-[#F7F6F2] flex items-center justify-center">
                {profile.avatarUrl ? (
                  <SpecimenImage
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-2xl font-bold text-[#0F291E]">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Stats Counter Row (Tabular Numerals) */}
            <div className="grid grid-cols-3 gap-4 sm:hidden flex-1 text-center">
              <div>
                <div className="font-mono text-lg font-semibold tabular-nums text-[#141E19]">
                  {specimens.length}
                </div>
                <div className="text-xs text-[#526058]">Especies</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold tabular-nums text-[#141E19]">
                  {followersCount}
                </div>
                <div className="text-xs text-[#526058]">Seguidores</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold tabular-nums text-[#141E19]">
                  {followingCount}
                </div>
                <div className="text-xs text-[#526058]">Siguiendo</div>
              </div>
            </div>
          </div>

          {/* Handle, Actions & Bio */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#141E19] truncate">
                  {profile.displayName}
                </h1>
                <p className="text-xs font-mono text-[#526058]">@{profile.handle}</p>
              </div>

              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={onOpenAddModal}
                      className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F291E] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#173D2D] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuevo hallazgo</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditName(profile.displayName);
                        setEditHandle(profile.handle);
                        setEditBio(profile.bio);
                        setEditLocation(profile.location);
                        setEditSpecialty(profile.specialty);
                        setIsEditingProfile(!isEditingProfile);
                      }}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#EFECE6] text-[#141E19] text-xs font-medium flex items-center gap-1.5 hover:bg-[#E2DDD3] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar perfil</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onToggleFollow(profile.uid)}
                      className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                        isFollowing
                          ? 'bg-[#EFECE6] text-[#141E19] hover:bg-[#E2DDD3]'
                          : 'bg-[#0F291E] text-white hover:bg-[#173D2D]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Siguiendo</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Seguir</span>
                        </>
                      )}
                    </button>
                    {onStartChat && (
                      <button
                        onClick={() => onStartChat(profile.uid)}
                        className="min-h-[40px] px-4 py-2 rounded-lg bg-[#EFECE6] text-[#141E19] text-xs font-medium flex items-center gap-1.5 hover:bg-[#E2DDD3] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Mensaje</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Desktop Stats Row */}
            <div className="hidden sm:flex items-center gap-6 mt-3.5 text-sm">
              <div>
                <span className="font-mono font-semibold tabular-nums text-[#141E19]">
                  {specimens.length}
                </span>{' '}
                <span className="text-[#526058]">hallazgos en colección</span>
              </div>
              <div>
                <span className="font-mono font-semibold tabular-nums text-[#141E19]">
                  {followersCount}
                </span>{' '}
                <span className="text-[#526058]">seguidores</span>
              </div>
              <div>
                <span className="font-mono font-semibold tabular-nums text-[#141E19]">
                  {followingCount}
                </span>{' '}
                <span className="text-[#526058]">siguiendo</span>
              </div>
            </div>

            {/* Bio & Unboxed Metadata */}
            <p className="text-sm text-[#141E19] mt-3 leading-relaxed max-w-xl">
              {profile.bio}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#526058] mt-2">
              <span className="text-[#0F291E] font-medium">{profile.specialty}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.location}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {plantsCount} Plantae / {animalsCount} Animalia / {fungiCount} Fungi
              </span>
            </div>
          </div>
        </div>

        {/* Inline Edit Profile Drawer */}
        {isEditingProfile && isOwnProfile && (
          <form
            onSubmit={handleSaveProfileEdit}
            className="mt-6 p-5 rounded-2xl bg-[#EFECE6] border border-[#141E19]/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[#141E19]">
                Editar Perfil de Coleccionista
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[#526058]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#526058] mb-1">Nombre público</label>
                <input
                  type="text"
                  maxLength={80}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#141E19]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#526058] mb-1">Usuario (@handle)</label>
                <input
                  type="text"
                  maxLength={40}
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#141E19]/15 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-[#526058] mb-1">Especialidad</label>
                <input
                  type="text"
                  maxLength={80}
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#141E19]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#526058] mb-1">Región / Ubicación</label>
                <input
                  type="text"
                  maxLength={80}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#141E19]/15 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#526058] mb-1">Biografía de colección</label>
              <textarea
                rows={2}
                maxLength={240}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full p-3 rounded-lg bg-white border border-[#141E19]/15 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F291E] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Guardando...' : 'Guardar cambios'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Collection Filter Bar & Search */}
      <section className="px-4 sm:px-8 py-3.5 border-b border-[#141E19]/8 flex flex-wrap items-center justify-between gap-3">
        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            Colección ({specimens.length})
          </button>
          <button
            onClick={() => setCategoryFilter('plant')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === 'plant'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Plantas ({plantsCount})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('animal')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === 'animal'
                ? 'bg-white text-[#141E19] shadow-2xs'
                : 'text-[#526058] hover:text-[#141E19]'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Animales ({animalsCount})</span>
          </button>
          {fungiCount > 0 && (
            <button
              onClick={() => setCategoryFilter('fungi')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === 'fungi'
                  ? 'bg-white text-[#141E19] shadow-2xs'
                  : 'text-[#526058] hover:text-[#141E19]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Fungi ({fungiCount})</span>
            </button>
          )}
          {isOwnProfile && (
            <button
              onClick={() => setCategoryFilter('saved')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === 'saved'
                  ? 'bg-white text-[#141E19] shadow-2xs'
                  : 'text-[#526058] hover:text-[#141E19]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Guardados ({savedBookmarkIds.length})</span>
            </button>
          )}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-[#526058] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nombre científico..."
              className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#141E19]/12 text-xs text-[#141E19] focus:outline-none focus:border-[#0F291E]"
            />
          </div>

          <div className="flex items-center bg-[#EFECE6] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#141E19] shadow-2xs'
                  : 'text-[#526058] hover:text-[#141E19]'
              }`}
              title="Cuadrícula tipo Instagram"
              aria-label="Vista de cuadrícula"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('taxonomy')}
              className={`min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'taxonomy'
                  ? 'bg-white text-[#141E19] shadow-2xs'
                  : 'text-[#526058] hover:text-[#141E19]'
              }`}
              title="Índice taxonómico"
              aria-label="Vista de lista taxonómica"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Collection Feed: Pure Specimen Grid or Taxonomic Index */}
      {filteredSpecimens.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <Leaf className="w-10 h-10 text-[#526058]/50 mx-auto mb-3 stroke-[1.5]" />
          <h2 className="font-serif text-xl font-semibold text-[#141E19]">
            {categoryFilter === 'saved'
              ? 'Aún no tienes especímenes guardados en favoritos'
              : 'No hay especímenes en esta vista'}
          </h2>
          <p className="text-xs text-[#526058] max-w-sm mx-auto mt-1">
            {categoryFilter === 'saved'
              ? 'Toca el icono de marcador en cualquier espécimen para guardarlo aquí estilo Instagram.'
              : isOwnProfile
                ? 'Usa el identificador tipo PlantNet o sube tu primera foto con su nombre científico para iniciar tu colección.'
                : 'Este coleccionista aún no tiene registros en esta categoría.'}
          </p>
          {isOwnProfile && categoryFilter !== 'saved' && (
            <button
              onClick={onOpenAddModal}
              className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F291E] text-white text-xs font-medium inline-flex items-center gap-2 hover:bg-[#173D2D] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar primer hallazgo</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Instagram-style 3-column Square Photo Grid with Like & Comment Counters */
        <div className="grid grid-cols-3 gap-0.5 sm:gap-2 sm:px-8 sm:pt-4">
          {filteredSpecimens.map((specimen) => {
            const likeCount = likes.filter((l) => l.specimenId === specimen.id).length;
            const commentCount = comments.filter((c) => c.specimenId === specimen.id).length;

            return (
              <button
                key={specimen.id}
                onClick={() => onSelectSpecimen(specimen)}
                className="group relative aspect-square w-full overflow-hidden bg-[#EFECE6] sm:rounded-xl text-left focus:outline-none cursor-pointer"
              >
                <SpecimenImage
                  src={specimen.photoDataUrl}
                  alt={specimen.scientificName}
                  category={specimen.category}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />

                {/* Top-right subtle IG engagement counters */}
                {(likeCount > 0 || commentCount > 0) && (
                  <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/55 backdrop-blur-2xs text-white px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-white" />
                      {likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-2.5 h-2.5 fill-white" />
                      {commentCount}
                    </span>
                  </div>
                )}

                {/* Measured Scrim Overlay for Scientific Binomial Name */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 sm:p-3.5 pt-8">
                  <p className="font-serif italic text-xs sm:text-base font-semibold text-white leading-tight truncate">
                    {specimen.scientificName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/80 truncate mt-0.5">
                    {specimen.commonName}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Herbarium Taxonomic List View */
        <div className="divide-y divide-[#141E19]/8 px-4 sm:px-8">
          {filteredSpecimens.map((specimen, idx) => {
            const likeCount = likes.filter((l) => l.specimenId === specimen.id).length;
            const commentCount = comments.filter((c) => c.specimenId === specimen.id).length;

            return (
              <button
                key={specimen.id}
                onClick={() => onSelectSpecimen(specimen)}
                className="w-full py-3.5 flex items-center gap-4 text-left hover:bg-[#EFECE6]/60 transition-colors rounded-xl px-2 cursor-pointer"
              >
                <span className="font-mono text-xs text-[#526058] tabular-nums w-6 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#EFECE6] shrink-0">
                  <SpecimenImage
                    src={specimen.photoDataUrl}
                    alt={specimen.scientificName}
                    category={specimen.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif italic text-lg font-semibold text-[#141E19] truncate">
                      {specimen.scientificName}
                    </h3>
                    <span className="text-xs text-[#526058] truncate">
                      · {specimen.commonName}
                    </span>
                  </div>
                  <div className="text-xs text-[#526058] truncate mt-0.5">
                    Familia <span className="italic">{specimen.family}</span> ·{' '}
                    {specimen.locationName} ·{' '}
                    <span className="font-mono tabular-nums">{specimen.observedDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-[#526058] shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {likeCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {commentCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
