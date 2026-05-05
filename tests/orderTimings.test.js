const request = require('supertest');
const app = require('../server');

describe('Order timings API', () => {
  test('GET /admin/api/orderTimings returns 200 and data array', async () => {
    const res = await request(app).get('/admin/api/orderTimings');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
