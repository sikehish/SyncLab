const request = require('supertest');
const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const { initializePorts, getNextAvailablePorts, releasePorts } = require('../utils/portManagement');
const PACKAGE_LIBRARY = require('../utils/packageLibrary');

// Mock external dependencies
jest.mock('child_process');
jest.mock('@prisma/client');
jest.mock('../utils/portManagement');
jest.mock('fs');
jest.mock('ioredis');

// Mock Prisma client
const mockUser = { id: 1, clerkId: 'user123', email: 'test@example.com', name: 'Test User' };
const mockRoom = { 
  roomId: 'room123', 
  containerName: 'ubuntu-vnc-instance-123', 
  websockifyPorts: [5001, 5002],
  osType: 'ubuntu',
  creator: mockUser,
  participants: [mockUser]
};
const mockSnapshot = { 
  id: 1, 
  snapshotName: 'snapshot-1-123', 
  containerName: 'ubuntu-vnc-instance-123',
  userId: 1
};

const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    room: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    snapshot: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn()
    },
    $disconnect: jest.fn()
  };
  
  PrismaClient.mockImplementation(() => prisma);

  const { app, server } = require('../index'); 
// Mock port management
initializePorts.mockImplementation(() => {});
getNextAvailablePorts.mockResolvedValue([5001, 5002]);
releasePorts.mockResolvedValue(true);

// Mock exec
exec.mockImplementation((command, callback) => callback(null, 'success', ''));

describe('User Registration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
   
   
    test('should register a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
   
   
      const response = await request(app)
        .post('/api/register')
        .send({ clerkId: 'user123', email: 'test@example.com', name: 'Test User' });
   
   
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { clerkId: 'user123', email: 'test@example.com', name: 'Test User' }
      });
    });
   
   
    test('should not register an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
   
   
      const response = await request(app)
        .post('/api/register')
        .send({ clerkId: 'user123', email: 'test@example.com', name: 'Test User' });
   
   
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User is already registered!');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
   });
   
   
   describe('Instance Creation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.room.create.mockResolvedValue(mockRoom);
    });
   
   
    test('should create a new instance with valid parameters', async () => {
      const response = await request(app)
        .post('/api/new-instance')
        .send({
          clerkId: 'user123',
          osType: 'ubuntu',
          selectedPackages: ['git', 'curl']
        });
   
   
      expect(response.status).toBe(202);
      expect(response.body.message).toContain('Container is being created');
      expect(getNextAvailablePorts).toHaveBeenCalled();
      expect(exec).toHaveBeenCalled();
    });
   
   
    test('should reject invalid OS type', async () => {
      const response = await request(app)
        .post('/api/new-instance')
        .send({
          clerkId: 'user123',
          osType: 'invalid-os'
        });
   
   
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid OS type');
    });
   
   
    test('should reject invalid packages', async () => {
      const response = await request(app)
        .post('/api/new-instance')
        .send({
          clerkId: 'user123',
          osType: 'ubuntu',
          selectedPackages: ['invalid-package']
        });
   
   
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid packages selected');
    });
   });
   
   
   describe('Room Joining', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      prisma.user.findUnique.mockResolvedValue(mockUser);
    });
   
   
    test('should allow joining an existing room', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
   
   
      const response = await request(app)
        .post('/api/join')
        .send({ roomId: 'room123', clerkId: 'user123' });
   
   
      expect(response.status).toBe(409); //the user is already in the same room
      expect(response.body.containerName).toBe(mockRoom.containerName);
      expect(response.body.websockifyPort).toBe(mockRoom.websockifyPorts[0]);
    });
   
   
    test('should reject joining non-existent room', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
   
   
      const response = await request(app)
        .post('/api/join')
        .send({ roomId: 'nonexistent', clerkId: 'user123' });
   
   
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Room not found');
    });
   });
   
   
   describe('Snapshot Management', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.snapshot.create.mockResolvedValue(mockSnapshot);
    });
   
   
    test('should list user snapshots', async () => {
      prisma.snapshot.findMany.mockResolvedValue([mockSnapshot]);
   
   
      const response = await request(app)
        .get('/api/snapshots/user123');
   
   
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(prisma.snapshot.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id }
      });
    });
   
   
    test('should create a snapshot', async () => {
      prisma.room.findUnique.mockResolvedValue(mockRoom);
   
   
      const response = await request(app)
        .post('/api/snapshot/room123/user123');
   
   
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Snapshot created successfully');
      expect(exec).toHaveBeenCalled();
    });
   });
   
   describe('Room Approval System', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.room.findUnique.mockResolvedValue(mockRoom);
    });
   
   
    test('should handle join request', async () => {
      const response = await request(app)
        .post('/api/request-join')
        .send({ roomId: 'room123', clerkId: 'user123' });
   
   
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Join request sent');
    });
   
   
    test('should approve user', async () => {
      const response = await request(app)
        .post('/api/approve-join')
        .send({ roomId: 'room123', clerkId: 'user123' });
   
   
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('User approved to join');
      expect(prisma.room.update).toHaveBeenCalled();
    });
   });
   
   
   describe('Token Generation', () => {
    test('should generate Agora token', async () => {
      const response = await request(app)
        .post('/api/generate-token')
        .send({ channelName: 'test-channel' });
   
   
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
   
   
    test('should reject token request without channel name', async () => {
      const response = await request(app)
        .post('/api/generate-token')
        .send({});
   
   
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Channel name is required');
    });
   });
   
   
   describe('Error Handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
   
   
    test('should handle internal server errors', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));
   
   
      const response = await request(app)
        .post('/api/register')
        .send({ clerkId: 'user123', email: 'test@example.com', name: 'Test User' });
   
   
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Internal server error');
    });
   });
   
   afterAll((done) => {
    server.close(done);
  });