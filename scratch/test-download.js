const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { IStorageService } = require('../dist/shared/storage/domain/ports/storage.service.port');

async function main() {
  console.log('Bootstrapping NestJS context for storage test...');
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const storageService = app.get(IStorageService);
    const path = "protocols/152/resolutions/Carta_Resolucion_Consolidada.pdf";
    console.log(`Generating download URL for key: ${path}...`);
    const url = await storageService.getDownloadUrl(path);
    console.log(`Download URL: ${url}`);
    
    console.log('Fetching URL...');
    const response = await fetch(url);
    console.log(`Response status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      console.log(`Successfully fetched! Size: ${buffer.byteLength} bytes.`);
    } else {
      console.log('Failed to fetch file content.');
      const text = await response.text();
      console.log('Response body:', text);
    }
    
    await app.close();
  } catch (err) {
    console.error('Error during test:', err);
  }
}

main();
