
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import Slider from 'react-slick';
import { toast } from 'react-toastify';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Product {
  id: string;
  name: string;
  productCode: string;
  price: number;
  quantity: number;
  brandName: string;
  categoryName: string;
  images: string[];
  isDeleted: boolean;
}

interface Banner {
  id: string;
  image: string;
  headline: string;
  ctaLink: string;
  ctaText: string;
}

interface Category {
  id: string;
  name: string;
}

interface OutletContext {
  addToCart: (product: Product) => void;
}


const API_URL = 'http://localhost:8080/datn';

// Reusable Product Card Component
export const ProductCard: React.FC<{
  product: Product;
  onClick: (id: string) => void;
  addToCart: (product: Product) => void;
}> = ({ product, onClick, addToCart }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(product.id);
    }
  };

  return (
    <div
      onClick={() => onClick(product.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
      className="border rounded-lg shadow-md p-4 bg-white hover:shadow-xl transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      <img
        src={product.images[0] ? `${API_URL}/${product.images[0]}` : '/avatar.png'}
        alt={`${product.brandName} ${product.name} (${product.categoryName})`}
        className="w-full h-40 object-contain rounded-md mb-2"
        onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
        loading="lazy"
      />
      <h3 className="text-sm font-semibold text-[#1F2937] line-clamp-2">{product.name}</h3>
      <p className="text-xs text-gray-500 mt-1">Code: {product.productCode}</p>
      <p className="text-base font-semibold text-[#1F2937] mt-1">{product.price.toLocaleString()} VNĐ</p>
      <div className="mt-auto flex items-center justify-between">
        <div className="text-xs flex items-center">
          {product.quantity > 0 ? (
            <>
              <svg className="w-5 h-5 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              In Stock
            </>
          ) : (
            <span className="text-[#EF4444]">Out of Stock</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (product.quantity > 0) {
              addToCart(product);
              toast.success(`${product.name} added to cart`);
            } else {
              toast.error('Product is out of stock');
            }
          }}
          disabled={product.quantity === 0}
          className="flex items-center px-3 py-1 bg-[#3B82F6] text-white text-xs rounded hover:bg-[#2563EB] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

// Category Icons (Moved from Layout for consistency, ideally in a shared utility)
const getCategoryIcon = (categoryName: string) => {
  const iconClass = 'w-5 h-5 mr-2';
  switch (categoryName) {
    case 'CPU':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
          <rect x="10" y="10" width="4" height="4" fill="currentColor" />
          <line x1="4" y1="10" x2="6" y2="10" strokeWidth="2" />
          <line x1="4" y1="14" x2="6" y2="14" strokeWidth="2" />
          <line x1="18" y1="10" x2="20" y2="10" strokeWidth="2" />
          <line x1="18" y1="14" x2="20" y2="14" strokeWidth="2" />
          <line x1="10" y1="4" x2="10" y2="6" strokeWidth="2" />
          <line x1="14" y1="4" x2="14" y2="6" strokeWidth="2" />
          <line x1="10" y1="18" x2="10" y2="20" strokeWidth="2" />
          <line x1="14" y1="18" x2="14" y2="20" strokeWidth="2" />
        </svg>
      );
    case 'VGA':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth="2" />
          <circle cx="9" cy="12" r="2.5" strokeWidth="2" />
          <line x1="9" y1="9.5" x2="9" y2="14.5" strokeWidth="1.5" />
          <line x1="6.5" y1="12" x2="11.5" y2="12" strokeWidth="1.5" />
          <line x1="7.8" y1="10.2" x2="10.2" y2="13.8" strokeWidth="1.5" />
          <line x1="7.8" y1="13.8" x2="10.2" y2="10.2" strokeWidth="1.5" />
          <rect x="17" y="10" width="3" height="4" fill="currentColor" />
          <circle cx="18" cy="11" r="0.5" fill="black" />
          <circle cx="19" cy="11" r="0.5" fill="black" />
          <circle cx="18" cy="12.5" r="0.5" fill="black" />
          <circle cx="19" cy="12.5" r="0.5" fill="black" />
        </svg>
      );
    case 'Mainboard':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
          <rect x="7" y="7" width="6" height="6" strokeWidth="1.5" />
          <rect x="9" y="9" width="2" height="2" fill="currentColor" />
          <line x1="15" y1="6" x2="19" y2="6" strokeWidth="1" />
          <line x1="15" y1="8" x2="19" y2="8" strokeWidth="1" />
          <line x1="15" y1="12" x2="19" y2="12" strokeWidth="1" />
          <line x1="15" y1="14" x2="19" y2="14" strokeWidth="1" />
          <circle cx="6" cy="18" r="0.8" fill="currentColor" />
          <circle cx="9" cy="18" r="0.8" fill="currentColor" />
          <circle cx="12" cy="18" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'RAM':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth="2" />
          <rect x="5" y="9" width="2" height="4" fill="currentColor" />
          <rect x="8" y="9" width="2" height="4" fill="currentColor" />
          <rect x="11" y="9" width="2" height="4" fill="currentColor" />
          <rect x="14" y="9" width="2" height="4" fill="currentColor" />
          <rect x="17" y="9" width="2" height="4" fill="currentColor" />
          <line x1="6" y1="17" x2="6" y2="21" strokeWidth="1" />
          <line x1="9" y1="17" x2="9" y2="21" strokeWidth="1" />
          <line x1="12" y1="17" x2="12" y2="21" strokeWidth="1" />
          <line x1="15" y1="17" x2="15" y2="21" strokeWidth="1" />
          <line x1="18" y1="17" x2="18" y2="21" strokeWidth="1" />
        </svg>
      );
    case 'SSD':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="2" />
          <text x="8" y="14" fill="currentColor" fontSize="6" fontFamily="Arial">SSD</text>
        </svg>
      );
    case 'HDD':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="5" y="4" width="14" height="16" rx="2" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" />
          <line x1="12" y1="12" x2="15" y2="8" strokeWidth="1" />
        </svg>
      );
    case 'PSU':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
          <line x1="12" y1="9" x2="12" y2="15" strokeWidth="1" />
          <line x1="9" y1="12" x2="15" y2="12" strokeWidth="1" />
          <line x1="10" y1="10" x2="14" y2="14" strokeWidth="1" />
          <line x1="10" y1="14" x2="14" y2="10" strokeWidth="1" />
          <rect x="17" y="8" width="2" height="2" fill="currentColor" />
          <rect x="17" y="12" width="2" height="2" fill="currentColor" />
        </svg>
      );
    case 'Case':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="6" y="3" width="12" height="18" rx="1" strokeWidth="2" />
          <circle cx="12" cy="6" r="1" fill="currentColor" />
          <rect x="9" y="8" width="6" height="2" fill="currentColor" />
          <line x1="9" y1="12" x2="15" y2="12" strokeWidth="1" />
          <line x1="9" y1="14" x2="15" y2="14" strokeWidth="1" />
          <line x1="9" y1="16" x2="15" y2="16" strokeWidth="1" />
        </svg>
      );
    default:
      return null;
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useOutletContext<OutletContext>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  // Memoized carousel banners
  const carouselBanners = useMemo<Banner[]>(() => [
    {
      id: '1',
      image: '/banner1.jpg',
      headline: 'Exclusive Tech Deals!',
      ctaLink: '/products?categoryName=All',
      ctaText: 'Shop Now',
    },
    {
      id: '2',
      image: '/banner2.jpg',
      headline: 'Upgrade Your PC!',
      ctaLink: '/products?categoryName=SSD',
      ctaText: 'Discover Now',
    },
    {
      id: '3',
      image: '/banner3.jpg',
      headline: 'Build Your Dream Rig!',
      ctaLink: '/products?categoryName=Case',
      ctaText: 'Browse Now',
    },
  ], []);

  const sliderSettings = useMemo(() => ({
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    pauseOnHover: true,
    adaptiveHeight: true,
  }), []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products`);
      const productsData = Array.isArray(response.data.result)
        ? response.data.result
        : response.data.result?.data || [];
      if (!Array.isArray(productsData)) throw new Error('Invalid product data format');
      setProducts(productsData.filter((p: Product) => !p.isDeleted));
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/category`);
      const categoriesData = Array.isArray(response.data.result)
        ? response.data.result
        : response.data.result?.data || [];
      if (!Array.isArray(categoriesData)) throw new Error('Invalid category data format');
      setCategories(categoriesData);
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.message : 'Failed to load categories');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Handle product click
  const handleProductClick = useCallback((productId: string) => {
    navigate(`/product/${productId}`);
  }, [navigate]);

  // Handle category click
  const handleCategoryClick = useCallback((category: string) => {
    navigate(`/products?categoryName=${encodeURIComponent(category)}`);
    setShowCategories(false);
  }, [navigate]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const category = product.categoryName || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as { [key: string]: Product[] });
  }, [products]);

  // Skeleton loader
  const renderSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-[200px] sm:h-[300px] md:h-[400px] bg-gray-200 rounded-lg"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg flex flex-col">
            <div className="h-40 bg-gray-300 rounded-md m-4"></div>
            <div className="h-4 bg-gray-300 rounded mx-4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mx-4 w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="container mx-auto p-4">{renderSkeleton()}</div>;

  if (products.length === 0 && categories.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center text-gray-600">
        No products or categories found
        <button
          onClick={() => { fetchProducts(); fetchCategories(); }}
          className="ml-4 px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#EDF2F7] rounded-lg shadow p-4 sticky top-4 h-[350px]">
          <button
            className="md:hidden flex items-center justify-between w-full text-lg font-bold text-[#1F2937] mb-2"
            onClick={() => setShowCategories((prev) => !prev)}
            aria-expanded={showCategories}
            aria-controls="category-list"
          >
            <span className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
              </svg>
              Danh mục
            </span>
            <svg className={`w-5 h-5 transform ${showCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <ul id="category-list" className={`${showCategories ? 'block' : 'hidden'} md:block`}>
            {categories.length === 0 ? (
              <li className="text-gray-600">No categories available</li>
            ) : (
              categories.map((category) => (
                <li
                  key={category.id}
                  onClick={() => handleCategoryClick(category.name)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(category.name); }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${category.name} products`}
                  className="flex items-center text-[#1F2937] hover:text-[#3B82F6] hover:bg-gray-100 px-2 py-2 rounded transition-all duration-200"
                >
                  {getCategoryIcon(category.name)}
                  <span>{category.name}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="md:col-span-3">
          <Slider {...sliderSettings}>
            {carouselBanners.map((banner) => (
              <div key={banner.id} className="relative h-[200px] sm:h-[300px] md:h-[400px] rounded-lg overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.headline}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white p-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">{banner.headline}</h2>
                  <button
                    onClick={() => navigate(banner.ctaLink)}
                    className="mt-4 px-4 py-2 bg-[#3B82F6] rounded hover:bg-[#2563EB] transition-colors"
                    aria-label={banner.ctaText}
                  >
                    {banner.ctaText}
                  </button>
                </div>
              </div>
            ))}
          </Slider>
          <div className="mt-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold text-[#1F2937] mb-4 flex items-center border-b-2 border-gray-200">
              Tất cả sản phẩm
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.slice(0, 9).map((product) => (
                <ProductCard key={product.id} product={product} onClick={handleProductClick} addToCart={addToCart} />
              ))}
            </div>
            {products.length > 9 && (
              <div className="text-center mt-4">
                <button
                  className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
                  onClick={() => navigate('/products?categoryName=All')}
                  aria-label="View more products"
                >
                  View More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <div key={category} className="mb-8 bg-white p-4 rounded-lg shadow">
          <h3 className="text-xl font-bold text-[#1F2937] mb-4 flex items-center border-b-2 border-gray-200">
            {getCategoryIcon(category)} {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categoryProducts.slice(0, 9).map((product) => (
              <ProductCard key={product.id} product={product} onClick={handleProductClick} addToCart={addToCart} />
            ))}
          </div>
          {categoryProducts.length > 9 && (
            <div className="text-center mt-4">
              <button
                className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
                onClick={() => navigate(`/products?categoryName=${encodeURIComponent(category)}`)}
                aria-label={`View more products in ${category}`}
              >
                View More
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
