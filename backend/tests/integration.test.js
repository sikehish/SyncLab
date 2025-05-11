const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { app, server } = require('../index');
const { redis } = require('../utils/portManagement');

jest.setTimeout(30000);

describe('Integration Tests', () => {
  let prisma;
  let testUsers = [];
  let createdRooms = [];
  let createdSnapshots = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterEach(async () => {
    for (const room of createdRooms) {
      try {
        await prisma.room.deleteMany({
          where: {
            roomId: room.roomId
          }
        });
      } catch (error) {
        console.warn(`Failed to clean up room ${room.roomId}:`, error.message);
      }
    }
    createdRooms = [];

    for (const snapshot of createdSnapshots) {
      try {
        await prisma.snapshot.deleteMany({
          where: {
            snapshotName: snapshot.snapshotName
          }
        });
      } catch (error) {
        console.warn(`Failed to clean up snapshot ${snapshot.snapshotName}:`, error.message);
      }
    }
    createdSnapshots = [];
  });

  afterAll(async () => {
    if (testUsers.length > 0) {
      const testClerkIds = testUsers.map(user => user.clerkId);
      await prisma.user.deleteMany({
        where: {
          clerkId: {
            in: testClerkIds
          }
        }
      });
    }
    
    await prisma.$disconnect();
    await redis.quit();
    server.close();
  });

  describe('User Endpoints', () => {
    test('POST /api/register - should register a new user', async () => {
      const testUser = {
        clerkId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/register')
        .send(testUser);

      testUsers.push(testUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('clerkId', testUser.clerkId);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.message).toBe('User registered successfully');
    });

    test('POST /api/register - should handle duplicate registration', async () => {
      const testUser = {
        clerkId: `dup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: `dup-${Date.now()}@example.com`,
        name: 'Duplicate User'
      };

      await request(app)
        .post('/api/register')
        .send(testUser);

      testUsers.push(testUser);

      const response = await request(app)
        .post('/api/register')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User is already registered!');
    });
  });

  describe('Instance Creation and Management', () => {
    let testUser;

    beforeEach(async () => {
      testUser = {
        clerkId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: `inst-${Date.now()}@example.com`,
        name: 'Instance Test User'
      };

      await request(app)
        .post('/api/register')
        .send(testUser);

      testUsers.push(testUser);
    });

    test('POST /api/new-instance - should create a new instance', async () => {
      const response = await request(app)
        .post('/api/new-instance')
        .send({
          clerkId: testUser.clerkId,
          osType: 'ubuntu',
          selectedPackages: ['git']
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('roomId');
      expect(response.body).toHaveProperty('websockifyPort');
      expect(response.body.osType).toBe('ubuntu');
      expect(response.body.message).toContain('Container is being created');

      if (response.body.roomId) {
        createdRooms.push({ roomId: response.body.roomId });
      }
    });

    test('POST /api/new-instance - should validate OS type', async () => {
      const response = await request(app)
        .post('/api/new-instance')
        .send({
          clerkId: testUser.clerkId,
          osType: 'windows', 
          selectedPackages: ['git']
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid OS type');
    });

    test('POST /api/new-instance - should validate package names', async () => {
      const response = await request(app)
        .post('/api/new-instance')
        .send({
          clerkId: testUser.clerkId,
          osType: 'ubuntu',
          selectedPackages: ['invalid-package'] 
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid packages selected');
    });
  });

  describe('Room Join Flow', () => {
    let testUser;
    let roomId;

    beforeEach(async () => {
      testUser = {
        clerkId: `join-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: `join-${Date.now()}@example.com`,
        name: 'Join Test User'
      };

      await request(app)
        .post('/api/register')
        .send(testUser);

      testUsers.push(testUser);

      const instanceResponse = await request(app)
        .post('/api/new-instance')
        .send({
          clerkId: testUser.clerkId,
          osType: 'ubuntu',
          selectedPackages: []
        });

      roomId = instanceResponse.body.roomId;
      createdRooms.push({ roomId });
    });

    test('POST /api/join - should handle joining a room', async () => {
      const secondUser = {
        clerkId: `second-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: `second-${Date.now()}@example.com`,
        name: 'Second Test User'
      };

      await request(app)
        .post('/api/register')
        .send(secondUser);

      testUsers.push(secondUser);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .post('/api/join')
        .send({
          roomId: roomId,
          clerkId: secondUser.clerkId
        });

        console.log("IKRAM: ",response.body)

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('containerName');
      expect(response.body).toHaveProperty('websockifyPort');
      expect(response.body).toHaveProperty('osType', 'ubuntu');
    });

    test('POST /api/join - should reject invalid room ID', async () => {
      const response = await request(app)
        .post('/api/join')
        .send({
          roomId: 'non-existent-room',
          clerkId: testUser.clerkId
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Room not found');
    });
  });

  describe('Token Generation', () => {
    test('POST /api/generate-token - should generate a token', async () => {
      const response = await request(app)
        .post('/api/generate-token')
        .send({
          channelName: `test-channel-${Date.now()}`
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    test('POST /api/generate-token - should require channel name', async () => {
      const response = await request(app)
        .post('/api/generate-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Channel name is required');
    });
  });

  describe('Username Management', () => {
    test('POST /api/setUsername/:uid/:username - should set a username', async () => {
      const uid = `test-uid-${Date.now()}`;
      const username = `test-username-${Date.now()}`;

      const response = await request(app)
        .post(`/api/setUsername/${uid}/${username}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Username set successfully');

      const getResponse = await request(app)
        .get(`/api/getUsername/${uid}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('username', username);
    });

    test('GET /api/getUsername/:uid - should handle non-existent username', async () => {
      const uid = `non-existent-uid-${Date.now()}`;

      const response = await request(app)
        .get(`/api/getUsername/${uid}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Username not found');
    });
  });

  describe('Available Packages', () => {
    test('GET /api/available-packages - should return package library', async () => {
      const response = await request(app)
        .get('/api/available-packages');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Object);
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });
  });
});