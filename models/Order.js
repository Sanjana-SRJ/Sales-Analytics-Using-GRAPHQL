import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  _id: { type: String },
  customerId: { type: String, ref: 'Customer' },
  products: [
    {
      productId: { type: String, ref: 'Product' },
      quantity: Number,
      priceAtPurchase: Number,
    }
  ],
  totalAmount: Number,
  orderDate: Date,
  status: String,
},{ _id: false });

export default mongoose.model('Order', orderSchema);
