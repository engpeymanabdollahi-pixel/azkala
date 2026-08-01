import { useNavigate } from 'react-router-dom';
import { ProductFormModal } from './ProductFormModal'; // ✅ ایمپورت صحیح

export function AddProduct() {
  const navigate = useNavigate();

  return (
    <ProductFormModal
      isOpen={true}
      mode="create"
      productId={null}
      onClose={() => navigate('/seller/products')}
      onSuccess={() => navigate('/seller/products')}
    />
  );
}
export default AddProduct;
