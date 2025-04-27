import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type CustomerSpending {
    customerId: String!
    totalSpent: Float!
    averageOrderValue: Float!
    lastOrderDate: String
  }

  type TopProduct {
    productId: String!
    name: String!
    totalSold: Int!
  }

  type CategoryRevenue {
    category: String!
    revenue: Float!
  }

  type SalesAnalytics {
    totalRevenue: Float!
    completedOrders: Int!
    categoryBreakdown: [CategoryRevenue!]!
  }

  type Query {
    getCustomerSpending(customerId: String!): CustomerSpending
    getTopSellingProducts(limit: Int!): [TopProduct!]!
    getSalesAnalytics(startDate: String!, endDate: String!): SalesAnalytics
  }
`;

export default typeDefs;
