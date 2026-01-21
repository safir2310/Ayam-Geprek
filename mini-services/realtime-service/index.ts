import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = 3003;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store connected clients
const clients = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (data) => {
    const { userId, role } = data;
    clients.set(socket.id, { userId, role });
    socket.join(role); // Join role-based room (admin or user)
    console.log(`Client ${socket.id} joined as ${role} (User: ${userId})`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clients.delete(socket.id);
  });
});

// Function to broadcast updates to specific roles
function broadcastUpdate(event: string, data: any, targetRole?: string) {
  if (targetRole) {
    io.to(targetRole).emit(event, data);
  } else {
    io.emit(event, data);
  }
  console.log(`Broadcasted ${event} to ${targetRole || 'all'}`);
}

// Expose broadcast function globally for API routes to use
global.broadcastUpdate = broadcastUpdate;

httpServer.listen(PORT, () => {
  console.log(`Realtime service running on port ${PORT}`);
});

export { io };
