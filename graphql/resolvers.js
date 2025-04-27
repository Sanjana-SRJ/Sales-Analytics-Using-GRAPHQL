import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const resolvers = {
    Query: {
      // 1️⃣ getCustomerSpending query
      getCustomerSpending: async (_, { customerId }) => {
        const orders = await Order.find({ customerId: customerId, status: 'completed' });
  
        if (!orders.length) {
          return {
            customerId,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
          };
        }
  
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalSpent / orders.length;
  
        // Get the last order date
        const lastOrderDate = orders
          .map(order => order.orderDate)
          .sort((a, b) => b - a)[0]
          .toISOString();
  
        return {
          customerId,
          totalSpent,
          averageOrderValue,
          lastOrderDate,
        };
      },
  
      // 2️⃣ getTopSellingProducts query
      getTopSellingProducts: async (_, { limit = 10 }) => {
        try {
          const productsSales = await Order.aggregate([
            {
              $addFields: {
                parsedProducts: {
                  $function: {
                    body: function(products) {
                      const sanitized = products.replace(/'/g, '"');
                      return JSON.parse(sanitized);
                    },
                    args: ["$products"],
                    lang: "js"
                  }
                }
              }
            },
            { $unwind: "$parsedProducts" },
            {
              $group: {
                _id: "$parsedProducts.productId", 
                totalSold: { $sum: "$parsedProducts.quantity" }
              }
            },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productDetails"
              }
            },
            { $unwind: "$productDetails" },
            {
              $project: {
                productId: "$_id",
                name: "$productDetails.name",
                totalSold: 1
              }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit } 
          ]);
      
          return productsSales;
        } catch (err) {
          console.error(err);
          throw new Error("Error fetching top-selling products: " + err.message);
        }
      },
      
      // 3️⃣ getSalesAnalytics query
      getSalesAnalytics: async (_, { startDate, endDate }) => {
        const start = startDate+"T00:00:00Z";
        const end = endDate+"T23:59:59Z";
      
        try {
          const baseAnalytics = await Order.aggregate([
            {
              $match: {
                orderDate: { $gte: start, $lte: end },
                status: 'completed',
              },
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                completedOrders: { $sum: 1 }
              }
            }
          ]);
      
          const categoryAggregation = await Order.aggregate([
            {
              $match: {
                orderDate: { $gte: start, $lte: end },
                status: 'completed',
              },
            },
            {
              $addFields: {
                parsedProducts: {
                  $function: {
                    body: function(products) {
                      const sanitized = products.replace(/'/g, '"');
                      return JSON.parse(sanitized);
                    },
                    args: ["$products"],
                    lang: "js"
                  }
                }
              }
            },
            { $unwind: "$parsedProducts" },
            {
              $lookup: {
                from: "products",
                localField: "parsedProducts.productId",
                foreignField: "_id",
                as: "productDetails"
              }
            },
            { $unwind: "$productDetails" },
            {
              $project: {
                category: "$productDetails.category",
                productRevenue: { 
                  $multiply: [
                    { $ifNull: ["$parsedProducts.priceAtPurchase", "$productDetails.price"] }, 
                    "$parsedProducts.quantity"
                  ] 
                }
              }
            },
            {
              $group: {
                _id: "$category",
                revenue: { $sum: "$productRevenue" }
              }
            },
            {
              $project: {
                _id: 0,
                category: "$_id",
                revenue: 1
              }
            }
          ]);

          const result = baseAnalytics.length > 0 ? {
            totalRevenue: baseAnalytics[0].totalRevenue,
            completedOrders: baseAnalytics[0].completedOrders,
            categoryBreakdown: categoryAggregation
          } : {
            totalRevenue: 0,
            completedOrders: 0,
            categoryBreakdown: []
          };
      
          return result;
        } catch (err) {
          console.error("Error in getSalesAnalytics:", err);
          throw new Error("Error fetching sales analytics: " + err.message);
        }
      }
    },
  };
  
  export default resolvers;
