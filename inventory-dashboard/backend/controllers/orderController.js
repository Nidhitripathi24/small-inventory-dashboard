const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
  const { customerName, items } = req.body;

  if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Please provide customerName and at least one item' });
  }

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        if (!item.product || !item.quantity || item.quantity < 1) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Each item needs a valid product and quantity' });
        }

        const product = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!product) {
          const existing = await Product.findById(item.product).session(session);
          await session.abortTransaction();
          session.endSession();

          if (!existing) {
            return res.status(404).json({ message: `Product not found: ${item.product}` });
          }
          return res.status(400).json({
            message: `Insufficient stock for ${existing.name}. Available: ${existing.stock}, requested: ${item.quantity}`,
          });
        }

        orderItems.push({ product: product._id, quantity: item.quantity, price: product.price });
        totalAmount += product.price * item.quantity;
      }

      const createdOrders = await Order.create([{ customerName, items: orderItems, totalAmount }], { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json(createdOrders[0]);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      const isRetriable = error.errorLabels && error.errorLabels.includes('TransientTransactionError');

      if (isRetriable && attempt < MAX_RETRIES - 1) {
        attempt++;
        continue;
      }

      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name price');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const validTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status: newStatus } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const allowedNext = validTransitions[order.status];
    if (!allowedNext.includes(newStatus)) {
      return res.status(400).json({
        message: `Cannot change status from '${order.status}' to '${newStatus}'`,
      });
    }

    if (newStatus === 'cancelled') {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
        order.status = 'cancelled';
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json(order);
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: 'Server error', error: err.message });
      }
    }

    order.status = newStatus;
    await order.save();
    res.json(order);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const exportOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    const escapeCSV = (value) => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = 'Order ID,Customer,Total,Status,Date';
    const rows = orders.map((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      return [
        order._id,
        escapeCSV(order.customerName),
        order.totalAmount,
        order.status,
        date,
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, exportOrders };