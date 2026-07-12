import { useNavigate, useParams } from 'react-router-dom';
import { EditProductModal } from './EditProductModal';

export function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();

  if (!productId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">شناسه محصول مشخص نشده است</p>
      </div>
    );
  }

  return (
    <EditProductModal
      isOpen={true}
      productId={parseInt(productId)}
      onClose={() => navigate('/seller/products')}
    />
  );
}