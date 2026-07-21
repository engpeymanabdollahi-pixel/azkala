import { useNavigate, useParams } from 'react-router-dom';
import { ProductFormModal } from './ProductFormModal'; // ✅ ایمپورت کامپوننت یکپارچه جدید

export function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // اگر این یک صفحه‌ی مستقل است، مودال را همیشه باز نشان می‌دهیم
  // و دکمه بستن آن کاربر را به لیست محصولات برمی‌گرداند
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