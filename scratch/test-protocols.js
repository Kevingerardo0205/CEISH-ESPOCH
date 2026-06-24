const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ProtocolsService } = require('../dist/modules/protocols/application/services/protocols.service');

async function main() {
  console.log('Bootstrapping NestJS application context...');
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(ProtocolsService);
    console.log('Calling service.findAll({ statusId: 3 })...');
    const result = await service.findAll({ statusId: 3 });
    console.log('Result:', JSON.stringify(result, null, 2));
    await app.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
