const request = require('supertest');
const express = require('express');
const exampleRoutes = require('../routes/exampleRoutes');

const app = express();
app.use(express.json());
app.use('/api', exampleRoutes);

describe('GET /api/example', () => {
  it('should return example response', async () => {
    const res = await request(app).get('/api/example');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Example response from controller');
  });
});
