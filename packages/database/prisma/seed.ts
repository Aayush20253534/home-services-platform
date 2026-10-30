import 'dotenv/config';
import { PrismaClient, PricingType } from '@prisma/client';

const database = new PrismaClient();

const seedCatalog = [
  {
    slug: 'cleaning',
    name: 'Cleaning',
    sortOrder: 1,
    services: [{ slug: 'bathroom-deep-cleaning', name: 'Bathroom deep cleaning', basePricePaise: 79900, durationMinutes: 90, description: 'Residential bathroom deep-cleaning service', pricingType: PricingType.FIXED }],
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    sortOrder: 2,
    services: [{ slug: 'electrical-inspection', name: 'Electrical inspection', basePricePaise: 24900, durationMinutes: 45, description: 'Initial diagnosis of household electrical faults', pricingType: PricingType.INSPECTION }],
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    sortOrder: 3,
    services: [{ slug: 'tap-leakage-check', name: 'Tap & leakage check', basePricePaise: 19900, durationMinutes: 60, description: 'Initial diagnosis of common leakage problems', pricingType: PricingType.INSPECTION }],
  },
  {
    slug: 'ac-repair',
    name: 'AC Repair',
    sortOrder: 4,
    services: [{ slug: 'ac-service-inspection', name: 'AC service & inspection', basePricePaise: 49900, durationMinutes: 60, description: 'AC inspection and basic service assessment', pricingType: PricingType.INSPECTION }],
  },
  {
    slug: 'appliances',
    name: 'Appliances',
    sortOrder: 5,
    services: [{ slug: 'appliance-diagnosis', name: 'Appliance diagnosis', basePricePaise: 29900, durationMinutes: 45, description: 'Household appliance fault diagnosis', pricingType: PricingType.INSPECTION }],
  },
  {
    slug: 'painting',
    name: 'Painting',
    sortOrder: 6,
    services: [{ slug: 'painting-consultation', name: 'Painting consultation', basePricePaise: 19900, durationMinutes: 30, description: 'Home painting estimate and consultation', pricingType: PricingType.INSPECTION }],
  },
];

async function main(): Promise<void> {
  for (const category of seedCatalog) {
    const savedCategory = await database.serviceCategory.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug, name: category.name, sortOrder: category.sortOrder },
      update: { name: category.name, sortOrder: category.sortOrder },
    });

    for (const service of category.services) {
      await database.service.upsert({
        where: { slug: service.slug },
        create: { ...service, categoryId: savedCategory.id },
        update: { ...service, categoryId: savedCategory.id },
      });
    }
  }

  const count = await database.service.count();
  console.log(`Catalog seed complete: ${seedCatalog.length} categories, ${count} total services.`);
  console.log('Prices are illustrative. No users, bookings or payments were generated.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
