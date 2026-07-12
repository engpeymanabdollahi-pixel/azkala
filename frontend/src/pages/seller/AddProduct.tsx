import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddProductModal } from './AddProductModal';

export function AddProduct() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    navigate('/seller/products');
  };

  return <AddProductModal isOpen={isOpen} onClose={handleClose} />;
}