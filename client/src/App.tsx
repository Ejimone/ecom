import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import AuthPage from "@/pages/auth-page";
import ProductsPage from "@/pages/products-page";
import ProductDetailPage from "@/pages/product-detail-page";
import CartPage from "@/pages/cart-page";
import OrdersPage from "@/pages/orders-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminUsers from "@/pages/admin/users";
import AdminOrders from "@/pages/admin/orders";
import NotFound from "@/pages/not-found";

function AdminRoute({ path, component: Component }: { path: string; component: () => JSX.Element }) {
  return (
    <ProtectedRoute
      path={path}
      component={() => {
        const { user } = useAuth();
        if (!user?.isAdmin) return <Redirect to="/" />;
        return <Component />;
      }}
    />
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={ProductsPage} />
      <ProtectedRoute path="/products/:id" component={ProductDetailPage} />
      <ProtectedRoute path="/cart" component={CartPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/products" component={AdminProducts} />
      <AdminRoute path="/admin/users" component={AdminUsers} />
      <AdminRoute path="/admin/orders" component={AdminOrders} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;