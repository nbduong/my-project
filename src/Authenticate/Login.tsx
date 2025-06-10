import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, setToken } from "../services/localStorageService";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate("/");
    }
  }, [navigate]);

  const validateForm = () => {
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
      setError("Tên tài khoản phải từ 4-20 ký tự, chỉ chứa chữ, số và dấu gạch dưới");
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/.test(password)) {
      setError("Mật khẩu phải từ 8-20 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    fetch("http://localhost:8080/datn/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code !== 0) throw new Error(data.message);
        setToken(data.result?.token);
        navigate("/dashboard");
      })
      .catch((err) => {
        setError("Đăng nhập thất bại: " + err.message);
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg"
      >
        <h2 className="text-3xl font-bold text-center text-[#1E3A8A] mb-4">
          ĐĂNG NHẬP
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Nếu bạn chưa có tài khoản,{" "}
          <Link to="/signup" className="text-[#3B82F6] font-medium hover:underline">
            đăng ký tại đây
          </Link>
        </p>

        {error && (
          <div className="bg-[#EF4444]/10 text-[#EF4444] p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Input Username */}
        <div className="mb-6 relative">
          <label
            htmlFor="username"
            className={`absolute left-3 transition-all duration-300 text-sm font-medium ${username
              ? "top-[-10px] text-[#1E3A8A] bg-white px-1"
              : "top-1/2 -translate-y-1/2 text-gray-500"
              }`}
          >
            Tài khoản <sup className="text-[#EF4444]">*</sup>
          </label>
          <input
            type="text"
            id="username"
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            required
            aria-label="Tài khoản"
          />
        </div>

        {/* Input Password */}
        <div className="mb-6 relative">
          <label
            htmlFor="password"
            className={`absolute left-3 transition-all duration-300 text-sm font-medium ${password
              ? "top-[-10px] text-[#1E3A8A] bg-white px-1"
              : "top-1/2 -translate-y-1/2 text-gray-500"
              }`}
          >
            Mật khẩu <sup className="text-[#EF4444]">*</sup>
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"

            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all pr-10"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
            aria-label="Mật khẩu"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1E3A8A] hover:text-[#2563EB]"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="mb-6 flex justify-between items-center text-sm">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              className="mr-2 rounded focus:ring-[#3B82F6]"
            />
            <label htmlFor="rememberMe" className="text-gray-600">
              Nhớ tài khoản
            </label>
          </div>
          <Link
            to="/forgot"
            className="text-[#3B82F6] font-medium hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="w-[200px] py-2 bg-[#3B82F6] text-white font-semibold rounded-md hover:bg-[#2563EB] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label="Đăng nhập"
          >
            Đăng nhập
          </button>
        </div>
      </form>
    </div>
  );
};