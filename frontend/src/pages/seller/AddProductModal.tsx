import { useNavigate } from 'react-router-dom';
import { ProductFormModal } from './ProductFormModal'; // ✅ ایمپورت کامپوننت یکپارچه جدید

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