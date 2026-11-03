
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const User = require('../models/User');
const Product = require('../models/Product');
const ServiceRecord = require('../models/ServiceRecord');
const auth = require('../middleware/auth');

const {
  sendManualWarrantyTest
} = require('../utils/warrantyReminder');

// INVOICE STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG and WEBP files are allowed'));
    }
  }
});

// WARRANTY STATUS
function warrantyStatus(endDate) {
  if (!endDate) return 'No Warranty';

  const remaining = Math.ceil(
    (new Date(endDate) - new Date()) / 86400000
  );

  if (remaining < 0) return 'Expired';
  if (remaining <= 30) return 'Expiring Soon';

  return 'Active';
}

// AUTHENTICATION

router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({
        message: 'Enter all fields. Password must be at least 6 characters.'
      });
    }

    const existing = await User.findOne({
      email: email.toLowerCase()
    });

    if (existing) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: (email || '').toLowerCase()
    });

    if (
      !user ||
      !(await bcrypt.compare(password || '', user.password))
    ) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRODUCTS

router.get('/products', auth, async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.json(products.map(p => ({
      ...p.toObject(),
      warrantyStatus: warrantyStatus(p.warrantyEndDate)
    })));

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/products', auth, async (req, res) => {
  try {
    const {
      productName,
      purchaseDate,
      purchasePrice
    } = req.body;

    if (!productName || !purchaseDate) {
      return res.status(400).json({
        message: 'Product name and purchase date are required'
      });
    }

    const product = await Product.create({
      ...req.body,
      userId: req.userId,
      purchasePrice: Number(purchasePrice) || 0
    });

    res.status(201).json(product);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      ...product.toObject(),
      warrantyStatus: warrantyStatus(product.warrantyEndDate)
    });

  } catch (error) {
    res.status(400).json({
      message: 'Invalid product ID'
    });
  }
});

router.put('/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json(product);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    await ServiceRecord.deleteMany({
      productId: product._id,
      userId: req.userId
    });

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// INVOICE UPLOAD

router.post(
  '/products/:id/invoice',
  auth,
  (req, res, next) => {
    upload.single('invoice')(req, res, err => {
      if (err) {
        return res.status(400).json({
          message: err.message
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'Please select a file'
        });
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.userId
        },
        {
          invoice: '/uploads/' + req.file.filename
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      res.json({
        message: 'Invoice uploaded successfully',
        product
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// SERVICE HISTORY

router.get('/services', auth, async (req, res) => {
  try {
    const records = await ServiceRecord.find({
      userId: req.userId
    })
      .populate('productId', 'productName brand')
      .sort({ serviceDate: -1 });

    res.json(records);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/services', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.body.productId,
      userId: req.userId
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const record = await ServiceRecord.create({
      ...req.body,
      userId: req.userId
    });

    res.status(201).json(record);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/services/:id', auth, async (req, res) => {
  try {
    const record = await ServiceRecord.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!record) {
      return res.status(404).json({
        message: 'Record not found'
      });
    }

    res.json({
      message: 'Service record deleted'
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DASHBOARD

router.get('/dashboard', auth, async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.userId
    });

    const services = await ServiceRecord.countDocuments({
      userId: req.userId
    });

    const active = products.filter(
      p => warrantyStatus(p.warrantyEndDate) === 'Active'
    ).length;

    const expiring = products.filter(
      p => warrantyStatus(p.warrantyEndDate) === 'Expiring Soon'
    ).length;

    const expired = products.filter(
      p => warrantyStatus(p.warrantyEndDate) === 'Expired'
    ).length;

    res.json({
      totalProducts: products.length,
      activeWarranties: active,
      expiringWarranties: expiring,
      expiredWarranties: expired,
      totalServices: services,
      recentProducts: products.slice(0, 5)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NOTIFICATIONS

router.get('/notifications', auth, async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.userId
    });

    const notifications = [];

    products.forEach(p => {
      const status = warrantyStatus(p.warrantyEndDate);

      if (status === 'Expiring Soon') {
        const days = Math.ceil(
          (new Date(p.warrantyEndDate) - new Date()) / 86400000
        );

        notifications.push({
          id: p._id,
          message: `${p.productName} warranty expires in ${days} days`,
          type: 'warning',
          date: p.warrantyEndDate
        });

      } else if (status === 'Expired') {
        notifications.push({
          id: p._id,
          message: `${p.productName} warranty has expired`,
          type: 'danger',
          date: p.warrantyEndDate
        });
      }
    });

    res.json(notifications);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MANUAL WARRANTY EMAIL TEST

router.post('/notifications/test-email', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required'
      });
    }

    const previewUrl = await sendManualWarrantyTest(
      productId,
      req.userId
    );

    res.json({
      message: 'Test warranty email sent successfully!',
      previewUrl
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

module.exports = router;
