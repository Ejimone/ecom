import { useQuery } from "@tanstack/react-query";
import { CartItem, Product } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const cartItemsWithProducts = cartItems.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId)
  }));

  const total = cartItemsWithProducts.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    try {
      await apiRequest("POST", "/api/orders", {
        status: "pending",
        total,
        items: cartItemsWithProducts.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.product?.name || "",
          price: item.product?.price || 0
        }))
      });
      
      toast({
        title: "Order placed successfully",
        description: "Thank you for your purchase!",
      });
    } catch (error) {
      toast({
        title: "Failed to place order",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItemsWithProducts.map(item => {
                const product = item.product;
                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-muted-foreground">
                        ${(product.price / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newQuantity = Math.max(1, item.quantity - 1);
                          updateQuantity.mutate({
                            productId: item.productId,
                            quantity: newQuantity,
                          });
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newQuantity = Math.min(
                            product.stock,
                            item.quantity + 1
                          );
                          updateQuantity.mutate({
                            productId: item.productId,
                            quantity: newQuantity,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeFromCart.mutate(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 border rounded-lg space-y-4">
                <h2 className="text-xl font-semibold">Order Summary</h2>
                <div className="flex justify-between py-2 border-b">
                  <span>Subtotal</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between py-2 font-semibold">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Payment will be collected upon delivery
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
