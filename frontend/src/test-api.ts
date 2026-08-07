import { productService, categoryService } from './services/api';
import { logger } from './utils/logger';

async function testApi() {
  logger.info('🧪 Testing API connection...');
  
  try {
    // Test categories
    logger.info('\\n📂 Testing categories...');
    const categories = await categoryService.getCategories();
    logger.info('✓ Categories:', categories.data.length);
    
    // Test products
    logger.info('\\n📦 Testing products...');
    const products = await productService.getProducts();
    logger.info('✓ Products:', products.data.data.length);
    
    // Test featured
    logger.info('\\n⭐ Testing featured products...');
    const featured = await productService.getFeatured();
    logger.info('✓ Featured:', featured.data.length);
    
    logger.info('\\n✅ All API tests passed!');
  } catch (error) {
    logger.error('❌ API test failed:', error);
  }
}

testApi();