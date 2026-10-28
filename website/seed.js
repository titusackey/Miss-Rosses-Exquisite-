/**
 * Seed Initial Data for Miss Roses Exquisite
 * Seeds Dresses, Bangles, Slippers with realistic descriptions, prices, variants,
 * and sets up the Super Admin account.
 */

const bcrypt = require('bcryptjs');
const db = require('./src/db');

async function seed() {
  console.log('🌱 Seeding Miss Roses Exquisite Database...');

  // 1. Super Admin Account
  const existingAdmin = db.getAdminByEmail('admin@missrosesexquisite.com');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('AdminRose2026!', salt);
    db.createAdmin('SuperAdmin', 'admin@missrosesexquisite.com', hash, 'super_admin');
    console.log('👑 Super Admin account created: admin@missrosesexquisite.com / AdminRose2026!');
  } else {
    console.log('👑 Super Admin account already exists.');
  }

  // 2. Initial Products (Dresses, Bangles, Slippers)
  const initialProducts = [
    // --- DRESSES (Category ID: 1) ---
    {
      category_id: 1,
      name: 'Royal Emerald Velvet Evening Gown',
      slug: 'royal-emerald-velvet-evening-gown',
      description: 'Lustrous emerald velvet gown with tailored corset bodice, side split, and graceful train. Designed for regal gala evenings and high-profile receptions.',
      price: 1450.00,
      compare_price: 1700.00,
      image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
      badge: 'Best Seller',
      is_featured: 1,
      variants: [
        { variant_name: 'Size Small (UK 8)', stock_quantity: 6, low_stock_threshold: 2, sku: 'DRS-EMR-S' },
        { variant_name: 'Size Medium (UK 10-12)', stock_quantity: 12, low_stock_threshold: 3, sku: 'DRS-EMR-M' },
        { variant_name: 'Size Large (UK 14-16)', stock_quantity: 8, low_stock_threshold: 2, sku: 'DRS-EMR-L' }
      ]
    },
    {
      category_id: 1,
      name: 'Blush Rose Floral Maxi Dress',
      slug: 'blush-rose-floral-maxi-dress',
      description: 'Airy silk-chiffon dress adorned with bespoke rose petal prints. Features delicate flutter sleeves, a cinched waistband, and pleated A-line skirt.',
      price: 980.00,
      compare_price: 1150.00,
      image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      badge: 'New Arrival',
      is_featured: 1,
      variants: [
        { variant_name: 'Size Small (UK 8)', stock_quantity: 5, low_stock_threshold: 2, sku: 'DRS-BLS-S' },
        { variant_name: 'Size Medium (UK 10-12)', stock_quantity: 9, low_stock_threshold: 3, sku: 'DRS-BLS-M' },
        { variant_name: 'Size Large (UK 14-16)', stock_quantity: 4, low_stock_threshold: 2, sku: 'DRS-BLS-L' }
      ]
    },
    {
      category_id: 1,
      name: 'Midnight Noir Sequin Cocktail Dress',
      slug: 'midnight-noir-sequin-cocktail-dress',
      description: 'Shimmering hand-sewn micro sequins over luxury stretch fabric. Flattering cowl neckline that catches every gleam of evening light.',
      price: 1200.00,
      compare_price: 1350.00,
      image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      badge: 'Popular',
      is_featured: 0,
      variants: [
        { variant_name: 'Size Small (UK 8)', stock_quantity: 4, low_stock_threshold: 2, sku: 'DRS-NOIR-S' },
        { variant_name: 'Size Medium (UK 10-12)', stock_quantity: 7, low_stock_threshold: 2, sku: 'DRS-NOIR-M' },
        { variant_name: 'Size Large (UK 14-16)', stock_quantity: 3, low_stock_threshold: 2, sku: 'DRS-NOIR-L' }
      ]
    },

    // --- BANGLES (Category ID: 2) ---
    {
      category_id: 2,
      name: '24K Gold-Plated Filigree Bangle Stack',
      slug: '24k-gold-plated-filigree-bangle-stack',
      description: 'A 5-piece royal bridal bangle stack intricately etched with heritage filigree motifs and anti-tarnish protective sealing.',
      price: 650.00,
      compare_price: 780.00,
      image_url: 'https://images.unsplash.com/photo-1611591475152-47e0a9860b8b?auto=format&fit=crop&w=800&q=80',
      badge: 'Signature Piece',
      is_featured: 1,
      variants: [
        { variant_name: 'Standard Wrist (6.5 - 7.5 in)', stock_quantity: 15, low_stock_threshold: 3, sku: 'BNG-GLD-STD' }
      ]
    },
    {
      category_id: 2,
      name: 'Handcrafted Imperial Coral & Brass Bangle',
      slug: 'imperial-coral-brass-bangle',
      description: 'Authentic polished Ghanaian brass cast with vibrant Mediterranean red coral stones. A statement piece that exudes timeless prestige.',
      price: 520.00,
      compare_price: 600.00,
      image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
      badge: 'Artisanal',
      is_featured: 1,
      variants: [
        { variant_name: 'Standard Wrist', stock_quantity: 10, low_stock_threshold: 2, sku: 'BNG-CRL-STD' }
      ]
    },
    {
      category_id: 2,
      name: 'Swarovski Crystal Pavé Slim Cuff Bangle',
      slug: 'swarovski-crystal-pave-slim-cuff',
      description: 'Minimalist high-shine rhodium bangle encrusted with fine pave Swarovski crystals. Opens with a discreet magnetic safety clasp.',
      price: 450.00,
      compare_price: 550.00,
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      badge: 'Trending',
      is_featured: 0,
      variants: [
        { variant_name: 'Standard Wrist', stock_quantity: 18, low_stock_threshold: 4, sku: 'BNG-CRYS-STD' }
      ]
    },

    // --- SLIPPERS (Category ID: 3) ---
    {
      category_id: 3,
      name: 'Adorned Pearl & Gold Moroccan Leather Mules',
      slug: 'pearl-gold-moroccan-leather-mules',
      description: 'Hand-stitched genuine calfskin leather slippers crowned with lustrous freshwater pearls and gold embroidery. Padded memory foam footbed.',
      price: 480.00,
      compare_price: 580.00,
      image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
      badge: 'Best Seller',
      is_featured: 1,
      variants: [
        { variant_name: 'Size EU 37 (UK 4)', stock_quantity: 5, low_stock_threshold: 2, sku: 'SLP-PRL-37' },
        { variant_name: 'Size EU 38 (UK 5)', stock_quantity: 8, low_stock_threshold: 2, sku: 'SLP-PRL-38' },
        { variant_name: 'Size EU 39 (UK 6)', stock_quantity: 11, low_stock_threshold: 3, sku: 'SLP-PRL-39' },
        { variant_name: 'Size EU 40 (UK 7)', stock_quantity: 6, low_stock_threshold: 2, sku: 'SLP-PRL-40' },
        { variant_name: 'Size EU 41 (UK 8)', stock_quantity: 4, low_stock_threshold: 2, sku: 'SLP-PRL-41' }
      ]
    },
    {
      category_id: 3,
      name: 'Velvet Rose Embroidered Slide Slippers',
      slug: 'velvet-rose-embroidered-slide-slippers',
      description: 'Sumptuous plush velvet slides featuring Miss Roses signature rose emblem hand-embroidered in metallic threading. Non-slip rubber outsole.',
      price: 360.00,
      compare_price: 420.00,
      image_url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80',
      badge: 'Comfort Luxe',
      is_featured: 1,
      variants: [
        { variant_name: 'Size EU 38 (UK 5)', stock_quantity: 6, low_stock_threshold: 2, sku: 'SLP-VLV-38' },
        { variant_name: 'Size EU 39 (UK 6)', stock_quantity: 9, low_stock_threshold: 2, sku: 'SLP-VLV-39' },
        { variant_name: 'Size EU 40 (UK 7)', stock_quantity: 7, low_stock_threshold: 2, sku: 'SLP-VLV-40' }
      ]
    },
    {
      category_id: 3,
      name: 'Crystal-Embellished Metallic Strappy Slides',
      slug: 'crystal-metallic-strappy-slides',
      description: 'Gleaming champagne gold crossover straps set with radiant geometric crystals. Perfect pairing for evening dresses and luxury loungewear.',
      price: 410.00,
      compare_price: 490.00,
      image_url: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=800&q=80',
      badge: 'Popular',
      is_featured: 0,
      variants: [
        { variant_name: 'Size EU 38 (UK 5)', stock_quantity: 5, low_stock_threshold: 2, sku: 'SLP-CRY-38' },
        { variant_name: 'Size EU 39 (UK 6)', stock_quantity: 8, low_stock_threshold: 2, sku: 'SLP-CRY-39' },
        { variant_name: 'Size EU 40 (UK 7)', stock_quantity: 6, low_stock_threshold: 2, sku: 'SLP-CRY-40' }
      ]
    }
  ];

  // Only seed if empty
  const currentProds = db.getProducts();
  if (currentProds.length === 0) {
    for (const prod of initialProducts) {
      db.createProduct(prod);
    }
    console.log(`✅ Seeded ${initialProducts.length} luxury dresses, bangles, and slippers with inventory variants!`);
  } else {
    console.log(`ℹ️ Database already contains ${currentProds.length} products. Skipping duplicate seed.`);
  }

  console.log('✨ Seed complete!\n');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
