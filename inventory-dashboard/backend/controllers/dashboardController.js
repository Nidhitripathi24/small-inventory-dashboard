const Order = require('../models/Order');
const Product = require('../models/Product');

const getDashboardSummary = async (req, res) => {
  try {
    // Total revenue: sum totalAmount across all non-cancelled orders
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Total orders: every order, regardless of status
    const totalOrders = await Order.countDocuments();

    // Low-stock product count (same $expr logic from Phase 6)
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });

    // Best sellers: top 5 products by quantity sold, excluding cancelled orders
    const bestSellers = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantitySold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$productInfo.name',
          totalQuantitySold: 1,
        },
      },
    ]);

    // Recent orders: latest 5, plain query — no aggregation needed here
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerName totalAmount status createdAt');

    res.json({ totalRevenue, totalOrders, lowStockCount, bestSellers, recentOrders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardSummary };