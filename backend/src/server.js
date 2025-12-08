const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Import resolvers and typeDefs
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');

// Database (sử dụng in-memory hoặc kết nối database thực)
const db = require('./database');

// JSON Scalar Type
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.OBJECT) {
      return JSON.parse(JSON.stringify(ast));
    }
    return null;
  },
});

// Create schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...resolvers,
    JSON: JSONScalar,
  },
});

// JWT Authentication Middleware
const authenticate = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return { user: null };
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await db.users.findById(decoded.userId);
    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null };
  }
};

// Create Apollo Server
const createApolloServer = async () => {
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const auth = await authenticate(req);
      return {
        ...auth,
        db,
      };
    },
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      
      // Sanitize error messages in production
      if (process.env.NODE_ENV === 'production') {
        return {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        };
      }
      
      return error;
    },
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
  });

  await server.start();
  return server;
};

// Create Express app
const app = express();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/graphql', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const startServer = async () => {
  try {
    const apolloServer = await createApolloServer();
    
    apolloServer.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false, // Already handled by express cors
    });

    const PORT = process.env.PORT || 4000;
    
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
      console.log(`🏥 Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;