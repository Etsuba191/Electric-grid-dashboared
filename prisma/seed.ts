import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clear existing data to avoid conflicts on re-seeding
  await prisma.gridAsset.deleteMany();
  await prisma.user.deleteMany();
  console.log('Deleted all existing grid assets and users.');

  
  for (const userData of users) {
    const hashedPassword = await hash(userData.password, 12);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: hashedPassword,
        role: userData.role,
      },
    });
    console.log(`Created ${userData.role.toLowerCase()} user: ${userData.email} with id: ${user.id}`);
  }

  // Seed substations
  const substationsPath = path.join(process.cwd(), 'public', 'Substations.geojson');
  const substationsFile = fs.readFileSync(substationsPath, 'utf-8');
  const substationsData = JSON.parse(substationsFile);

  const substationAssets = substationsData.features.map((feature: any) => {
    const properties = feature.properties;
    const coordinates = feature.geometry.coordinates;
    return {
      id: properties.ORIG_FID.toString(),
      name: properties.Name_First || 'Unknown Substation',
      type: 'substation',
      status: 'normal',
      latitude: coordinates[1],
      longitude: coordinates[0],
      address: properties.Poletical_ || 'Unknown',
      voltage: parseInt(properties.VOLTAGE_LE) || 0,
      load: 0,
      capacity: 0,
      site: properties.Name_First || null,
      zone: properties.New_EEP_Re || null,
      woreda: properties.Poletical_ || null,
      category: properties.TYPE_First || null,
      nameLink: properties.Name_First || null,
    };
  });

  if (substationAssets.length > 0) {
    await prisma.gridAsset.createMany({
      data: substationAssets,
    });
    console.log(`Seeded ${substationAssets.length} substations.`);
  }

  // Seed electric towers
  const towersPath = path.join(process.cwd(), 'public', 'ElectricTowers.geojson');
  const towersFile = fs.readFileSync(towersPath, 'utf-8');
  const towersData = JSON.parse(towersFile);

  const towerAssets = towersData.features.map((feature: any) => {
    const properties = feature.properties;
    const coordinates = feature.geometry.coordinates;
    return {
      id: properties.OBJECTID.toString(),
      name: properties.Link_Name || `Tower ${properties.Barcode}`,
      type: 'tower',
      status: properties.Status?.toLowerCase() || 'unknown',
      latitude: coordinates[1],
      longitude: coordinates[0],
      address: properties.Town || 'Unknown',
      voltage: 0,
      load: 0,
      capacity: 0,
      site: properties.Site_Name || null,
      zone: properties.Zone || null,
      woreda: properties.Woreda || null,
      category: properties.Catagory || null,
      nameLink: properties.Link_Name || null,
    };
  });

  if (towerAssets.length > 0) {
    await prisma.gridAsset.createMany({
      data: towerAssets,
    });
    console.log(`Seeded ${towerAssets.length} electric towers.`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
