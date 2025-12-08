const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { GraphQLScalarType, Kind } = require('graphql');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Import resolvers and typeDefs
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');

// Database (sử dụng in-memory hoặc kết nối database thực)
const db = require('./database');

// ==================== SCALAR TYPES ====================

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

// DateTime Scalar Type
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize: (value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue: (value) => {
    return new Date(value);
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
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
    DateTime: DateTimeScalar,
  },
});

// ==================== AUTHENTICATION ====================

// JWT Authentication Middleware
const authenticate = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return { user: null };
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const user = await db.users.findById(decoded.userId);
    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null };
  }
};

// ==================== APOLLO SERVER ====================

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

// ==================== EXPRESS APP ====================

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

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mock login endpoint (for development)
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  // In production, verify credentials against database
  const userId = 'user-1'; // Mock user ID
  const token = jwt.sign(
    { userId, email, role: 'user' },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    token,
    user: {
      id: userId,
      email
    }
  });
});

// ==================== START SERVER ====================

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
      console.log(`🔐 Mock login at http://localhost:${PORT}/api/login`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

module.exports = app;