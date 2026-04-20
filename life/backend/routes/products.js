const express = require('express');
const router = express.Router();
const { get, all, run } = require('../config/database');
const { authMiddleware, generateId } = require('../config/auth');

// Get all products
router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let query = 'SELECT * FROM products WHERE available = 1';
    let params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = await all(query, params);

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch products'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await get(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({
        error: true,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to fetch product'
    });
  }
});

// Create product (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        error: true,
        message: 'Name and price are required'
      });
    }

    const productId = generateId();
    await run(
      `INSERT INTO products (id, name, description, price, category, image_url, provider_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [productId, name, description || null, price, category || 'General', imageUrl || null, req.user.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Product created',
      productId
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({
      error: true,
      message: 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;

    // Verify ownership
    const product = await get(
      'SELECT provider_id FROM products WHERE id = ?',
      [req.params.id]
    );

    if (!product || product.provider_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Unauthorized'
      });
    }

    await run(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, category = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, price, category, imageUrl, req.params.id]
    );

    res.json({
      success: true,
      message: 'Product updated'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verify ownership
    const product = await get(
      'SELECT provider_id FROM products WHERE id = ?',
      [req.params.id]
    );

    if (!product || product.provider_id !== req.user.userId) {
      return res.status(403).json({
        error: true,
        message: 'Unauthorized'
      });
    }

    await run(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Product deleted'
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to delete product'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const products = await all(
      'SELECT * FROM products WHERE category = ? AND available = 1 ORDER BY created_at DESC',
      [req.params.category]
    );

    res.json({
      success: true,
      products,
      category: req.params.category
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to fetch products'
    });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await all(
      'SELECT DISTINCT category FROM products WHERE available = 1'
    );

    res.json({
      success: true,
      categories: categories.map(c => c.category)
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;
