export type StylistPeer = {
  id: string;
  name: string;
  price: number;
  mainImage: string;
  categories: string[];
};

export type StylistRequest = {
  productId: string;
  peers: StylistPeer[];
};

export type StylistResponse = {
  productId: string;
  complements: StylistPeer[];
};

const COMPLEMENT_KEYWORDS = [
  'аксессуар',
  'accessory',
  'сумк',
  'bag',
  'обув',
  'shoe',
  'брюк',
  'pants',
  'джинс',
  'jean',
  'юбк',
  'skirt',
  'шарф',
  'scarf',
  'ремен',
  'belt',
  'шапк',
  'hat',
  'нижн',
];

self.onmessage = (event: MessageEvent<StylistRequest>) => {
  const { productId, peers } = event.data;
  const current = peers.find((p) => p.id === productId);

  const others = peers.filter((p) => p.id !== productId);

  const scored = others
    .map((peer) => {
      const text = `${peer.name} ${peer.categories.join(' ')}`.toLowerCase();
      let score = 0;
      for (const kw of COMPLEMENT_KEYWORDS) {
        if (text.includes(kw)) score += 2;
      }
      if (current) {
        const priceDiff = Math.abs(peer.price - current.price) / (current.price || 1);
        if (priceDiff < 0.5) score += 1;
      }
      return { peer, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const complements =
    scored.length > 0
      ? scored.slice(0, 5).map((s) => s.peer)
      : others.slice(0, 4);

  const response: StylistResponse = { productId, complements };
  self.postMessage(response);
};
