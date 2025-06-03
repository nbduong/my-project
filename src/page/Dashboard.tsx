import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  productCode: string;
  description: string | null;
  price: number;
  quantity: number;
  brandName: string;
  categoryName: string;
  images: string[];
  specifications: { [key: string]: string };
  isDeleted: boolean; // Thêm isDeleted vào interface
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm] = useState<string>('');
  const [sortField] = useState<keyof Product | ''>('');
  const API_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : 'http://localhost:8080/datn';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        const productsData = Array.isArray(response.data.result)
          ? response.data.result
          : response.data.result?.data || [];
        if (!Array.isArray(productsData)) throw new Error('Dữ liệu sản phẩm không hợp lệ');
        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách sản phẩm');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const filteredProducts = products.filter(
    (product) =>
      !product.isDeleted && // Chỉ hiển thị sản phẩm có isDeleted là false
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === 'price' || sortField === 'quantity') {
      return (a[sortField] as number) - (b[sortField] as number);
    }
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    return aValue.toString().localeCompare(bValue.toString());
  });

  // Nhóm sản phẩm theo danh mục
  const groupedProducts = sortedProducts.reduce((acc, product) => {
    if (!acc[product.categoryName]) {
      acc[product.categoryName] = [];
    }
    acc[product.categoryName].push(product);
    return acc;
  }, {} as { [key: string]: Product[] });

  if (loading) return <div className="text-center text-xl text-gray-600">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (Object.keys(groupedProducts).length === 0) return <div className="text-center text-gray-600">Không tìm thấy sản phẩm</div>;

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "CPU":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="10" y="10" width="4" height="4" fill="currentColor" />
            <line x1="4" y1="10" x2="6" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="4" y1="14" x2="6" y2="14" stroke="currentColor" strokeWidth="2" />
            <line x1="18" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="18" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="4" x2="10" y2="6" stroke="currentColor" strokeWidth="2" />
            <line x1="14" y1="4" x2="14" y2="6" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="18" x2="10" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="14" y1="18" x2="14" y2="20" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case "VGA":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="9" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="9.5" x2="9" y2="14.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="6.5" y1="12" x2="11.5" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7.8" y1="10.2" x2="10.2" y2="13.8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7.8" y1="13.8" x2="10.2" y2="10.2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="17" y="10" width="3" height="4" fill="currentColor" />
            <circle cx="18" cy="11" r="0.5" fill="black" />
            <circle cx="19" cy="11" r="0.5" fill="black" />
            <circle cx="18" cy="12.5" r="0.5" fill="black" />
            <circle cx="19" cy="12.5" r="0.5" fill="black" />
          </svg>
        );
      case "Mainboard":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="7" y="7" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="9" y="9" width="2" height="2" fill="currentColor" />
            <line x1="15" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1" />
            <circle cx="6" cy="18" r="0.8" fill="currentColor" />
            <circle cx="9" cy="18" r="0.8" fill="currentColor" />
            <circle cx="12" cy="18" r="0.8" fill="currentColor" />
          </svg>
        );
      case "RAM":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="5" y="9" width="2" height="4" fill="currentColor" />
            <rect x="8" y="9" width="2" height="4" fill="currentColor" />
            <rect x="11" y="9" width="2" height="4" fill="currentColor" />
            <rect x="14" y="9" width="2" height="4" fill="currentColor" />
            <rect x="17" y="9" width="2" height="4" fill="currentColor" />
            <line x1="6" y1="17" x2="6" y2="21" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="17" x2="9" y2="21" stroke="currentColor" strokeWidth="1" />
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1" />
            <line x1="15" y1="17" x2="15" y2="21" stroke="currentColor" strokeWidth="1" />
            <line x1="18" y1="17" x2="18" y2="21" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      case "SSD":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <text x="8" y="14" fill="currentColor" fontSize="6" fontFamily="Arial">
              SSD
            </text>
          </svg>
        );
      case "HDD":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="0.8" fill="currentColor" />
            <line x1="12" y1="12" x2="15" y2="8" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      case "PSU":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="14" x2="14" y2="10" stroke="currentColor" strokeWidth="1" />
            <rect x="17" y="8" width="2" height="2" fill="currentColor" />
            <rect x="17" y="12" width="2" height="2" fill="currentColor" />
          </svg>
        );
      case "Case":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="6" y="3" width="12" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="6" r="1" fill="currentColor" />
            <rect x="9" y="8" width="6" height="2" fill="currentColor" />
            <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <div key={category} className="mb-8 bg-white p-4 rounded-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b-2 border-[#331A17] border-opacity-40">{getCategoryIcon(category)} {category || 'Danh mục khác'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categoryProducts.slice(0, 10).map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="border rounded-lg shadow-md p-2 bg-gray-100 hover:shadow-2xl transition-shadow duration-200 cursor-pointer flex flex-col h-full"
              >
                <img
                  src={`${API_URL}/${product.images[0] || '/avatar.png'}`}
                  alt={`${product.name} thumbnail`}
                  className="w-full h-40 object-cover rounded-md mb-2"
                  onError={(e) => {
                    e.currentTarget.src = '/avatar.png';
                  }}
                />
                <h3 className="text-xs text-gray-800 font-semibold line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-600 mt-1">Mã: {product.productCode}</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {product.price.toLocaleString()} VNĐ
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="text-xs text-green-500 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Sẵn sàng
                  </div>
                  <div>
                    <button
                      className="flex items-center px-2 py-1 bg-[#371A16] text-white text-xs rounded hover:bg-yellow-200 hover:text-[#371A16] transition-colors"
                    >
                      Mua ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {categoryProducts.length > 10 && (
            <div className="text-center mt-4">
              <button
                className="px-4 py-2 bg-[#371A16] text-white rounded hover:bg-yellow-200 hover:text-[#371A16] transition-colors"
                onClick={() => navigate(`/products?categoryName=${encodeURIComponent(category || 'Danh mục khác')}`)}
              >
                Xem thêm
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};