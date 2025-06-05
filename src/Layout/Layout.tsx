import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { getToken, loadCart, saveCart, clearCart } from '../services/localStorageService';
import { logOut } from '../services/authenticationService';

interface Product {
  id: string;
  name: string;
  productCode: string;
  price: number;
  images: string[];
  brandName?: string;
  categoryName?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Category {
  name: string;
}

const API_URL = 'http://localhost:8080/datn';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [productName, setProductName] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const toggleAccountMenu = () => {
    setShowAccountMenu((prev) => !prev);
  };
  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Load cart from localStorage
  useEffect(() => {
    setCartItems(loadCart());
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  // Clear cart after successful payment
  const handleClearCart = () => {
    setCartItems([]);
    clearCart();
  };

  const handleLogout = () => {
    logOut();
    window.location.href = "/"
  };

  const getUserDetails = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/users/myInfo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.result?.roles?.some((role: { name: string }) => role.name === 'ADMIN')) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/category`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Không thể lấy danh sách danh mục');
      }

      const data = await response.json();
      const categoriesData = Array.isArray(data.result) ? data.result : data.result?.data || [];
      console.log(categoriesData);
      setCategories(categoriesData);
      setCategoryError(null);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoryError('Không thể tải danh mục. Vui lòng thử lại.');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'GET'

      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) {
        throw new Error('Không thể lấy danh sách sản phẩm');
      }

      const data = await response.json();
      const productsData = Array.isArray(data.result) ? data.result : data.result?.data || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchProductName = async (accessToken: string, productId: string) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) {
        throw new Error('Không thể lấy thông tin sản phẩm');
      }

      const data = await response.json();
      setProductName(data.result?.name || 'Sản phẩm');
    } catch (error) {
      console.error('Error fetching product name:', error);
      setProductName('Sản phẩm');
    }
  };

  const filterSuggestions = (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.productCode.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const debouncedFilterSuggestions = debounce(filterSuggestions, 300);

  useEffect(() => {
    const accessToken = getToken();
    if (accessToken) {
      getUserDetails(accessToken);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setCategoryError(null);
    }
    fetchCategories();
    fetchProducts();
  }, [navigate]);

  useEffect(() => {
    debouncedFilterSuggestions(searchTerm);
  }, [searchTerm, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const accessToken = getToken();
    const productId = location.pathname.match(/\/product\/(\d+)/)?.[1];
    if (accessToken && productId) {
      fetchProductName(accessToken, productId);
    } else {
      setProductName(null);
    }
  }, [location.pathname]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/products?query=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
      setSearchTerm('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectProduct = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const isCategoryActive = (categoryName: string) => {
    const params = new URLSearchParams(location.search);
    const currentCategory = params.get('categoryName');
    return currentCategory === categoryName;
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'CPU':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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
      case 'VGA':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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
      case 'Mainboard':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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
      case 'RAM':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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
      case 'SSD':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <text x="8" y="14" fill="currentColor" fontSize="6" fontFamily="Arial">
              SSD
            </text>
          </svg>
        );
      case 'HDD':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="0.8" fill="currentColor" />
            <line x1="12" y1="12" x2="15" y2="8" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      case 'PSU':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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
      case 'Case':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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

  const getBreadcrumb = () => {
    const params = new URLSearchParams(location.search);
    const categoryName = params.get('categoryName');
    const query = params.get('query');
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems = [];

    if (pathSegments[0] === 'products') {
      breadcrumbItems.push({ label: 'Trang chủ', path: '/' });
      breadcrumbItems.push({ label: 'Sản phẩm', path: '/products' });
      if (categoryName) {
        breadcrumbItems.push({ label: categoryName, path: `/products?categoryName=${encodeURIComponent(categoryName)}` });
      } else if (query) {
        breadcrumbItems.push({ label: `Tìm kiếm: ${query}`, path: `/products?query=${encodeURIComponent(query)}` });
      }
    } else if (pathSegments[0] === 'product' && productName) {
      breadcrumbItems.push({ label: 'Trang chủ', path: '/' });
      breadcrumbItems.push({ label: 'Sản phẩm', path: '/products' });
      breadcrumbItems.push({ label: productName, path: location.pathname });
    } else if (pathSegments[0] === 'cart') {
      breadcrumbItems.push({ label: 'Trang chủ', path: '/' });
      breadcrumbItems.push({ label: 'Giỏ hàng', path: '/cart' });
    }

    return breadcrumbItems;
  };

  return (
    <div>
      <header className="w-full bg-[#371A16] flex items-center justify-center">
        <div className="h-[100px] flex items-center justify-between container">
          <div className="left flex items-center justify-center">
            <Link to="/">
              <div className="logo w-[140px] h-[80px] mr-12">
                <img src="/logo.png" alt="logo.png" className="w-full h-full ml-[-20px]" />
              </div>
            </Link>
            <div className="search-box relative" ref={searchRef}>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="white"
                  className="size-6 text-black z-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Bạn đang tìm kiếm sản phẩm gì?"
                  className="w-[545px] p-3 rounded-lg ml-[-30px] pl-10 bg-white text-gray-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => searchTerm && setShowSuggestions(true)}
                />
                <button
                  onClick={handleSearch}
                  className="ml-[-100px] border-l border-black px-4 py-2"
                >
                  Tìm kiếm
                </button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-[530px] bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto z-50">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <img
                        src={`${API_URL}/${product.images[0] || '/avatar.png'}`}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded mr-2"
                        onError={(e) => {
                          e.currentTarget.src = '/avatar.png';
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800">{product.name}</span>
                        <span className="text-sm text-gray-600">
                          {product.price.toLocaleString()} VNĐ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group h-[100px] flex items-center">
              <Link to="/chatbot" className="text-white">
                <div className="flex flex-col items-center relative mr-4">
                  <div className="hover:opacity-50 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>

                    <p>Chat Bot</p>
                    
                  </div>
                </div>
              </Link>
              <Link to="/cart" className="text-white">
                <div className="flex flex-col items-center relative">
                  <div className="hover:opacity-50 flex flex-col items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                      />
                    </svg>
                    <p>Giỏ hàng</p>
                    {getTotalItems() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {getTotalItems()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="absolute top-20 right-[-100px] w-[500px] bg-white border rounded-lg mt-1 shadow-lg max-h-96 overflow-y-auto z-50 hidden group-hover:block transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                {cartItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-600">Giỏ hàng trống</div>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center p-2 border-b hover:bg-gray-100"
                      >
                        <img
                          src={`${API_URL}/${item.product.images[0] || '/avatar.png'}`}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded mr-2"
                          onError={(e) => {
                            e.currentTarget.src = '/avatar.png';
                          }}
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-800">{item.product.name}</span>
                          <div className="flex items-center mt-1">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="mx-2 text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {(item.product.price * item.quantity).toLocaleString()} VNĐ
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-2 text-red-500 hover:text-red-700 font-bold"
                        >
                          X
                        </button>
                      </div>
                    ))}
                    <div className="p-4 border-t">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Tổng cộng:</span>
                        <span>{getTotalPrice().toLocaleString()} VNĐ</span>
                      </div>
                      <Link
                        to="/cart"
                        className="block mt-2 bg-[#371A16] text-white text-center py-2 rounded hover:bg-[#4a2420]"
                      >
                        Xem giỏ hàng
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="relative" ref={accountRef}>
              {isLoggedIn ? (
                <div className="text-white h-[100px] flex items-center">
                  <button
                    onClick={toggleAccountMenu}
                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                    <p>Tài khoản</p>
                  </button>
                  {showAccountMenu && (
                    <div className="absolute top-20 left-[-30px] w-32 text-center bg-white text-black rounded-lg shadow-lg z-50 transform transition-all duration-200 ease-in-out">
                      <Link
                        to={isAdmin ? '/admin' : '/user'}
                        className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors rounded-t-lg"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        {isAdmin ? 'Quản trị' : 'Tài khoản'}
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowAccountMenu(false);
                        }}
                        className="w-full text-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors rounded-b-lg"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-white h-[100px] flex items-center">
                  <button
                    onClick={toggleAccountMenu}
                    className="flex flex-col items-center hover:opacity-80 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                    <p>Tài khoản</p>
                  </button>
                  {showAccountMenu && (
                    <div className="absolute top-20 left-[-30px] w-32 text-center bg-white text-black rounded-lg shadow-lg z-50 transform transition-all duration-200 ease-in-out">
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors rounded-t-lg"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/signup"
                        className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors rounded-b-lg"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <nav className="w-full bg-[#371A16] flex items-center justify-center border-t-white border-t-[1px]">
        <div className="h-[60px] flex items-center justify-between container">
          <ul className="px-4 flex space-x-6 text-white">
            <Link
              to="/"
              className={`hover:text-yellow-200 transition-colors ${location.pathname === '/' && !location.search ? 'text-yellow-200' : ''}`}
            >
              <li className="h-[60px] flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="mr-2 size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>
                Tất cả
              </li>
            </Link>

            {categoryError ? (
              <li className="text-red-400">{categoryError}</li>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.name}
                  to={`/products?categoryName=${encodeURIComponent(category.name)}`}
                  className={`hover:text-yellow-200 transition-colors ${isCategoryActive(category.name) ? 'text-yellow-200' : ''}`}
                >
                  <li className="h-[60px] flex items-center">
                    {getCategoryIcon(category.name)}
                    {category.name}
                  </li>
                </Link>
              ))
            ) : (
              <li className="text-gray-400">Đang tải danh mục...</li>
            )}
          </ul>
        </div>
      </nav>
      <div className="ml-4 w-full flex items-center justify-center py-3">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="flex space-x-2 text-gray-600 text-[12px]">
              {getBreadcrumb().map((item, index) => (
                <li key={item.path} className="flex items-center">
                  {index < getBreadcrumb().length - 1 ? (
                    <>
                      <Link to={item.path} className="hover:text-[#371A16]">
                        {item.label}
                      </Link>
                      <span className="mx-2">/</span>
                    </>
                  ) : (
                    <span className="text-[#371A16] font-semibold">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
      <section className="flex justify-center">
        <div className="container">
          <Outlet context={{ addToCart, cartItems, removeFromCart, updateQuantity, getTotalItems, getTotalPrice, clearCart: handleClearCart }} />
        </div>
      </section>
      <footer className="w-full bg-[#371A16] text-white py-8 mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Thông tin cửa hàng</h3>
              <p className="text-sm">Địa chỉ: 1905 Vũ Tông Phan, Thanh Xuân, Hà Nội</p>
              <p className="text-sm">Điện thoại: (035) 2398 952</p>
              <p className="text-sm">Email: nbduong1905@gmail.com</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Liên kết nhanh</h3>
              <ul className="text-sm space-y-2">
                <li>
                  <Link to="/" className="hover:text-yellow-200">Trang chủ</Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-yellow-200">Sản phẩm</Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-yellow-200">Giỏ hàng</Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-yellow-200">Về chúng tôi</Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-yellow-200">Liên hệ</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Theo dõi chúng tôi</h3>
              <div className="flex space-x-4">
                <a href="https://web.facebook.com/Zawser19" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} GearVN. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}