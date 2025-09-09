import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Seed GridAssets from GeoJSON ---
  const filePath = path.join(process.cwd(), 'data', 'ethiopia-regions.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const topology = JSON.parse(fileContents) as Topology;

  // IMPORTANT: This script dynamically finds the first object key in your TopoJSON file.
  // If you have multiple objects, you might need to specify the correct one.
  const geojsonKey = Object.keys(topology.objects)[0];
  if (!geojsonKey) {
    console.error(
      "Could not find a feature collection key in your TopoJSON file's 'objects' property."
    );
    process.exit(1);
  }
  console.log(`Using TopoJSON object key: ${geojsonKey}`);
  const geojson = feature(topology, topology.objects[geojsonKey]);

  if (geojson.type !== 'FeatureCollection') {
    console.error('The converted GeoJSON is not a FeatureCollection.');
    return;
  }

  const assetsToCreate = [];

  for (const f of geojson.features) {
    if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
      let longitude: number | undefined;
      let latitude: number | undefined;

      // A simple way to get a representative point.
      // For Polygons, take the first coordinate of the first ring.
      // For MultiPolygons, take the first coordinate of the first polygon's first ring.
      if (f.geometry.type === 'Polygon' && f.geometry.coordinates[0]?.length > 0) {
        [longitude, latitude] = f.geometry.coordinates[0][0];
      } else if (f.geometry.type === 'MultiPolygon' && f.geometry.coordinates[0]?.[0]?.length > 0) {
        [longitude, latitude] = f.geometry.coordinates[0][0][0];
      }

      if (longitude !== undefined && latitude !== undefined) {
        // IMPORTANT: Adjust property names (e.g., REGIONNAME) to match your GeoJSON file.
        const name = f.properties?.REGIONNAME || f.properties?.name || `Unnamed Region ${assetsToCreate.length + 1}`;

        const assetData = {
          name: name,
          type: 'Region', // Default type
          status: 'Active', // Default status
          latitude: latitude,
          longitude: longitude,
          address: f.properties?.address || `${name}, Ethiopia`,
          voltage: 220, // Dummy data, please adjust
          load: Math.random() * 100, // Dummy data, please adjust
          capacity: 1000, // Dummy data, please adjust
          lastUpdate: new Date(),
          site: f.properties?.site || null,
          zone: f.properties?.zone || null,
          woreda: f.properties?.woreda || null,
          category: 'Geographical', // Default category
          nameLink: name.toLowerCase().replace(/ /g, '-')
        };
        assetsToCreate.push(assetData);
      }
    }
  }

  if (assetsToCreate.length > 0) {
    console.log(`Deleting existing grid assets...`);
    await prisma.gridAsset.deleteMany({});

    console.log(`Creating ${assetsToCreate.length} grid assets...`);
    await prisma.gridAsset.createMany({
      data: assetsToCreate,
      skipDuplicates: true,
    });
    console.log(`Seeded ${assetsToCreate.length} grid assets.`);
  } else {
    console.log('No grid assets to create from the GeoJSON file.');
  }

  // --- Seed Users (optional) ---
  console.log(`Seeding users...`);
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user: ${adminUser.email} with password "password123"`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });