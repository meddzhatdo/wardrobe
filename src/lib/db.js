export function dbItemToApp(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    size: row.size,
    material: row.material,
    color: row.color,
    category: row.category,
    notes: row.notes,
    image: row.image_url,
    boards: row.board_names || [],
    liked: row.liked,
    ratio: 'portrait',
    attributes: row.attributes || { warmthRating: 'none' },
  };
}

export function dbOutfitToApp(row) {
  const ci = row.canvas_items;
  const isLegacyArray = Array.isArray(ci);
  return {
    id: row.id,
    name: row.name,
    thumbnail: row.thumbnail,
    items:        isLegacyArray ? ci        : (ci?.items        ?? []),
    bgColor:      isLegacyArray ? '#FFFFFF' : (ci?.bgColor      ?? '#FFFFFF'),
    canvasWidth:  isLegacyArray ? 480       : (ci?.canvasWidth  ?? 480),
    canvasHeight: isLegacyArray ? 679       : (ci?.canvasHeight ?? 679),
    liked:        row.liked        ?? false,
    boards:       row.board_names  ?? [],
  };
}

export function collageToDbPayload(collage) {
  return {
    items:       collage.items       ?? [],
    bgColor:     collage.bgColor     ?? '#FFFFFF',
    canvasWidth:  collage.canvasWidth  ?? 480,
    canvasHeight: collage.canvasHeight ?? 679,
  };
}
