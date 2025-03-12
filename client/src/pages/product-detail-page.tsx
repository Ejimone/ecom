import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { useParams } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/400x300?text=No+Image";
              }}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{product.name}</CardTitle>
              <CardDescription className="text-lg">
                {product.category}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-2xl font-bold">
                ${(product.price / 100).toFixed(2)}
              </p>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() =>
                  addToCart.mutate({ productId: product.id, quantity })
                }
                disabled={addToCart.isPending || product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>

              {product.stock > 0 && (
                <p className="text-sm text-muted-foreground">
                  {product.stock} items in stock
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}