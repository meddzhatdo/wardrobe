/**
 * WardrobeApp.jsx
 * Phase 1 — UI Layout + Mock Data
 * Stack: React · Tailwind CSS · Lucide React
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Shirt, Wand2, Sparkles,
  X, Heart, Plus, Search, ChevronRight, ChevronLeft, ChevronDown, Pencil, Trash2, Brush, Check, Layers, Lock, GripVertical, MoreHorizontal, SlidersHorizontal,
  Undo2, Redo2, Loader2, ImageIcon, Camera, User, LogOut, Download, Eraser, MapPin, Bookmark,
  Eye, EyeOff,
  Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog,
} from 'lucide-react';
import { supabase } from './supabase.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Global Styles (injected once into <head>)
   ───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  /* Hide scrollbars while keeping scroll behaviour */
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  /* Modal slide-up (mobile) */
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  /* Modal fade-scale-in (desktop) */
  @keyframes fadeScaleIn {
    from { opacity: 0; transform: scale(0.97) translateY(6px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  /* Backdrop */
  @keyframes backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal-animate   { animation: slideUp     0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
  .backdrop-fade   { animation: backdropIn  0.2s ease forwards; }

  @media (min-width: 768px) {
    .modal-animate { animation: fadeScaleIn 0.2s ease-out forwards; }
  }

  /* Location badge transitions */
  .loc-pill  { transition: max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease; }
  .loc-input { transition: max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease; }

  /* Outfit carousel transitions */
  @keyframes outfitSlideRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes outfitSlideLeft  { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes outfitFade       { from { opacity: 0; } to { opacity: 1; } }
  .outfit-enter-right { animation: outfitSlideRight 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
  .outfit-enter-left  { animation: outfitSlideLeft  0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
  .outfit-text-fade   { animation: outfitFade       0.25s ease-out both; }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Mock Data
   ───────────────────────────────────────────────────────────────────────────── */
const BOARDS = ['All', 'Workwear', 'Weekend', 'Evening', 'Basics', 'Outerwear'];

const PRESET_LOCATIONS = [
  { city: 'New York, NY',    lat: 40.7128,  lon: -74.0060,  weather: { tempF: 38, conditionLabel: 'Overcast',      highF: 44, lowF: 31, laterCondition: null      } },
  { city: 'Los Angeles, CA', lat: 34.0522,  lon: -118.2437, weather: { tempF: 73, conditionLabel: 'Clear',         highF: 78, lowF: 64, laterCondition: null      } },
  { city: 'Miami, FL',       lat: 25.7617,  lon: -80.1918,  weather: { tempF: 86, conditionLabel: 'Partly Cloudy', highF: 90, lowF: 79, laterCondition: 'Showers' } },
  { city: 'Chicago, IL',     lat: 41.8781,  lon: -87.6298,  weather: { tempF: 26, conditionLabel: 'Snow',          highF: 31, lowF: 20, laterCondition: null      } },
  { city: 'Seattle, WA',     lat: 47.6062,  lon: -122.3321, weather: { tempF: 52, conditionLabel: 'Rain',          highF: 56, lowF: 46, laterCondition: null      } },
];

const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses & Jumpsuits',
  'Outerwear',
  'Knitwear & Sweaters',
  'Shoes',
  'Activewear / Athleisure',
  'Accessories & Bags',
  'Jewelry',
  'Underwear & Sleepwear',
  'Other',
];

const ITEMS = [
  {
    id: 1,
    name: 'Structured Leather Tote',
    brand: '—',
    price: '$—',
    material: 'Grained Leather',
    category: 'Accessories & Bags',
    boards: ['Workwear', 'Weekend'],
    color: 'Chocolate Brown',
    size: 'OS',
    image: '/demo/245-DEERCOW-MARRON_FRONT.png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#5C3A1E', colorFamily: 'Brown', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 2,
    name: 'CC Crystal Cuff',
    brand: 'Chanel',
    price: '$—',
    material: 'Lambskin & Crystal',
    category: 'Jewelry',
    boards: ['Evening'],
    color: 'Blush',
    size: 'OS',
    image: '/demo/Chanel.png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#F0DDD4', colorFamily: 'Pink', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 3,
    name: 'CC Cashmere Beanie',
    brand: 'Chanel',
    price: '$1,300',
    material: '100% Cashmere',
    category: 'Accessories & Bags',
    boards: ['Weekend'],
    color: 'Ivory',
    size: 'OS',
    image: '/demo/Chanel_-_Chasmere_Beanie_($1,300).png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'warm' },
    colorProfile: { primaryHex: '#F5F0E6', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 4,
    name: 'Camellia Rain Boot',
    brand: 'Chanel',
    price: '$—',
    material: 'Rubber & Patent',
    category: 'Shoes',
    boards: ['Weekend', 'Outerwear'],
    color: 'Black',
    size: '38',
    image: "/demo/Chanel_Women's_Boots.png",
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 5,
    name: 'Classic Denim Jacket',
    brand: '—',
    price: '$—',
    material: '100% Cotton Denim',
    category: 'Outerwear',
    boards: ['Weekend', 'Basics'],
    color: 'Medium Wash Blue',
    size: 'S',
    image: '/demo/Classic_jean_jacket.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#6B8CAD', colorFamily: 'Blue', undertone: 'Cool', vibrancy: 'Muted' },
  },
  {
    id: 6,
    name: 'Fine Knit Cardigan',
    brand: 'H&M',
    price: '$—',
    material: 'Fine Knit Polyamide Blend',
    category: 'Knitwear & Sweaters',
    boards: ['Weekend', 'Basics'],
    color: 'Pale Yellow',
    size: 'S',
    image: '/demo/Gilet_en_maille_fine_-_Jaune_clair_-_ENFANT___H&M_FR.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'mid', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F5EBA0', colorFamily: 'Yellow', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 7,
    name: 'Floral Pleated Charmeuse Skirt',
    brand: 'Lauren Ralph Lauren',
    price: '$—',
    material: '100% Polyester Charmeuse',
    category: 'Bottoms',
    boards: ['Evening', 'Weekend'],
    color: 'Floral Multi',
    size: 'S',
    image: '/demo/Lauren_Ralph_Lauren_Floral_Pleated_Satin_Charmeuse_Skirt.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#7B4F6E', colorFamily: 'Purple', undertone: 'Cool', vibrancy: 'Muted' },
  },
  {
    id: 8,
    name: 'Lucilla Shirt Dress',
    brand: 'Cinq à Sept',
    price: '$—',
    material: 'Stretch Crepe',
    category: 'Dresses & Jumpsuits',
    boards: ['Workwear', 'Evening'],
    color: 'Navy',
    size: 'XS',
    image: '/demo/Lucilla_Dress.png',
    ratio: 'portrait',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#1A2744', colorFamily: 'Blue', undertone: 'Cool', vibrancy: 'Deep' },
  },
  {
    id: 9,
    name: 'Polka Dot Midi Skirt',
    brand: 'Ralph Lauren',
    price: '$—',
    material: 'Silk Blend',
    category: 'Bottoms',
    boards: ['Workwear', 'Weekend'],
    color: 'Black & White',
    size: '6',
    image: '/demo/Ralph_Lauren.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 10,
    name: 'Kaida Boot-Cut Jean',
    brand: 'Ralph Lauren Collection',
    price: '$—',
    material: 'Stretch Denim',
    category: 'Bottoms',
    boards: ['Weekend', 'Workwear'],
    color: 'White',
    size: '26',
    image: '/demo/Ralph_Lauren_Collection___Kaida_White_Boot-Cut_Jeans___Autumn_•_Winter_Fashion.png',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F5F2EC', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Pastel' },
  },
  {
    id: 11,
    name: 'Flared Sleeve Silk Top',
    brand: 'Reformation',
    price: '$—',
    material: '100% Silk',
    category: 'Tops',
    boards: ['Evening', 'Weekend'],
    color: 'Army Green',
    size: 'XS',
    image: '/demo/Reformation_Flared_Sleeve_Silk_Top_-_Green.png',
    ratio: 'portrait',
    liked: true,
    attributes: { layerType: 'base', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#4A5C38', colorFamily: 'Green', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 12,
    name: 'Super Puff Long Coat',
    brand: 'Aritzia',
    price: '$—',
    material: 'Recycled Nylon & Down Fill',
    category: 'Outerwear',
    boards: ['Outerwear', 'Weekend'],
    color: 'Black',
    size: 'XS',
    image: '/demo/Super Puff Long.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'heavy' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 13,
    name: 'The Icon Watch',
    brand: 'Hanan Maybin',
    price: '$—',
    material: 'Gold-Tone Steel & Leather',
    category: 'Accessories & Bags',
    boards: ['Workwear', 'Evening', 'Weekend'],
    color: 'Gold',
    size: 'OS',
    image: '/demo/THE_ICON_WATCH.png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#C9A84C', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 14,
    name: 'Double T-Buckle Pump',
    brand: 'Tory Burch',
    price: '$—',
    material: 'Leather',
    category: 'Shoes',
    boards: ['Workwear', 'Evening'],
    color: 'Black',
    size: '8',
    image: "/demo/Tory_Burch_Double_T-Buckle_Pump_80_mm_High_Women's_Heels_Perfect_Black_Perfect_Black___10_M,_Leather.png",
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 15,
    name: 'Bow Mini Dress',
    brand: 'Valentino Garavani',
    price: '$—',
    material: 'Virgin Wool',
    category: 'Dresses & Jumpsuits',
    boards: ['Evening'],
    color: 'Red',
    size: 'IT 42',
    image: '/demo/Valentino_Garavani_Multicolor_Virgin_Wool_Short_Dress_-_IT42.png',
    ratio: 'portrait',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'short', warmthRating: 'medium' },
    colorProfile: { primaryHex: '#C41E3A', colorFamily: 'Red', undertone: 'Warm', vibrancy: 'Vivid' },
  },
  {
    id: 16,
    name: 'Embroidered Beaded Blouse',
    brand: 'Zara',
    price: '$—',
    material: 'Tulle & Silk Blend',
    category: 'Tops',
    boards: ['Evening'],
    color: 'Cream',
    size: 'S',
    image: '/demo/Zara_Tops___Embroidered_Beaded_Structure_Blouse_Zara_Cream_Floral_Embroidered_Blouse___Color__Cream___Size__S.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F0E8D5', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 17,
    name: 'CC Quilted Ballet Flat',
    brand: 'Chanel',
    price: '$—',
    material: 'Quilted Lambskin',
    category: 'Shoes',
    boards: ['Workwear', 'Weekend', 'Evening'],
    color: 'Black',
    size: '38',
    image: '/demo/blackchanelflats.png',
    ratio: 'square',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 18,
    name: 'High-Rise Flare Pant',
    brand: '—',
    price: '$—',
    material: 'Stretch Denim',
    category: 'Bottoms',
    boards: ['Workwear', 'Evening', 'Weekend'],
    color: 'Black',
    size: '26',
    image: '/demo/blackpants.png',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 19,
    name: 'Wrap Tie Blouse',
    brand: '—',
    price: '$—',
    material: 'Cotton Poplin',
    category: 'Tops',
    boards: ['Workwear', 'Weekend'],
    color: 'Light Blue',
    size: 'S',
    image: '/demo/bluelong.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#A8C4D8', colorFamily: 'Blue', undertone: 'Cool', vibrancy: 'Pastel' },
  },
  {
    id: 20,
    name: 'Camellia Leather Jacket',
    brand: 'Chanel',
    price: '$—',
    material: 'Lambskin Leather',
    category: 'Outerwear',
    boards: ['Outerwear', 'Evening', 'Weekend'],
    color: 'Black',
    size: '36 FR',
    image: '/demo/camellia leather jacket.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'medium' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 21,
    name: 'Cashmere Turtleneck',
    brand: '—',
    price: '$—',
    material: '100% Cashmere',
    category: 'Knitwear & Sweaters',
    boards: ['Basics', 'Weekend'],
    color: 'Ivory',
    size: 'S',
    image: '/demo/cashmeresweater.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'mid', sleeveLength: 'long', warmthRating: 'warm' },
    colorProfile: { primaryHex: '#F5F0E6', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 22,
    name: 'Oversized Sunglasses',
    brand: 'Chanel',
    price: '$—',
    material: 'Acetate',
    category: 'Accessories & Bags',
    boards: ['Weekend', 'Evening'],
    color: 'Black',
    size: 'OS',
    image: '/demo/chanelglasses.png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 23,
    name: 'One-Shoulder Charmeuse Top',
    brand: '—',
    price: '$—',
    material: 'Silk Charmeuse',
    category: 'Tops',
    boards: ['Evening', 'Weekend'],
    color: 'Olive',
    size: 'XS',
    image: '/demo/charmeuse olive top.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#4A5C30', colorFamily: 'Green', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 24,
    name: 'Dark Wash Bootcut Jean',
    brand: '—',
    price: '$—',
    material: 'Stretch Denim',
    category: 'Bottoms',
    boards: ['Weekend', 'Basics'],
    color: 'Dark Indigo',
    size: '26',
    image: '/demo/darkjeans.png',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#1E2F4A', colorFamily: 'Blue', undertone: 'Cool', vibrancy: 'Deep' },
  },
  {
    id: 25,
    name: 'Crochet Knit Midi Dress',
    brand: 'Sandro',
    price: '$—',
    material: 'Cotton Crochet Knit',
    category: 'Dresses & Jumpsuits',
    boards: ['Weekend', 'Evening'],
    color: 'Pale Yellow',
    size: 'XS',
    image: '/demo/dress.png',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'short', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F5E9A0', colorFamily: 'Yellow', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 26,
    name: 'Light Wash Flare Jean',
    brand: '—',
    price: '$—',
    material: 'Stretch Denim',
    category: 'Bottoms',
    boards: ['Weekend', 'Basics'],
    color: 'Light Wash Blue',
    size: '26',
    image: '/demo/flare jeans.png',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#9DB8D0', colorFamily: 'Blue', undertone: 'Cool', vibrancy: 'Pastel' },
  },
  {
    id: 27,
    name: 'Super-Star Sneaker',
    brand: 'Golden Goose',
    price: '$—',
    material: 'Leather & Glitter',
    category: 'Shoes',
    boards: ['Weekend', 'Basics'],
    color: 'White & Gold',
    size: '38',
    image: '/demo/ggsneaker.png',
    ratio: 'square',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#F5F0E6', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 28,
    name: 'Belted Knit Maxi Dress',
    brand: '—',
    price: '$—',
    material: 'Wool Bouclé Knit',
    category: 'Dresses & Jumpsuits',
    boards: ['Evening', 'Weekend'],
    color: 'Oatmeal',
    size: 'XS',
    image: '/demo/knitdress.png',
    ratio: 'tall',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'long', warmthRating: 'medium' },
    colorProfile: { primaryHex: '#D8CCBA', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 29,
    name: 'Off-Shoulder Knit Top',
    brand: 'Michael Kors',
    price: '$—',
    material: 'Ribbed Knit',
    category: 'Tops',
    boards: ['Workwear', 'Evening'],
    color: 'Black',
    size: 'XS',
    image: '/demo/michael_kors_top_.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 30,
    name: 'Crystal-Heel Mary Jane',
    brand: 'Miu Miu',
    price: '$—',
    material: 'Satin & Crystal',
    category: 'Shoes',
    boards: ['Evening'],
    color: 'Olive Green',
    size: '38',
    image: '/demo/miumiu.png',
    ratio: 'square',
    liked: true,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#6B7A3A', colorFamily: 'Green', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 31,
    name: 'Ojima Ruffle Top',
    brand: 'Isabel Marant',
    price: '$—',
    material: 'Silk Chiffon',
    category: 'Tops',
    boards: ['Evening', 'Weekend'],
    color: 'Blush',
    size: 'XS',
    image: '/demo/ojima top.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#E8C4B8', colorFamily: 'Pink', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 32,
    name: 'Polka Dot Cap-Sleeve Top',
    brand: '—',
    price: '$—',
    material: 'Jersey',
    category: 'Tops',
    boards: ['Weekend', 'Workwear'],
    color: 'Cream & Black',
    size: 'S',
    image: '/demo/polkadot.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'short', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F5F0E0', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 33,
    name: 'Black Ribbed Turtleneck',
    brand: 'Ralph Lauren',
    price: '$—',
    material: 'Merino Wool Rib Knit',
    category: 'Knitwear & Sweaters',
    boards: ['Basics', 'Workwear', 'Weekend'],
    color: 'Black',
    size: 'XS',
    image: '/demo/rlblacksweater.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'mid', sleeveLength: 'long', warmthRating: 'warm' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 34,
    name: 'Burgundy Ribbed Turtleneck',
    brand: 'Ralph Lauren',
    price: '$—',
    material: 'Merino Wool Rib Knit',
    category: 'Knitwear & Sweaters',
    boards: ['Basics', 'Weekend'],
    color: 'Burgundy',
    size: 'XS',
    image: '/demo/rlburgundysweater.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'mid', sleeveLength: 'long', warmthRating: 'warm' },
    colorProfile: { primaryHex: '#5C1A2A', colorFamily: 'Red', undertone: 'Cool', vibrancy: 'Deep' },
  },
  {
    id: 35,
    name: 'Shearling Wrap Coat',
    brand: '—',
    price: '$—',
    material: 'Shearling Lamb',
    category: 'Outerwear',
    boards: ['Outerwear', 'Weekend'],
    color: 'Camel',
    size: 'S',
    image: '/demo/shearling coat.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'heavy' },
    colorProfile: { primaryHex: '#C4A882', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 36,
    name: 'Draped Silk Top',
    brand: '—',
    price: '$—',
    material: '100% Silk',
    category: 'Tops',
    boards: ['Evening', 'Workwear'],
    color: 'Ivory',
    size: 'XS',
    image: '/demo/silk top.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'base', sleeveLength: 'none', warmthRating: 'light' },
    colorProfile: { primaryHex: '#F5F0E0', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Pastel' },
  },
  {
    id: 37,
    name: 'Suede Flare Pant',
    brand: '—',
    price: '$—',
    material: 'Genuine Suede',
    category: 'Bottoms',
    boards: ['Weekend', 'Evening'],
    color: 'Camel',
    size: '26',
    image: '/demo/suedejeans.png',
    ratio: 'portrait',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'medium' },
    colorProfile: { primaryHex: '#C4A06A', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 38,
    name: 'Ava Top-Handle Bag',
    brand: 'Teddy Blake',
    price: '$—',
    material: 'Pebbled Leather',
    category: 'Accessories & Bags',
    boards: ['Workwear', 'Weekend', 'Evening'],
    color: 'Cream',
    size: 'OS',
    image: '/demo/teddyblakeava.png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#D8CDB8', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 39,
    name: 'Westminster Trench Coat',
    brand: 'Burberry',
    price: '$2,290',
    material: 'Cotton Gabardine',
    category: 'Outerwear',
    boards: ['Outerwear', 'Workwear', 'Weekend'],
    color: 'Honey',
    size: 'UK 8',
    image: '/demo/trench coat.png',
    ratio: 'tall',
    liked: true,
    attributes: { layerType: 'outer', sleeveLength: 'long', warmthRating: 'light' },
    colorProfile: { primaryHex: '#C8922A', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
  {
    id: 40,
    name: 'Cera Suede Ankle Boot',
    brand: 'Veronica Beard',
    price: '$—',
    material: 'Suede',
    category: 'Shoes',
    boards: ['Weekend', 'Workwear'],
    color: 'Black',
    size: '38',
    image: '/demo/veronicabeardceraboots.png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#1A1A1A', colorFamily: 'Neutral', undertone: 'Neutral', vibrancy: 'Deep' },
  },
  {
    id: 41,
    name: 'Raffia Wedge Sandal',
    brand: 'Jimmy Choo',
    price: '$—',
    material: 'Raffia & Metallic Leather',
    category: 'Shoes',
    boards: ['Evening', 'Weekend'],
    color: 'Gold',
    size: '38',
    image: '/demo/wedges.png',
    ratio: 'square',
    liked: false,
    attributes: { layerType: 'none', sleeveLength: 'none', warmthRating: 'none' },
    colorProfile: { primaryHex: '#C4A456', colorFamily: 'Neutral', undertone: 'Warm', vibrancy: 'Muted' },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Nav config
   ───────────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'today',    label: 'Today',      Icon: Sun      },
  { id: 'wardrobe', label: 'Wardrobe',   Icon: Shirt    },
  { id: 'studio',   label: 'Studio',     Icon: Wand2    },
  { id: 'stylist',  label: 'AI Stylist', Icon: Sparkles },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────────── */
const RATIO = {
  tall:     'aspect-[2/3]',
  portrait: 'aspect-[3/4]',
  square:   'aspect-square',
};

function countByBoard(items, board) {
  return board === 'All' ? items.length : items.filter(i => i.boards.includes(board)).length;
}

/* ─────────────────────────────────────────────────────────────────────────────
   AddToCollageModal
   ───────────────────────────────────────────────────────────────────────────── */
function AddToCollageModal({ savedOutfits, draftOutfits, onClose, onCreateNew, onOpenCollage }) {
  const [view, setView] = useState('saved');
  const list = view === 'saved' ? savedOutfits : draftOutfits;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm modal-animate">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h3 className="text-base font-semibold text-gray-900">Add to Collage</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Toggle */}
        <div className="px-5 pb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
            {[
              { key: 'saved',  label: 'Published',  count: savedOutfits.length },
              { key: 'drafts', label: 'Drafts', count: draftOutfits.length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {count > 0 && <span className="text-[11px] tabular-nums text-gray-400">{count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Collage thumbnails */}
        <div className="px-5 pb-2 min-h-[6rem]">
          {list.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-gray-400">
                {view === 'saved' ? 'No published collages yet' : 'No drafts yet'}
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
              {list.map(outfit => {
                const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
                const thumbBg = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };
                return (
                  <div
                    key={outfit.id}
                    onClick={() => onOpenCollage(outfit, view)}
                    className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                    style={{ width: 68, height: 96, ...thumbBg }}
                  >
                    {items.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wand2 size={16} className="text-gray-300" />
                      </div>
                    ) : items.map((item, idx) => {
                      const w = item.w ?? 128;
                      const h = item.h ?? 128;
                      const rot = item.rotation ?? 0;
                      return (
                        <div
                          key={item._cid ?? idx}
                          style={{
                            position: 'absolute',
                            left: `${(item.x / canvasWidth) * 100}%`,
                            top: `${(item.y / canvasHeight) * 100}%`,
                            width: `${(w / canvasWidth) * 100}%`,
                            height: `${(h / canvasHeight) * 100}%`,
                            transform: `rotate(${rot}deg)`,
                            zIndex: idx + 1,
                          }}
                        >
                          <div className="w-full h-full rounded-sm overflow-hidden" style={item.flipX ? { transform: 'scaleX(-1)' } : undefined}>
                            <img src={item.image} alt="" draggable={false} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create button */}
        <div className="px-5 pb-5 pt-3">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            Create Collage
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BackgroundEraserModal
   ───────────────────────────────────────────────────────────────────────────── */
function BackgroundEraserModal({ image, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [brushSize, setBrushSize] = useState(24);
  const [isErasing, setIsErasing] = useState(false);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fetch(image)
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(blobUrl);
          const MAX = 1200;
          const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
          canvas.width  = Math.round(img.naturalWidth  * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
          setLoaded(true);
        };
        img.src = blobUrl;
      })
      .catch(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
          setLoaded(true);
        };
        img.src = image;
      });
  }, [image]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const pt = e.touches ? e.touches[0] : e;
    return { x: (pt.clientX - rect.left) * scaleX, y: (pt.clientY - rect.top) * scaleY };
  };

  const scaledRadius = () => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return brushSize * (canvas.width / rect.width);
  };

  const erasePoint = (ctx, x, y) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, scaledRadius(), 0, Math.PI * 2);
    ctx.fill();
  };

  const eraseLine = (ctx, x0, y0, x1, y1) => {
    const r = scaledRadius();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth  = r * 2;
    ctx.lineCap    = 'round';
    ctx.lineJoin   = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    erasePoint(canvasRef.current.getContext('2d'), pos.x, pos.y);
    lastPos.current = pos;
    setIsErasing(true);
  };

  const onPointerMove = (e) => {
    e.preventDefault();
    if (!isErasing) return;
    const pos = getPos(e);
    eraseLine(canvasRef.current.getContext('2d'), lastPos.current.x, lastPos.current.y, pos.x, pos.y);
    lastPos.current = pos;
  };

  const onPointerUp = () => {
    if (!isErasing) return;
    setIsErasing(false);
    const canvas = canvasRef.current;
    const snap = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    setHistory(h => [...h.slice(-19), snap]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newH = history.slice(0, -1);
    setHistory(newH);
    const canvas = canvasRef.current;
    canvas.getContext('2d').putImageData(newH[newH.length - 1], 0, 0);
  };

  const reset = () => {
    if (!history.length) return;
    const canvas = canvasRef.current;
    canvas.getContext('2d').putImageData(history[0], 0, 0);
    setHistory(h => [h[0]]);
  };

  const handleSave = () => {
    setSaving(true);
    canvasRef.current.toBlob(blob => onSave(blob), 'image/png');
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4 md:p-6">

      {/* Header row */}
      <div className="w-full max-w-lg flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Erase Background</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white disabled:opacity-25 transition-colors rounded-lg hover:bg-white/10"
          >
            <Undo2 size={13} /> Undo
          </button>
          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="ml-1 w-7 h-7 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="w-full max-w-lg flex-1 flex items-center justify-center rounded-2xl overflow-hidden relative"
        style={{
          minHeight: 0,
          backgroundImage: 'repeating-conic-gradient(#666 0% 25%, #444 0% 50%)',
          backgroundSize: '20px 20px',
        }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={24} className="text-white/50 animate-spin" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block',
            cursor: 'crosshair',
            touchAction: 'none',
            opacity: loaded ? 1 : 0,
          }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg flex-shrink-0 mt-3 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <Brush size={13} className="text-white/40 flex-shrink-0" />
          <input
            type="range" min={4} max={60} value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="flex-1 accent-white"
          />
          <div
            className="flex-shrink-0 rounded-full bg-white/80 transition-all"
            style={{ width: Math.max(8, Math.min(brushSize * 0.8, 40)), height: Math.max(8, Math.min(brushSize * 0.8, 40)) }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-white/70 border border-white/20 rounded-2xl hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !loaded}
            className="flex-1 py-3 text-sm font-medium bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ItemModal
   ───────────────────────────────────────────────────────────────────────────── */
function ItemModal({ item, liked, onToggleLike, onClose, onUpdate, onDelete, onAddToOutfit, onOpenCollage, savedOutfits, draftOutfits, boards, onToggleBoard, onUpdateImage, isPreview = false }) {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCollagePicker, setShowCollagePicker] = useState(false);
  const [showEraser, setShowEraser] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const boardMenuRef = useRef(null);

  useEffect(() => {
    if (!boardMenuOpen) return;
    const handler = e => {
      if (!boardMenuRef.current?.contains(e.target)) setBoardMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);
  const [draft, setDraft] = useState({
    name: item.name,
    brand: item.brand,
    price: item.price,
    category: item.category,
    size: item.size,
    material: item.material,
    notes: item.notes || '',
    attributes: item.attributes || { warmthRating: 'none' },
  });

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const handleSave = () => {
    onUpdate(item.id, draft);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setDraft({
      name: item.name, brand: item.brand, price: item.price,
      category: item.category, size: item.size, material: item.material,
      notes: item.notes || '',
      attributes: item.attributes || { warmthRating: 'none' },
    });
    setEditMode(false);
  };

  const editInput = "w-full bg-transparent border-b border-gray-200 focus:border-gray-500 focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full md:w-[440px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden modal-animate max-h-[92vh] flex flex-col">

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && !isPreview && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-t-[2rem] md:rounded-[2rem]">
            <div className="bg-white rounded-2xl p-6 mx-6 shadow-2xl w-full max-w-xs">
              <p className="text-sm font-semibold text-gray-800 mb-1">Delete this item?</p>
              <p className="text-xs text-gray-500 mb-5">This action can't be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-200 bg-white text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Top-right button cluster */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          {!isPreview && (editMode ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors bg-white rounded-full shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-700 transition-colors shadow-md"
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <Pencil size={13} strokeWidth={2} className="text-gray-500" />
            </button>
          ))}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <X size={14} strokeWidth={2.5} className="text-gray-500" />
          </button>
        </div>

        {/* Hero image */}
        <div className="relative flex-shrink-0 h-72 md:h-80 bg-gray-50 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain"
          />
          {editMode && (
            <button
              onClick={() => setShowEraser(true)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-md hover:bg-white border border-gray-200 transition-colors whitespace-nowrap"
            >
              <Eraser size={13} />
              Edit background
            </button>
          )}
        </div>

        {/* Brand + name + action buttons — kept outside scroll container so tooltip renders over image */}
        <div className="flex-shrink-0 px-6 pt-6 relative z-[1]">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-1">
              {editMode ? (
                <div className="space-y-1.5">
                  <input
                    value={draft.brand}
                    onChange={e => set('brand', e.target.value)}
                    placeholder="Brand"
                    className={`${editInput} text-[11px] font-semibold text-gray-500 uppercase tracking-[0.18em] pb-0.5`}
                  />
                  <input
                    value={draft.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Item name"
                    className={`${editInput} text-xl font-semibold text-gray-900 pb-0.5`}
                  />
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.18em] mb-1">
                    {item.brand}
                  </p>
                  <h2 className="text-xl font-semibold text-gray-900 leading-snug">{item.name}</h2>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Save image to device */}
              <div className="relative group/download">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(item.image);
                      if (!res.ok) { window.open(item.image, '_blank'); return; }
                      const blob = await res.blob();
                      const extMap = { 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
                      const ext = extMap[blob.type] || 'jpg';
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${item.name || 'item'}.${ext}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      window.open(item.image, '_blank');
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-all"
                >
                  <Download size={15} className="text-gray-400" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/download:opacity-100 transition-opacity z-[20]">
                  Save image
                </div>
              </div>
              {/* Board membership toggle */}
              {!isPreview && (
                <div className="relative group/boards" ref={boardMenuRef}>
                  <button
                    onClick={() => setBoardMenuOpen(o => !o)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                      boardMenuOpen ? 'bg-gray-900 border-gray-900' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Layers size={15} className={boardMenuOpen ? 'text-white' : 'text-gray-400'} />
                  </button>
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/boards:opacity-100 transition-opacity z-[20]">
                    Move to board
                  </div>
                  {boardMenuOpen && (
                    <div className="absolute top-11 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[160px] z-10">
                      {boards.filter(b => b !== 'All').length === 0 ? (
                        <p className="px-4 py-2.5 text-xs text-gray-400">No boards yet</p>
                      ) : boards.filter(b => b !== 'All').map(board => {
                        const inBoard = item.boards.includes(board);
                        return (
                          <button
                            key={board}
                            onClick={() => onToggleBoard(item.id, board)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                          >
                            <span className="truncate">{board}</span>
                            {inBoard && <Check size={13} className="text-gray-900 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <div className="relative group/like">
                <button
                  onClick={() => onToggleLike(item.id)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                    liked ? 'bg-rose-50 border-rose-200' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Heart size={15} className={liked ? 'text-rose-500 fill-rose-500' : 'text-gray-400'} />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/like:opacity-100 transition-opacity z-[20]">
                  Favorite item
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-6 pb-6">

            {/* Price */}
            {editMode ? (
              <input
                value={draft.price}
                onChange={e => set('price', e.target.value)}
                placeholder="Price"
                className={`${editInput} text-3xl font-light tracking-tight text-gray-900 pb-0.5 mb-6 block`}
              />
            ) : (
              <p className="text-3xl font-light tracking-tight text-gray-900 mb-6">{item.price}</p>
            )}

            {/* Detail tiles */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {/* Category — dropdown in edit mode */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Category</p>
                {editMode ? (
                  <select
                    value={draft.category}
                    onChange={e => set('category', e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-sm font-medium text-gray-800 mt-0.5 cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-800">{item.category}</p>
                )}
              </div>

              {/* Size — free text */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Size</p>
                {editMode ? (
                  <input
                    value={draft.size}
                    onChange={e => set('size', e.target.value)}
                    className={`${editInput} text-sm font-medium text-gray-800 mt-0.5`}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800">{item.size}</p>
                )}
              </div>

              <div className="col-span-2 bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Material</p>
                {editMode ? (
                  <textarea
                    value={draft.material}
                    onChange={e => set('material', e.target.value)}
                    rows={2}
                    className={`${editInput} text-sm font-medium text-gray-800 mt-0.5 resize-none leading-relaxed w-full`}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 whitespace-pre-line">{item.material}</p>
                )}
              </div>

              {/* Notes */}
              <div className="col-span-2 bg-gray-50 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Notes</p>
                {editMode ? (
                  <textarea
                    value={draft.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Add a note about this piece…"
                    rows={3}
                    className={`${editInput} text-sm text-gray-700 mt-0.5 resize-none leading-relaxed w-full`}
                  />
                ) : item.notes ? (
                  <p className="text-sm text-gray-600 leading-relaxed">{item.notes}</p>
                ) : (
                  <p className="text-sm text-gray-300 italic">No notes added</p>
                )}
              </div>

            </div>

            {/* Bottom actions — view mode only */}
            {!editMode && (
              <>
                <button
                  onClick={() => setShowCollagePicker(true)}
                  className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-semibold tracking-wide hover:bg-gray-700 active:scale-[0.98] transition-all mb-3"
                >
                  Add to Outfit
                </button>

                {!isPreview && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 text-sm text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    Delete item
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {showCollagePicker && (
        <AddToCollageModal
          savedOutfits={savedOutfits}
          draftOutfits={draftOutfits}
          onClose={() => setShowCollagePicker(false)}
          onCreateNew={() => { setShowCollagePicker(false); onAddToOutfit(item); }}
          onOpenCollage={(outfit, type) => { setShowCollagePicker(false); onOpenCollage(item, outfit, type); }}
        />
      )}

      {showEraser && (
        <BackgroundEraserModal
          image={item.image}
          onClose={() => setShowEraser(false)}
          onSave={blob => {
            setShowEraser(false);
            setEditMode(false);
            onUpdateImage?.(item.id, blob);
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GridCard
   ───────────────────────────────────────────────────────────────────────────── */
function GridCard({ item, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <div className="cursor-pointer group" onClick={() => onClick(item)}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100">
        <div className="w-full aspect-[3/4] p-5 relative">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.04] ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${item._bgRemoving ? 'blur-sm' : ''}`}
          />
          {item._bgRemoving && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
                <Loader2 size={11} className="animate-spin text-gray-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">Processing…</span>
              </div>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/6 transition-colors duration-300 pointer-events-none" />
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-gray-800 truncate leading-snug">{item.name}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OrganizeCard
   ───────────────────────────────────────────────────────────────────────────── */
function OrganizeCard({ item, draggedId, selected, onSelect, onDragStart, onDragHover, onDragEnd }) {
  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragOver={e => {
        e.preventDefault();
        if (draggedId === item.id) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onDragHover(item.id, e.clientX, e.clientY, rect);
      }}
      onDrop={e => e.preventDefault()}
      onDragEnd={onDragEnd}
      className={`relative rounded-2xl overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        draggedId === item.id ? 'opacity-40' : ''
      } ${selected ? 'ring-[3px] ring-gray-900' : ''}`}
    >
      <div className="w-full aspect-square p-3">
        <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-contain pointer-events-none" />
      </div>
      {selected && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WardrobeTab
   ───────────────────────────────────────────────────────────────────────────── */
function WardrobeTab({ items, boards, boardMeta, likedItems, onSelectItem, onDeleteBoard, onEditBoard, onDeleteItems, onCreateBoard, onToggleItemBoard, onAddItem, userId, isPreview = false }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);
  const [deleteConfirmBoard, setDeleteConfirmBoard] = useState(null);
  const [editBoard, setEditBoard] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const addMenuRef = useRef(null);
  const boardMenuRef = useRef(null);

  const [organizeMode, setOrganizeMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [organizedItems, setOrganizedItems] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [organizeBoardPickerOpen, setOrganizeBoardPickerOpen] = useState(false);
  const [pendingOrganizeAddItems, setPendingOrganizeAddItems] = useState(null);
  const organizeBoardPickerRef = useRef(null);
  const [addToBoardMode, setAddToBoardMode] = useState(false);
  const [addToBoardSelectedIds, setAddToBoardSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [categoryFilter, setCategoryFilter] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = e => {
      if (!addMenuRef.current?.contains(e.target)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  useEffect(() => {
    if (!boardMenuOpen) return;
    const handler = e => {
      if (!boardMenuRef.current?.contains(e.target)) setBoardMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);

  useEffect(() => {
    if (!organizeBoardPickerOpen) return;
    const handler = e => { if (!organizeBoardPickerRef.current?.contains(e.target)) setOrganizeBoardPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [organizeBoardPickerOpen]);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = e => { if (!filterDropdownRef.current?.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  useEffect(() => {
    setOrganizeMode(false);
    setSelectedItemIds(new Set());
    setOrganizedItems([]);
  }, [activeFilter, favoritesOnly]);

  const filtered = (() => {
    let list = activeFilter === 'All' ? items : items.filter(i => i.boards.includes(activeFilter));
    if (favoritesOnly) list = list.filter(i => likedItems.has(i.id));
    try {
      const key = `wardrobe-order-${userId || 'guest'}-${activeFilter}-${favoritesOnly ? 'fav' : 'all'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const ids = JSON.parse(saved);
        const idSet = new Set(ids);
        const idMap = new Map(list.map(i => [i.id, i]));
        const ordered = ids.flatMap(id => idMap.has(id) ? [idMap.get(id)] : []);
        const newItems = list.filter(i => !idSet.has(i.id));
        list = [...newItems, ...ordered];
      }
    } catch {}
    return list;
  })();

  const availableCategories = CATEGORIES;

  const displayItems = (() => {
    let list = filtered;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.brand || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q) ||
        (i.color || '').toLowerCase().includes(q) ||
        (i.material || '').toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter.size > 0) {
      list = list.filter(i => categoryFilter.has(i.category));
    }
    return list;
  })();

  const enterOrganize = () => {
    setOrganizedItems([...filtered]);
    setSelectedItemIds(new Set());
    setOrganizeMode(true);
  };

  const exitOrganize = () => {
    try {
      const key = `wardrobe-order-${userId || 'guest'}-${activeFilter}-${favoritesOnly ? 'fav' : 'all'}`;
      localStorage.setItem(key, JSON.stringify(organizedItems.map(i => i.id)));
    } catch {}
    setOrganizeMode(false);
    setSelectedItemIds(new Set());
    setOrganizedItems([]);
    setDraggedId(null);
  };

  const toggleSelectItem = id => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const enterAddToBoard = () => {
    setAddToBoardSelectedIds(new Set());
    setAddToBoardMode(true);
  };

  const exitAddToBoard = () => {
    setAddToBoardMode(false);
    setAddToBoardSelectedIds(new Set());
  };

  const confirmAddToBoard = () => {
    addToBoardSelectedIds.forEach(id => onToggleItemBoard(id, activeFilter));
    setAddToBoardMode(false);
    setAddToBoardSelectedIds(new Set());
  };

  const toggleAddBoardItem = id => {
    setAddToBoardSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDragHover = (targetId, clientX, clientY, rect) => {
    if (!draggedId || targetId === draggedId) return;
    setOrganizedItems(prev => {
      const from = prev.findIndex(i => i.id === draggedId);
      const to = prev.findIndex(i => i.id === targetId);
      if (from === -1 || to === -1 || from === to) return prev;
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      // Only reorder once the cursor crosses the midpoint in the direction of travel
      const movingForward = from < to;
      const pastThreshold = movingForward
        ? (clientX > midX || clientY > midY)
        : (clientX < midX || clientY < midY);
      if (!pastThreshold) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Tab header ── */}
      <div className="px-5 md:px-7 pt-5 pb-0 flex-shrink-0">
        {/* Row 1: page title + add/search */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Wardrobe</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (searchOpen) {
                  setSearchOpen(false);
                  setSearchQuery('');
                } else {
                  setSearchOpen(true);
                }
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                searchOpen ? 'bg-gray-900 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {searchOpen
                ? <X size={16} strokeWidth={2.5} className="text-white" />
                : <Search size={16} strokeWidth={2} className="text-gray-600" />}
            </button>
            {!isPreview && (
              <div className="relative" ref={addMenuRef}>
                <button
                  onClick={() => setAddMenuOpen(o => !o)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Plus size={17} strokeWidth={2.5} className="text-white" />
                </button>
                {addMenuOpen && (
                  <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-36 z-20">
                    <button
                      onClick={() => { setAddMenuOpen(false); onAddItem(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Item
                    </button>
                    <button
                      onClick={() => { setAddMenuOpen(false); setNewBoardName(''); setNewBoardDesc(''); setNewBoardOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Board
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="mb-4 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
            <Search size={14} strokeWidth={2} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, category, color…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Row 2: board title + organize/settings */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-3xl font-semibold text-gray-900 truncate max-w-[20ch]">{activeFilter}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeFilter !== 'All' && (
              <div className="relative" ref={boardMenuRef}>
                <button
                  onClick={() => setBoardMenuOpen(o => o ? null : activeFilter)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xl leading-none"
                >
                  ···
                </button>
                {boardMenuOpen && (
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40 z-20">
                    <button
                      onClick={() => {
                        setBoardMenuOpen(null);
                        setEditBoard(activeFilter);
                        setEditName(activeFilter);
                        setEditDesc(boardMeta[activeFilter]?.description ?? '');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit board
                    </button>
                    <button
                      onClick={() => { setBoardMenuOpen(null); enterAddToBoard(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Add to board
                    </button>
                    <button
                      onClick={() => { setBoardMenuOpen(null); setDeleteConfirmBoard(activeFilter); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Delete board
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={organizeMode ? exitOrganize : enterOrganize}
              className={`flex items-center gap-1.5 px-4 h-10 rounded-full transition-colors text-sm font-medium ${
                organizeMode ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {organizeMode ? <X size={14} strokeWidth={2.5} /> : <Brush size={14} strokeWidth={2} />}
              {organizeMode ? 'Done' : 'Organize'}
            </button>
          </div>
        </div>
        <div className="mb-5">
          <p className="text-sm text-gray-400 mt-0.5">{displayItems.length} item{displayItems.length !== 1 ? 's' : ''}{searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}</p>
          <div className="min-h-[1.25rem] mt-0.5">
            {activeFilter !== 'All' && boardMeta[activeFilter]?.description && (
              <p className="text-sm text-gray-400 italic pl-3">{boardMeta[activeFilter].description}</p>
            )}
          </div>
        </div>

        {/* ── Board filter ── */}
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {boards.map(board => {
            const active = activeFilter === board;
            return (
              <button
                key={board}
                onClick={() => setActiveFilter(board)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-base font-medium transition-colors pb-0.5 ${
                  active
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              >
                {board}
              </button>
            );
          })}
        </div>

        {/* ── Favorites + Filter ── */}
        <div className="pb-3 flex items-center gap-2">
          <button
            onClick={() => setFavoritesOnly(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              favoritesOnly
                ? 'bg-rose-50 text-rose-500'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Heart size={13} className={favoritesOnly ? 'fill-rose-500' : ''} />
            Favorites
          </button>

          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter.size > 0
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={13} />
              Filter{categoryFilter.size > 0 ? ` · ${categoryFilter.size}` : ''}
            </button>
            {filterOpen && (
              <div className="absolute left-0 top-10 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-56 z-20 max-h-40 overflow-y-auto scrollbar-hide">
                {availableCategories.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No categories found</p>
                ) : (
                  availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(prev => {
                        const next = new Set(prev);
                        next.has(cat) ? next.delete(cat) : next.add(cat);
                        return next;
                      })}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className={categoryFilter.has(cat) ? 'text-gray-900 font-medium' : 'text-gray-600'}>{cat}</span>
                      {categoryFilter.has(cat) && <Check size={14} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                    </button>
                  ))
                )}
                {categoryFilter.size > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setCategoryFilter(new Set()); setFilterOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pb-28 md:pb-8">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              {searchQuery.trim()
                ? <Search size={22} className="text-gray-300" />
                : <Shirt size={22} className="text-gray-300" />}
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {searchQuery.trim() ? 'No items match your search' : 'No items in this board'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayItems.map(item => (
              <GridCard key={item.id} item={item} onClick={onSelectItem} />
            ))}
          </div>
        )}
      </div>

      {/* ── Organize mode full-screen overlay ── */}
      {organizeMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">

          {/* Header */}
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Organize Board</h2>
            <button
              onClick={() => {
                const allSelected = selectedItemIds.size > 0;
                setSelectedItemIds(allSelected ? new Set() : new Set(organizedItems.map(i => i.id)));
              }}
              className="absolute left-5 md:left-7 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              {selectedItemIds.size > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={exitOrganize}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {organizedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Shirt size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No items in this board</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {organizedItems.map(item => (
                  <OrganizeCard
                    key={item.id}
                    item={item}
                    draggedId={draggedId}
                    selected={selectedItemIds.has(item.id)}
                    onSelect={() => toggleSelectItem(item.id)}
                    onDragStart={() => setDraggedId(item.id)}
                    onDragHover={handleDragHover}
                    onDragEnd={() => setDraggedId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Floating action bar */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none z-10">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {selectedItemIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{selectedItemIds.size} selected</span>
              )}
              {/* Move to board */}
              <div className="relative" ref={organizeBoardPickerRef}>
                <div className="relative group">
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                    selectedItemIds.size > 0 && !organizeBoardPickerOpen ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                  }`}>
                    <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">Move to board</span>
                  </div>
                  <button
                    disabled={selectedItemIds.size === 0}
                    onClick={() => setOrganizeBoardPickerOpen(o => !o)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      selectedItemIds.size > 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Layers size={18} />
                  </button>
                </div>
                {organizeBoardPickerOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48 z-10">
                    {boards.filter(b => b !== 'All').length === 0 && (
                      <p className="px-4 py-2.5 text-xs text-gray-400">No boards yet</p>
                    )}
                    {boards.filter(b => b !== 'All').map(board => {
                      const selectedArr = organizedItems.filter(i => selectedItemIds.has(i.id));
                      const allInBoard = selectedArr.length > 0 && selectedArr.every(i => (i.boards ?? []).includes(board));
                      return (
                        <button
                          key={board}
                          onClick={() => {
                            const toAdd = organizedItems.filter(item =>
                              selectedItemIds.has(item.id) && !(item.boards ?? []).includes(board)
                            );
                            toAdd.forEach(item => onToggleItemBoard(item.id, board));
                            if (toAdd.length > 0) {
                              setOrganizedItems(prev => prev.map(item =>
                                toAdd.some(t => t.id === item.id)
                                  ? { ...item, boards: [...(item.boards ?? []), board] }
                                  : item
                              ));
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {board}
                          {allInBoard && <Check size={13} strokeWidth={2.5} className="text-gray-500" />}
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setPendingOrganizeAddItems(new Set(selectedItemIds));
                          setOrganizeBoardPickerOpen(false);
                          setNewBoardName('');
                          setNewBoardDesc('');
                          setNewBoardOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        New board…
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Delete */}
              <div className="relative group">
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                  selectedItemIds.size > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                }`}>
                  <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">Delete</span>
                </div>
                <button
                  disabled={selectedItemIds.size === 0}
                  onClick={() => setShowDeleteSelectedConfirm(true)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedItemIds.size > 0
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Delete selected confirmation */}
          {showDeleteSelectedConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setShowDeleteSelectedConfirm(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Delete {selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''}?
                </h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  {activeFilter === 'All'
                    ? `${selectedItemIds.size === 1 ? 'This item' : 'These items'} will be permanently removed from your wardrobe.`
                    : `${selectedItemIds.size === 1 ? 'This item' : 'These items'} will be removed from this board but stay in your wardrobe.`}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const toDelete = new Set(selectedItemIds);
                      onDeleteItems(toDelete, activeFilter);
                      setOrganizedItems(prev => prev.filter(i => !toDelete.has(i.id)));
                      setSelectedItemIds(new Set());
                      setShowDeleteSelectedConfirm(false);
                    }}
                    className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteSelectedConfirm(false)}
                    className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add to board full-screen overlay ── */}
      {addToBoardMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Add to {activeFilter}</h2>
            <button
              onClick={exitAddToBoard}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* All items grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Shirt size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No items in your wardrobe</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map(item => {
                  const alreadyInBoard = (item.boards ?? []).includes(activeFilter);
                  const isSelected = addToBoardSelectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={alreadyInBoard ? undefined : () => toggleAddBoardItem(item.id)}
                      className={`relative rounded-2xl overflow-hidden bg-gray-100 transition-all duration-150 select-none ${
                        alreadyInBoard ? 'cursor-default' : 'cursor-pointer'
                      } ${isSelected && !alreadyInBoard ? 'ring-[3px] ring-gray-900' : ''} ${
                        alreadyInBoard ? 'ring-[3px] ring-emerald-400' : ''
                      }`}
                    >
                      <div className="w-full aspect-square p-3">
                        <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-contain pointer-events-none" />
                      </div>
                      {isSelected && !alreadyInBoard && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
                      {alreadyInBoard && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
                          <Check size={20} strokeWidth={2.5} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating action bar */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {addToBoardSelectedIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{addToBoardSelectedIds.size} selected</span>
              )}
              <button
                onClick={confirmAddToBoard}
                disabled={addToBoardSelectedIds.size === 0}
                className={`h-12 px-5 rounded-2xl flex items-center gap-2 font-medium text-sm transition-colors ${
                  addToBoardSelectedIds.size > 0
                    ? 'bg-gray-900 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Plus size={16} />
                Add to board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit board popup ── */}
      {editBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setEditBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Board</h3>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span>
                </label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                disabled={!editName.trim()}
                onClick={() => {
                  const trimmed = editName.trim();
                  onEditBoard(editBoard, trimmed, editDesc.trim());
                  if (activeFilter === editBoard) setActiveFilter(trimmed);
                  setEditBoard(null);
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => setEditBoard(null)}
                className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New board modal ── */}
      {newBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setNewBoardOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
            <h3 className="text-base font-semibold text-gray-900 mb-4">New Board</h3>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                  Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span>
                </label>
                <textarea
                  value={newBoardDesc}
                  onChange={e => setNewBoardDesc(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                disabled={!newBoardName.trim() || boards.includes(newBoardName.trim())}
                onClick={() => {
                  const name = newBoardName.trim();
                  const desc = newBoardDesc.trim();
                  onCreateBoard(name, desc);
                  if (pendingOrganizeAddItems) {
                    organizedItems.forEach(item => {
                      if (pendingOrganizeAddItems.has(item.id)) onToggleItemBoard(item.id, name);
                    });
                    setPendingOrganizeAddItems(null);
                  }
                  setActiveFilter(name);
                  setNewBoardOpen(false);
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => { setPendingOrganizeAddItems(null); setNewBoardOpen(false); }}
                className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete board confirmation popup ── */}
      {deleteConfirmBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-fade" onClick={() => setDeleteConfirmBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs modal-animate">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete "{deleteConfirmBoard}"?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              This board will be permanently removed. Items inside won't be deleted.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onDeleteBoard(deleteConfirmBoard);
                  if (activeFilter === deleteConfirmBoard) setActiveFilter('All');
                  setDeleteConfirmBoard(null);
                }}
                className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
              >
                Delete Board
              </button>
              <button
                onClick={() => setDeleteConfirmBoard(null)}
                className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Weather helpers
   ───────────────────────────────────────────────────────────────────────────── */
const DEFAULT_CITY = 'New York';
const DEFAULT_LAT  = 40.7128;
const DEFAULT_LON  = -74.006;

function wmoCondition(code) {
  if (code <= 1)  return { label: 'Clear',         Icon: Sun,            bg: 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)' };
  if (code === 2) return { label: 'Partly Cloudy', Icon: CloudSun,       bg: 'linear-gradient(160deg,#1976D2,#546E7A)' };
  if (code === 3) return { label: 'Overcast',      Icon: Cloud,          bg: 'linear-gradient(160deg,#37474F,#546E7A)' };
  if (code <= 48) return { label: 'Foggy',         Icon: CloudFog,       bg: 'linear-gradient(160deg,#455A64,#78909C)' };
  if (code <= 57) return { label: 'Drizzle',       Icon: CloudDrizzle,   bg: 'linear-gradient(160deg,#1A237E,#1565C0)' };
  if (code <= 67) return { label: 'Rain',          Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' };
  if (code <= 77) return { label: 'Snow',          Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' };
  if (code <= 82) return { label: 'Showers',       Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' };
  if (code <= 86) return { label: 'Snow Showers',  Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' };
  return           { label: 'Thunderstorm',        Icon: CloudLightning, bg: 'linear-gradient(160deg,#1A1A2E,#0F3460)' };
}

// Label → icon/bg used by the static preview weather card (mirrors wmoCondition without WMO codes).
const CONDITION_LABEL_META = {
  'Clear':        { Icon: Sun,            bg: 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)' },
  'Partly Cloudy':{ Icon: CloudSun,       bg: 'linear-gradient(160deg,#1976D2,#546E7A)' },
  'Overcast':     { Icon: Cloud,          bg: 'linear-gradient(160deg,#37474F,#546E7A)' },
  'Foggy':        { Icon: CloudFog,       bg: 'linear-gradient(160deg,#455A64,#78909C)' },
  'Drizzle':      { Icon: CloudDrizzle,   bg: 'linear-gradient(160deg,#1A237E,#1565C0)' },
  'Rain':         { Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' },
  'Snow':         { Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' },
  'Showers':      { Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' },
  'Snow Showers': { Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' },
  'Thunderstorm': { Icon: CloudLightning, bg: 'linear-gradient(160deg,#1A1A2E,#0F3460)' },
};

function fmtHour(ms) {
  const h = new Date(ms).getHours();
  if (h === 0)  return '12am';
  if (h < 12)  return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   WeatherWidget
   ───────────────────────────────────────────────────────────────────────────── */
function WeatherWidget({ lat, lon, city, onCommit, onSelectLocation, onWeatherReady, compact = false }) {
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [isEditing,      setIsEditing]      = useState(false);
  const [inputValue,     setInputValue]     = useState('');
  const [suggestions,    setSuggestions]    = useState([]);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  useEffect(() => {
    if (lat == null || lon == null) { setLoading(true); return; }
    setLoading(true);
    setData(null);
    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=2`,
      { signal: ctrl.signal }
    )
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); onWeatherReady?.(d); })
      .catch(e => { if (e.name !== 'AbortError') setLoading(false); });
    return () => ctrl.abort();
  }, [lat, lon]);

  const startEditing = () => {
    setInputValue(city ?? '');
    setSuggestions([]);
    setHighlightedIdx(-1);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const clearSearch = () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setSuggestions([]);
    setHighlightedIdx(-1);
  };

  const commit = () => {
    clearSearch();
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== city) onCommit(trimmed);
    setIsEditing(false);
  };

  const selectSuggestion = (result) => {
    clearSearch();
    const addr = result.address || {};
    const name = addr.city || addr.town || addr.village || addr.county || result.display_name.split(',')[0].trim();
    const region = addr.state_code || addr.state || '';
    const displayCity = region ? `${name}, ${region}` : name;
    onSelectLocation({ city: displayCity, lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
    setIsEditing(false);
  };

  const onInputChange = (val) => {
    setInputValue(val);
    setHighlightedIdx(-1);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (val.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val.trim())}&format=json&addressdetails=1&limit=5`,
          { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } }
        );
        setSuggestions(await res.json());
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([]);
      }
    }, 320);
  };

  const onKeyDown = e => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIdx(i => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Enter' && highlightedIdx >= 0) {
        selectSuggestion(suggestions[highlightedIdx]);
        return;
      }
    }
    if (e.key === 'Enter')  { commit(); return; }
    if (e.key === 'Escape') { clearSearch(); setIsEditing(false); }
  };

  const skeletonBg = 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)';

  if (loading || !data) {
    if (compact) {
      return (
        <div className="flex-shrink-0 rounded-2xl overflow-hidden animate-pulse" style={{ width: 148, background: skeletonBg }}>
          <div className="p-3 space-y-2">
            <div className="h-2.5 w-16 bg-white/20 rounded-full" />
            <div className="h-10 w-20 bg-white/20 rounded-xl" />
            <div className="h-2.5 w-14 bg-white/20 rounded-full" />
            <div className="h-2.5 w-12 bg-white/20 rounded-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-3xl overflow-hidden" style={{ background: skeletonBg }}>
        <div className="px-6 pt-5 pb-5 animate-pulse">
          <div className="h-3 w-24 bg-white/20 rounded-full mb-4" />
          <div className="flex items-center justify-between">
            <div className="h-[72px] w-28 bg-white/20 rounded-2xl" />
            <div className="space-y-3 text-right">
              <div className="h-5 w-32 bg-white/20 rounded-full ml-auto" />
              <div className="h-4 w-24 bg-white/20 rounded-full ml-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currTemp = Math.round(data.current.temperature_2m);
  const currCode = data.current.weather_code;
  const high     = Math.round(data.daily.temperature_2m_max[0]);
  const low      = Math.round(data.daily.temperature_2m_min[0]);
  const { label, Icon: CondIcon, bg } = wmoCondition(currCode);

  const nowMs = Date.now();
  const hours = [];
  for (let i = 0; i < data.hourly.time.length; i++) {
    const ms = new Date(data.hourly.time[i]).getTime();
    if (ms >= nowMs - 30 * 60 * 1000) {
      hours.push({
        key:  data.hourly.time[i],
        ms,
        temp: Math.round(data.hourly.temperature_2m[i]),
        code: data.hourly.weather_code[i],
      });
      if (hours.length >= 24) break;
    }
  }

  if (compact) {
    return (
      <div className="relative flex-shrink-0" style={{ width: 148 }}>
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ background: bg }}>
          <div className="p-3">
            {/* Location */}
            {onCommit && isEditing ? (
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={10} className="text-white/60 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={commit}
                  placeholder="City…"
                  className="bg-transparent text-[11px] font-medium text-white border-b border-white/40 focus:border-white/80 focus:outline-none w-full placeholder:text-white/40"
                />
              </div>
            ) : onCommit ? (
              <button onClick={startEditing} className="flex items-center gap-1 mb-2 w-full min-w-0">
                <MapPin size={10} className="text-white/60 flex-shrink-0" />
                <span className="text-[11px] font-medium text-white/80 truncate">{city ?? DEFAULT_CITY}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={10} className="text-white/60 flex-shrink-0" />
                <span className="text-[11px] font-medium text-white/80 truncate">{city ?? DEFAULT_CITY}</span>
              </div>
            )}
            {/* Temp */}
            <div className="flex items-start gap-1">
              <span className="text-[42px] font-thin text-white leading-none tracking-tight">{currTemp}</span>
              <span className="text-sm font-light text-white/60 mt-1.5">°F</span>
            </div>
            {/* Condition */}
            <div className="flex items-center gap-1.5 mt-2">
              <CondIcon size={13} className="text-white/90" strokeWidth={1.8} />
              <span className="text-[11px] font-medium text-white/80">{label}</span>
            </div>
            {/* H/L */}
            <p className="text-[10px] text-white/50 mt-1 tracking-wide">H: {high}°  ·  L: {low}°</p>
          </div>
        </div>
        {/* Autocomplete suggestions */}
        {isEditing && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
            {suggestions.map((s, i) => {
              const addr = s.address || {};
              const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
              const region = addr.state_code || addr.state || '';
              const display = region ? `${name}, ${region}` : name;
              return (
                <button
                  key={s.place_id ?? i}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors ${
                    highlightedIdx === i ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate font-medium text-gray-800">{display}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="rounded-3xl overflow-hidden" style={{ background: bg }}>
        {/* Location row */}
        <div className="px-6 pt-5">
          <div className="relative flex items-center h-5">
            <div
              className="loc-pill absolute left-0 overflow-hidden"
              style={{ maxWidth: isEditing ? 0 : 280, opacity: isEditing ? 0 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}
            >
              {onCommit ? (
                <button onClick={startEditing} className="flex items-center gap-1.5 whitespace-nowrap">
                  <MapPin size={12} className="text-white/60 flex-shrink-0" />
                  <span className="text-sm font-medium text-white/80 tracking-wide">{city ?? DEFAULT_CITY}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <MapPin size={12} className="text-white/60 flex-shrink-0" />
                  <span className="text-sm font-medium text-white/80 tracking-wide">{city ?? DEFAULT_CITY}</span>
                </div>
              )}
            </div>
            <div
              className="loc-input absolute left-0 overflow-hidden"
              style={{ maxWidth: isEditing ? 280 : 0, opacity: isEditing ? 1 : 0, pointerEvents: isEditing ? 'auto' : 'none' }}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <MapPin size={12} className="text-white/60 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={commit}
                  placeholder="Search city…"
                  className="bg-transparent text-sm font-medium text-white border-b border-white/40 focus:border-white/80 focus:outline-none w-48 placeholder:text-white/40 transition-colors"
                />
              </div>
            </div>
            <div className="invisible flex items-center gap-1.5 text-sm font-medium whitespace-nowrap">
              <MapPin size={12} className="mr-1" />{city ?? DEFAULT_CITY}
            </div>
          </div>
        </div>

        {/* Current conditions */}
        <div className="px-6 pt-3 pb-5 flex items-center justify-between">
          <div className="flex items-start">
            <span className="text-[68px] font-thin text-white leading-none tracking-tight">{currTemp}</span>
            <span className="text-xl font-light text-white/60 mt-3 ml-0.5">°F</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <CondIcon size={20} className="text-white/90" strokeWidth={1.8} />
              <span className="text-[17px] font-medium text-white">{label}</span>
            </div>
            <p className="text-sm text-white/60 font-medium tracking-wide">H: {high}°  ·  L: {low}°</p>
          </div>
        </div>

      </div>

      {/* Autocomplete suggestions */}
      {isEditing && suggestions.length > 0 && (
        <div className="absolute top-[44px] left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
          {suggestions.map((s, i) => {
            const addr = s.address || {};
            const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
            const region = addr.state_code || addr.state || '';
            const country = addr.country || '';
            const display = region ? `${name}, ${region}` : name;
            return (
              <button
                key={s.place_id ?? i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${
                  highlightedIdx === i ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{display}</p>
                  {country && <p className="text-xs text-gray-400 truncate">{country}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   Outfit generation — two-stage vision pipeline
   ───────────────────────────────────────────────────────────────────────────── */

const OUTFIT_CATEGORIES = new Set([
  'Tops', 'Bottoms', 'Dresses & Jumpsuits',
  'Outerwear', 'Knitwear & Sweaters',
  'Shoes', 'Activewear / Athleisure',
  'Accessories & Bags', 'Jewelry',
]);

// Stage 1: rule-based filter → pool of ≤30 weather-appropriate items
function buildWeatherPool(weather, allItems) {
  let pool = allItems.filter(i => OUTFIT_CATEGORIES.has(i.category));

  if (weather.tempF > 75) {
    // Warm: no heavy items at all
    pool = pool.filter(i => i.attributes?.warmthRating !== 'heavy');
  } else if (weather.tempF > 50) {
    // Cool/comfortable: heavy outerwear (shearling, heavy parkas) is overkill
    pool = pool.filter(i =>
      i.category !== 'Outerwear' || i.attributes?.warmthRating !== 'heavy'
    );
  } else if (weather.tempF < 40) {
    // Cold: surface warmer items first; unrated items are included after rated ones
    const warm    = pool.filter(i => ['heavy', 'warm', 'medium'].includes(i.attributes?.warmthRating));
    const unrated = pool.filter(i => !i.attributes?.warmthRating);
    const light   = pool.filter(i => i.attributes?.warmthRating === 'light');
    pool = [...warm, ...unrated, ...light];
  }

  // Stratified sample so all outfit roles are represented
  const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  const tops        = pool.filter(i => ['Tops', 'Dresses & Jumpsuits', 'Knitwear & Sweaters', 'Activewear / Athleisure'].includes(i.category));
  const bottoms     = pool.filter(i => i.category === 'Bottoms');
  const shoes       = pool.filter(i => i.category === 'Shoes');
  const outer       = pool.filter(i => i.category === 'Outerwear');
  const accessories = pool.filter(i => ['Accessories & Bags', 'Jewelry'].includes(i.category));

  const candidates = [
    ...pick(tops,        10),
    ...pick(bottoms,      6),
    ...pick(shoes,        5),
    ...pick(outer,        4),
    ...pick(accessories,  5),
  ];

  const seen = new Set();
  const final = [];
  for (const item of candidates) {
    if (!seen.has(item.id) && final.length < 30) {
      seen.add(item.id);
      final.push(item);
    }
  }
  return final;
}

async function imageUrlToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const blob = await res.blob();
  const mediaType = blob.type || 'image/jpeg';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ data: reader.result.split(',')[1], mediaType });
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function callAnthropicForOutfits(weather, allItems) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set');

  // Stage 1 — narrow to weather-appropriate pool
  const pool = buildWeatherPool(weather, allItems);

  // Stage 2 — build vision content blocks (image + text label per item)
  const content = [];
  for (const item of pool) {
    try {
      const { data, mediaType } = await imageUrlToBase64(item.image);
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } });
    } catch {
      // image unavailable — text label still provides context
    }
    content.push({ type: 'text', text: `[ID:${item.id}] ${item.name} | Category: ${item.category}` });
  }

  content.push({
    type: 'text',
    text:
      `Weather: ${weather.tempF}°F now (${weather.conditionLabel}), High ${weather.highF}°F / Low ${weather.lowF}°F` +
      (weather.laterCondition ? `, with ${weather.laterCondition} expected later today` : '') + `.\n\n` +
      `Using the garment images above, generate exactly 3 distinct, cohesive outfits. Hard rules:\n` +
      `1. TOPS: Every outfit must include a "Tops" or "Knitwear & Sweaters" item UNLESS it contains a "Dresses & Jumpsuits" item. Never omit a top.\n` +
      `2. BOTTOMS: Every outfit must include one "Bottoms" item UNLESS it contains a "Dresses & Jumpsuits" item. NEVER combine two bottoms (e.g., jeans + skirt is invalid — pick one).\n` +
      `3. SHOES: Every outfit must include exactly one "Shoes" item.\n` +
      `4. ACCESSORIES: "Accessories & Bags" and "Jewelry" items are optional but encouraged when they complement the look visually. You may include one or two per outfit.\n` +
      `5. LAYERING: Below 50°F, pair short-sleeve or base-layer tops with an "Outerwear" item.\n` +
      `6. OUTERWEAR WEIGHT: Above 65°F include no outerwear or only a very light jacket. Between 50–65°F a medium jacket or blazer is appropriate — avoid heavy coats, shearling, or thick parkas. Below 50°F heavier coats are suitable. Below 32°F heavy outerwear is expected.\n` +
      `7. DISTINCT: No two outfits may share the exact same item set.\n` +
      `If an outfit is not fully weather-appropriate (e.g. the wardrobe lacks a heavy coat for freezing temperatures, or only light fabrics are available for rain), the "description" field may include a brief, practical recommendation for what to add or swap to make it work for the conditions.\n` +
      `The "description" field must be no more than 200 characters.\n` +
      `Return ONLY a raw JSON array of exactly 3 objects: ` +
      `[{"outfitName":"...","description":"...","itemIds":["id1","id2",...]}]`,
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      system: 'You are a professional fashion stylist with visual expertise. You are visually inspecting the attached garment images. Look closely at their actual colors, fabrics, textures, and silhouettes. Group them into 5 outfits based on true visual compatibility, ensuring patterns do not clash and colors harmonize perfectly. Respond with valid raw JSON only — no markdown fences, no commentary.',
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`Anthropic API error: ${err}`);
  }

  const json = await res.json();
  let raw = json.content?.[0]?.text ?? '';
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Response was not a JSON array');

  // Client-side guard: drop outfits that still violate structural rules
  const itemMap = Object.fromEntries(allItems.map(i => [i.id, i]));
  const valid = parsed.filter(outfit => {
    const cats = (outfit.itemIds ?? []).map(id => itemMap[id]?.category).filter(Boolean);
    const hasOnePiece = cats.includes('Dresses & Jumpsuits');
    const hasTop      = cats.some(c => c === 'Tops' || c === 'Knitwear & Sweaters');
    const bottomCount = cats.filter(c => c === 'Bottoms').length;
    const hasShoes    = cats.includes('Shoes');
    if (!hasOnePiece && !hasTop)    return false;
    if (bottomCount > 1)             return false;
    if (!hasOnePiece && bottomCount === 0) return false;
    if (!hasShoes)                   return false;
    return true;
  });

  if (valid.length === 0) throw new Error('No valid outfits could be generated with your current wardrobe items.');
  return valid.slice(0, 3);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Content-aware image trimming — used in Studio canvas to give each item a
   bounding box that matches the actual garment shape, not the full image square.
   ───────────────────────────────────────────────────────────────────────────── */

const _trimCache = new Map();

function computeImageTrim(src) {
  if (_trimCache.has(src)) return Promise.resolve(_trimCache.get(src));
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const nw = img.naturalWidth, nh = img.naturalHeight;
      try {
        const S = 128;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, S, S);
        const { data } = ctx.getImageData(0, 0, S, S);
        let x0 = S, y0 = S, x1 = -1, y1 = -1;
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          if (data[(y * S + x) * 4 + 3] > 10) {
            if (x < x0) x0 = x; if (y < y0) y0 = y;
            if (x > x1) x1 = x; if (y > y1) y1 = y;
          }
        }
        const t = x1 >= 0
          ? { fx: x0/S, fy: y0/S, fw: (x1-x0+1)/S, fh: (y1-y0+1)/S, nw, nh }
          : null;
        _trimCache.set(src, t); resolve(t);
      } catch { _trimCache.set(src, null); resolve(null); }
    };
    img.onerror = () => { _trimCache.set(src, null); resolve(null); };
    img.src = src;
  });
}

// Returns the canvas bounding-box size for an item given its trim data.
// Uses actual pixel dimensions (nw/nh) so portrait/landscape images get the right AR.
function contentBounds(trim, maxSize) {
  if (!trim) return { w: maxSize, h: maxSize };
  const { fw, fh, nw, nh } = trim;
  if (nw && nh) {
    const cw = fw * nw, ch = fh * nh;
    const scale = maxSize / Math.max(cw, ch);
    return { w: Math.max(1, Math.round(cw * scale)), h: Math.max(1, Math.round(ch * scale)) };
  }
  return { w: Math.max(1, Math.round(fw * maxSize)), h: Math.max(1, Math.round(fh * maxSize)) };
}

/* ─────────────────────────────────────────────────────────────────────────────
   OutfitCollage — flat-lay collage with head-to-toe body ordering
   z-layers: outerwear(1) → bottoms(2) → tops/shoes(3) → accessories(4)
   ───────────────────────────────────────────────────────────────────────────── */

// cx/cy = center of slot in a 510×720 canvas (A4 ratio, page-filling)
// w/h   = item image size
// z     = stacking layer (1=outerwear, 2=bottoms, 3=tops/shoes, 4=accessories)
// sx/sy = per-item stagger when >1 item shares a slot
// All bounding boxes kept ≥14px from canvas edges (510×720).
// Product images carry ~20% transparent padding — tops/bottoms bounding boxes are spaced
// so their visible garments have a small gap rather than overlapping.
// 1000×1000 unit design grid — safe zone 50–950 on both axes.
// Z hierarchy: 1=Bottoms, 2=Tops/Dresses, 3=Outerwear, 4=Shoes/Accessories/Jewelry.
// sx/sy = per-additional-item offset (spread) when multiple items share a category.
const LAYOUT_CONFIG = {
  // Level 1 — Outerwear (left side; visible alongside tops/bottoms)
  'Outerwear':               { cx: 215, cy: 450, w: 460, h: 550, z: 1, sx: 28, sy: 10 },
  // Level 2 — Bottoms (lower center; sits above outerwear)
  'Bottoms':                 { cx: 500, cy: 625, w: 480, h: 550, z: 2, sx: 28, sy: 10 },
  // Level 3 — Tops / full-length garments (upper center; proportional to Bottoms)
  'Tops':                    { cx: 500, cy: 265, w: 320, h: 345, z: 3, sx: 22, sy:  8 },
  'Knitwear & Sweaters':     { cx: 500, cy: 265, w: 320, h: 345, z: 3, sx: 22, sy:  8 },
  'Dresses & Jumpsuits':     { cx: 500, cy: 450, w: 415, h: 875, z: 3, sx: 26, sy: 10 },
  'Activewear / Athleisure': { cx: 500, cy: 450, w: 415, h: 735, z: 3, sx: 26, sy: 10 },
  // Level 4 — Accents (shoes left-bottom, bags right-mid, jewelry top-right)
  'Shoes':                   { cx: 345, cy: 862, w: 275, h: 190, z: 4, sx: 72, sy: 10 },
  'Accessories & Bags':      {
    cx: 762, cy: 490, w: 295, h: 295, z: 4, sx: 18, sy: 58, max: 2,
    // Explicit per-slot positions: 1st middle-right, 2nd bottom-right (no overlap)
    slots: [
      { cx: 762, cy: 490 },
      { cx: 820, cy: 790 },
    ],
  },
  'Jewelry':                 { cx: 762, cy: 195, w: 202, h: 202, z: 4, sx: 28, sy: 28 },
};

// Design-space dimensions (coordinate grid)
const DESIGN_W = 1000;
const DESIGN_H = 1000;
// vertical space consumed by the TodayTab header (title + padding + gap)
const COLLAGE_HEADER_OFFSET = 172;

// Converts AI outfit items into design-space (1000×1000) canvas items.
// CreateOutfitModal scales them to the actual canvas size on mount via initialDesignWidth/Height.
function aiOutfitToCanvasItems(outfitItems) {
  const groups = {};
  for (const item of outfitItems) {
    const slot = LAYOUT_CONFIG[item.category];
    if (!slot) continue;
    (groups[item.category] ??= []).push(item);
  }
  const canvasItems = [];
  for (const [cat, catItems] of Object.entries(groups)) {
    const { cx, cy, w, h, z, sx, sy, slots, max } = LAYOUT_CONFIG[cat];
    const limited = max ? catItems.slice(0, max) : catItems;
    const n = limited.length;
    limited.forEach((item, i) => {
      let x, y;
      if (slots && slots[i] !== undefined) {
        x = Math.round(slots[i].cx - w / 2);
        y = Math.round(slots[i].cy - h / 2);
      } else {
        const offset = i - (n - 1) / 2;
        x = Math.round(cx + offset * sx - w / 2);
        y = Math.round(cy + offset * sy - h / 2);
      }
      canvasItems.push({
        ...item,
        _cid:      `${item.id}-${Date.now()}-${i}`,
        x, y, w, h,
        rotation:  0,
        zIndex:    z,
        _aiLayout: true, // box sized from LAYOUT_CONFIG (non-uniform A4 scale); skip canCrop in editor
      });
    });
  }
  return canvasItems;
}



function FadeIn({ children, className = '' }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className={`transition-all duration-500 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${className}`}>
      {children}
    </div>
  );
}

function GeneratingSkeleton({ city, weatherSummary }) {
  const phase = !weatherSummary ? 'weather' : 'outfits';
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 animate-pulse">
        {phase === 'weather'
          ? <Cloud size={24} className="text-gray-300" />
          : <Sparkles size={24} className="text-gray-300" />}
      </div>
      <p className="text-[15px] font-semibold text-gray-700 mb-1.5">
        {phase === 'weather' ? 'Checking the weather…' : 'Styling your day…'}
      </p>
      <p className="text-sm text-gray-400 leading-relaxed max-w-[210px]">
        {phase === 'weather'
          ? (city ? `Looking up conditions in ${city}` : 'Fetching your local weather')
          : (city ? `Picking outfits for ${city}'s weather today` : 'Crafting your daily looks')}
      </p>
    </div>
  );
}

function useCollageScale() {
  const calc = () => {
    const byHeight = Math.min(1, (window.innerHeight - COLLAGE_HEADER_OFFSET) / DESIGN_H);
    // Cap by available width so collage never overflows the screen in column layout.
    // displayW = DESIGN_H * scale * (210/297), so byWidth = (screenW - hPad) / (DESIGN_H * 210/297)
    const byWidth = (window.innerWidth - 48) / (DESIGN_H * (210 / 297));
    return Math.min(byHeight, byWidth, 1);
  };
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const update = () => setScale(calc());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

function OutfitCollage({ items }) {
  const scale = useCollageScale();

  const groups = {};
  for (const item of items) {
    const slot = LAYOUT_CONFIG[item.category];
    if (!slot) continue;
    (groups[item.category] ??= []).push(item);
  }

  const placed = [];
  for (const [cat, catItems] of Object.entries(groups)) {
    const slot = LAYOUT_CONFIG[cat];
    const { cx, cy, w, h, z, sx: dsx, sy: dsy, slots, max } = slot;
    const limited = max ? catItems.slice(0, max) : catItems;
    const n = limited.length;
    limited.forEach((item, i) => {
      let left, top;
      if (slots && slots[i] !== undefined) {
        left = Math.round(slots[i].cx - w / 2);
        top  = Math.round(slots[i].cy - h / 2);
      } else {
        const offset = i - (n - 1) / 2;
        left = Math.round(cx + offset * dsx - w / 2);
        top  = Math.round(cy + offset * dsy - h / 2);
      }
      placed.push({ item, left, top, w, h, z });
    });
  }

  placed.sort((a, b) => a.z - b.z);

  // A4 portrait display — non-uniform scale so Today and Studio look identical
  const displayH = Math.round(DESIGN_H * scale);
  const displayW = Math.round(displayH * 210 / 297);
  const scaleX   = displayW / DESIGN_W;
  const scaleY   = displayH / DESIGN_H;

  return (
    <div
      className="flex-shrink-0 rounded-3xl bg-gray-50 overflow-hidden relative"
      style={{ width: displayW, height: displayH }}
    >
      {placed.map(({ item, left, top, w, h, z }) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left:   Math.round(left * scaleX),
            top:    Math.round(top  * scaleY),
            width:  Math.round(w    * scaleX),
            height: Math.round(h    * scaleY),
            zIndex: z,
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
              <Shirt size={20} className="text-gray-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// v2: array of { date, sig, outfits } — keyed by weather signature, not city
const OUTFITS_CACHE_KEY = 'wardrobe_daily_outfits_v2';

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Encodes what actually drives outfit choice: temp band + precipitation now + precipitation later
function weatherSig(weather) {
  return `${tempBand(weather.highF)}-${hasPrecip(weather.conditionLabel) ? 'p' : 'd'}-${hasPrecip(weather.laterCondition) ? 'p' : 'd'}`;
}

function loadCachedOutfits(weather) {
  try {
    const raw = localStorage.getItem(OUTFITS_CACHE_KEY);
    if (!raw) return null;
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return null;
    const entry = entries.find(e => e.date === todayDateKey() && e.sig === weatherSig(weather));
    return entry?.outfits ?? null;
  } catch { return null; }
}

function saveCachedOutfits(outfits, weather) {
  try {
    const raw = localStorage.getItem(OUTFITS_CACHE_KEY);
    let entries = [];
    try { const p = JSON.parse(raw); if (Array.isArray(p)) entries = p; } catch {}
    const today = todayDateKey();
    const sig = weatherSig(weather);
    // Replace existing entry for same sig, drop stale dates
    entries = entries.filter(e => e.date === today && e.sig !== sig);
    entries.push({ date: today, sig, outfits });
    localStorage.setItem(OUTFITS_CACHE_KEY, JSON.stringify(entries));
  } catch {}
}

// Temperature bands (°F) that define meaningfully different clothing needs
const TEMP_BAND_THRESHOLDS = [32, 50, 65, 75, 85];
function tempBand(t) {
  for (let i = 0; i < TEMP_BAND_THRESHOLDS.length; i++) if (t < TEMP_BAND_THRESHOLDS[i]) return i;
  return TEMP_BAND_THRESHOLDS.length;
}

const PRECIP_LABELS = new Set(['Drizzle', 'Rain', 'Snow', 'Showers', 'Snow Showers', 'Thunderstorm']);
function hasPrecip(label) { return PRECIP_LABELS.has(label); }

function weatherNeedsRegen(prev, next) {
  if (!prev) return true;
  // Different clothing-band for the day's high
  if (tempBand(prev.highF) !== tempBand(next.highF)) return true;
  // Precipitation status changed (current or expected later)
  if (hasPrecip(prev.conditionLabel) !== hasPrecip(next.conditionLabel)) return true;
  if (hasPrecip(prev.laterCondition) !== hasPrecip(next.laterCondition)) return true;
  // High or low shifted by more than 10°F within the same band
  if (Math.abs(prev.highF - next.highF) > 10 || Math.abs(prev.lowF - next.lowF) > 10) return true;
  return false;
}

function LocationBar({ city, onCommit, onSelectLocation }) {
  const [editing,  setEditing]  = useState(false);
  const [val,      setVal]      = useState('');
  const [suggs,    setSuggs]    = useState([]);
  const [hi,       setHi]       = useState(-1);
  const inputRef    = useRef(null);
  const containerRef = useRef(null);
  const debRef      = useRef(null);
  const ctrlRef     = useRef(null);

  const clearSearch = () => {
    clearTimeout(debRef.current);
    ctrlRef.current?.abort();
    setSuggs([]);
    setHi(-1);
  };
  const commit = () => {
    clearSearch();
    const t = val.trim();
    if (t && t !== city) onCommit(t);
    setEditing(false);
  };
  const startEdit = () => {
    setVal(city ?? '');
    setSuggs([]);
    setHi(-1);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };
  const pick = s => {
    clearSearch();
    const addr = s.address || {};
    const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
    const region = addr.state_code || addr.state || '';
    onSelectLocation({ city: region ? `${name}, ${region}` : name, lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
    setEditing(false);
  };
  const onChange = v => {
    setVal(v);
    setHi(-1);
    clearTimeout(debRef.current);
    ctrlRef.current?.abort();
    if (v.trim().length < 2) { setSuggs([]); return; }
    debRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v.trim())}&format=json&addressdetails=1&limit=5`,
          { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } }
        );
        setSuggs(await res.json());
      } catch (e) { if (e.name !== 'AbortError') setSuggs([]); }
    }, 320);
  };
  const onKeyDown = e => {
    if (suggs.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, suggs.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHi(i => Math.max(i - 1, -1)); return; }
      if (e.key === 'Enter' && hi >= 0) { pick(suggs[hi]); return; }
    }
    if (e.key === 'Enter')  { commit(); return; }
    if (e.key === 'Escape') { clearSearch(); setEditing(false); }
  };
  // Only commit when focus leaves the entire component (not when moving to a suggestion)
  const handleBlur = e => {
    if (containerRef.current?.contains(e.relatedTarget)) return;
    commit();
  };

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      {editing ? (
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
          <MapPin size={15} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={val}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={handleBlur}
            placeholder="Search city…"
            className="bg-transparent text-base text-gray-700 focus:outline-none w-56 placeholder:text-gray-400"
          />
        </div>
      ) : (
        <button onClick={startEdit} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2.5">
          <MapPin size={15} className="text-gray-500 flex-shrink-0" />
          <span className="text-base text-gray-600 max-w-[220px] truncate">{city ?? 'Set location'}</span>
        </button>
      )}
      {editing && suggs.length > 0 && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 w-72">
          {suggs.map((s, i) => {
            const addr = s.address || {};
            const name = addr.city || addr.town || addr.village || addr.county || s.display_name.split(',')[0].trim();
            const region = addr.state_code || addr.state || '';
            const country = addr.country || '';
            const display = region ? `${name}, ${region}` : name;
            return (
              <button key={s.place_id ?? i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(s)}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors ${hi === i ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{display}</p>
                  {country && <p className="text-xs text-gray-400 truncate">{country}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Static demo outfits shown to non-logged-in users — one set per preset city, never changes.
const PREVIEW_CITY_OUTFITS = {
  'New York, NY': [
    { outfitName: 'Winter Polish',    description: 'Cashmere warmth meets tailored structure for a cold overcast day.', itemIds: [21, 24, 40, 35, 1]  },
    { outfitName: 'Puff & Polish',    description: 'Max warmth with a sleek monochrome silhouette.',                    itemIds: [33, 18, 4,  12, 3]  },
    { outfitName: 'Warm Tones',       description: 'Rich burgundy and camel cut through a grey winter morning.',       itemIds: [34, 37, 40, 39, 38] },
  ],
  'Los Angeles, CA': [
    { outfitName: 'Sunny Edit',       description: 'Effortless warm-weather dressing for a clear LA day.',             itemIds: [11, 26, 27, 38, 22] },
    { outfitName: 'Boho Glam',        description: 'Flowy silk and a floral skirt — perfect for the sunshine.',        itemIds: [23, 7,  41, 1]      },
    { outfitName: 'Garden Party',     description: 'Polished and playful in the California sun.',                      itemIds: [31, 9,  30, 13]     },
  ],
  'Miami, FL': [
    { outfitName: 'Miami Afternoon',  description: 'Breezy crochet and wedges for a tropical afternoon.',              itemIds: [25, 41, 22, 38]     },
    { outfitName: 'Poolside Glam',    description: 'Draped silk and crystal heels — resort elegance.',                 itemIds: [36, 7,  30, 2]      },
    { outfitName: 'Rain-Ready',       description: 'Light and practical for when the afternoon showers arrive.',       itemIds: [19, 26, 4,  1]      },
  ],
  'Chicago, IL': [
    { outfitName: 'Blizzard Chic',    description: 'Staying warm and stylish when it snows.',                          itemIds: [21, 18, 4,  12, 3]  },
    { outfitName: 'Deep Freeze',      description: 'Sleek tonal layers built for the coldest days.',                   itemIds: [33, 24, 40, 35, 1]  },
    { outfitName: 'Scarlet Snow',     description: 'A pop of burgundy against a grey winter cityscape.',               itemIds: [34, 37, 4,  12, 38] },
  ],
  'Seattle, WA': [
    { outfitName: 'Northwest Classic',description: 'A timeless trench-and-boot rainy-day uniform.',                    itemIds: [19, 24, 4,  39, 1]  },
    { outfitName: 'Rainy Layers',     description: 'Cashmere and leather keep the drizzle at bay.',                    itemIds: [21, 37, 4,  20, 38] },
    { outfitName: 'Effortless Grey',  description: 'Understated and polished for a cool overcast morning.',            itemIds: [29, 10, 40, 39, 13] },
  ],
};

function TodayTab({ items = [], onSaveToPublished, onEditInStudio, isPreview = false, userId = null }) {
  const [location,       setLocation]       = useState({ city: null, lat: null, lon: null });
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [outfits,        setOutfits]        = useState([]);
  const [generating,     setGenerating]     = useState(false);
  const [genError,       setGenError]       = useState(null);
  const [currentIdx,     setCurrentIdx]     = useState(0);
  const [retryKey,       setRetryKey]       = useState(0);
  const [saveState,      setSaveState]      = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const locationMenuRef = useRef(null);
  const collageScale     = useCollageScale();
  const outfitWeatherRef = useRef(null); // weather that generated the current outfits
  const directionRef     = useRef('right'); // tracks nav direction for slide animation

  const navigate = (toIdx) => {
    directionRef.current = toIdx >= currentIdx ? 'right' : 'left';
    setCurrentIdx(toIdx);
  };

  const locationKey = isPreview ? 'wardrobe_location_preview' : `wardrobe_location_user_${userId}`;

  useEffect(() => {
    // Preview mode: restore saved location only if it's a known preset, otherwise use first preset
    if (isPreview) {
      try {
        const saved = localStorage.getItem(locationKey);
        if (saved) {
          const loc = JSON.parse(saved);
          const preset = PRESET_LOCATIONS.find(p => p.city === loc.city);
          if (preset) {
            setLocation(preset);
            setWeatherSummary(preset.weather);
            return;
          }
        }
      } catch {}
      setLocation(PRESET_LOCATIONS[0]);
      setWeatherSummary(PRESET_LOCATIONS[0].weather);
      return;
    }

    // Restore a manually-set location so tab switches don't reset it
    try {
      const saved = localStorage.getItem(locationKey);
      if (saved) { setLocation(JSON.parse(saved)); return; }
    } catch {}

    if (!navigator.geolocation) {
      setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const { address } = await res.json();
          const name = address.city || address.town || address.village || address.county || DEFAULT_CITY;
          const region = address.state_code || address.state || '';
          setLocation({ city: region ? `${name}, ${region}` : name, lat: latitude, lon: longitude });
        } catch {
          setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON });
        }
      },
      () => setLocation({ city: DEFAULT_CITY, lat: DEFAULT_LAT, lon: DEFAULT_LON }),
      { timeout: 8000 }
    );
  }, [isPreview, locationKey]);

  // Preview mode: load the static city outfits whenever the city changes — no AI, no cache
  useEffect(() => {
    if (!isPreview || !location.city) return;
    const cityOutfits = PREVIEW_CITY_OUTFITS[location.city];
    if (cityOutfits) {
      setOutfits(cityOutfits);
      setGenError(null);
      setCurrentIdx(0);
      outfitWeatherRef.current = weatherSummary;
    }
  }, [isPreview, location.city]);

  // Load cache or generate outfits — keyed by date + city
  useEffect(() => {
    if (isPreview) return; // preview uses static PREVIEW_CITY_OUTFITS above
    if (!weatherSummary || items.length === 0 || !location.city) return;
    // Skip regen if weather hasn't changed meaningfully since last generation
    if (!weatherNeedsRegen(outfitWeatherRef.current, weatherSummary)) return;

    const cached = loadCachedOutfits(weatherSummary);
    if (cached) {
      const existingIds = new Set(items.map(i => String(i.id)));
      const goodOutfits = cached.filter(o => (o.itemIds ?? []).every(id => existingIds.has(String(id))));
      // All outfits still valid — use cache unchanged
      if (goodOutfits.length === cached.length) {
        setOutfits(cached);
        setGenError(null);
        outfitWeatherRef.current = weatherSummary;
        return;
      }
      // Some outfits reference deleted items — keep the good ones, generate only what's needed
      const needed = 3 - goodOutfits.length;
      if (goodOutfits.length > 0) setOutfits(goodOutfits);
      let cancelled = false;
      setCurrentIdx(0);
      setGenError(null);
      setGenerating(true);
      callAnthropicForOutfits(weatherSummary, items)
        .then(fresh => {
          if (cancelled) return;
          const combined = [...goodOutfits, ...fresh.slice(0, needed)];
          setOutfits(combined);
          saveCachedOutfits(combined, weatherSummary);
          outfitWeatherRef.current = weatherSummary;
        })
        .catch(e => { if (!cancelled) setGenError(e.message); })
        .finally(() => { if (!cancelled) setGenerating(false); });
      return () => { cancelled = true; };
    }
    // No cache — generate all 3
    let cancelled = false;
    setOutfits([]);
    setCurrentIdx(0);
    setGenError(null);
    setGenerating(true);
    callAnthropicForOutfits(weatherSummary, items)
      .then(results => {
        if (!cancelled) {
          setOutfits(results);
          saveCachedOutfits(results, weatherSummary);
          outfitWeatherRef.current = weatherSummary;
        }
      })
      .catch(e       => { if (!cancelled) setGenError(e.message); })
      .finally(()    => { if (!cancelled) setGenerating(false); });
    return () => { cancelled = true; };
  }, [weatherSummary, items.length, location.city, retryKey]);

  useEffect(() => {
    if (!locationMenuOpen) return;
    const handler = e => { if (!locationMenuRef.current?.contains(e.target)) setLocationMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [locationMenuOpen]);

  // Arrow-key navigation
  useEffect(() => {
    if (outfits.length === 0) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  { directionRef.current = 'left';  setCurrentIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowRight') { directionRef.current = 'right'; setCurrentIdx(i => Math.min(outfits.length - 1, i + 1)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [outfits.length]);

  const saveLocation = (loc) => {
    try { localStorage.setItem(locationKey, JSON.stringify(loc)); } catch {}
    setLocation(loc);
  };

  const handleSelectLocation = ({ city, lat, lon }) => {
    saveLocation({ city, lat, lon });
    setWeatherSummary(null); // triggers fresh weather fetch; outfits stay until regen is confirmed needed
  };

  const handleCitySearch = async (query) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const [result] = await res.json();
      if (result) {
        const addr = result.address || {};
        const name = addr.city || addr.town || addr.village || addr.county || result.display_name.split(',')[0].trim();
        const region = addr.state_code || addr.state || '';
        saveLocation({ city: region ? `${name}, ${region}` : name, lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
      } else {
        saveLocation({ ...location, city: query });
      }
      setWeatherSummary(null);
    } catch {
      saveLocation({ ...location, city: query });
      setWeatherSummary(null);
    }
  };

  const handleWeatherReady = (d) => {
    const tempF = Math.round(d.current.temperature_2m);
    const highF = Math.round(d.daily.temperature_2m_max[0]);
    const lowF  = Math.round(d.daily.temperature_2m_min[0]);
    const { label: conditionLabel } = wmoCondition(d.current.weather_code);

    // Scan remaining hours today for a worse condition (higher WMO code = more severe)
    const now      = Date.now();
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    let worstCode  = d.current.weather_code;
    for (let i = 0; i < d.hourly.time.length; i++) {
      const t = new Date(d.hourly.time[i]).getTime();
      if (t >= now && t < midnight.getTime() && d.hourly.weather_code[i] > worstCode) {
        worstCode = d.hourly.weather_code[i];
      }
    }
    const laterCondition = worstCode !== d.current.weather_code
      ? wmoCondition(worstCode).label
      : null;

    setWeatherSummary({ tempF, conditionLabel, highF, lowF, laterCondition });
  };

  // Build a fast id→item lookup
  const itemById = {};
  for (const item of items) itemById[item.id] = item;

  const outfit = outfits[currentIdx] ?? null;
  const outfitItems = outfit ? (outfit.itemIds ?? []).map(id => itemById[id]).filter(Boolean) : [];

  useEffect(() => { setSaveState('idle'); }, [currentIdx]);

  const handleSave = async () => {
    if (!outfit || !outfitItems.length || saveState !== 'idle') return;
    setSaveState('saving');
    const canvasItems = aiOutfitToCanvasItems(outfitItems);
    await onSaveToPublished?.({
      name: outfit.outfitName,
      items: canvasItems,
      bgColor: '#FFFFFF',
      canvasWidth: DESIGN_W,
      canvasHeight: DESIGN_H,
      thumbnail: '',
    });
    setSaveState('saved');
    setTimeout(() => { setSaveState('idle'); }, 2800);
  };

  const handleEdit = () => {
    if (!outfit || !outfitItems.length) return;
    const canvasItems = aiOutfitToCanvasItems(outfitItems);
    onEditInStudio?.({
      name: outfit.outfitName,
      items: canvasItems,
      bgColor: '#FFFFFF',
      canvasWidth: DESIGN_W,
      canvasHeight: DESIGN_H,
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-28 md:pb-8">

      {/* Title */}
      <div className="px-6 md:px-8 pt-8 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Today's Looks</h1>
          <p className="text-sm text-gray-400 mt-0.5">Curated from your wardrobe</p>
        </div>
        {isPreview ? (
          <div className="relative flex-shrink-0" ref={locationMenuRef}>
            <button
              onClick={() => setLocationMenuOpen(o => !o)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2.5"
            >
              <MapPin size={15} className="text-gray-500 flex-shrink-0" />
              <span className="text-base text-gray-600 max-w-[220px] truncate">{location.city ?? 'Select city'}</span>
              <ChevronDown size={15} strokeWidth={2} className={`text-gray-400 flex-shrink-0 transition-transform ${locationMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {locationMenuOpen && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[180px] z-20">
                {PRESET_LOCATIONS.map(l => (
                  <button
                    key={l.city}
                    onClick={() => { saveLocation(l); setWeatherSummary(l.weather ?? null); setLocationMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                  >
                    {l.city}
                    {location.city === l.city && <Check size={13} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <LocationBar
            city={location.city}
            onCommit={handleCitySearch}
            onSelectLocation={handleSelectLocation}
          />
        )}
        {/* hidden — keep mounted so weather fetch + onWeatherReady fire before outfits load; skipped in preview since presets supply static weather */}
        {!isPreview && (
          <div className="hidden">
            <WeatherWidget
              compact
              lat={location.lat}
              lon={location.lon}
              city={location.city}
              onCommit={handleCitySearch}
              onSelectLocation={handleSelectLocation}
              onWeatherReady={handleWeatherReady}
            />
          </div>
        )}
      </div>

      {/* Outfit section */}
      <div className="flex flex-col gap-4 pl-6 md:pl-8 pr-6 md:pr-10">

        {items.length < 3 && (
          <div className="ml-6 md:ml-8 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Shirt size={22} className="text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Your wardrobe needs a few more pieces</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[220px]">
                Add more items to unlock daily style inspiration tailored to the weather.
              </p>
            </div>
          </div>
        )}

        {/* Unified skeleton — wait for outfits AND weather before revealing any content */}
        {items.length >= 3 && !genError && (generating || !outfits.length || !weatherSummary) && (
          <GeneratingSkeleton city={location.city} weatherSummary={weatherSummary} />
        )}

        {items.length >= 3 && !generating && genError && (
          <div className="flex flex-col items-center justify-center text-center px-8 py-20 flex-1">
            <p className="text-5xl mb-6">✦</p>
            {genError.includes('No valid outfits') ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 leading-snug">
                  Nothing quite fits today's weather
                </h2>
                <p className="text-base text-gray-400 leading-relaxed max-w-xs">
                  {isPreview
                    ? 'Try switching to a different city to see outfits suited to that climate.'
                    : 'Add a few more pieces to your wardrobe — a mix of tops, bottoms, and a pair of shoes is all it takes.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 leading-snug">
                  Couldn't reach the stylist
                </h2>
                <p className="text-base text-gray-400 leading-relaxed max-w-xs">
                  Something went wrong on our end. Your wardrobe is fine — give it a moment and try again.
                </p>
              </>
            )}
            <button
              onClick={() => { setGenError(null); setRetryKey(k => k + 1); }}
              className="mt-8 px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {items.length >= 3 && !generating && outfits.length > 0 && weatherSummary && (
          <FadeIn>
          <div className="flex flex-col items-center [@media(min-width:1000px)_and_(min-height:680px)]:flex-row [@media(min-width:1000px)_and_(min-height:680px)]:items-stretch">
            {/* Collage — slides in from direction of navigation */}
            <div key={`collage-${currentIdx}`} className={directionRef.current === 'right' ? 'outfit-enter-right' : 'outfit-enter-left'}>
              {outfitItems.length > 0 ? (
                <OutfitCollage items={outfitItems} />
              ) : (
                <div className="rounded-3xl bg-white flex-shrink-0 flex items-center justify-center"
                  style={{ height: Math.round(DESIGN_H * collageScale), width: Math.round(DESIGN_H * collageScale * 210 / 297) }}>
                  <p className="text-sm text-gray-400">No items found</p>
                </div>
              )}
            </div>

            {/* Info panel — right of collage on wide screens, below on narrow */}
            <div className="flex-1 min-w-0 flex flex-col items-start px-5 pt-4 pb-0 [@media(min-width:1000px)_and_(min-height:680px)]:pl-8 [@media(min-width:1000px)_and_(min-height:680px)]:pt-0">
              {/* Counter */}
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-1">
                {currentIdx + 1} of {outfits.length}
              </p>
              {/* Outfit name */}
              <h3 key={`name-${currentIdx}`} className="text-base font-semibold text-gray-900 leading-snug mb-3 outfit-text-fade">
                {outfit.outfitName}
              </h3>
              {/* Nav arrows */}
              <div className="flex gap-1.5 mb-4">
                <button
                  onClick={() => navigate(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} strokeWidth={2} />
                </button>
                <button
                  onClick={() => navigate(Math.min(outfits.length - 1, currentIdx + 1))}
                  disabled={currentIdx === outfits.length - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              </div>
              {/* Dot indicators */}
              <div className="flex gap-1.5 mb-5">
                {outfits.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(i)}
                    className={`rounded-full transition-all ${
                      i === currentIdx
                        ? 'w-4 h-1.5 bg-gray-800'
                        : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              {/* Description — fixed height so buttons don't jump between outfits */}
              <div key={`desc-${currentIdx}`} className="h-24 mb-3 flex items-start justify-center overflow-hidden outfit-text-fade">
                {outfit.description && (
                  <p className="text-sm text-gray-500 leading-relaxed text-center">{outfit.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 justify-center">
                {/* Save */}
                <div className="relative group">
                  <button
                    onClick={handleSave}
                    disabled={saveState !== 'idle'}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors
                      ${saveState === 'saved'
                        ? 'border-green-200 bg-green-50 text-green-500'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                  >
                    {saveState === 'saved'
                      ? <Check size={15} strokeWidth={2.5} />
                      : <Bookmark size={15} strokeWidth={1.8} />
                    }
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {saveState === 'saved' ? 'Saved!' : 'Save to Outfits'}
                  </span>
                </div>

                {/* Edit in Studio */}
                <div className="relative group">
                  <button
                    onClick={handleEdit}
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Pencil size={14} strokeWidth={1.8} />
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit Outfit
                  </span>
                </div>
              </div>

              {/* Weather Report — weatherSummary is guaranteed non-null here */}
              {(() => {
                const meta = CONDITION_LABEL_META[weatherSummary.conditionLabel] ?? CONDITION_LABEL_META['Clear'];
                const CondIcon = meta.Icon;
                return (
                  <div className="mt-5 w-full">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-2">Weather Report</p>
                    <div className="rounded-3xl overflow-hidden" style={{ background: meta.bg }}>
                      <div className="px-6 pt-5">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-white/60 flex-shrink-0" />
                          <span className="text-sm font-medium text-white/80 tracking-wide">{location.city}</span>
                        </div>
                      </div>
                      <div className="px-6 pt-3 pb-5 flex items-center justify-between">
                        <div className="flex items-start">
                          <span className="text-[68px] font-thin text-white leading-none tracking-tight">{weatherSummary.tempF}</span>
                          <span className="text-xl font-light text-white/60 mt-3 ml-0.5">°F</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-2">
                            <CondIcon size={20} className="text-white/90" strokeWidth={1.8} />
                            <span className="text-[17px] font-medium text-white">{weatherSummary.conditionLabel}</span>
                          </div>
                          <p className="text-sm text-white/60 font-medium tracking-wide">H: {weatherSummary.highF}°  ·  L: {weatherSummary.lowF}°</p>
                          {weatherSummary.laterCondition && (
                            <p className="text-xs text-white/50 mt-0.5">{weatherSummary.laterCondition} later</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          </FadeIn>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CreateOutfitModal
   ───────────────────────────────────────────────────────────────────────────── */
function CreateOutfitModal({ initialItem, initialCanvasItems, initialBgColor, initialDesignWidth, initialDesignHeight, onClose, onPublish, onAutoSave, onDetachCollage, onDelete, items = [], boards = ['All'] }) {
  const [canvasItems, setCanvasItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [studioFilter, setStudioFilter] = useState(new Set());
  const [studioFilterOpen, setStudioFilterOpen] = useState(false);
  const studioFilterRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [wideLayout, setWideLayout] = useState(
    () => window.innerWidth >= 1250
  );
  const [draggingCid, setDraggingCid] = useState(null);
  const [selectedCid, setSelectedCid] = useState(null);
  const [bgColor, setBgColor] = useState(initialBgColor ?? '#FFFFFF');
  const [bgLayerSelected, setBgLayerSelected] = useState(false);
  const [hexInput, setHexInput] = useState((initialBgColor ?? '#FFFFFF').replace('#', ''));
  const [layerDragging, setLayerDragging] = useState(null);
  const [layerMenuState, setLayerMenuState] = useState(null); // { cid, rect }
  const canvasRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bgRowRef = useRef(null);
  const layerMenuRef = useRef(null);
  const collageMenuRef = useRef(null);
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [collageMenuOpen, setCollageMenuOpen] = useState(false);
  const [, trimTick] = useState(0);

  const ITEM_SIZE = 220;
  const DOT_GRID_STYLE = {
    backgroundColor: '#F3F5F4',
    backgroundImage: 'radial-gradient(circle, #C6C9CC 1.5px, transparent 1.5px)',
    backgroundSize: '28px 28px',
    backgroundPosition: 'center',
  };
  const bgStyle = bgColor === '#FFFFFF' ? DOT_GRID_STYLE : { backgroundColor: bgColor };
  const swatchStyle = bgColor === '#FFFFFF'
    ? { ...DOT_GRID_STYLE, backgroundSize: '7px 7px', backgroundImage: 'radial-gradient(circle, #C6C9CC 1px, transparent 1px)' }
    : { backgroundColor: bgColor };
  const BG_COLORS = [
    //           red        orange     yellow     green      blue       purple     pink
    /* light  */ '#FFFFFF','#FFF3E0','#FFFDE7','#F1F8E9','#E3F2FD','#F3E5F5','#FCE4EC',
    /* mid    */ '#F44336','#FF9800','#FFEB3B','#4CAF50','#2196F3','#9C27B0','#E91E63',
    /* dark   */ '#B71C1C','#E65100','#F57F17','#1B5E20','#0D47A1','#4A148C','#880E4F',
    /* darker */ '#7B0000','#7C2900','#5D3A00','#0A3D0C','#0A1F5C','#1A0033','#000000',
  ];

  const pushHistory = snapshot => {
    historyRef.current = [...historyRef.current, snapshot];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const undo = () => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [canvasItems, ...futureRef.current];
    setCanvasItems(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (!futureRef.current.length) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current, canvasItems];
    setCanvasItems(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const base = initialCanvasItems || [];

    const applyLayout = (width, height) => {
      if (!initialItem) {
        if (base.length > 0) {
          if (initialDesignWidth && initialDesignHeight) {
            const sx = width  / initialDesignWidth;
            const sy = height / initialDesignHeight;
            setCanvasItems(base.map(item => ({
              ...item,
              x: Math.round(item.x * sx),
              y: Math.round(item.y * sy),
              w: Math.round((item.w ?? ITEM_SIZE) * sx),
              h: Math.round((item.h ?? ITEM_SIZE) * sy),
            })));
          } else {
            setCanvasItems(base);
          }
        }
        return;
      }
      const _cid = `${initialItem.id}-${Date.now()}`;
      computeImageTrim(initialItem.image).then(trim => {
        const { w, h } = contentBounds(trim, ITEM_SIZE);
        const x = Math.max(0, (width  - w) / 2);
        const y = Math.max(0, (height - h) / 2);
        setCanvasItems([...base, { ...initialItem, _cid, x, y, w, h, rotation: 0 }]);
      });
    };

    // Try immediate measurement; fall back to ResizeObserver if layout isn't ready yet
    const { width, height } = canvasRef.current.getBoundingClientRect();
    if (width > 0 && height > 0) {
      applyLayout(width, height);
      return;
    }
    const ro = new ResizeObserver(entries => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) { ro.disconnect(); applyLayout(w, h); }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const uncached = canvasItems.filter(i => i.image && !_trimCache.has(i.image));
    if (!uncached.length) return;
    let fired = false;
    Promise.all(uncached.map(i => computeImageTrim(i.image).then(() => { fired = true; })))
      .then(() => { if (fired) trimTick(n => n + 1); });
  }, [canvasItems]);

  const buildSnapshot = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return {
      items: canvasItems,
      bgColor,
      canvasWidth: rect?.width ?? 480,
      canvasHeight: rect?.height ?? 679,
    };
  };

  const handleClose = () => {
    onAutoSave(buildSnapshot());
    onClose();
  };

  const filtered = (() => {
    let list = activeFilter === 'All' ? items : items.filter(i => i.boards.includes(activeFilter));
    if (studioFilter.size > 0) list = list.filter(i => studioFilter.has(i.category));
    return list;
  })();

  // Click-to-add: cascade items from center so they don't stack
  const addToCanvas = item => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const cw = rect?.width ?? 480;
    const ch = rect?.height ?? 679;
    const offset = (canvasItems.length % 7) * 20;
    const _cid = `${item.id}-${Date.now()}`;
    pushHistory(canvasItems);
    computeImageTrim(item.image).then(trim => {
      const { w, h } = contentBounds(trim, ITEM_SIZE);
      const x = Math.max(0, Math.min((cw - w) / 2 - 60 + offset, cw - w));
      const y = Math.max(0, Math.min((ch - h) / 2 - 60 + offset, ch - h));
      setCanvasItems(prev => [...prev, { ...item, _cid, x, y, w, h, rotation: 0 }]);
    });
  };

  const duplicateItem = cid => {
    const item = canvasItems.find(i => i._cid === cid);
    if (!item) return;
    const newCid = `${item.id}-${Date.now()}`;
    const newItem = { ...item, _cid: newCid, x: item.x + 20, y: item.y + 20 };
    pushHistory(canvasItems);
    setCanvasItems(prev => [...prev, newItem]);
    setSelectedCid(newCid);
  };

  const removeFromCanvas = cid => {
    pushHistory(canvasItems);
    setCanvasItems(prev => prev.filter(i => i._cid !== cid));
  };

  // ── HTML5 drag-and-drop: wardrobe → canvas ──
  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('itemId', String(item.id));
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = e => {
    // only clear if leaving the canvas itself, not a child
    if (!canvasRef.current?.contains(e.relatedTarget)) setIsDragOver(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragOver(false);
    const item = items.find(i => i.id === Number(e.dataTransfer.getData('itemId')));
    if (!item) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;
    const _cid = `${item.id}-${Date.now()}`;
    pushHistory(canvasItems);
    computeImageTrim(item.image).then(trim => {
      const { w, h } = contentBounds(trim, ITEM_SIZE);
      const x = Math.max(0, Math.min(dropX - w / 2, rect.width  - w));
      const y = Math.max(0, Math.min(dropY - h / 2, rect.height - h));
      setCanvasItems(prev => [...prev, { ...item, _cid, x, y, w, h, rotation: 0 }]);
    });
  };

  // ── Mouse drag: reposition items already on canvas ──
  const startItemDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCid(cid);
    pushHistory(canvasItems);
    const item = canvasItems.find(i => i._cid === cid);
    const itemW = item.w ?? ITEM_SIZE;
    const itemH = item.h ?? ITEM_SIZE;
    dragOffset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
    setDraggingCid(cid);

    const onMove = e => {
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      setCanvasItems(prev => prev.map(i => i._cid === cid ? { ...i, x, y } : i));
    };
    const onUp = () => {
      setDraggingCid(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Resize: drag a corner handle to change w/h ──
  const startResizeDrag = (e, cid, corner) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory(canvasItems);
    const item = canvasItems.find(i => i._cid === cid);
    const startX = e.clientX;
    const startW = item.w ?? ITEM_SIZE;
    const startH = item.h ?? ITEM_SIZE;
    const ratio = startW / startH;
    const startItemX = item.x;
    const startItemY = item.y;

    const onMove = e => {
      const dx = e.clientX - startX;
      setCanvasItems(prev => prev.map(i => {
        if (i._cid !== cid) return i;
        let x = startItemX, y = startItemY, w, h, flipX;
        if (corner === 'se') {
          const rawW = startW + dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX - w : startItemX;
        }
        if (corner === 'sw') {
          const rawW = startW - dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX + startW : startItemX + startW - w;
        }
        if (corner === 'ne') {
          const rawW = startW + dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX - w : startItemX;
          y = startItemY + startH - h;
        }
        if (corner === 'nw') {
          const rawW = startW - dx;
          flipX = rawW < 0;
          w = Math.max(10, Math.abs(rawW)); h = w / ratio;
          x = flipX ? startItemX + startW : startItemX + startW - w;
          y = startItemY + startH - h;
        }
        return { ...i, x, y, w, h, flipX };
      }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Rotate: drag the top handle to spin the item ──
  const startRotateDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory(canvasItems);
    const item = canvasItems.find(i => i._cid === cid);
    const w = item.w ?? ITEM_SIZE;
    const h = item.h ?? ITEM_SIZE;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + item.x + w / 2;
    const centerY = rect.top  + item.y + h / 2;

    const onMove = e => {
      const raw = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
      const nearest90 = Math.round(raw / 90) * 90;
      const angle = Math.abs(raw - nearest90) < 8 ? nearest90 : raw;
      setCanvasItems(prev => prev.map(i => i._cid === cid ? { ...i, rotation: angle } : i));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Layer reorder drag ──
  const startLayerDrag = (e, cid) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory(canvasItems);
    setLayerDragging(cid);
    const onMove = e => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const row = el?.closest('[data-layer-cid]');
      const hoverCid = row?.dataset?.layerCid;
      if (hoverCid && hoverCid !== cid) {
        setCanvasItems(prev => {
          const arr = [...prev];
          const from = arr.findIndex(i => i._cid === cid);
          const to   = arr.findIndex(i => i._cid === hoverCid);
          if (from === -1 || to === -1) return prev;
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          return arr;
        });
      }
    };
    const onUp = () => {
      setLayerDragging(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const moveLayerTo = (cid, dir) => {
    pushHistory(canvasItems);
    setCanvasItems(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(i => i._cid === cid);
      if (idx === -1) return prev;
      const [item] = arr.splice(idx, 1);
      if (dir === 'top')         arr.push(item);
      else if (dir === 'bottom') arr.unshift(item);
      else if (dir === 'up')     arr.splice(Math.min(idx + 1, arr.length), 0, item);
      else if (dir === 'down')   arr.splice(Math.max(idx - 1, 0), 0, item);
      return arr;
    });
    setLayerMenuState(null);
  };

  useEffect(() => {
    if (!layerMenuState) return;
    const handler = e => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target)) {
        setLayerMenuState(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [layerMenuState]);

  useEffect(() => {
    if (!collageMenuOpen) return;
    const handler = e => {
      if (collageMenuRef.current && !collageMenuRef.current.contains(e.target)) {
        setCollageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [collageMenuOpen]);

  useEffect(() => {
    if (!studioFilterOpen) return;
    const handler = e => { if (!studioFilterRef.current?.contains(e.target)) setStudioFilterOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [studioFilterOpen]);

  useEffect(() => {
    const check = () => setWideLayout(window.innerWidth >= 1250);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const startNewCollage = () => {
    setCanvasItems([]);
    setSelectedCid(null);
    setBgLayerSelected(false);
    setBgColor('#FFFFFF');
    setHexInput('FFFFFF');

    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setCollageMenuOpen(false);
    onDetachCollage?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Header */}
      <div className="relative z-[1100] flex items-center px-4 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <X size={20} className="text-gray-600" />
        </button>
        {/* Centered undo / redo / menu */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <Undo2 size={22} className="text-gray-600" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <Redo2 size={22} className="text-gray-600" />
          </button>
          {/* Collage options menu */}
          <div className="relative" ref={collageMenuRef}>
            <button
              onClick={() => setCollageMenuOpen(o => !o)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={22} className="text-gray-600" />
            </button>
            {collageMenuOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 z-[1200]">
                <button
                  onClick={startNewCollage}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Start new collage
                </button>
                <button
                  onClick={() => { setCollageMenuOpen(false); onDelete?.(); onClose(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                >
                  Delete collage
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { onPublish(buildSnapshot()); onClose(); }}
            disabled={canvasItems.length === 0}
            className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Body — layers left, canvas center, wardrobe panel right */}
      <div className={`flex-1 relative ${wideLayout ? 'flex flex-row overflow-hidden' : 'grid grid-cols-2 overflow-y-auto'}`}>

        {/* ── Layers panel ── */}
        <div className={`flex flex-col flex-shrink-0 border-gray-100 bg-white overflow-hidden ${wideLayout ? 'w-72 border-r h-auto' : 'col-start-1 row-start-2 border-t border-r h-72'}`}>
          <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Layers</p>
          </div>

          {/* All layers in one scrollable vertical list — items first, background last */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
            {[...canvasItems].reverse().map(item => (
              <div
                key={item._cid}
                data-layer-cid={item._cid}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer ${selectedCid === item._cid ? 'bg-blue-50' : ''} ${layerDragging === item._cid ? 'opacity-40' : ''}`}
                onClick={() => { setSelectedCid(item._cid); setBgLayerSelected(false); }}
              >
                <div
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
                  onMouseDown={e => startLayerDrag(e, item._cid)}
                  onClick={e => e.stopPropagation()}
                >
                  <GripVertical size={16} />
                </div>
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-cover" style={item.flipX ? { transform: 'scaleX(-1)' } : undefined} />
                </div>
                <span className="text-sm text-gray-700 truncate leading-tight flex-1">{item.name}</span>
                <button
                  className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={e => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setLayerMenuState(prev => prev?.cid === item._cid ? null : { cid: item._cid, rect });
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}

            {/* Background layer — always at bottom of list */}
            <div
              ref={bgRowRef}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer ${bgLayerSelected ? 'bg-blue-50' : ''}`}
              onClick={() => { setBgLayerSelected(s => !s); setSelectedCid(null); }}
            >
              <Lock size={14} className="flex-shrink-0 text-gray-400" />
              <div className="w-9 h-9 rounded-lg border border-gray-200 flex-shrink-0" style={swatchStyle} />
              <span className="text-sm text-gray-700 flex-1">Background</span>
            </div>
          </div>
        </div>

        {/* Color picker popup — fixed position aligned to background layer row */}
        {bgLayerSelected && bgRowRef.current && (() => {
          const r = bgRowRef.current.getBoundingClientRect();
          const style = { top: r.top, left: r.right + 8 };
          return (
            <div className="fixed z-[60]" style={style}>
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-64">
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {BG_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { setBgColor(color); setHexInput(color.replace('#', '')); }}
                      className="aspect-square rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: color, borderColor: bgColor === color ? '#60a5fa' : '#e5e7eb' }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-mono">#</span>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                      setHexInput(val);
                      if (val.length === 6) setBgColor('#' + val);
                    }}
                    maxLength={6}
                    placeholder="FFFFFF"
                    className="flex-1 min-w-0 text-[11px] font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Item action toolbar — fixed so it's never clipped by canvas overflow */}
        {selectedCid && canvasRef.current && (() => {
          const item = canvasItems.find(i => i._cid === selectedCid);
          if (!item) return null;
          const cr = canvasRef.current.getBoundingClientRect();
          const w = item.w ?? ITEM_SIZE;
          const h = item.h ?? ITEM_SIZE;
          const toolbarW = 104;
          const toolbarH = 52;
          const pad = 8;
          // horizontal: center on item, clamped inside canvas
          const rawX = cr.left + item.x + w / 2;
          const clampedX = Math.max(cr.left + toolbarW / 2 + pad, Math.min(rawX, cr.right - toolbarW / 2 - pad));
          // vertical: below item if it fits, otherwise above
          const rawBelow = cr.top + item.y + h + 12;
          const rawAbove = cr.top + item.y - toolbarH - 12;
          const fitsBelow = rawBelow + toolbarH <= cr.bottom - pad;
          const top = fitsBelow ? rawBelow : Math.max(cr.top + pad, rawAbove);
          return (
            <div
              className="fixed z-[1100] flex gap-1 bg-gray-900 rounded-full shadow-lg px-2 py-2"
              style={{ top, left: clampedX, transform: 'translateX(-50%)' }}
              onMouseDown={e => e.stopPropagation()}
            >
              <div className="relative group/dup">
                <button
                  onClick={e => { e.stopPropagation(); duplicateItem(selectedCid); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <Plus size={17} className="text-white" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/dup:opacity-100 transition-opacity z-20">
                  Duplicate
                </div>
              </div>
              <div className="relative group/del">
                <button
                  onClick={e => { e.stopPropagation(); removeFromCanvas(selectedCid); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover/del:opacity-100 transition-opacity z-20">
                  Delete
                </div>
              </div>
            </div>
          );
        })()}

        {/* Layer reorder menu popup */}
        {layerMenuState && (
          <div
            ref={layerMenuRef}
            className="fixed z-[60]"
            style={{ top: layerMenuState.rect.top, left: layerMenuState.rect.right + 8 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-44">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-2">Reorder menu</p>
              {[
                { label: 'Move to top',    dir: 'top'    },
                { label: 'Move up',        dir: 'up'     },
                { label: 'Move down',      dir: 'down'   },
                { label: 'Move to bottom', dir: 'bottom' },
              ].map(({ label, dir }) => (
                <button
                  key={dir}
                  onClick={() => moveLayerTo(layerMenuState.cid, dir)}
                  className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Canvas viewport (neutral surround) ── */}
        <div
          className={`flex items-center justify-center overflow-hidden bg-white ${wideLayout ? 'flex-1 p-8' : 'col-span-2 row-start-1 p-4 min-h-[50vh]'}`}
          onClick={() => { setSelectedCid(null); setBgLayerSelected(false); }}
        >
          {/* ── A4 paper canvas ── */}
          <div
            ref={canvasRef}
            className={`relative overflow-hidden rounded-2xl transition-[filter] duration-150 ${isDragOver ? 'brightness-95' : ''}`}
            style={{
              aspectRatio: '210 / 297',
              height: '100%',
              maxWidth: '100%',
              ...bgStyle,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

          {/* Drop target indicator */}
          {isDragOver && (
            <div className="absolute inset-3 border-2 border-dashed border-gray-400 rounded-2xl pointer-events-none flex items-center justify-center">
              <p className="text-sm font-medium text-gray-400 select-none">Drop to place</p>
            </div>
          )}

          {/* Canvas items — absolutely positioned, draggable to reposition */}
          {canvasItems.map((item, idx) => {
            const w = item.w ?? ITEM_SIZE;
            const h = item.h ?? ITEM_SIZE;
            const rot = item.rotation ?? 0;
            const isSelected = selectedCid === item._cid;
            return (
              <div
                key={item._cid}
                style={{
                  left: item.x,
                  top: item.y,
                  width: w,
                  height: h,
                  transform: `rotate(${rot}deg)`,
                  zIndex: draggingCid === item._cid ? 1000 : isSelected ? 500 : (item.zIndex ?? idx + 1),
                }}
                className="absolute group select-none cursor-grab active:cursor-grabbing"
                onMouseDown={e => startItemDrag(e, item._cid)}
                onClick={e => e.stopPropagation()}
              >
                <div
                  className={`w-full h-full overflow-hidden ${isSelected ? 'ring-2 ring-blue-400 rounded-xl' : ''}`}
                  style={item.flipX ? { transform: 'scaleX(-1)' } : undefined}
                >
                  {(() => {
                    const trim = _trimCache.get(item.image) ?? null;
                    // Skip crop-fit for AI-layout items: their box AR comes from LAYOUT_CONFIG scaled
                    // non-uniformly to A4, so it won't match the content AR and the image would stretch.
                    const canCrop = !item._aiLayout && trim && trim.nw && trim.nh &&
                      Math.abs(item.w / item.h - (trim.fw * trim.nw) / (trim.fh * trim.nh)) < 0.05;
                    return canCrop ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        draggable={false}
                        className="pointer-events-none"
                        style={{
                          position: 'absolute',
                          width:  `${100 / trim.fw}%`,
                          height: `${100 / trim.fh}%`,
                          left:   `${-trim.fx / trim.fw * 100}%`,
                          top:    `${-trim.fy / trim.fh * 100}%`,
                        }}
                      />
                    ) : (
                      <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                    );
                  })()}
                </div>
                {/* Selection handles */}
                {isSelected && (
                  <>
                    {/* Rotate handle */}
                    <div
                      style={{ top: -28, left: '50%', transform: 'translateX(-50%)' }}
                      className="absolute w-5 h-5 bg-white border-2 border-blue-400 rounded-full cursor-crosshair shadow z-10"
                      onMouseDown={e => { e.stopPropagation(); startRotateDrag(e, item._cid); }}
                    />
                    {/* Corner resize handles */}
                    <div style={{ top: -4, left: -4 }}    className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-nw-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'nw'); }} />
                    <div style={{ top: -4, right: -4 }}   className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-ne-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'ne'); }} />
                    <div style={{ bottom: -4, left: -4 }}  className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-sw-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'sw'); }} />
                    <div style={{ bottom: -4, right: -4 }} className="absolute w-3 h-3 bg-white border-2 border-blue-400 rounded-sm cursor-se-resize z-10" onMouseDown={e => { e.stopPropagation(); startResizeDrag(e, item._cid, 'se'); }} />
                  </>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* ── Mini wardrobe panel ── */}
        <div className={`flex flex-col flex-shrink-0 bg-white border-gray-100 ${wideLayout ? 'h-auto w-[480px] border-l' : 'col-start-2 row-start-2 h-72 border-t overflow-hidden'}`}>

          {/* Category filter */}
          <div className="relative flex-shrink-0 border-b border-gray-100 px-3 py-2.5" ref={studioFilterRef}>
            <button
              onClick={() => setStudioFilterOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors w-full ${
                studioFilter.size > 0
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={11} />
              Filter{studioFilter.size > 0 ? ` · ${studioFilter.size}` : ''}
            </button>
            {studioFilterOpen && (
              <div className="absolute left-3 right-3 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 max-h-48 overflow-y-auto scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setStudioFilter(prev => { const next = new Set(prev); next.has(cat) ? next.delete(cat) : next.add(cat); return next; })}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className={studioFilter.has(cat) ? 'text-gray-900 font-medium' : 'text-gray-600'}>{cat}</span>
                    {studioFilter.has(cat) && <Check size={13} strokeWidth={2.5} className="text-gray-900 flex-shrink-0" />}
                  </button>
                ))}
                {studioFilter.size > 0 && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setStudioFilter(new Set()); setStudioFilterOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Board filter — collapsible */}
          <div className="flex-shrink-0 border-b border-gray-100">
            <button
              onClick={() => setBoardsOpen(o => !o)}
              className="flex items-center justify-between w-full px-4 py-3 text-left"
            >
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Board</p>
                <p className="text-sm font-medium text-gray-800">{activeFilter}</p>
              </div>
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${boardsOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {boardsOpen && (
              <div className="border-t border-gray-100 py-1">
                {boards.map(board => {
                  const active = activeFilter === board;
                  return (
                    <button
                      key={board}
                      onClick={() => setActiveFilter(board)}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors ${
                        active ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {board}
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item)}
                  onClick={() => addToCanvas(item)}
                  className="aspect-square rounded-xl overflow-hidden bg-[#f0f0f0] bg-[repeating-conic-gradient(#e0e0e0_0%_25%,#f0f0f0_0%_50%)] [background-size:12px_12px] hover:opacity-75 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
                >
                  <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OutfitCard
   ───────────────────────────────────────────────────────────────────────────── */
async function saveCollageAsPng(outfit) {
  const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679, name } = outfit;
  const SCALE = 2;
  const W = canvasWidth * SCALE;
  const H = canvasHeight * SCALE;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  if (bgColor !== '#FFFFFF') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
  }

  const sorted = [...items].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const bitmaps = await Promise.all(
    sorted.map(async item => {
      try {
        const res = await fetch(item.image);
        if (!res.ok) return null;
        return createImageBitmap(await res.blob());
      } catch { return null; }
    })
  );

  sorted.forEach((item, idx) => {
    const bitmap = bitmaps[idx];
    if (!bitmap) return;
    const x   = (item.x   ?? 0)   * SCALE;
    const y   = (item.y   ?? 0)   * SCALE;
    const w   = (item.w   ?? 128) * SCALE;
    const h   = (item.h   ?? 128) * SCALE;
    const rot = (item.rotation ?? 0) * Math.PI / 180;
    const imgAspect = bitmap.width / bitmap.height;
    const boxAspect = w / h;
    let drawW, drawH, offX = 0, offY = 0;
    if (imgAspect > boxAspect) {
      drawW = w; drawH = w / imgAspect; offY = (h - drawH) / 2;
    } else {
      drawH = h; drawW = h * imgAspect; offX = (w - drawW) / 2;
    }
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    if (item.flipX) ctx.scale(-1, 1);
    ctx.drawImage(bitmap, -w / 2 + offX, -h / 2 + offY, drawW, drawH);
    ctx.restore();
    bitmap.close();
  });

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'outfit'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function OutfitOrganizeCard({ outfit, draggedId, selected, onSelect, onDragStart, onDragHover, onDragEnd }) {
  const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
  const bgStyle = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };
  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragOver={e => {
        e.preventDefault();
        if (draggedId === outfit.id) return;
        onDragHover(outfit.id);
      }}
      onDrop={e => e.preventDefault()}
      onDragEnd={onDragEnd}
      style={{ aspectRatio: '210 / 297', ...bgStyle }}
      className={`relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        draggedId === outfit.id ? 'opacity-40' : ''
      } ${selected ? 'ring-[3px] ring-gray-900' : ''}`}
    >
      {outfit.thumbnail ? (
        <img src={outfit.thumbnail} alt={outfit.name || 'Outfit'} className="w-full h-full object-cover pointer-events-none" />
      ) : items.map((item, idx) => {
        const w = item.w ?? 128;
        const h = item.h ?? 128;
        const rot = item.rotation ?? 0;
        return (
          <div
            key={item._cid ?? idx}
            style={{
              position: 'absolute',
              left: `${(item.x / canvasWidth) * 100}%`,
              top: `${(item.y / canvasHeight) * 100}%`,
              width: `${(w / canvasWidth) * 100}%`,
              height: `${(h / canvasHeight) * 100}%`,
              transform: item.flipX ? `rotate(${rot}deg) scaleX(-1)` : `rotate(${rot}deg)`,
              zIndex: item.zIndex ?? idx + 1,
            }}
          >
            <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
          </div>
        );
      })}
      {selected && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
    </div>
  );
}

function OutfitCard({
  outfit, onDelete, onEdit, onDuplicate, isDraft, liked, outfitBoards, organizeMode, dragging,
  onToggleLike, onToggleBoard, onDragStart, onDragOver, onDragEnd, isPreview = false,
}) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const loadedCountRef = useRef(0);
  const dotsRef      = useRef(null);
  const dropdownRef  = useRef(null);
  const boardBtnRef  = useRef(null);
  const boardDropRef = useRef(null);
  const { items = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
  const bgStyle = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };

  const handleItemImgLoad = () => {
    loadedCountRef.current++;
    if (loadedCountRef.current >= items.length) setImgLoaded(true);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => {
      if (!dotsRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!boardMenuOpen) { setBoardSearch(''); return; }
    const handler = e => {
      if (!boardBtnRef.current?.contains(e.target) && !boardDropRef.current?.contains(e.target)) setBoardMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [boardMenuOpen]);

  return (
    <div
      className={`group relative cursor-pointer ${organizeMode ? 'cursor-grab active:cursor-grabbing' : ''} ${dragging ? 'opacity-40' : ''}`}
      style={{ aspectRatio: '210 / 297' }}
      draggable={organizeMode}
      onDragStart={organizeMode ? onDragStart : undefined}
      onDragOver={organizeMode ? onDragOver : undefined}
      onDragEnd={organizeMode ? onDragEnd : undefined}
      onMouseLeave={() => { if (!boardMenuOpen) setBoardMenuOpen(false); }}
    >
      {/* Background + items */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={bgStyle}>
        {items.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <Wand2 size={20} className="text-gray-300" />
          </div>
        ) : items.map((item, idx) => {
          const w = item.w ?? 128;
          const h = item.h ?? 128;
          const rot = item.rotation ?? 0;
          return (
            <div
              key={item._cid ?? idx}
              style={{
                position: 'absolute',
                left:   `${(item.x / canvasWidth) * 100}%`,
                top:    `${(item.y / canvasHeight) * 100}%`,
                width:  `${(w / canvasWidth) * 100}%`,
                height: `${(h / canvasHeight) * 100}%`,
                transform: item.flipX ? `rotate(${rot}deg) scaleX(-1)` : `rotate(${rot}deg)`,
                zIndex: item.zIndex ?? idx + 1,
              }}
            >
              <img src={item.image} alt={item.name} draggable={false} onLoad={handleItemImgLoad} className="w-full h-full object-contain pointer-events-none" />
            </div>
          );
        })}
        {/* Skeleton overlay — fades out once all images load */}
        {items.length > 0 && (
          <div className={`absolute inset-0 bg-gray-200 z-20 transition-opacity duration-500 ${imgLoaded ? 'opacity-0 pointer-events-none' : 'animate-pulse'}`} />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none z-10" />
      </div>

      {/* Heart — top right, shown on hover or when liked */}
      {!organizeMode && (
        <button
          onClick={e => { e.stopPropagation(); onToggleLike?.(); }}
          className={`absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all ${liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <Heart size={13} strokeWidth={2} className={liked ? 'fill-rose-500 text-rose-500' : 'text-gray-600'} />
        </button>
      )}

      {/* Board dropdown — positioned relative to card, above action bar */}
      {boardMenuOpen && (
        <div ref={boardDropRef} className="absolute bottom-12 right-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-52 z-30">
          <p className="px-3 pt-1 pb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Move to Board</p>
          <div className="px-2 pb-1.5">
            <input
              autoFocus
              value={boardSearch}
              onChange={e => setBoardSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Search boards…"
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-400"
            />
          </div>
          {(() => {
            const visible = (outfitBoards ?? []).filter(b => b !== 'All' && b.toLowerCase().includes(boardSearch.toLowerCase()));
            if (visible.length === 0) return <p className="px-3 py-2 text-xs text-gray-400">{boardSearch ? 'No matches' : 'No boards yet'}</p>;
            return (
              <div className="overflow-y-auto max-h-[96px]">
                {visible.map(board => {
                  const inBoard = (outfit.boards ?? []).includes(board);
                  return (
                    <button
                      key={board}
                      onClick={e => { e.stopPropagation(); onToggleBoard?.(board); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="truncate">{board}</span>
                      {inBoard && <Check size={13} strokeWidth={2.5} className="text-gray-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Bottom action buttons */}
      {!organizeMode && (
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
          {/* Board assignment */}
          <div ref={boardBtnRef}>
            <button
              onClick={e => { e.stopPropagation(); setBoardMenuOpen(o => !o); }}
              className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <Layers size={13} className="text-gray-700" />
            </button>
          </div>

          {/* Edit */}
          <button
            onClick={e => { e.stopPropagation(); onEdit?.(); }}
            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <Pencil size={13} className="text-gray-700" />
          </button>

          {/* More (⋯) */}
          <div ref={dotsRef} className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
              className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={16} className="text-gray-700" />
            </button>
            {menuOpen && (
              <div ref={dropdownRef} className="absolute bottom-full right-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 p-1 w-40 z-20 overflow-hidden">
                <button
                  onClick={async e => { e.stopPropagation(); setMenuOpen(false); setSaving(true); try { await saveCollageAsPng(outfit); } finally { setSaving(false); } }}
                  disabled={saving}
                  className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save to device'}
                </button>
                {!isPreview && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onDuplicate?.(); }}
                    className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Duplicate
                  </button>
                )}
                {!isPreview && (
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete?.(); }}
                    className="w-full text-center px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StudioTab({
  savedOutfits, draftOutfits, onSaveOutfit, onSaveDraftOutfit,
  onUpdateSavedOutfit, onUpdateDraftOutfit, onRemoveDraftOutfit, onRemoveSavedOutfit,
  pendingOutfitItem, pendingTargetCollage, onClearPendingOutfit,
  pendingAiCollage, onClearPendingAiCollage, items, boards,
  outfitBoards, outfitBoardMeta, likedOutfits,
  onCreateOutfitBoard, onDeleteOutfitBoard, onEditOutfitBoard, onToggleOutfitBoard, onToggleOutfitLike,
  isPreview = false, previewCollages = [],
}) {
  const [showCreate, setShowCreate]               = useState(false);
  const [createSeed, setCreateSeed]               = useState(null);
  const [initialCanvasItems, setInitialCanvasItems] = useState(null);
  const [initialBgColor, setInitialBgColor]       = useState(null);
  const [initialDesignWidth,  setInitialDesignWidth]  = useState(null);
  const [initialDesignHeight, setInitialDesignHeight] = useState(null);
  const [editingCollage, setEditingCollage]       = useState(null);

  // Board / favorites / organize state
  const [activeOutfitFilter,  setActiveOutfitFilter]  = useState('All');
  const [outfitFavoritesOnly, setOutfitFavoritesOnly] = useState(false);
  const [newBoardOpen,   setNewBoardOpen]   = useState(false);
  const [newBoardName,   setNewBoardName]   = useState('');
  const [newBoardDesc,   setNewBoardDesc]   = useState('');
  const [editBoard,      setEditBoard]      = useState(null);
  const [editName,       setEditName]       = useState('');
  const [editDesc,       setEditDesc]       = useState('');
  const [deleteConfirmBoard, setDeleteConfirmBoard] = useState(null);
  const [boardMenuOpen,  setBoardMenuOpen]  = useState(false);
  const [addMenuOpen,    setAddMenuOpen]    = useState(false);
  const [organizeMode,   setOrganizeMode]   = useState(false);
  const [organizedList,  setOrganizedList]  = useState([]);
  const [draggedId,      setDraggedId]      = useState(null);
  const [selectedOutfitIds, setSelectedOutfitIds] = useState(new Set());
  const [showDeleteOrganizeConfirm, setShowDeleteOrganizeConfirm] = useState(false);
  const [organizeBoardPickerOpen, setOrganizeBoardPickerOpen] = useState(false);
  const [pendingOrganizeAdd, setPendingOrganizeAdd] = useState(null);
  const boardMenuRef           = useRef(null);
  const addMenuRef             = useRef(null);
  const organizeBoardPickerRef = useRef(null);
  const [addToBoardMode, setAddToBoardMode] = useState(false);
  const [addToBoardSelectedIds, setAddToBoardSelectedIds] = useState(new Set());

  useEffect(() => {
    if (!pendingOutfitItem) return;
    setCreateSeed(pendingOutfitItem);
    if (pendingTargetCollage) {
      const list = pendingTargetCollage.type === 'saved' ? savedOutfits : draftOutfits;
      const outfit = list.find(o => o.id === pendingTargetCollage.id);
      setInitialCanvasItems(outfit?.items || []);
      setInitialBgColor(outfit?.bgColor ?? null);
      setInitialDesignWidth(outfit?.canvasWidth ?? null);
      setInitialDesignHeight(outfit?.canvasHeight ?? null);
      setEditingCollage(pendingTargetCollage);
    } else {
      setInitialCanvasItems(null);
      setInitialBgColor(null);
      setInitialDesignWidth(null);
      setInitialDesignHeight(null);
      setEditingCollage(null);
    }
    setShowCreate(true);
    onClearPendingOutfit();
  }, [pendingOutfitItem]);

  useEffect(() => {
    if (!pendingAiCollage) return;
    setCreateSeed(null);
    setInitialCanvasItems(pendingAiCollage.items);
    setInitialBgColor(pendingAiCollage.bgColor ?? '#FFFFFF');
    setInitialDesignWidth(pendingAiCollage.canvasWidth ?? null);
    setInitialDesignHeight(pendingAiCollage.canvasHeight ?? null);
    setEditingCollage(null);
    setShowCreate(true);
    onClearPendingAiCollage();
  }, [pendingAiCollage]);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = e => { if (!addMenuRef.current?.contains(e.target)) setAddMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  useEffect(() => {
    if (!organizeBoardPickerOpen) return;
    const handler = e => { if (!organizeBoardPickerRef.current?.contains(e.target)) setOrganizeBoardPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [organizeBoardPickerOpen]);

  const draftIds = new Set(draftOutfits.map(o => o.id));

  const applyFilters = list => {
    let l = list;
    if (activeOutfitFilter !== 'All') l = l.filter(o => (o.boards ?? []).includes(activeOutfitFilter));
    if (outfitFavoritesOnly) l = l.filter(o => likedOutfits.has(o.id));
    return l;
  };

  const filteredDrafts = applyFilters(draftOutfits);
  const filteredSaved  = applyFilters(isPreview ? previewCollages : savedOutfits);

  const openCollageForEditing = (outfit, type) => {
    setCreateSeed(null);
    setInitialCanvasItems(outfit.items || []);
    setInitialBgColor(outfit.bgColor ?? null);
    setInitialDesignWidth(outfit.canvasWidth ?? null);
    setInitialDesignHeight(outfit.canvasHeight ?? null);
    setEditingCollage({ id: outfit.id, type });
    setShowCreate(true);
  };

  const enterOrganize = () => {
    setOrganizedList([...filteredDrafts, ...filteredSaved]);
    setSelectedOutfitIds(new Set());
    setOrganizeMode(true);
  };

  const exitOrganize = () => {
    setOrganizeMode(false);
    setOrganizedList([]);
    setSelectedOutfitIds(new Set());
    setDraggedId(null);
  };

  const toggleSelectOutfit = id => {
    setSelectedOutfitIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const enterAddToBoard = () => {
    setAddToBoardSelectedIds(new Set());
    setAddToBoardMode(true);
  };

  const exitAddToBoard = () => {
    setAddToBoardMode(false);
    setAddToBoardSelectedIds(new Set());
  };

  const confirmAddToBoard = () => {
    addToBoardSelectedIds.forEach(id => onToggleOutfitBoard(id, activeOutfitFilter));
    setAddToBoardMode(false);
    setAddToBoardSelectedIds(new Set());
  };

  const toggleAddBoardOutfit = id => {
    setAddToBoardSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOrganizeDragHover = targetId => {
    if (!draggedId || targetId === draggedId) return;
    setOrganizedList(prev => {
      const from = prev.findIndex(o => o.id === draggedId);
      const to   = prev.findIndex(o => o.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Tab header ── */}
        <div className="px-5 md:px-7 pt-5 pb-0 flex-shrink-0">
          {/* Row 1: page title + add */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Style Studio</h1>
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setAddMenuOpen(o => !o)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Plus size={17} strokeWidth={2.5} className="text-white" />
              </button>
              {addMenuOpen && (
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-36 z-20">
                  <button
                    onClick={() => { setAddMenuOpen(false); setShowCreate(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Outfit
                  </button>
                  <button
                    onClick={() => { setAddMenuOpen(false); setNewBoardName(''); setNewBoardDesc(''); setNewBoardOpen(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Board
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Row 2: board title + organize/settings */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-3xl font-semibold text-gray-900 truncate max-w-[20ch]">{activeOutfitFilter}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeOutfitFilter !== 'All' && (
                <div className="relative" ref={boardMenuRef}>
                  <button
                    onClick={() => setBoardMenuOpen(o => !o)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 text-xl leading-none"
                  >
                    ···
                  </button>
                  {boardMenuOpen && (
                    <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40 z-20">
                      <button
                        onClick={() => {
                          setBoardMenuOpen(false);
                          setEditBoard(activeOutfitFilter);
                          setEditName(activeOutfitFilter);
                          setEditDesc(outfitBoardMeta?.[activeOutfitFilter]?.description ?? '');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Edit board
                      </button>
                      <button
                        onClick={() => { setBoardMenuOpen(false); enterAddToBoard(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Add to board
                      </button>
                      <button
                        onClick={() => { setBoardMenuOpen(false); setDeleteConfirmBoard(activeOutfitFilter); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                      >
                        Delete board
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={enterOrganize}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full transition-colors text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Brush size={14} strokeWidth={2} />
                Organize
              </button>
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm text-gray-400 mt-0.5">{filteredDrafts.length + filteredSaved.length} outfit{filteredDrafts.length + filteredSaved.length !== 1 ? 's' : ''}</p>
            <div className="min-h-[1.25rem] mt-0.5">
              {activeOutfitFilter !== 'All' && outfitBoardMeta?.[activeOutfitFilter]?.description && (
                <p className="text-sm text-gray-400 italic pl-3">{outfitBoardMeta[activeOutfitFilter].description}</p>
              )}
            </div>
          </div>

          {/* Board filter chips */}
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
            {(outfitBoards ?? ['All']).map(board => {
              const active = activeOutfitFilter === board;
              return (
                <button
                  key={board}
                  onClick={() => setActiveOutfitFilter(board)}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-base font-medium transition-colors pb-0.5 ${
                    active ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-700 border-b-2 border-transparent'
                  }`}
                >
                  {board}
                </button>
              );
            })}
          </div>

          {/* Favorites toggle */}
          <div className="pb-3">
            <button
              onClick={() => setOutfitFavoritesOnly(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                outfitFavoritesOnly ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Heart size={13} className={outfitFavoritesOnly ? 'fill-rose-500' : ''} />
              Favorites
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pb-28 md:pb-8">
          {filteredDrafts.length === 0 && filteredSaved.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Wand2 size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-800">No outfits yet</p>
              <p className="text-sm text-gray-400 mt-1">Tap + to create your first collage</p>
            </div>
          ) : (
            <>
              {filteredDrafts.length > 0 && (
                <div className="mb-6">
                  <p className="text-xl font-semibold text-gray-800 mb-3">Drafts ({filteredDrafts.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredDrafts.map(outfit => (
                      <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        isDraft={true}
                        isPreview={isPreview}
                        liked={likedOutfits.has(outfit.id)}
                        outfitBoards={outfitBoards ?? ['All']}
                        onEdit={() => openCollageForEditing(outfit, 'drafts')}
                        onDelete={() => onRemoveDraftOutfit(outfit.id)}
                        onDuplicate={() => {
                          const copy = { items: outfit.items, bgColor: outfit.bgColor, canvasWidth: outfit.canvasWidth, canvasHeight: outfit.canvasHeight, name: outfit.name ? `${outfit.name} (copy)` : '', thumbnail: outfit.thumbnail || '' };
                          onSaveDraftOutfit(copy);
                        }}
                        onToggleLike={() => onToggleOutfitLike(outfit.id)}
                        onToggleBoard={board => onToggleOutfitBoard(outfit.id, board)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {filteredSaved.length > 0 && (
                <div>
                  <p className="text-xl font-semibold text-gray-800 mb-3">Published ({filteredSaved.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredSaved.map(outfit => (
                      <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        isDraft={false}
                        isPreview={isPreview}
                        liked={likedOutfits.has(outfit.id)}
                        outfitBoards={outfitBoards ?? ['All']}
                        onEdit={() => openCollageForEditing(outfit, 'saved')}
                        onDelete={() => onRemoveSavedOutfit?.(outfit.id)}
                        onDuplicate={() => {
                          const copy = { items: outfit.items, bgColor: outfit.bgColor, canvasWidth: outfit.canvasWidth, canvasHeight: outfit.canvasHeight, name: outfit.name ? `${outfit.name} (copy)` : '', thumbnail: outfit.thumbnail || '' };
                          onSaveOutfit(copy);
                        }}
                        onToggleLike={() => onToggleOutfitLike(outfit.id)}
                        onToggleBoard={board => onToggleOutfitBoard(outfit.id, board)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Organize mode full-screen overlay ── */}
      {organizeMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">

          {/* Header */}
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Organize Outfits</h2>
            <button
              onClick={() => {
                const allSelected = selectedOutfitIds.size > 0;
                setSelectedOutfitIds(allSelected ? new Set() : new Set(organizedList.map(o => o.id)));
              }}
              className="absolute left-5 md:left-7 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              {selectedOutfitIds.size > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={exitOrganize}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Outfit grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {organizedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Wand2 size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No outfits here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {organizedList.map(outfit => (
                  <OutfitOrganizeCard
                    key={outfit.id}
                    outfit={outfit}
                    draggedId={draggedId}
                    selected={selectedOutfitIds.has(outfit.id)}
                    onSelect={() => toggleSelectOutfit(outfit.id)}
                    onDragStart={() => setDraggedId(outfit.id)}
                    onDragHover={handleOrganizeDragHover}
                    onDragEnd={() => setDraggedId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Floating action bar */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none z-10">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {selectedOutfitIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{selectedOutfitIds.size} selected</span>
              )}
              {/* Move to board */}
              <div className="relative" ref={organizeBoardPickerRef}>
                <div className="relative group">
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                    selectedOutfitIds.size > 0 && !organizeBoardPickerOpen ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                  }`}>
                    <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">Move to board</span>
                  </div>
                  <button
                    disabled={selectedOutfitIds.size === 0}
                    onClick={() => setOrganizeBoardPickerOpen(o => !o)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      selectedOutfitIds.size > 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Layers size={18} />
                  </button>
                </div>
                {organizeBoardPickerOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48 z-10">
                    {(outfitBoards ?? []).filter(b => b !== 'All').length === 0 && (
                      <p className="px-4 py-2.5 text-xs text-gray-400">No boards yet</p>
                    )}
                    {(outfitBoards ?? []).filter(b => b !== 'All').map(board => {
                      const selectedArr = organizedList.filter(o => selectedOutfitIds.has(o.id));
                      const allInBoard = selectedArr.length > 0 && selectedArr.every(o => (o.boards ?? []).includes(board));
                      return (
                        <button
                          key={board}
                          onClick={() => {
                            const toAdd = organizedList.filter(o =>
                              selectedOutfitIds.has(o.id) && !(o.boards ?? []).includes(board)
                            );
                            toAdd.forEach(o => onToggleOutfitBoard(o.id, board));
                            if (toAdd.length > 0) {
                              setOrganizedList(prev => prev.map(o =>
                                toAdd.some(t => t.id === o.id)
                                  ? { ...o, boards: [...(o.boards ?? []), board] }
                                  : o
                              ));
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {board}
                          {allInBoard && <Check size={13} strokeWidth={2.5} className="text-gray-500" />}
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setPendingOrganizeAdd(new Set(selectedOutfitIds));
                          setOrganizeBoardPickerOpen(false);
                          setNewBoardName('');
                          setNewBoardDesc('');
                          setNewBoardOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        New board…
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Delete */}
              <div className="relative group">
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity pointer-events-none ${
                  selectedOutfitIds.size > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                }`}>
                  <span className="text-xs font-semibold text-white bg-gray-800 rounded-lg px-2.5 py-1 whitespace-nowrap">{activeOutfitFilter === 'All' ? 'Delete' : 'Remove'}</span>
                </div>
                <button
                  disabled={selectedOutfitIds.size === 0}
                  onClick={() => setShowDeleteOrganizeConfirm(true)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedOutfitIds.size > 0
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Delete selected confirmation */}
          {showDeleteOrganizeConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteOrganizeConfirm(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {activeOutfitFilter === 'All'
                    ? `Delete ${selectedOutfitIds.size} outfit${selectedOutfitIds.size !== 1 ? 's' : ''}?`
                    : `Remove ${selectedOutfitIds.size} outfit${selectedOutfitIds.size !== 1 ? 's' : ''} from board?`}
                </h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  {activeOutfitFilter === 'All'
                    ? `${selectedOutfitIds.size === 1 ? 'This outfit' : 'These outfits'} will be permanently removed.`
                    : `${selectedOutfitIds.size === 1 ? 'This outfit' : 'These outfits'} will be removed from "${activeOutfitFilter}" but kept in your studio.`}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const toDelete = new Set(selectedOutfitIds);
                      if (activeOutfitFilter === 'All') {
                        toDelete.forEach(id => {
                          if (draftIds.has(id)) onRemoveDraftOutfit(id);
                          else onRemoveSavedOutfit?.(id);
                        });
                      } else {
                        toDelete.forEach(id => onToggleOutfitBoard(id, activeOutfitFilter));
                      }
                      setOrganizedList(prev => prev.filter(o => !toDelete.has(o.id)));
                      setSelectedOutfitIds(new Set());
                      setShowDeleteOrganizeConfirm(false);
                    }}
                    className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
                  >{activeOutfitFilter === 'All' ? 'Delete' : 'Remove'}</button>
                  <button
                    onClick={() => setShowDeleteOrganizeConfirm(false)}
                    className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                  >Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add to board full-screen overlay (Studio) ── */}
      {addToBoardMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="relative flex items-center justify-center px-5 md:px-7 pt-14 md:pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Add to {activeOutfitFilter}</h2>
            <button
              onClick={exitAddToBoard}
              className="absolute right-5 md:right-7 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* All saved outfits grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 md:px-7 pt-4 pb-36">
            {savedOutfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Wand2 size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No published outfits yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {savedOutfits.map(outfit => {
                  const alreadyInBoard = (outfit.boards ?? []).includes(activeOutfitFilter);
                  const isSelected = addToBoardSelectedIds.has(outfit.id);
                  const { items: oItems = [], bgColor = '#FFFFFF', canvasWidth = 480, canvasHeight = 679 } = outfit;
                  const bgStyle = bgColor === '#FFFFFF' ? { backgroundColor: '#F3F5F4' } : { backgroundColor: bgColor };
                  return (
                    <div
                      key={outfit.id}
                      onClick={alreadyInBoard ? undefined : () => toggleAddBoardOutfit(outfit.id)}
                      style={{ aspectRatio: '210 / 297', ...bgStyle }}
                      className={`relative rounded-2xl overflow-hidden transition-all duration-150 select-none ${
                        alreadyInBoard ? 'cursor-default' : 'cursor-pointer'
                      } ${isSelected && !alreadyInBoard ? 'ring-[3px] ring-gray-900' : ''} ${
                        alreadyInBoard ? 'ring-[3px] ring-emerald-400' : ''
                      }`}
                    >
                      {outfit.thumbnail ? (
                        <img src={outfit.thumbnail} alt={outfit.name || 'Outfit'} className="w-full h-full object-cover pointer-events-none" />
                      ) : oItems.map((item, idx) => {
                        const w = item.w ?? 128;
                        const h = item.h ?? 128;
                        const rot = item.rotation ?? 0;
                        return (
                          <div
                            key={item._cid ?? idx}
                            style={{
                              position: 'absolute',
                              left: `${(item.x / canvasWidth) * 100}%`,
                              top: `${(item.y / canvasHeight) * 100}%`,
                              width: `${(w / canvasWidth) * 100}%`,
                              height: `${(h / canvasHeight) * 100}%`,
                              transform: item.flipX ? `rotate(${rot}deg) scaleX(-1)` : `rotate(${rot}deg)`,
                              zIndex: item.zIndex ?? idx + 1,
                            }}
                          >
                            <img src={item.image} alt={item.name} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                          </div>
                        );
                      })}
                      {isSelected && !alreadyInBoard && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
                      {alreadyInBoard && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
                          <Check size={20} strokeWidth={2.5} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating action bar */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-3 flex items-center gap-3">
              {addToBoardSelectedIds.size > 0 && (
                <span className="text-sm text-gray-500 tabular-nums">{addToBoardSelectedIds.size} selected</span>
              )}
              <button
                onClick={confirmAddToBoard}
                disabled={addToBoardSelectedIds.size === 0}
                className={`h-12 px-5 rounded-2xl flex items-center gap-2 font-medium text-sm transition-colors ${
                  addToBoardSelectedIds.size > 0
                    ? 'bg-gray-900 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Plus size={16} />
                Add to board
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateOutfitModal
          initialItem={createSeed}
          initialCanvasItems={initialCanvasItems}
          initialBgColor={initialBgColor}
          initialDesignWidth={initialDesignWidth}
          initialDesignHeight={initialDesignHeight}
          onClose={() => { setShowCreate(false); setCreateSeed(null); setInitialCanvasItems(null); setInitialBgColor(null); setInitialDesignWidth(null); setInitialDesignHeight(null); setEditingCollage(null); }}
          onPublish={collage => {
            if (editingCollage?.type === 'saved') {
              onUpdateSavedOutfit(editingCollage.id, collage);
            } else {
              if (editingCollage?.type === 'drafts') onRemoveDraftOutfit(editingCollage.id);
              onSaveOutfit(collage);
            }
          }}
          onAutoSave={collage => {
            if (editingCollage?.type === 'saved') {
              onUpdateSavedOutfit(editingCollage.id, collage);
            } else if (editingCollage?.type === 'drafts') {
              onUpdateDraftOutfit(editingCollage.id, collage);
            } else if (collage.items.length > 0) {
              onSaveDraftOutfit(collage);
            }
          }}
          onDelete={() => {
            if (editingCollage?.type === 'saved') onRemoveSavedOutfit?.(editingCollage.id);
            else if (editingCollage?.type === 'drafts') onRemoveDraftOutfit(editingCollage.id);
          }}
          onDetachCollage={() => setEditingCollage(null)}
          items={items}
          boards={boards}
        />
      )}

      {/* ── New board modal ── */}
      {newBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNewBoardOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold text-gray-900 mb-4">New Board</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Name <span className="text-red-400">*</span></label>
                <input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} maxLength={20}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name" autoFocus />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span></label>
                <textarea value={newBoardDesc} onChange={e => setNewBoardDesc(e.target.value)} maxLength={150} rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                disabled={!newBoardName.trim() || (outfitBoards ?? []).includes(newBoardName.trim())}
                onClick={() => {
                  const n = newBoardName.trim();
                  onCreateOutfitBoard(n, newBoardDesc.trim());
                  if (pendingOrganizeAdd) {
                    organizedList.forEach(outfit => {
                      if (pendingOrganizeAdd.has(outfit.id)) onToggleOutfitBoard(outfit.id, n);
                    });
                    setPendingOrganizeAdd(null);
                  }
                  setActiveOutfitFilter(n);
                  setNewBoardOpen(false);
                }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >Create</button>
              <button onClick={() => { setPendingOrganizeAdd(null); setNewBoardOpen(false); }} className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit board modal ── */}
      {editBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Board</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Name <span className="text-red-400">*</span></label>
                <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={20} autoFocus
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Board name" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Description <span className="text-gray-300 normal-case font-normal tracking-normal">optional</span></label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} maxLength={150} rows={3}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
                  placeholder="Add a description…" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                disabled={!editName.trim()}
                onClick={() => { const n = editName.trim(); onEditOutfitBoard(editBoard, n, editDesc.trim()); if (activeOutfitFilter === editBoard) setActiveOutfitFilter(n); setEditBoard(null); }}
                className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >Save</button>
              <button onClick={() => setEditBoard(null)} className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete board confirmation ── */}
      {deleteConfirmBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmBoard(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete "{deleteConfirmBoard}"?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">This board will be permanently removed. Outfits inside won't be deleted.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { onDeleteOutfitBoard(deleteConfirmBoard); if (activeOutfitFilter === deleteConfirmBoard) setActiveOutfitFilter('All'); setDeleteConfirmBoard(null); }}
                className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 transition-colors"
              >Delete Board</button>
              <button onClick={() => setDeleteConfirmBoard(null)} className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StylistTab() {
  const prompts = [
    'What should I wear to a rooftop dinner?',
    'Build a capsule wardrobe from my basics',
    "What's trending for autumn?",
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 md:px-10 pt-8 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI Stylist</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your personal style advisor</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 md:px-10">
        {/* AI greeting bubble */}
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={14} className="text-emerald-500" />
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
            <p className="text-sm text-gray-700 leading-relaxed">
              Hi! I've reviewed your wardrobe. Ask me anything about your style.
            </p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="ml-11 space-y-2 mb-6">
          {prompts.map((p, i) => (
            <button
              key={i}
              className="block text-left w-full px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="px-6 md:px-10 pb-28 md:pb-8 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-2xl">
          <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles size={12} className="text-emerald-500" />
          </div>
          <p className="text-sm text-gray-400 flex-1 text-left">Ask your stylist anything…</p>
          <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
            <ChevronRight size={13} strokeWidth={2.5} className="text-white" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-[0.18em]">
          Coming Soon
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AddItemModal
   ───────────────────────────────────────────────────────────────────────────── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Returns true if the image has a meaningfully transparent background already removed —
// requires >5% of pixels at alpha < 128 to avoid false-positives from edge anti-aliasing
// or device-frame corner artifacts on screenshots saved as PNG.
async function hasTransparency(file) {
  if (!file.type.includes('png') && !file.type.includes('webp')) return false;
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const total = data.length / 4;
      let transparent = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 128) transparent++;
      }
      resolve(transparent / total > 0.05);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });
}

async function convertToPng(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

const MAX_IMAGE_PX = 600;
async function resizeImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const longest = Math.max(img.naturalWidth, img.naturalHeight);
      if (longest <= MAX_IMAGE_PX) { resolve(file); return; }
      const scale = MAX_IMAGE_PX / longest;
      const w = Math.round(img.naturalWidth  * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function trimTransparentPixels(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const src = document.createElement('canvas');
      src.width = w; src.height = h;
      const ctx = src.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, w, h);
      // Sum alpha per column and per row; a column/row only counts as content
      // if its total alpha exceeds a meaningful threshold. This ignores isolated
      // ghost pixels (alpha 5–30) left by background-removal models while still
      // capturing genuine semi-transparent clothing edges.
      const COL_THRESHOLD = Math.max(255, h * 0.5);   // at least ~half a fully-opaque pixel per col
      const ROW_THRESHOLD = Math.max(255, w * 0.5);
      const colSum = new Float32Array(w);
      const rowSum = new Float32Array(h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = data[(y * w + x) * 4 + 3];
          colSum[x] += a;
          rowSum[y] += a;
        }
      }
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let x = 0; x < w; x++) { if (colSum[x] >= COL_THRESHOLD) { if (x < x0) x0 = x; if (x > x1) x1 = x; } }
      for (let y = 0; y < h; y++) { if (rowSum[y] >= ROW_THRESHOLD) { if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      // No visible content — return original unchanged
      if (x1 < 0) { resolve(file); return; }
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
      // Add symmetric padding so the subject has breathing room and any minor
      // asymmetry from the bg-removal model is absorbed. Place the trimmed
      // content on a new canvas rather than cropping directly to the bounding box.
      const PAD = Math.max(8, Math.round(Math.min(cw, ch) * 0.04));
      const dst = document.createElement('canvas');
      dst.width = cw + PAD * 2; dst.height = ch + PAD * 2;
      dst.getContext('2d').drawImage(src, x0, y0, cw, ch, PAD, PAD, cw, ch);
      dst.toBlob(blob => {
        resolve(new File([blob], file.name || 'trimmed.png', { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function enrichItem({ imageUrl, imageFile, name, brand, category, material, color }) {
  const body = imageFile
    ? { imageBase64: await fileToBase64(imageFile), mediaType: imageFile.type, name, brand, category, material, color }
    : { imageUrl, name, brand, category, material, color };
  const res = await fetch('/api/enrich-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Enrichment failed');
  return res.json();
}

function AddMethodModal({ onClose, onImageSelected }) {
  const fileInputRef = useRef(null);

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kick off bg removal in the background — don't block the UI
    const bgPromise = (async () => {
      // Skip the worker entirely if the image already has transparency
      if (await hasTransparency(file)) {
        return await trimTransparentPixels(await resizeImage(file));
      }

      const buffer = await file.arrayBuffer();
      try {
        const resultBlob = await new Promise((resolve, reject) => {
          const worker = new Worker(
            new URL('./bgRemovalWorker.js', import.meta.url),
            { type: 'module' },
          );
          worker.onmessage = ({ data }) => {
            worker.terminate();
            if (data.ok) resolve(new Blob([data.buffer], { type: 'image/png' }));
            else reject(new Error(data.message));
          };
          worker.onerror = (err) => { worker.terminate(); reject(err); };
          worker.postMessage({ buffer, name: file.name, type: file.type }, [buffer]);
        });
        const processedFile = new File([resultBlob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
        return await trimTransparentPixels(await resizeImage(processedFile));
      } catch {
        const converted = await convertToPng(file);
        return await trimTransparentPixels(await resizeImage(converted));
      }
    })();

    // Open the form immediately with the raw file; bgPromise resolves the final image
    onImageSelected(file, bgPromise);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative w-full md:w-[360px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl modal-animate">
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={14} strokeWidth={2.5} className="text-gray-500" />
        </button>

        <div className="px-6 pt-6 pb-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Add item</p>
        </div>

        <div className="px-3 pb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ImageIcon size={18} className="text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Add from photo gallery</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="mx-4 border-t border-gray-100" />

          <div className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl opacity-40 cursor-not-allowed">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera size={18} className="text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Take a photo</span>
            <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onAdd, initialImage, imageProcessingPromise }) {
  const [imageFile, setImageFile] = useState(initialImage ?? null);
  const [previewUrl, setPreviewUrl] = useState(() => initialImage ? URL.createObjectURL(initialImage) : null);
  const [imageProcessing, setImageProcessing] = useState(!!imageProcessingPromise);
  const [showEraser, setShowEraser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', price: '', size: '', material: '', color: '',
    category: CATEGORIES[0], notes: '',
  });

  // Resolve bg removal in background; swap preview when done
  useEffect(() => {
    if (!imageProcessingPromise) return;
    let cancelled = false;
    imageProcessingPromise
      .then(processedFile => {
        if (cancelled) return;
        setImageFile(processedFile);
        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(processedFile); });
        setImageProcessing(false);
      })
      .catch(() => { if (!cancelled) setImageProcessing(false); });
    return () => { cancelled = true; };
  }, [imageProcessingPromise]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const editInput = "w-full bg-transparent border-b border-gray-200 focus:border-gray-500 focus:outline-none transition-colors text-sm font-medium text-gray-800 pb-0.5";

  const handleEraserSave = (blob) => {
    const newFile = new File([blob], 'edited.png', { type: 'image/png' });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setShowEraser(false);
  };

  const handleAdd = () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    // Pass the promise if bg removal is still running — addItem will resolve it in the background
    onAdd(form, imageFile, imageProcessing ? imageProcessingPromise : null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-fade" onClick={onClose} />
      <div className="relative w-full md:w-[440px] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden modal-animate max-h-[92vh] flex flex-col">

        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          <button
            onClick={handleAdd}
            disabled={saving || !form.name.trim()}
            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md flex items-center gap-1.5"
          >
            {saving && <Loader2 size={11} className="animate-spin" />}
            Add
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <X size={14} strokeWidth={2.5} className="text-gray-500" />
          </button>
        </div>

        {/* Hero image */}
        {previewUrl && (
          <div
            className="relative flex-shrink-0 h-64 overflow-hidden"
            style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%)', backgroundSize: '20px 20px' }}
          >
            <img src={previewUrl} alt="" className="w-full h-full object-contain" />
            {imageProcessing ? (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-end justify-center pb-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
                  <Loader2 size={12} className="animate-spin text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Removing background…</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowEraser(true)}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-md hover:bg-white border border-gray-200 transition-colors whitespace-nowrap"
              >
                <Eraser size={13} />
                Edit background
              </button>
            )}
          </div>
        )}

        {showEraser && (
          <BackgroundEraserModal
            image={previewUrl}
            onClose={() => setShowEraser(false)}
            onSave={handleEraserSave}
          />
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-6 pt-6 pb-6 space-y-5">
            <div className="space-y-3">
              <input
                autoFocus
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Item name *"
                className={`${editInput} text-lg`}
              />
              <input
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Brand"
                className={editInput}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-sm font-medium text-gray-800 cursor-pointer border-b border-gray-200 pb-0.5"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Size</p>
                <input value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. S" className={editInput} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Price</p>
                <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. $120" className={editInput} />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Material</p>
              <input value={form.material} onChange={e => set('material', e.target.value)} placeholder="e.g. 100% Silk" className={editInput} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DB ↔ App shape converters
   ───────────────────────────────────────────────────────────────────────────── */
function dbItemToApp(row) {
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

function dbOutfitToApp(row) {
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

function collageToDbPayload(collage) {
  return {
    items:       collage.items       ?? [],
    bgColor:     collage.bgColor     ?? '#FFFFFF',
    canvasWidth:  collage.canvasWidth  ?? 480,
    canvasHeight: collage.canvasHeight ?? 679,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   AuthModal  (replaces full-page AuthScreen — floats above the preview app)
   ───────────────────────────────────────────────────────────────────────────── */
function AuthModal({ onClose }) {
  const [mode, setMode]       = useState('signin');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            name: name.trim(),
            bio: '',
            top_size: '',
            bottom_size: '',
            shoe_size: '',
            styles: [],
          });
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-fade" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-sm modal-animate">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.22em] mb-1">est. 2026</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Vêtu</h1>
          <p className="text-sm text-gray-300 mt-1">Your digital wardrobe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 px-8 pt-12 pb-8 relative">
          {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <X size={18} strokeWidth={2} />
            </button>
          )}
          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {[{ key: 'signin', label: 'Sign In' }, { key: 'signup', label: 'Sign Up' }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ProfileTab
   ───────────────────────────────────────────────────────────────────────────── */
const STYLE_TAGS = ['Minimalist', 'Classic', 'Casual', 'Streetwear', 'Formal', 'Bohemian', 'Athletic', 'Romantic'];
const TOP_SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BOTTOM_SIZES = ['24', '25', '26', '27', '28', '29', '30', '32', 'XS', 'S', 'M', 'L', 'XL'];
const SHOE_SIZES = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '11', '12'];

function ProfileTab({ items, boards, savedOutfits, profile, onUpdateProfile, onSignOut, onUpdateAvatar }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(profile);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(profile);
  }, [profile]);

  const stats = [
    { label: 'Items',   value: items.length },
    { label: 'Boards',  value: boards.filter(b => b !== 'All').length },
    { label: 'Outfits', value: savedOutfits.length },
  ];

  const toggleStyle = tag => {
    setDraft(d => ({
      ...d,
      styles: d.styles.includes(tag) ? d.styles.filter(s => s !== tag) : [...d.styles, tag],
    }));
  };

  const handleSave = () => {
    onUpdateProfile(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 pt-8 pb-32 md:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Profile</h2>
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full hover:border-gray-400 transition-all"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
        </div>

        {/* Avatar + name + bio */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 shadow-md flex items-center justify-center overflow-hidden cursor-pointer relative"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                !profile.name && <User size={28} className="text-white/80" />
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
                <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarUploading(true);
                await onUpdateAvatar(file);
                setAvatarUploading(false);
                e.target.value = '';
              }}
            />
          </div>

          {editing ? (
            <input
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder="Your name"
              className="text-xl font-bold text-gray-900 text-center bg-transparent border-b-2 border-gray-300 focus:border-gray-900 outline-none pb-0.5 mb-2 w-48"
            />
          ) : (
            <h3 className="text-xl font-bold text-gray-900 mb-1">{profile.name || 'Add your name'}</h3>
          )}

          {editing ? (
            <textarea
              value={draft.bio}
              onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
              placeholder="Add a short bio…"
              rows={2}
              className="text-sm text-gray-500 text-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 resize-none w-full max-w-xs mt-1"
            />
          ) : (
            <p className="text-sm text-gray-400 text-center mt-0.5">
              {profile.bio || 'Add a short bio'}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-0 justify-center mb-8 py-5 border-y border-gray-100">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center flex-1 ${i > 0 ? 'border-l border-gray-100' : ''}`}>
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              <span className="text-xs text-gray-400 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Sizes */}
        <section className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">My Sizes</h4>
          <div className="space-y-3">
            {[
              { key: 'topSize',    label: 'Top',    options: TOP_SIZES },
              { key: 'bottomSize', label: 'Bottom', options: BOTTOM_SIZES },
              { key: 'shoeSize',   label: 'Shoes',  options: SHOE_SIZES },
            ].map(({ key, label, options }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-14 flex-shrink-0">{label}</span>
                {editing ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setDraft(d => ({ ...d, [key]: opt }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          draft[key] === opt
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={`text-sm font-medium px-3 py-1 rounded-lg ${profile[key] ? 'bg-gray-100 text-gray-800' : 'text-gray-300'}`}>
                    {profile[key] || 'Not set'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Style preferences */}
        <section className="mb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Style Preferences</h4>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map(tag => {
              const selected = editing ? draft.styles.includes(tag) : profile.styles.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => editing && toggleStyle(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selected
                      ? 'bg-gray-900 text-white'
                      : editing
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-400'
                  } ${!editing ? 'cursor-default' : ''}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {!editing && profile.styles.length === 0 && (
            <p className="text-sm text-gray-300 mt-2">Tap Edit to add your style preferences</p>
          )}
        </section>

        {/* Settings */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Settings</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-700">Privacy</p>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </div>

            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-700">Appearance</p>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </div>

            <button
              onClick={onSignOut}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-red-50 transition-colors group mt-2"
            >
              <LogOut size={15} className="text-red-400 group-hover:text-red-500" />
              <p className="text-sm font-medium text-red-400 group-hover:text-red-500">Sign out</p>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Root — WardrobeApp
   ───────────────────────────────────────────────────────────────────────────── */
export default function WardrobeApp() {
  const [user, setUser]                   = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const authInitializedRef                = useRef(false);
  const currentUserIdRef                  = useRef(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab]         = useState(() => {
    try {
      const saved = localStorage.getItem('wardrobe_active_tab');
      if (saved && ['today', 'wardrobe', 'studio', 'stylist', 'profile'].includes(saved)) return saved;
    } catch {}
    return 'today';
  });
  const [mountedTabs, setMountedTabs]     = useState(() => {
    try {
      const saved = localStorage.getItem('wardrobe_active_tab');
      if (saved && ['today', 'wardrobe', 'studio', 'stylist', 'profile'].includes(saved)) {
        return new Set(['today', saved]);
      }
    } catch {}
    return new Set(['today']);
  });
  const [selectedItem, setSelectedItem]   = useState(null);
  const [items, setItems]                 = useState([]);
  const [addStep, setAddStep]                 = useState(null);
  const [addItemFile, setAddItemFile]         = useState(null);
  const [addItemProcessing, setAddItemProcessing] = useState(null); // Promise for bg removal
  const [boards, setBoards]               = useState(['All']);
  const [boardMeta, setBoardMeta]         = useState({});
  const [profile, setProfile]             = useState({
    name: '', bio: '', topSize: '', bottomSize: '', shoeSize: '', styles: [], avatarUrl: '',
  });
  const [pendingOutfitItem, setPendingOutfitItem] = useState(null);
  const [pendingTargetCollage, setPendingTargetCollage] = useState(null);
  const [pendingAiCollage, setPendingAiCollage] = useState(null);
  const [savedOutfits, setSavedOutfits]   = useState([]);
  const [draftOutfits, setDraftOutfits]   = useState([]);
  const [previewDraftOutfits, setPreviewDraftOutfits] = useState([]);
  const [previewSavedOutfits, setPreviewSavedOutfits] = useState(() => {
    const byId = {};
    for (const item of ITEMS) byId[item.id] = item;
    const build = (id, name, ids) => {
      const outfitItems = ids.map(i => byId[i]).filter(Boolean);
      return { id, name, items: aiOutfitToCanvasItems(outfitItems), bgColor: '#FFFFFF', canvasWidth: DESIGN_W, canvasHeight: DESIGN_H, liked: false, boards: [], thumbnail: '' };
    };
    return [
      build('preview-1', 'Weekend Casual', [11, 26, 27, 38]),
      build('preview-2', 'Work Ready',     [8, 14, 1, 13]),
    ];
  });
  const [likedItems, setLikedItems]       = useState(() => new Set());
  const [outfitBoards, setOutfitBoards]       = useState(['All']);
  const [outfitBoardMeta, setOutfitBoardMeta] = useState({});
  const [likedOutfits, setLikedOutfits]       = useState(() => new Set());

  // ── Auth + data loading ──────────────────────────────────────────────────
  const loadUserData = async (u) => {
    const uid = u.id;
    const [profileRes, itemsRes, boardsRes, outfitsRes, outfitBoardsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('items').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('boards').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('outfits').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('outfit_boards').select('*').eq('user_id', uid).order('created_at'),
    ]);

    if (profileRes.data) {
      const p = profileRes.data;
      setProfile({ name: p.name, bio: p.bio, topSize: p.top_size, bottomSize: p.bottom_size, shoeSize: p.shoe_size, styles: p.styles, avatarUrl: u.user_metadata?.avatar_url || p.avatar_url || '' });
    }

    if (itemsRes.data) {
      const appItems = itemsRes.data.map(dbItemToApp);
      setItems(appItems);
      setLikedItems(new Set(appItems.filter(i => i.liked).map(i => i.id)));
    }

    if (boardsRes.data) {
      setBoards(['All', ...boardsRes.data.map(b => b.name)]);
      const meta = {};
      boardsRes.data.forEach(b => { if (b.description) meta[b.name] = { description: b.description }; });
      setBoardMeta(meta);
    }

    if (outfitsRes.data) {
      const allAppOutfits = outfitsRes.data.map(dbOutfitToApp);
      const rawRows = outfitsRes.data;
      setSavedOutfits(allAppOutfits.filter((_, i) => !rawRows[i].is_draft));
      setDraftOutfits(allAppOutfits.filter((_, i) =>  rawRows[i].is_draft));
      setLikedOutfits(new Set(allAppOutfits.filter(o => o.liked).map(o => o.id)));
    }

    if (outfitBoardsRes.data) {
      setOutfitBoards(['All', ...outfitBoardsRes.data.map(b => b.name)]);
      const meta = {};
      outfitBoardsRes.data.forEach(b => { if (b.description) meta[b.name] = { description: b.description }; });
      setOutfitBoardMeta(meta);
    }
  };

  useEffect(() => {
    // Initial session check — await data before revealing UI to avoid flash
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      currentUserIdRef.current = u?.id ?? null;
      setUser(u);
      if (u) await loadUserData(u);
      setAuthLoading(false);
      authInitializedRef.current = true;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // TOKEN_REFRESHED fires on tab focus (Supabase silently rotates JWT) — nothing changed
      if (event === 'TOKEN_REFRESHED') return;
      const u = session?.user ?? null;
      const prevId = currentUserIdRef.current;
      currentUserIdRef.current = u?.id ?? null;
      setUser(u);
      if (u) {
        // Only transition when it's a genuinely new sign-in (different user ID).
        // Same-user SIGNED_IN can fire from cross-tab sync or re-auth and must not reload.
        if (authInitializedRef.current && event === 'SIGNED_IN' && u.id !== prevId) {
          setTransitioning(true);
          await loadUserData(u);
          setTransitioning(false);
        }
      } else {
        setItems([]); setBoards(['All']); setBoardMeta({});
        setSavedOutfits([]); setDraftOutfits([]); setLikedItems(new Set());
        setOutfitBoards(['All']); setOutfitBoardMeta({}); setLikedOutfits(new Set());
        setProfile({ name: '', bio: '', topSize: '', bottomSize: '', shoeSize: '', styles: [] });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // ── Board handlers ───────────────────────────────────────────────────────
  const handleDeleteBoard = async name => {
    setBoards(prev => prev.filter(b => b !== name));
    setBoardMeta(prev => { const next = { ...prev }; delete next[name]; return next; });
    if (user) await supabase.from('boards').delete().eq('user_id', user.id).eq('name', name);
  };

  const handleToggleItemBoard = async (itemId, board) => {
    let nextBoards;
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const inBoard = i.boards.includes(board);
      nextBoards = inBoard ? i.boards.filter(b => b !== board) : [...i.boards, board];
      return { ...i, boards: nextBoards };
    }));
    setSelectedItem(prev => {
      if (prev?.id !== itemId) return prev;
      const inBoard = prev.boards.includes(board);
      return { ...prev, boards: inBoard ? prev.boards.filter(b => b !== board) : [...prev.boards, board] };
    });
    if (user && nextBoards !== undefined) {
      await supabase.from('items').update({ board_names: nextBoards }).eq('id', itemId).eq('user_id', user.id);
    }
  };

  const handleCreateBoard = async (name, description) => {
    setBoards(prev => [...prev, name]);
    if (description) setBoardMeta(prev => ({ ...prev, [name]: { description } }));
    if (user) await supabase.from('boards').insert({ user_id: user.id, name, description: description || '' });
  };

  const handleEditBoard = async (oldName, newName, description) => {
    setBoards(prev => prev.map(b => b === oldName ? newName : b));
    setItems(prev => prev.map(i => ({ ...i, boards: i.boards.map(b => b === oldName ? newName : b) })));
    setBoardMeta(prev => {
      const next = { ...prev };
      delete next[oldName];
      if (description) next[newName] = { description };
      return next;
    });
    if (user) {
      await supabase.from('boards').update({ name: newName, description: description || '' }).eq('user_id', user.id).eq('name', oldName);
      const affectedItems = items.filter(i => i.boards.includes(oldName));
      await Promise.all(affectedItems.map(i =>
        supabase.from('items').update({ board_names: i.boards.map(b => b === oldName ? newName : b) }).eq('id', i.id).eq('user_id', user.id)
      ));
    }
  };

  const handleDeleteItems = async (ids, board) => {
    if (board === 'All') {
      setItems(prev => prev.filter(i => !ids.has(i.id)));
      setLikedItems(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
      if (user) await supabase.from('items').delete().in('id', [...ids]).eq('user_id', user.id);
    } else {
      setItems(prev => prev.map(i => ids.has(i.id) ? { ...i, boards: i.boards.filter(b => b !== board) } : i));
      if (user) {
        const affectedItems = items.filter(i => ids.has(i.id));
        await Promise.all(affectedItems.map(i =>
          supabase.from('items').update({ board_names: i.boards.filter(b => b !== board) }).eq('id', i.id).eq('user_id', user.id)
        ));
      }
    }
  };

  // ── Item handlers ────────────────────────────────────────────────────────
  const toggleLike = async id => {
    const nowLiked = !likedItems.has(id);
    setLikedItems(prev => { const next = new Set(prev); nowLiked ? next.add(id) : next.delete(id); return next; });
    if (user) await supabase.from('items').update({ liked: nowLiked }).eq('id', id).eq('user_id', user.id);
  };

  const updateItem = async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    setSelectedItem(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    if (user) {
      const dbUpdates = {};
      if (updates.name      !== undefined) dbUpdates.name      = updates.name;
      if (updates.brand     !== undefined) dbUpdates.brand     = updates.brand;
      if (updates.price     !== undefined) dbUpdates.price     = updates.price;
      if (updates.size      !== undefined) dbUpdates.size      = updates.size;
      if (updates.material  !== undefined) dbUpdates.material  = updates.material;
      if (updates.color     !== undefined) dbUpdates.color     = updates.color;
      if (updates.category  !== undefined) dbUpdates.category  = updates.category;
      if (updates.notes     !== undefined) dbUpdates.notes     = updates.notes;
      if (Object.keys(dbUpdates).length) {
        await supabase.from('items').update(dbUpdates).eq('id', id).eq('user_id', user.id);
      }
    }
  };

  const deleteItem = async id => {
    setItems(prev => prev.filter(i => i.id !== id));
    setLikedItems(prev => { const next = new Set(prev); next.delete(id); return next; });
    setSelectedItem(null);
    if (user) await supabase.from('items').delete().eq('id', id).eq('user_id', user.id);
  };

  const updateItemImage = async (id, blob) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-edited.png`;
    const file = await trimTransparentPixels(new File([blob], 'edited.png', { type: 'image/png' }));
    const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, file);
    if (uploadErr) { console.error('Image upload error:', uploadErr); return; }
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
    setItems(prev => prev.map(i => i.id === id ? { ...i, image: publicUrl } : i));
    setSelectedItem(prev => prev?.id === id ? { ...prev, image: publicUrl } : prev);
    await supabase.from('items').update({ image_url: publicUrl }).eq('id', id).eq('user_id', user.id);
  };

  const addItem = async (form, imageFile, imageProcessingPromise) => {
    const tempId = `temp-${Date.now()}`;
    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : '';
    setItems(prev => [{
      id: tempId, ...form, image: previewUrl, boards: [], liked: false, ratio: 'portrait',
      attributes: { warmthRating: 'none' },
      _enriching: true,
      _bgRemoving: !!imageProcessingPromise,
    }, ...prev]);

    try {
      // If bg removal is still running, wait for it and swap the optimistic preview
      let finalImageFile = imageFile;
      if (imageProcessingPromise) {
        try {
          finalImageFile = await imageProcessingPromise;
          const processedUrl = URL.createObjectURL(finalImageFile);
          setItems(prev => prev.map(i => i.id === tempId ? { ...i, image: processedUrl, _bgRemoving: false } : i));
        } catch {
          setItems(prev => prev.map(i => i.id === tempId ? { ...i, _bgRemoving: false } : i));
        }
      }

      let imageUrl = '';
      if (finalImageFile && user) {
        const safeName = finalImageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, finalImageFile);
        if (!uploadErr) {
          imageUrl = supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl;
        }
      }

      const { data: dbItem, error: dbErr } = await supabase.from('items').insert({
        user_id: user.id,
        name: form.name, brand: form.brand, price: form.price, size: form.size,
        material: form.material, color: form.color, category: form.category, notes: form.notes,
        image_url: imageUrl, liked: false, board_names: [],
        attributes: { warmthRating: 'none' },
      }).select().single();

      if (dbErr) throw dbErr;

      setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: dbItem.id, image: imageUrl || previewUrl } : i));

      const result = await enrichItem({
        imageUrl: imageUrl || null,
        imageFile: imageUrl ? null : finalImageFile,
        name: form.name, brand: form.brand, category: form.category, material: form.material, color: form.color,
      });

      setItems(prev => prev.map(i => i.id === dbItem.id ? { ...i, ...result, _enriching: false } : i));
      await supabase.from('items').update({ attributes: result.attributes }).eq('id', dbItem.id);
    } catch (err) {
      console.error('addItem error:', err);
      setItems(prev => prev.map(i => i.id === tempId ? { ...i, _enriching: false } : i));
    }
  };

  // ── Outfit handlers ──────────────────────────────────────────────────────
  const handleAddToOutfit = item => {
    setPendingOutfitItem(item);
    setPendingTargetCollage(null);
    switchTab('studio');
    setSelectedItem(null);
  };

  const handleOpenExistingCollage = (item, outfit, type) => {
    setPendingOutfitItem(item);
    setPendingTargetCollage({ id: outfit.id, type });
    switchTab('studio');
    setSelectedItem(null);
  };

  // ── Outfit board handlers ─────────────────────────────────────────────────
  const handleCreateOutfitBoard = async (name, description) => {
    setOutfitBoards(prev => [...prev, name]);
    if (description) setOutfitBoardMeta(prev => ({ ...prev, [name]: { description } }));
    if (user) await supabase.from('outfit_boards').insert({ user_id: user.id, name, description: description || '' });
  };

  const handleDeleteOutfitBoard = async name => {
    setOutfitBoards(prev => prev.filter(b => b !== name));
    setOutfitBoardMeta(prev => { const next = { ...prev }; delete next[name]; return next; });
    const strip = list => list.map(o => ({ ...o, boards: o.boards.filter(b => b !== name) }));
    setSavedOutfits(prev => strip(prev));
    setDraftOutfits(prev => strip(prev));
    if (user) {
      await supabase.from('outfit_boards').delete().eq('user_id', user.id).eq('name', name);
      const affected = [...savedOutfits, ...draftOutfits].filter(o => o.boards.includes(name));
      await Promise.all(affected.map(o =>
        supabase.from('outfits').update({ board_names: o.boards.filter(b => b !== name) }).eq('id', o.id)
      ));
    }
  };

  const handleEditOutfitBoard = async (oldName, newName, description) => {
    setOutfitBoards(prev => prev.map(b => b === oldName ? newName : b));
    setOutfitBoardMeta(prev => {
      const next = { ...prev }; delete next[oldName];
      if (description) next[newName] = { description };
      return next;
    });
    const rename = list => list.map(o => ({ ...o, boards: o.boards.map(b => b === oldName ? newName : b) }));
    setSavedOutfits(prev => rename(prev));
    setDraftOutfits(prev => rename(prev));
    if (user) {
      await supabase.from('outfit_boards').update({ name: newName, description: description || '' }).eq('user_id', user.id).eq('name', oldName);
      const affected = [...savedOutfits, ...draftOutfits].filter(o => o.boards.includes(oldName));
      await Promise.all(affected.map(o =>
        supabase.from('outfits').update({ board_names: o.boards.map(b => b === oldName ? newName : b) }).eq('id', o.id)
      ));
    }
  };

  const handleToggleOutfitBoard = async (outfitId, board) => {
    let nextBoards;
    const toggle = list => list.map(o => {
      if (o.id !== outfitId) return o;
      const inBoard = o.boards.includes(board);
      nextBoards = inBoard ? o.boards.filter(b => b !== board) : [...o.boards, board];
      return { ...o, boards: nextBoards };
    });
    setSavedOutfits(prev => toggle(prev));
    setDraftOutfits(prev => toggle(prev));
    if (user && nextBoards !== undefined)
      await supabase.from('outfits').update({ board_names: nextBoards }).eq('id', outfitId).eq('user_id', user.id);
  };

  const toggleOutfitLike = async id => {
    const nowLiked = !likedOutfits.has(id);
    setLikedOutfits(prev => { const next = new Set(prev); nowLiked ? next.add(id) : next.delete(id); return next; });
    if (user) await supabase.from('outfits').update({ liked: nowLiked }).eq('id', id).eq('user_id', user.id);
  };

  const handleSaveOutfit = async collage => {
    if (!collage.items.length) return;
    const { data } = await supabase.from('outfits').insert({
      user_id: user.id, name: collage.name || '', canvas_items: collageToDbPayload(collage),
      thumbnail: collage.thumbnail || '', is_draft: false, liked: false, board_names: [],
    }).select().single();
    if (data) setSavedOutfits(prev => [dbOutfitToApp(data), ...prev]);
  };

  const handleSaveDraftOutfit = async collage => {
    if (!collage.items.length) return;
    const { data } = await supabase.from('outfits').insert({
      user_id: user.id, name: collage.name || '', canvas_items: collageToDbPayload(collage),
      thumbnail: collage.thumbnail || '', is_draft: true, liked: false, board_names: [],
    }).select().single();
    if (data) setDraftOutfits(prev => [dbOutfitToApp(data), ...prev]);
  };

  const updateSavedOutfit = async (id, collage) => {
    setSavedOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o));
    await supabase.from('outfits').update({ canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '' }).eq('id', id);
  };

  const updateDraftOutfit = async (id, collage) => {
    setDraftOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o));
    await supabase.from('outfits').update({ canvas_items: collageToDbPayload(collage), thumbnail: collage.thumbnail || '' }).eq('id', id);
  };

  const handleRemoveDraftOutfit = async id => {
    setDraftOutfits(prev => prev.filter(o => o.id !== id));
    await supabase.from('outfits').delete().eq('id', id);
  };

  const handleRemoveSavedOutfit = async id => {
    setSavedOutfits(prev => prev.filter(o => o.id !== id));
    await supabase.from('outfits').delete().eq('id', id);
  };

  // ── Profile handler ──────────────────────────────────────────────────────
  const handleUpdateProfile = async updates => {
    setProfile(updates);
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        name: updates.name, bio: updates.bio,
        top_size: updates.topSize, bottom_size: updates.bottomSize, shoe_size: updates.shoeSize,
        styles: updates.styles,
        avatar_url: updates.avatarUrl,
      });
    }
  };

  const handleUpdateAvatar = async (file) => {
    if (!user || !file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `avatars/${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('item-images').upload(path, file, { upsert: true });
    if (uploadErr) { console.error('Avatar upload failed:', uploadErr.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
    // Persist in auth user metadata — survives refresh without any DB schema change
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setProfile(prev => ({ ...prev, avatarUrl: publicUrl }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    switchTab('wardrobe');
  };

  const switchTab = (id) => {
    setMountedTabs(prev => { const next = new Set(prev); next.add(id); return next; });
    setActiveTab(id);
    try { localStorage.setItem('wardrobe_active_tab', id); } catch {}
  };

  const handleTabSwitch = (id) => {
    if (id === activeTab) return;
    switchTab(id);
  };

  const renderContent = () => {
    // Each tab is kept permanently mounted after first visit (display:none when inactive)
    // so state and effects survive tab switches without re-fetching.
    const tab = (id) => activeTab === id ? 'flex flex-col flex-1 min-h-0' : 'hidden';

    return (
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Spinner overlays tabs without unmounting them, preserving state like activeFilter */}
        {transitioning && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        )}
      <>
        {mountedTabs.has('wardrobe') && (
          <div className={tab('wardrobe')}>
            <WardrobeTab
              items={previewItems}
              boards={isPreview ? BOARDS : boards}
              boardMeta={isPreview ? {} : boardMeta}
              likedItems={likedItems}
              onSelectItem={setSelectedItem}
              onDeleteBoard={handleDeleteBoard}
              onEditBoard={handleEditBoard}
              onDeleteItems={handleDeleteItems}
              onCreateBoard={handleCreateBoard}
              onToggleItemBoard={handleToggleItemBoard}
              onAddItem={() => setAddStep('picker')}
              userId={user?.id}
              isPreview={isPreview}
            />
          </div>
        )}
        {mountedTabs.has('today') && (
          <div className={tab('today')}>
            <TodayTab
              items={readyItems}
              onSaveToPublished={isPreview
                ? collage => { if (collage.items?.length) setPreviewSavedOutfits(prev => [{ ...collage, id: `preview-${Date.now()}`, liked: false, boards: [] }, ...prev]); }
                : handleSaveOutfit}
              onEditInStudio={collage => { setPendingAiCollage(collage); switchTab('studio'); }}
              isPreview={isPreview}
              userId={user?.id}
            />
          </div>
        )}
        {mountedTabs.has('studio') && (
          <div className={tab('studio')}>
            <StudioTab
              savedOutfits={savedOutfits}
              draftOutfits={isPreview ? previewDraftOutfits : draftOutfits}
              onSaveOutfit={isPreview
                ? collage => { if (collage.items?.length) setPreviewSavedOutfits(prev => [{ ...collage, id: `preview-${Date.now()}`, liked: false, boards: [] }, ...prev]); }
                : handleSaveOutfit}
              onSaveDraftOutfit={isPreview
                ? collage => { if (collage.items?.length) setPreviewDraftOutfits(prev => [{ ...collage, id: `preview-draft-${Date.now()}`, liked: false, boards: [] }, ...prev]); }
                : handleSaveDraftOutfit}
              onUpdateSavedOutfit={isPreview
                ? (id, collage) => setPreviewSavedOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o))
                : updateSavedOutfit}
              onUpdateDraftOutfit={isPreview
                ? (id, collage) => setPreviewDraftOutfits(prev => prev.map(o => o.id === id ? { ...o, ...collage, boards: o.boards, liked: o.liked } : o))
                : updateDraftOutfit}
              onRemoveDraftOutfit={isPreview
                ? id => setPreviewDraftOutfits(prev => prev.filter(o => o.id !== id))
                : handleRemoveDraftOutfit}
              onRemoveSavedOutfit={isPreview
                ? id => setPreviewSavedOutfits(prev => prev.filter(o => o.id !== id))
                : handleRemoveSavedOutfit}
              pendingOutfitItem={pendingOutfitItem}
              pendingTargetCollage={pendingTargetCollage}
              onClearPendingOutfit={() => { setPendingOutfitItem(null); setPendingTargetCollage(null); }}
              pendingAiCollage={pendingAiCollage}
              onClearPendingAiCollage={() => setPendingAiCollage(null)}
              items={readyItems}
              boards={isPreview ? BOARDS : boards}
              outfitBoards={outfitBoards}
              outfitBoardMeta={outfitBoardMeta}
              likedOutfits={likedOutfits}
              onCreateOutfitBoard={handleCreateOutfitBoard}
              onDeleteOutfitBoard={handleDeleteOutfitBoard}
              onEditOutfitBoard={handleEditOutfitBoard}
              onToggleOutfitBoard={handleToggleOutfitBoard}
              onToggleOutfitLike={toggleOutfitLike}
              isPreview={isPreview}
              previewCollages={previewCollages}
            />
          </div>
        )}
        {mountedTabs.has('stylist') && (
          <div className={tab('stylist')}>
            <StylistTab />
          </div>
        )}
        {mountedTabs.has('profile') && !isPreview && (
          <div className={tab('profile')}>
            <ProfileTab
              items={items}
              boards={boards}
              savedOutfits={savedOutfits}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onSignOut={handleSignOut}
              onUpdateAvatar={handleUpdateAvatar}
            />
          </div>
        )}
      </>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const isPreview = !user;

  // In preview mode: use mock wardrobe items and 2 pre-built collages
  const previewItems = isPreview ? ITEMS : items;
  // Items ready for outfit generation and the collage editor — excludes cards still processing bg removal
  const readyItems = isPreview ? ITEMS : items.filter(i => !i._bgRemoving);
  const previewCollages = previewSavedOutfits;

  return (
    <div className="flex h-screen bg-white overflow-hidden antialiased font-sans">

      {/* ────────────────────────────────────────────────
          Desktop Sidebar
          ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 xl:w-64 border-r border-gray-100 py-8 px-4 flex-shrink-0 bg-white">

        {/* Logo */}
        <div className="px-3 mb-10">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.22em] mb-1">
            est. 2026
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vêtu</h1>
          <p className="text-xs text-gray-400 mt-0.5">Your digital wardrobe</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {TABS.map(({ id, label, Icon }) => {
            if (isPreview && (id === 'profile' || id === 'stylist')) return null;
            const active = activeTab === id;
            const displayLabel = id === 'today'
              ? `Today, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : label;
            return (
              <button
                key={id}
                onClick={() => handleTabSwitch(id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
                {displayLabel}
              </button>
            );
          })}
        </nav>

        {/* Profile / Sign In */}
        <div className="mt-auto">
          {isPreview ? (
            <div className="px-3 pb-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                <User size={15} strokeWidth={2} />
                Sign in / Sign up
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-2 leading-snug">Sign in to save your wardrobe and outfits</p>
            </div>
          ) : (
            <button
              onClick={() => handleTabSwitch('profile')}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors group ${
                activeTab === 'profile' ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 flex-shrink-0 shadow-sm overflow-hidden">
                {profile.avatarUrl && <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-400">View profile</p>
              </div>
              <ChevronRight
                size={13}
                className="text-gray-300 ml-auto group-hover:text-gray-500 transition-colors"
              />
            </button>
          )}
        </div>
      </aside>

      {/* ────────────────────────────────────────────────
          Main content area
          ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile-only top bar */}
        <div className="md:hidden flex items-center justify-between px-5 pt-14 pb-3 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Vêtu</h1>
          </div>
          <div className="flex items-center gap-2">
            {isPreview ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
              >
                <User size={12} strokeWidth={2} />
                Sign in
              </button>
            ) : (
              <>
                {activeTab !== 'studio' && (
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                    <Search size={15} className="text-gray-600" />
                  </button>
                )}
                <button onClick={() => handleTabSwitch('profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-purple-400 shadow-sm" />
              </>
            )}
          </div>
        </div>

        {/* Active tab */}
        {renderContent()}
      </main>

      {/* ────────────────────────────────────────────────
          Mobile bottom navigation
          ──────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100">
        <div className="flex items-center justify-around px-2 pt-2 pb-6">
          {TABS.map(({ id, label, Icon }) => {
            if (isPreview && (id === 'profile' || id === 'stylist')) return null;
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabSwitch(id)}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div
                  className={`w-12 h-7 flex items-center justify-center rounded-xl transition-all ${
                    active ? 'bg-gray-900' : ''
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.2 : 1.75}
                    className={active ? 'text-white' : 'text-gray-400'}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    active ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ────────────────────────────────────────────────
          Item detail modal
          ──────────────────────────────────────────────── */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          liked={likedItems.has(selectedItem.id)}
          onToggleLike={toggleLike}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onUpdateImage={updateItemImage}
          onAddToOutfit={handleAddToOutfit}
          onOpenCollage={handleOpenExistingCollage}
          savedOutfits={savedOutfits}
          draftOutfits={draftOutfits}
          boards={boards}
          onToggleBoard={handleToggleItemBoard}
          isPreview={isPreview}
        />
      )}

      {addStep === 'picker' && (
        <AddMethodModal
          onClose={() => setAddStep(null)}
          onImageSelected={(file, bgPromise) => {
            setAddItemFile(file);
            setAddItemProcessing(bgPromise);
            setAddStep('form');
          }}
        />
      )}

      {addStep === 'form' && (
        <AddItemModal
          onClose={() => { setAddStep(null); setAddItemFile(null); setAddItemProcessing(null); }}
          onAdd={addItem}
          initialImage={addItemFile}
          imageProcessingPromise={addItemProcessing}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
