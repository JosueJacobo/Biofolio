/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import {
  Grid,
  Camera,
  Compass,
  LogIn,
  LogOut,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  CollectorProfile,
  DirectMessage,
  Specimen,
  SpecimenCategory,
  SpecimenComment,
  SpecimenLike,
} from './types';
import {
  SEED_COMMENTS,
  SEED_LIKES,
  SEED_PROFILES,
  SEED_SPECIMENS,
} from './seedData';
import { sanitizeHandle } from './utils/imageUtils';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { InstagramCollectionProfile } from './components/InstagramCollectionProfile';
import { PlantNetIdentifier } from './components/PlantNetIdentifier';
import { ExploreCommunity } from './components/ExploreCommunity';
import { SpecimenDetailModal } from './components/SpecimenDetailModal';
import { DirectChatView, buildChatRoomId } from './components/DirectChatModal';

const LOCAL_SPECIMENS_KEY = 'bioatlas_offline_specimens_v1';
const LOCAL_PROFILE_KEY = 'bioatlas_offline_profile_v1';
const LOCAL_FOLLOWS_KEY = 'bioatlas_offline_follows_v1';
const LOCAL_LIKES_KEY = 'biofolio_offline_likes_v1';
const LOCAL_COMMENTS_KEY = 'biofolio_offline_comments_v1';
const LOCAL_BOOKMARKS_KEY = 'biofolio_offline_bookmarks_v1';
const LOCAL_MESSAGES_KEY = 'biofolio_offline_messages_v1';

const REMOTE_WS_FALLBACK =
  'wss://ais-pre-qdiu5tf34npx4y7dtmyje4-705778784942.us-west2.run.app/ws-chat';
const REMOTE_MESSAGES_HTTP =
  'https://ais-pre-qdiu5tf34npx4y7dtmyje4-705778784942.us-west2.run.app/api/messages';

