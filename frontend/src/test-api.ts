import { productService, categoryService } from './services/api';

async function testApi() {
  console.log('🧪 Testing API connection...');
  
  try {
    // Test categories
    console.log('\n📂 Testing categories...');
    const categories = await categoryService.getCategories();
    console.log('✓ Categories:', categories.data.length);
    
    // Test products
    console.log('\n📦 Testing products...');
    const products = await productService.getProducts();
    console.log('✓ Products:', products.data.data.length);
    
    // Test featured
    console.log('\n⭐ Testing featured products...');
    const featured = await productService.getFeatured();
    console.log('✓ Featured:', featured.data.length);
    
    console.log('\n✅ All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testApi();