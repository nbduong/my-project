import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Dashboard } from "./page/Dashboard";
import { Login } from "./Authenticate/Login";
import { Signup } from "./Authenticate/Signup";
import { Profile } from "./page/User/Profile";
import { AdminLayout } from "./Layout/AdminLayout";
import { ManageUsers } from "./page/Admin/ManageUsers";
import { ManageProduct } from "./page/Admin/ManageProduct";
import { ManageOrder } from "./page/Admin/ManageOrder";
import { ManageNews } from "./page/Admin/ManageNews";
import { UserLayout } from "./Layout/UserLayout";
import { ManageCategory } from "./page/Admin/ManageCategory";
import { ManageBrand } from "./page/Admin/ManageBrand";
import ProductDetails from "./page/ProductDetails";
import ProductList from "./page/ProductList";
import { CartPage } from "./page/Cart";
import { CheckoutPage } from "./page/Checkout";
import UserOrderPage from "./page/User/UserPageOrder";
import Layout from "./Layout/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/product" element={<ManageProduct />} />
            <Route path="/admin/order" element={<ManageOrder />} />
            <Route path="/admin/news" element={<ManageNews />} />
            <Route path="/admin/category" element={<ManageCategory />} />
            <Route path="/admin/brand" element={<ManageBrand />} />

          </Route>
          <Route path="/user" element={<UserLayout />}>
            <Route path="/user/profile" element={<Profile />} />
            <Route path="/user/order" element={<UserOrderPage />} />
          </Route>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/Cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
