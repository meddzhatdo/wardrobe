import { describe, it, expect } from 'vitest';
import { dbItemToApp, dbOutfitToApp, collageToDbPayload } from '../db.js';

describe('dbItemToApp', () => {
  it('maps all fields from a db row', () => {
    const row = {
      id: '1',
      name: 'White Tee',
      brand: 'Uniqlo',
      price: 19.99,
      size: 'M',
      material: 'Cotton',
      color: 'White',
      category: 'Tops',
      notes: 'Comfy',
      image_url: 'https://example.com/img.jpg',
      board_names: ['Basics'],
      liked: true,
      attributes: { warmthRating: 'light' },
    };
    const result = dbItemToApp(row);
    expect(result).toEqual({
      id: '1',
      name: 'White Tee',
      brand: 'Uniqlo',
      price: 19.99,
      size: 'M',
      material: 'Cotton',
      color: 'White',
      category: 'Tops',
      notes: 'Comfy',
      image: 'https://example.com/img.jpg',
      boards: ['Basics'],
      liked: true,
      ratio: 'portrait',
      attributes: { warmthRating: 'light' },
    });
  });

  it('defaults boards to [] when board_names is null', () => {
    const result = dbItemToApp({ id: '2', board_names: null });
    expect(result.boards).toEqual([]);
  });

  it('defaults attributes when missing', () => {
    const result = dbItemToApp({ id: '3', attributes: null });
    expect(result.attributes).toEqual({ warmthRating: 'none' });
  });
});

describe('dbOutfitToApp', () => {
  it('maps modern canvas_items format', () => {
    const row = {
      id: 'o1',
      name: 'Summer Look',
      thumbnail: 'https://example.com/thumb.jpg',
      canvas_items: {
        items: [{ id: '1', x: 0, y: 0 }],
        bgColor: '#F5F5F5',
        canvasWidth: 480,
        canvasHeight: 679,
      },
      liked: true,
      board_names: ['Weekend'],
    };
    const result = dbOutfitToApp(row);
    expect(result.items).toEqual([{ id: '1', x: 0, y: 0 }]);
    expect(result.bgColor).toBe('#F5F5F5');
    expect(result.canvasWidth).toBe(480);
    expect(result.canvasHeight).toBe(679);
    expect(result.liked).toBe(true);
    expect(result.boards).toEqual(['Weekend']);
  });

  it('handles legacy array format for canvas_items', () => {
    const row = {
      id: 'o2',
      name: 'Old Look',
      thumbnail: '',
      canvas_items: [{ id: '1' }, { id: '2' }],
      liked: false,
      board_names: [],
    };
    const result = dbOutfitToApp(row);
    expect(result.items).toEqual([{ id: '1' }, { id: '2' }]);
    expect(result.bgColor).toBe('#FFFFFF');
    expect(result.canvasWidth).toBe(480);
    expect(result.canvasHeight).toBe(679);
  });

  it('defaults liked and boards when missing', () => {
    const result = dbOutfitToApp({ id: 'o3', canvas_items: {} });
    expect(result.liked).toBe(false);
    expect(result.boards).toEqual([]);
  });
});

describe('collageToDbPayload', () => {
  it('extracts the four canvas fields', () => {
    const collage = {
      items: [{ id: '1' }],
      bgColor: '#000',
      canvasWidth: 480,
      canvasHeight: 679,
      somethingElse: 'ignored',
    };
    expect(collageToDbPayload(collage)).toEqual({
      items: [{ id: '1' }],
      bgColor: '#000',
      canvasWidth: 480,
      canvasHeight: 679,
    });
  });

  it('applies defaults when fields are missing', () => {
    const payload = collageToDbPayload({});
    expect(payload.bgColor).toBe('#FFFFFF');
    expect(payload.canvasWidth).toBe(480);
    expect(payload.canvasHeight).toBe(679);
    expect(payload.items).toEqual([]);
  });
});
