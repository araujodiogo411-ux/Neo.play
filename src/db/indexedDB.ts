/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MediaItem } from '../types';

const DB_NAME = 'CineNeoDB';
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('media_items')) {
        db.createObjectStore('media_items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('blobs')) {
        db.createObjectStore('blobs');
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Store files as Blobs
export async function saveBlob(id: string, file: Blob): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('blobs', 'readwrite');
    const store = transaction.objectStore('blobs');
    const request = store.put(file, id);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getBlob(id: string): Promise<Blob | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('blobs', 'readonly');
    const store = transaction.objectStore('blobs');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('blobs', 'readwrite');
    const store = transaction.objectStore('blobs');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Convert Blobs inside MediaItems to Object URLs for current session usage
export async function resolveMediaUrls(item: MediaItem): Promise<MediaItem> {
  const resolved = { ...item };
  
  if (resolved.posterBlobId) {
    try {
      const blob = await getBlob(resolved.posterBlobId);
      if (blob) {
        resolved.posterUrl = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.error('Error resolving poster blob:', e);
    }
  }

  if (resolved.videoBlobId) {
    try {
      const blob = await getBlob(resolved.videoBlobId);
      if (blob) {
        resolved.videoUrl = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.error('Error resolving video blob:', e);
    }
  }

  if (resolved.seasons) {
    resolved.seasons = await Promise.all(
      resolved.seasons.map(async (season) => {
        const episodes = await Promise.all(
          season.episodes.map(async (episode) => {
            const resEp = { ...episode };
            if (resEp.thumbnailBlobId) {
              const b = await getBlob(resEp.thumbnailBlobId);
              if (b) resEp.thumbnailUrl = URL.createObjectURL(b);
            }
            if (resEp.videoBlobId) {
              const b = await getBlob(resEp.videoBlobId);
              if (b) resEp.videoUrl = URL.createObjectURL(b);
            }
            return resEp;
          })
        );
        return { ...season, episodes };
      })
    );
  }

  return resolved;
}

// Get All Media Items
export async function getMediaItems(): Promise<MediaItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('media_items', 'readonly');
    const store = transaction.objectStore('media_items');
    const request = store.getAll();

    request.onsuccess = async () => {
      const items = request.result as MediaItem[];
      // Resolve Blob Object URLs
      const resolved = await Promise.all(items.map(resolveMediaUrls));
      resolve(resolved);
    };
    request.onerror = () => reject(request.error);
  });
}

// Save Media Item
export async function saveMediaItem(item: MediaItem): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('media_items', 'readwrite');
    const store = transaction.objectStore('media_items');
    
    // Create a copy without temporary blob ObjectURLs
    const itemToStore = { ...item };
    if (itemToStore.posterBlobId) {
      itemToStore.posterUrl = ''; // Clear temporary ObjectURL reference
    }
    if (itemToStore.videoBlobId) {
      itemToStore.videoUrl = ''; // Clear temporary ObjectURL reference
    }
    if (itemToStore.seasons) {
      itemToStore.seasons = itemToStore.seasons.map((season) => ({
        ...season,
        episodes: season.episodes.map((ep) => {
          const epCopy = { ...ep };
          if (epCopy.thumbnailBlobId) epCopy.thumbnailUrl = '';
          if (epCopy.videoBlobId) epCopy.videoUrl = '';
          return epCopy;
        }),
      }));
    }

    const request = store.put(itemToStore);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Delete Media Item
export async function deleteMediaItem(id: string): Promise<void> {
  const db = await openDatabase();
  const item = await new Promise<MediaItem | null>((resolve, reject) => {
    const transaction = db.transaction('media_items', 'readonly');
    const store = transaction.objectStore('media_items');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  if (item) {
    if (item.posterBlobId) await deleteBlob(item.posterBlobId);
    if (item.videoBlobId) await deleteBlob(item.videoBlobId);
    if (item.seasons) {
      for (const season of item.seasons) {
        for (const ep of season.episodes) {
          if (ep.thumbnailBlobId) await deleteBlob(ep.thumbnailBlobId);
          if (ep.videoBlobId) await deleteBlob(ep.videoBlobId);
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('media_items', 'readwrite');
    const store = transaction.objectStore('media_items');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Seed Database with initial mock content if empty
export async function seedDatabaseIfEmpty(): Promise<void> {
  const currentItems = await getMediaItems();
  if (currentItems.length > 0) return;

  const mockItems: MediaItem[] = [
    {
      id: 'cosmos-laundromat',
      title: 'Cosmos Laundromat',
      description: 'Em uma ilha desolada, um ovelha suicida chamada Franck conhece um vendedor peculiar que lhe oferece o contrato de sua vida, transformando sua existência em uma jornada colorida através de múltiplos mundos e dimensões.',
      type: 'movie',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      genres: ['Sci-Fi', 'Drama', 'Fantasia'],
      rating: '8.5',
      top10Rank: 1,
      duration: '12m',
      scheduledExpirationDate: '2026-10-31',
      isPreconfigured: true
    },
    {
      id: 'sintel',
      title: 'Sintel',
      description: 'Uma jovem guerreira solitária chamada Sintel resgata e cuida de um pequeno dragão ferido. Quando a criatura é sequestrada por um enorme dragão adulto, ela inicia uma jornada perigosa e emocionante de busca e redenção pelas terras congeladas.',
      type: 'movie',
      posterUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      genres: ['Aventura', 'Fantasia', 'Drama'],
      rating: '7.9',
      top10Rank: 2,
      duration: '15m',
      isPreconfigured: true
    },
    {
      id: 'tears-of-steel',
      title: 'Tears of Steel',
      description: 'Situado no futuro de Amsterdã, um grupo de cientistas e combatentes militares usa tecnologia de ponta para recriar um evento romântico do passado na tentativa de salvar o planeta de uma invasão de robôs gigantes destruidores.',
      type: 'movie',
      posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      genres: ['Sci-Fi', 'Ação', 'Futurista'],
      rating: '8.2',
      top10Rank: 3,
      duration: '12m',
      scheduledExpirationDate: '2026-07-20', // Shows "Saída em breve" because of current time June 30, 2026
      isPreconfigured: true
    },
    {
      id: 'subaru-dream',
      title: 'Subaru Race Dream',
      description: 'Uma emocionante perseguição automobilística de tirar o fôlego pelas rodovias sinuosas da Europa. Alta velocidade, carros customizados e a busca implacável pelo troféu mundial.',
      type: 'movie',
      posterUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      genres: ['Ação', 'Corrida', 'Esporte'],
      rating: '8.8',
      top10Rank: 5,
      duration: '15m',
      isPreconfigured: true
    },
    {
      id: 'big-buck-bunny',
      title: 'Big Buck Bunny',
      description: 'Um coelho gigante e adorável de temperamento pacífico decide dar uma lição inesquecível em três roedores travessos da floresta após eles destruírem suas amadas borboletas e perturbarem seu sossego matinal.',
      type: 'movie',
      posterUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      genres: ['Comédia', 'Animação', 'Família'],
      rating: '8.0',
      duration: '10m',
      releaseDate: '2026-07-15', // countdown to July 15 (future relative to June 30, 2026)
      isPreconfigured: true
    },
    {
      id: 'elephants-dream',
      title: 'Elephants Dream',
      description: 'Série conceitual surrealista que explora a mente humana de forma teatral. Emo e Proog vivem dentro de uma engrenagem caótica e tentam decifrar o propósito de sua própria existência.',
      type: 'series',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      videoUrl: '',
      genres: ['Drama', 'Ficção', 'Mistério'],
      rating: '7.1',
      top10Rank: 4,
      newSeasonSoon: true,
      isPreconfigured: true,
      seasons: [
        {
          seasonNumber: 1,
          episodes: [
            {
              id: 'ed-e1',
              title: 'A Máquina Gigante',
              description: 'Proog apresenta Emo ao estranho mundo de engrenagens de som industrial onde vivem.',
              duration: '5m',
              thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
              episodeNumber: 1
            },
            {
              id: 'ed-e2',
              title: 'Os Cabos Elétricos',
              description: 'Emo tenta entender as regras rígidas do mundo, mas o perigo e o caos elétrico espreitam por todos os lados.',
              duration: '6m',
              thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
              episodeNumber: 2
            }
          ]
        }
      ]
    },
    {
      id: 'caminhos-da-natureza',
      title: 'Caminhos da Natureza',
      description: 'Série documental que leva você a uma viagem sem precedentes pelos habitats mais intocados e espetaculares do nosso planeta, revelando a incrível luta diária pela sobrevivência animal.',
      type: 'series',
      posterUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
      videoUrl: '',
      genres: ['Documentário', 'Natureza', 'Família'],
      rating: '9.2',
      isPreconfigured: true,
      seasons: [
        {
          seasonNumber: 1,
          episodes: [
            {
              id: 'cn-e1',
              title: 'Vales Profundos',
              description: 'Uma jornada visual de alta resolução pelos ecossistemas de montanha mais isolados e majestosos.',
              duration: '3m',
              thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
              episodeNumber: 1
            },
            {
              id: 'cn-e2',
              title: 'Águas Correntes',
              description: 'O extraordinário ciclo da vida marinha e as correntes profundas que guiam a migração oceânica.',
              duration: '4m',
              thumbnailUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&auto=format&fit=crop&q=80',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              episodeNumber: 2
            }
          ]
        }
      ]
    }
  ];

  for (const item of mockItems) {
    await saveMediaItem(item);
  }
}
