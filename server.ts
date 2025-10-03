// server.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors()); 
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: '.' });
});

//API ที่ไม่มีการ Pagination
app.get('/nearby-stations', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const long = parseFloat(req.query.long as string);
    const limit = parseInt(req.query.limit as string) || 5;

    if (isNaN(lat) || isNaN(long)) {
      return res.status(400).json({ error: 'Invalid lat or long' });
    }

    const stations = await prisma.$queryRawUnsafe(
      `
        SELECT
          name,
          en_name,
          lat,
          long,
          (6371 * acos(
            cos(radians($1)) * cos(radians(lat)) * cos(radians(long) - radians($2))
            + sin(radians($1)) * sin(radians(lat))
          )) AS distance
        FROM stations
        ORDER BY distance
        LIMIT $3;
      `,
      lat, long, limit
    );

    res.json(stations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

//API ที่มีการ Pagination
app.get('/nearby-stations-pagination', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const long = parseFloat(req.query.long as string);
    const userLimit = parseInt(req.query.limit as string) || 10; // จำนวนทั้งหมดที่ user ต้องการ
    const page = parseInt(req.query.page as string) || 1;

    if (isNaN(lat) || isNaN(long)) {
      return res.status(400).json({ error: 'Invalid lat or long' });
    }

    // หนึ่งหน้า max 10
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const fetchLimit = Math.min(pageSize, userLimit - offset);

    if (fetchLimit <= 0) {
      return res.json({
        page,
        limit: 0,
        total: userLimit,
        totalPages: Math.ceil(userLimit / pageSize),
        data: []
      });
    }


    const stations = await prisma.$queryRawUnsafe(
      `
      SELECT
        name,
        en_name,
        lat,
        long,
        (6371 * acos(
          cos(radians($1)) * cos(radians(lat)) * cos(radians(long) - radians($2))
          + sin(radians($1)) * sin(radians(lat))
        )) AS distance
      FROM stations
      ORDER BY distance
      LIMIT $3
      OFFSET $4
      `,
      lat, long, fetchLimit, offset
    );

    const totalPages = Math.ceil(userLimit / pageSize);

    res.json({
      page,
      limit: fetchLimit,
      total: userLimit,
      totalPages,
      data: stations
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