type ActiveTab = 'collection' | 'identify' | 'explore' | 'chat';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('collection');

  // Viewing another collector's Instagram-style profile
  const [inspectedCollectorUid, setInspectedCollectorUid] = useState<string | null>(null);
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [selectedChatPartnerUid, setSelectedChatPartnerUid] = useState<string | null>(
    'curator_valeria_botanica'
  );

  // Local offline state (works immediately without sign-in and offline)
  const [localProfile, setLocalProfile] = useState<CollectorProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage error
    }
    return {
      uid: 'local_collector',
      handle: 'mi.herbario',
      displayName: 'Mi Colección Naturalista',
      bio: 'Bitácora personal de flora, fauna y micología. Fotografía taxonómica e identificación de campo.',
      avatarUrl: SEED_SPECIMENS[0]?.photoDataUrl || '',
      location: 'Exploración de Campo · Modo Offline Activo',
      specialty: 'Flora & Fauna Silvestre',
      isPublic: true,
    };
  });

  const [localSpecimens, setLocalSpecimens] = useState<Specimen[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SPECIMENS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        ...SEED_SPECIMENS[0],
        id: 'local_initial_monstera',
        ownerId: 'local_collector',
        ownerHandle: 'mi.herbario',
        ownerName: 'Mi Colección Naturalista',
      },
      {
        ...SEED_SPECIMENS[2],
        id: 'local_initial_morpho',
        ownerId: 'local_collector',
        ownerHandle: 'mi.herbario',
        ownerName: 'Mi Colección Naturalista',
      },
      {
        ...SEED_SPECIMENS[4],
        id: 'local_initial_amanita',
        ownerId: 'local_collector',
        ownerHandle: 'mi.herbario',
        ownerName: 'Mi Colección Naturalista',
      },
    ];
  });

  const [localFollowingIds, setLocalFollowingIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_FOLLOWS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['curator_valeria_botanica'];
  });

  const [localLikes, setLocalLikes] = useState<SpecimenLike[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_LIKES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return SEED_LIKES;
  });

  const [localComments, setLocalComments] = useState<SpecimenComment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_COMMENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return SEED_COMMENTS;
  });

  const [savedBookmarkIds, setSavedBookmarkIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['seed_passiflora_02'];
  });

  const [localMessages, setLocalMessages] = useState<DirectMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'srv_msg_welcome_1',
        roomId: 'curator_valeria_botanica__local_collector',
        senderId: 'curator_valeria_botanica',
        senderHandle: 'valeria.herbario',
        senderName: 'Dra. Valeria Montes',
        recipientId: 'local_collector',
        text: '¡Hola! Vi tus registros de campo en Biofolio. Si encuentras alguna cactácea o arácea interesante, compártela por aquí.',
        timestamp: '2026-10-03T16:30:00.000Z',
      },
      {
        id: 'srv_msg_welcome_2',
        roomId: 'curator_mateo_fauna__local_collector',
        senderId: 'curator_mateo_fauna',
        senderHandle: 'mateo.naturalista',
        senderName: 'Mateo Ríos',
        recipientId: 'local_collector',
        text: '¡Saludos! Qué buena colección estás armando. Avísame cuando subas nuevos hallazgos de fauna o entomología.',
        timestamp: '2026-10-03T17:15:00.000Z',
      },
    ];
  });

  // Cloud Firestore & WebSocket state
  const [cloudProfiles, setCloudProfiles] = useState<CollectorProfile[]>([]);
  const [cloudSpecimens, setCloudSpecimens] = useState<Specimen[]>([]);
  const [cloudFollowingMap, setCloudFollowingMap] = useState<Record<string, string>>({});
  const [cloudFollowersCount, setCloudFollowersCount] = useState<number>(0);
  const [cloudLikes, setCloudLikes] = useState<SpecimenLike[]>([]);
  const [cloudComments, setCloudComments] = useState<SpecimenComment[]>([]);
  const [cloudMessages, setCloudMessages] = useState<DirectMessage[]>([]);
  const [wsMessages, setWsMessages] = useState<DirectMessage[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Persist local state to localStorage for guaranteed offline access
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localProfile));
    } catch {
      // ignore
    }
  }, [localProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_SPECIMENS_KEY, JSON.stringify(localSpecimens));
    } catch {
      // ignore
    }
  }, [localSpecimens]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_FOLLOWS_KEY, JSON.stringify(localFollowingIds));
    } catch {
      // ignore
    }
  }, [localFollowingIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(localLikes));
    } catch {
      // ignore
    }
  }, [localLikes]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(localComments));
    } catch {
      // ignore
    }
  }, [localComments]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(savedBookmarkIds));
    } catch {
      // ignore
    }
  }, [savedBookmarkIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(localMessages));
    } catch {
      // ignore
    }
  }, [localMessages]);

  // 1. Auth Listener & Profile Bootstrap
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);

      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        try {
          const snap = await getDoc(profileRef);
          if (!snap.exists()) {
            const handle = sanitizeHandle(
              user.email?.split('@')[0] || user.displayName || 'naturalista'
            );
            const newProfile = {
              uid: user.uid,
              handle,
              displayName: (user.displayName || 'Coleccionista Naturalista').slice(0, 80),
              bio: localProfile.bio.slice(0, 240),
              avatarUrl: (user.photoURL || SEED_SPECIMENS[0].photoDataUrl).slice(0, 150000),
              location: localProfile.location.slice(0, 80),
              specialty: localProfile.specialty.slice(0, 80),
              isPublic: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(profileRef, newProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Subscriptions
  useEffect(() => {
    if (!authReady) return;

    const profilesQuery = query(
      collection(db, 'profiles'),
      where('isPublic', '==', true)
    );
    const unsubProfiles = onSnapshot(
      profilesQuery,
      (snapshot) => {
        const list: CollectorProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CollectorProfile);
        });
        setCloudProfiles(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'profiles');
      }
    );

    const specimensQuery = query(
      collection(db, 'specimens'),
      where('isPublic', '==', true)
    );
    const unsubSpecimens = onSnapshot(
      specimensQuery,
      (snapshot) => {
        const list: Specimen[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Specimen, 'id'>;
          list.push({
            ...data,
            id: docSnap.id,
            isOfflinePending: docSnap.metadata.hasPendingWrites,
          });
        });
        setCloudSpecimens(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'specimens');
      }
    );

    const likesQuery = query(
      collection(db, 'likes'),
      where('isPublic', '==', true)
    );
    const unsubLikes = onSnapshot(
      likesQuery,
      (snapshot) => {
        const list: SpecimenLike[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<SpecimenLike, 'id'>;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        setCloudLikes(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'likes');
      }
    );

    const commentsQuery = query(
      collection(db, 'comments'),
      where('isPublic', '==', true)
    );
    const unsubComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const list: SpecimenComment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<SpecimenComment, 'id'>;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        setCloudComments(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'comments');
      }
    );

    return () => {
      unsubProfiles();
      unsubSpecimens();
      unsubLikes();
      unsubComments();
    };
  }, [authReady]);

  // 3. Follows & Direct Messages Subscriptions when authenticated
  useEffect(() => {
    if (!authReady || !currentUser) {
      setCloudFollowingMap({});
      setCloudFollowersCount(0);
      setCloudMessages([]);
      return;
    }

    const followingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUser.uid)
    );
    const unsubFollowing = onSnapshot(
      followingQuery,
      (snapshot) => {
        const map: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.followingId) {
            map[data.followingId] = docSnap.id;
          }
        });
        setCloudFollowingMap(map);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'follows');
      }
    );

    const followersQuery = query(
      collection(db, 'follows'),
      where('followingId', '==', currentUser.uid)
    );
    const unsubFollowers = onSnapshot(
      followersQuery,
      (snapshot) => {
        setCloudFollowersCount(snapshot.size);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'follows');
      }
    );

    const sentMsgQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid)
    );
    const receivedMsgQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid)
    );

    let sentList: DirectMessage[] = [];
    let recList: DirectMessage[] = [];

    const mergeAndSetMessages = () => {
      const map = new Map<string, DirectMessage>();
      [...sentList, ...recList].forEach((m) => map.set(m.id, m));
      setCloudMessages(Array.from(map.values()));
    };

    const unsubSent = onSnapshot(
      sentMsgQuery,
      (snap) => {
        sentList = [];
        snap.forEach((d) => {
          const data = d.data();
          sentList.push({
            id: d.id,
            roomId: data.roomId,
            senderId: data.senderId,
            senderHandle: data.senderHandle,
            senderName: data.senderName,
            recipientId: data.recipientId,
            text: data.text,
            timestamp: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
        mergeAndSetMessages();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
    );

    const unsubRec = onSnapshot(
      receivedMsgQuery,
      (snap) => {
        recList = [];
        snap.forEach((d) => {
          const data = d.data();
          recList.push({
            id: d.id,
            roomId: data.roomId,
            senderId: data.senderId,
            senderHandle: data.senderHandle,
            senderName: data.senderName,
            recipientId: data.recipientId,
            text: data.text,
            timestamp: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
        mergeAndSetMessages();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
    );

    return () => {
      unsubFollowing();
      unsubFollowers();
      unsubSent();
      unsubRec();
    };
  }, [authReady, currentUser]);

  // Merge seed profiles + cloud profiles
  const allProfiles = useMemo(() => {
    const map = new Map<string, CollectorProfile>();
    SEED_PROFILES.forEach((p) => map.set(p.uid, p));
    cloudProfiles.forEach((p) => map.set(p.uid, p));
    if (!currentUser) {
      map.set(localProfile.uid, localProfile);
    }
    return Array.from(map.values());
  }, [cloudProfiles, currentUser, localProfile]);

  const activeUserProfile: CollectorProfile = useMemo(() => {
    if (currentUser) {
      const found = cloudProfiles.find((p) => p.uid === currentUser.uid);
      if (found) return found;
      return {
        uid: currentUser.uid,
        handle: sanitizeHandle(currentUser.email?.split('@')[0] || 'naturalista'),
        displayName: currentUser.displayName || 'Coleccionista Naturalista',
        bio: localProfile.bio,
        avatarUrl: currentUser.photoURL || SEED_SPECIMENS[0].photoDataUrl,
        location: localProfile.location,
        specialty: localProfile.specialty,
        isPublic: true,
      };
    }
    return localProfile;
  }, [currentUser, cloudProfiles, localProfile]);

  // 4. Real-Time WebSocket Connection to Server (/ws-chat) with Auto-Reconnect & Idempotency
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWebSocket = () => {
      if (!isMounted || typeof window === 'undefined') return;
      const isGitHubPages = window.location.hostname.includes('github.io');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = isGitHubPages
        ? REMOTE_WS_FALLBACK
        : `${protocol}//${window.location.host}/ws-chat`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: 'user:join',
              user: {
                uid: activeUserProfile.uid,
                handle: activeUserProfile.handle,
                displayName: activeUserProfile.displayName,
              },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'chat:init' && Array.isArray(payload.messages)) {
              setWsMessages(payload.messages);
              if (Array.isArray(payload.users)) {
                setOnlineUserIds(payload.users.map((u: { uid: string }) => u.uid));
              }
            } else if (payload.type === 'message:created' && payload.message) {
              const incoming: DirectMessage = payload.message;
              // Idempotent handler: check if message ID already exists
              setWsMessages((prev) =>
                prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
              );
            } else if (payload.type === 'presence:sync' && Array.isArray(payload.users)) {
              setOnlineUserIds(payload.users.map((u: { uid: string }) => u.uid));
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWebSocket, 4000);
          }
        };
      } catch {
        // ignore WebSocket connection error when offline
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeUserProfile.uid, activeUserProfile.handle, activeUserProfile.displayName]);

  // Merge specimens
  const allPublicSpecimens = useMemo(() => {
    const map = new Map<string, Specimen>();
    SEED_SPECIMENS.forEach((s) => map.set(s.id, s));
    cloudSpecimens.forEach((s) => map.set(s.id, s));
    if (!currentUser) {
      localSpecimens.forEach((s) => map.set(s.id, s));
    }
    return Array.from(map.values());
  }, [cloudSpecimens, currentUser, localSpecimens]);

  const mySpecimens = useMemo(() => {
    if (currentUser) {
      const userCloud = cloudSpecimens.filter((s) => s.ownerId === currentUser.uid);
      return userCloud;
    }
    return localSpecimens;
  }, [currentUser, cloudSpecimens, localSpecimens]);

  // Merge likes & comments
  const allLikes = useMemo(() => {
    const map = new Map<string, SpecimenLike>();
    localLikes.forEach((l) => map.set(l.id, l));
    cloudLikes.forEach((l) => map.set(l.id, l));
    return Array.from(map.values());
  }, [localLikes, cloudLikes]);

  const allComments = useMemo(() => {
    const map = new Map<string, SpecimenComment>();
    localComments.forEach((c) => map.set(c.id, c));
    cloudComments.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [localComments, cloudComments]);

  // Merge messages (Local + WebSocket Server + Firestore) sorted chronologically
  const allDirectMessages = useMemo(() => {
    const map = new Map<string, DirectMessage>();
    localMessages.forEach((m) => map.set(m.id, m));
    wsMessages.forEach((m) => map.set(m.id, m));
    cloudMessages.forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort((a, b) =>
      (a.timestamp || '').localeCompare(b.timestamp || '')
    );
  }, [localMessages, wsMessages, cloudMessages]);

  const effectiveFollowingIds = useMemo(() => {
    const set = new Set<string>(localFollowingIds);
    Object.keys(cloudFollowingMap).forEach((uid) => set.add(uid));
    return Array.from(set);
  }, [localFollowingIds, cloudFollowingMap]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Error iniciando sesión con Google:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setInspectedCollectorUid(null);
  };

  const handleSaveSpecimen = async (data: {
    scientificName: string;
    commonName: string;
    category: SpecimenCategory;
    family: string;
    kingdom: string;
    photoDataUrl: string;
    locationName: string;
    coordinates: string;
    habitat: string;
    conservationStatus: string;
    notes: string;
    confidence: number;
    observedDate: string;
  }) => {
    const cleanId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (currentUser) {
      const specimenRef = doc(db, 'specimens', cleanId);
      const payload = {
        ownerId: currentUser.uid,
        ownerHandle: activeUserProfile.handle.slice(0, 40),
        ownerName: activeUserProfile.displayName.slice(0, 80),
        scientificName: data.scientificName.slice(0, 120),
        commonName: data.commonName.slice(0, 120),
        category: data.category,
        family: data.family.slice(0, 80),
        kingdom: data.kingdom.slice(0, 40),
        photoDataUrl: data.photoDataUrl.slice(0, 750000),
        locationName: data.locationName.slice(0, 120),
        coordinates: data.coordinates.slice(0, 60),
        habitat: data.habitat.slice(0, 120),
        conservationStatus: data.conservationStatus.slice(0, 60),
        notes: data.notes.slice(0, 600),
        confidence: Number(data.confidence) || 95,
        observedDate: data.observedDate.slice(0, 40),
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(specimenRef, payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `specimens/${cleanId}`);
      }
    } else {
      const newLocalSpecimen: Specimen = {
        id: cleanId,
        ownerId: localProfile.uid,
        ownerHandle: localProfile.handle,
        ownerName: localProfile.displayName,
        ...data,
        isPublic: true,
      };
      setLocalSpecimens((prev) => [newLocalSpecimen, ...prev]);
    }

    setInspectedCollectorUid(null);
    setActiveTab('collection');
  };

  const handleDeleteSpecimen = async (specimenId: string) => {
    if (currentUser && !specimenId.startsWith('local_')) {
      try {
        await deleteDoc(doc(db, 'specimens', specimenId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `specimens/${specimenId}`);
      }
    } else {
      setLocalSpecimens((prev) => prev.filter((s) => s.id !== specimenId));
    }
  };

  const handleUpdateProfile = async (updated: Partial<CollectorProfile>) => {
    if (currentUser) {
      const profileRef = doc(db, 'profiles', currentUser.uid);
      try {
        await updateDoc(profileRef, {
          handle: (updated.handle || activeUserProfile.handle).slice(0, 40),
          displayName: (updated.displayName || activeUserProfile.displayName).slice(0, 80),
          bio: (updated.bio ?? activeUserProfile.bio).slice(0, 240),
          avatarUrl: (updated.avatarUrl || activeUserProfile.avatarUrl).slice(0, 150000),
          location: (updated.location ?? activeUserProfile.location).slice(0, 80),
          specialty: (updated.specialty ?? activeUserProfile.specialty).slice(0, 80),
          isPublic: true,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `profiles/${currentUser.uid}`);
      }
    } else {
      setLocalProfile((prev) => ({
        ...prev,
        ...updated,
      }));
    }
  };

  const handleToggleFollow = async (targetUid: string) => {
    const isSeedTarget = SEED_PROFILES.some((p) => p.uid === targetUid);

    if (currentUser && !isSeedTarget) {
      const existingFollowDocId = cloudFollowingMap[targetUid];
      if (existingFollowDocId) {
        try {
          await deleteDoc(doc(db, 'follows', existingFollowDocId));
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.DELETE,
            `follows/${existingFollowDocId}`
          );
        }
      } else {
        const followId = `${currentUser.uid}_${targetUid}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        try {
          await setDoc(doc(db, 'follows', followId), {
            followerId: currentUser.uid,
            followingId: targetUid,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `follows/${followId}`);
        }
      }
    } else {
      setLocalFollowingIds((prev) =>
        prev.includes(targetUid)
          ? prev.filter((id) => id !== targetUid)
          : [...prev, targetUid]
      );
    }
  };

  // Instagram Like handler
  const handleToggleLike = async (specimenId: string) => {
    const cleanSpecimenId = specimenId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const myUid = activeUserProfile.uid;
    const existingLike = allLikes.find(
      (l) => l.specimenId === specimenId && l.userId === myUid
    );

    if (currentUser) {
      const likeDocId = `lk_${currentUser.uid}_${cleanSpecimenId}`.slice(0, 120);
      if (existingLike) {
        try {
          await deleteDoc(doc(db, 'likes', existingLike.id));
        } catch {
          setLocalLikes((prev) => prev.filter((l) => l.id !== existingLike.id));
        }
      } else {
        try {
          await setDoc(doc(db, 'likes', likeDocId), {
            specimenId: cleanSpecimenId,
            userId: currentUser.uid,
            userHandle: activeUserProfile.handle.slice(0, 40),
            isPublic: true,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `likes/${likeDocId}`);
        }
      }
    } else {
      if (existingLike) {
        setLocalLikes((prev) => prev.filter((l) => l.id !== existingLike.id));
      } else {
        const newLike: SpecimenLike = {
          id: `local_like_${Date.now()}`,
          specimenId,
          userId: localProfile.uid,
          userHandle: localProfile.handle,
          isPublic: true,
        };
        setLocalLikes((prev) => [...prev, newLike]);
      }
    }
  };

  // Instagram Comment handler
  const handleAddComment = async (specimenId: string, text: string) => {
    const cleanSpecimenId = specimenId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const trimmed = text.trim().slice(0, 400);
    if (!trimmed) return;

    if (currentUser) {
      const commentId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      try {
        await setDoc(doc(db, 'comments', commentId), {
          specimenId: cleanSpecimenId,
          authorId: currentUser.uid,
          authorHandle: activeUserProfile.handle.slice(0, 40),
          authorName: activeUserProfile.displayName.slice(0, 80),
          text: trimmed,
          isPublic: true,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `comments/${commentId}`);
      }
    } else {
      const newComment: SpecimenComment = {
        id: `local_cm_${Date.now()}`,
        specimenId,
        authorId: localProfile.uid,
        authorHandle: localProfile.handle,
        authorName: localProfile.displayName,
        text: trimmed,
        isPublic: true,
      };
      setLocalComments((prev) => [...prev, newComment]);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (currentUser && !commentId.startsWith('local_') && !commentId.startsWith('seed_')) {
      try {
        await deleteDoc(doc(db, 'comments', commentId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
      }
    } else {
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleToggleBookmark = (specimenId: string) => {
    setSavedBookmarkIds((prev) =>
      prev.includes(specimenId)
        ? prev.filter((id) => id !== specimenId)
        : [...prev, specimenId]
    );
  };

  // Direct Message Handler (Optimistic Local + WebSocket Broadcast + Firestore Persistence)
  const handleSendDirectMessage = async (recipientId: string, text: string) => {
    const trimmed = text.trim().slice(0, 500);
    if (!trimmed) return;

    const msgId = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const roomId = buildChatRoomId(activeUserProfile.uid, recipientId);
    const nowIso = new Date().toISOString();

    const newMsg: DirectMessage = {
      id: msgId,
      roomId,
      senderId: activeUserProfile.uid,
      senderHandle: activeUserProfile.handle.slice(0, 40),
      senderName: activeUserProfile.displayName.slice(0, 80),
      recipientId,
      text: trimmed,
      timestamp: nowIso,
    };

    // 1. Optimistic local state update
    setLocalMessages((prev) =>
      prev.some((m) => m.id === msgId) ? prev : [...prev, newMsg]
    );

    // 2. Real-time WebSocket broadcast (or HTTP fallback)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message:create',
          message: newMsg,
        })
      );
    } else {
      const isGitHubPages =
        typeof window !== 'undefined' && window.location.hostname.includes('github.io');
      const endpoint = isGitHubPages ? REMOTE_MESSAGES_HTTP : '/api/messages';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      }).catch(() => {
        // Offline safe
      });
    }

    // 3. Persist to Firestore if authenticated
    if (currentUser && currentUser.uid !== recipientId) {
      try {
        await setDoc(doc(db, 'messages', msgId), {
          roomId,
          senderId: currentUser.uid,
          senderHandle: activeUserProfile.handle.slice(0, 40),
          senderName: activeUserProfile.displayName.slice(0, 80),
          recipientId: recipientId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
          text: trimmed,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `messages/${msgId}`);
      }
    }
  };

  const handleOpenChatWithUser = (targetUid: string) => {
    setSelectedChatPartnerUid(targetUid);
    setActiveTab('chat');
  };

  // Determine which profile is being displayed in the Collection View
  const inspectedProfile = useMemo(() => {
    if (!inspectedCollectorUid) return activeUserProfile;
    return (
      allProfiles.find((p) => p.uid === inspectedCollectorUid) || activeUserProfile
    );
  }, [inspectedCollectorUid, allProfiles, activeUserProfile]);

  const inspectedSpecimens = useMemo(() => {
    if (
      !inspectedCollectorUid ||
      inspectedCollectorUid === activeUserProfile.uid
    ) {
      return mySpecimens;
    }
    return allPublicSpecimens.filter((s) => s.ownerId === inspectedCollectorUid);
  }, [inspectedCollectorUid, activeUserProfile.uid, mySpecimens, allPublicSpecimens]);

  const isViewingOwnProfile =
    !inspectedCollectorUid || inspectedCollectorUid === activeUserProfile.uid;

  const pendingSyncCount = mySpecimens.filter((s) => s.isOfflinePending).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#141E19]">
      {/* Strict 3-Zone Top Navigation Bar Contract */}
      <header className="sticky top-0 z-30 h-14 px-4 sm:px-8 bg-[#F7F6F2]/90 backdrop-blur-md border-b border-[#141E19]/10 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#collection"
          onClick={(e) => {
            e.preventDefault();
            setInspectedCollectorUid(null);
            setActiveTab('collection');
          }}
          className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#0F291E] whitespace-nowrap"
        >
          Biofolio
        </a>

        {/* Zone 2: Clean text navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#526058]">
          <button
            onClick={() => {
              setInspectedCollectorUid(null);
              setActiveTab('collection');
            }}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'collection' && isViewingOwnProfile
                ? 'text-[#0F291E] font-semibold underline underline-offset-8'
                : 'hover:text-[#141E19]'
            }`}
          >
            Mi Colección
          </button>
          <button
            onClick={() => setActiveTab('identify')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'identify'
                ? 'text-[#0F291E] font-semibold underline underline-offset-8'
                : 'hover:text-[#141E19]'
            }`}
          >
            Identificador PlantNet
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'explore'
                ? 'text-[#0F291E] font-semibold underline underline-offset-8'
                : 'hover:text-[#141E19]'
            }`}
          >
            Comunidad
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'chat'
                ? 'text-[#0F291E] font-semibold underline underline-offset-8'
                : 'hover:text-[#141E19]'
            }`}
          >
            Mensajes
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions (PWA Install + Cloud Sync Auth) */}
        <div className="flex items-center gap-2.5">
          <PWAInstallButton />

          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#EFECE6] text-[#141E19] text-xs font-medium flex items-center gap-1.5 hover:bg-[#E2DDD3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Cerrar sesión en la nube"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#0F291E]/25 text-[#0F291E] text-xs font-medium flex items-center gap-1.5 hover:bg-[#EFECE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sincronizar cuenta</span>
            </button>
          )}
        </div>
      </header>

      {/* Back Banner when inspecting another collector's Instagram-style collection */}
      {!isViewingOwnProfile && activeTab === 'collection' && (
        <div className="bg-[#EFECE6] border-b border-[#141E19]/8 px-4 sm:px-8 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setInspectedCollectorUid(null)}
            className="min-h-[38px] text-xs font-medium text-[#0F291E] flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a mi colección personal</span>
          </button>
          <span className="text-xs text-[#526058]">
            Viendo perfil de @{inspectedProfile.handle}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'collection' && (
          <InstagramCollectionProfile
            profile={inspectedProfile}
            specimens={inspectedSpecimens}
            allSpecimensForBookmarks={allPublicSpecimens}
            followersCount={
              isViewingOwnProfile
                ? cloudFollowersCount + 14
                : inspectedProfile.uid === 'curator_valeria_botanica'
                  ? 128 + (effectiveFollowingIds.includes(inspectedProfile.uid) ? 1 : 0)
                  : 94 + (effectiveFollowingIds.includes(inspectedProfile.uid) ? 1 : 0)
            }
            followingCount={isViewingOwnProfile ? effectiveFollowingIds.length : 19}
            isOwnProfile={isViewingOwnProfile}
            isFollowing={effectiveFollowingIds.includes(inspectedProfile.uid)}
            onToggleFollow={handleToggleFollow}
            onSelectSpecimen={(sp) => setSelectedSpecimen(sp)}
            onOpenAddModal={() => setActiveTab('identify')}
            onUpdateProfile={handleUpdateProfile}
            likes={allLikes}
            comments={allComments}
            savedBookmarkIds={savedBookmarkIds}
            onToggleLike={handleToggleLike}
            onStartChat={handleOpenChatWithUser}
          />
        )}

        {activeTab === 'identify' && (
          <PlantNetIdentifier onSaveSpecimen={handleSaveSpecimen} />
        )}

        {activeTab === 'explore' && (
          <ExploreCommunity
            profiles={allProfiles}
            specimens={allPublicSpecimens}
            currentUserId={activeUserProfile.uid}
            followingIds={effectiveFollowingIds}
            onToggleFollow={handleToggleFollow}
            onSelectCollector={(uid) => {
              setInspectedCollectorUid(uid);
              setActiveTab('collection');
            }}
            onSelectSpecimen={(sp) => setSelectedSpecimen(sp)}
            likes={allLikes}
            comments={allComments}
            savedBookmarkIds={savedBookmarkIds}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onToggleBookmark={handleToggleBookmark}
            onStartChat={handleOpenChatWithUser}
          />
        )}

        {activeTab === 'chat' && (
          <DirectChatView
            currentUserProfile={activeUserProfile}
            profiles={allProfiles}
            messages={allDirectMessages}
            onlineUserIds={onlineUserIds}
            selectedPartnerUid={selectedChatPartnerUid}
            onSelectPartner={setSelectedChatPartnerUid}
            onSendMessage={handleSendDirectMessage}
            onOpenCollectorProfile={(uid) => {
              setInspectedCollectorUid(uid);
              setActiveTab('collection');
            }}
          />
        )}
      </main>

      {/* Specimen Herbarium Sheet & Instagram Post Detail Modal */}
      <SpecimenDetailModal
        specimen={selectedSpecimen}
        onClose={() => setSelectedSpecimen(null)}
        currentUserId={activeUserProfile.uid}
        isFollowingCollector={
          selectedSpecimen
            ? effectiveFollowingIds.includes(selectedSpecimen.ownerId)
            : false
        }
        onToggleFollow={handleToggleFollow}
        onSelectCollector={(uid) => {
          setInspectedCollectorUid(uid);
          setActiveTab('collection');
        }}
        onDeleteSpecimen={handleDeleteSpecimen}
        likes={allLikes}
        comments={allComments}
        isSavedBookmark={
          selectedSpecimen ? savedBookmarkIds.includes(selectedSpecimen.id) : false
        }
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onToggleBookmark={handleToggleBookmark}
        onStartChat={handleOpenChatWithUser}
      />

      {/* Offline & Sync Status Indicator */}
      <OfflineIndicator pendingCount={pendingSyncCount} />

      {/* Mobile Fixed Bottom Navigation Bar (4 Tabs: Colección, Identificar, Comunidad, Mensajes) */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#F7F6F2]/95 backdrop-blur-md border-t border-[#141E19]/10 grid grid-cols-4 items-center"
      >
        <button
          onClick={() => {
            setInspectedCollectorUid(null);
            setActiveTab('collection');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'collection' ? 'text-[#0F291E]' : 'text-[#526058]'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight mt-1">
            Mi Colección
          </span>
        </button>

        <button
          onClick={() => setActiveTab('identify')}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'identify' ? 'text-[#0F291E]' : 'text-[#526058]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === 'identify'
                ? 'bg-[#0F291E] text-white'
                : 'bg-[#EFECE6] text-[#0F291E]'
            }`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight mt-0.5">
            Identificar
          </span>
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'explore' ? 'text-[#0F291E]' : 'text-[#526058]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight mt-1">
            Comunidad
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'chat' ? 'text-[#0F291E]' : 'text-[#526058]'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight mt-1">
            Mensajes
          </span>
        </button>
      </nav>
    </div>
  );
}
