import { useNavigate, useParams } from 'react-router-dom';
import { ProductFormModal } from './ProductFormModal'; // ✅ ایمپورت صحیح

export function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <ProductFormModal
      isOpen={true}
      mode="edit"
      productId={id ? Number(id) : null}
      onClose={() => navigate('/seller/products')}
      onSuccess={() => navigate('/seller/products')}
    />
  );
}
export default EditProduct;
