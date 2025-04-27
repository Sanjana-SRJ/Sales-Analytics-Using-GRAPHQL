import express  from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

import typeDefs from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';

async function startServer() {
  const app = express();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  server.applyMiddleware({ app });

  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

  app.listen({ port: 4000 }, () =>
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}

startServer();
