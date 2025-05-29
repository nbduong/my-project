import { useEffect, useState, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getToken } from "../services/localStorageService";
import { logOut } from "../services/authenticationService";

interface Product {
  id: number;
  name: string;
  productCode: string;
  price: number;
  images: string[];
  brandName?: string;
  categoryName?: string;
}

interface Category {
  name: string;
}

const API_URL = "http://localhost:8080/datn";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [productName, setProductName] = useState<string | null>(null); // Lưu tên sản phẩm cho breadcrumb
  const searchRef = useRef<HTMLDivElement>(null);

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleLogout = () => {
    logOut();
    window.location.href = "/login";
  };

  const getUserDetails = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/users/myInfo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (data.result?.roles?.some((role: { name: string }) => role.name === "ADMIN")) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchProducts = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Không thể lấy danh sách sản phẩm");
      }

      const data = await response.json();
      const productsData = Array.isArray(data.result) ? data.result : data.result?.data || [];
      setProducts(productsData);

      const uniqueCategories: Category[] = Array.from(
        new Set(
          productsData
            .filter((product: Product) => product.categoryName)
            .map((product: Product) => product.categoryName as string)
        )
      ).map((name) => ({ name }));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Lấy tên sản phẩm cho trang chi tiết
  const fetchProductName = async (accessToken: string, productId: string) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Không thể lấy thông tin sản phẩm");
      }

      const data = await response.json();
      setProductName(data.result?.name || "Sản phẩm");
    } catch (error) {
      console.error("Error fetching product name:", error);
      setProductName("Sản phẩm");
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
      fetchProducts(accessToken);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lấy tên sản phẩm khi ở trang chi tiết
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
      setSearchTerm("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectProduct = (productId: number) => {
    navigate(`/product/${productId}`);
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const isCategoryActive = (categoryName: string) => {
    const params = new URLSearchParams(location.search);
    const currentCategory = params.get("categoryName");
    return currentCategory === categoryName;
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "CPU":
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
      case "VGA":
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
      case "Mainboard":
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
      case "RAM":
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
      case "SSD":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <text x="8" y="14" fill="currentColor" fontSize="6" fontFamily="Arial">
              SSD
            </text>
          </svg>
        );
      case "HDD":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="0.8" fill="currentColor" />
            <line x1="12" y1="12" x2="15" y2="8" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      case "PSU":
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
      case "Case":
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

  // Xây dựng breadcrumb
  const getBreadcrumb = () => {
    const params = new URLSearchParams(location.search);
    const categoryName = params.get("categoryName");
    const query = params.get("query");
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbItems = [];

    if (pathSegments[0] === "products") {
      breadcrumbItems.push({ label: "Trang chủ", path: "/" });
      breadcrumbItems.push({ label: "Sản phẩm", path: "/products" });
      if (categoryName) {
        breadcrumbItems.push({ label: categoryName, path: `/products?categoryName=${encodeURIComponent(categoryName)}` });
      } else if (query) {
        breadcrumbItems.push({ label: `Tìm kiếm: ${query}`, path: `/products?query=${encodeURIComponent(query)}` });
      }
    } else if (pathSegments[0] === "product" && productName) {
      breadcrumbItems.push({ label: "Trang chủ", path: "/" });
      breadcrumbItems.push({ label: "Sản phẩm", path: "/products" });
      breadcrumbItems.push({ label: productName, path: location.pathname });
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
                        src={`${API_URL}/${product.images[0] || "/avatar.png"}`}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded mr-2"
                        onError={(e) => {
                          e.currentTarget.src = "/avatar.png";
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

          {isLoggedIn ? (
            <Link to={isAdmin ? "/admin" : "/user"}>
              <div className="mr-4 right text-white group">
                <div className="flex flex-col items-center">
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
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                    <p>Tài khoản</p>
                  </div>
                  <div className="text-[14px] absolute top-14 w-[130px] bg-white text-black group-hover:flex flex-col text-center hidden">
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 hover:text-[#371A16]"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/login">
              <div className="right text-white group">
                <div className="flex flex-col items-center">
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
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                    <p>Tài khoản</p>
                  </div>
                  <div className="text-[14px] absolute top-14 w-[130px] bg-white text-black group-hover:flex flex-col text-center hidden">
                    <Link to="/login">
                      <button className="px-4 py-2 hover:text-[#371A16]">
                        Đăng nhập
                      </button>
                    </Link>
                    <Link to="/signup">
                      <button className="px-4 py-2 hover:text-[#371A16]">
                        Đăng ký
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </header>
      <nav className="w-full bg-[#371A16] flex items-center justify-center border-t-white border-t-[1px]">
        <div className="h-[60px] flex items-center justify-between container">
          <ul className="px-4 flex space-x-6 text-white">
            <Link
              to="/"
              className={`hover:text-yellow-200 transition-colors ${location.pathname === "/" && !location.search ? "text-yellow-200" : ""
                }`}
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

            {categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.name}
                  to={`/products?categoryName=${encodeURIComponent(category.name)}`}
                  className={`hover:text-yellow-200 transition-colors ${isCategoryActive(category.name) ? "text-yellow-200" : ""
                    }`}
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
      {/* Thanh breadcrumb */}
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
          <Outlet />
        </div>
      </section>
    </div>
  );
}