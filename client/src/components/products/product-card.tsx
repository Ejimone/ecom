import { Product } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="block">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-48 w-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/400x300?text=No+Image";
            }}
          />
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <div className="block">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
          </div>
        </Link>
        <p className="text-muted-foreground text-sm truncate">
          {product.description}
        </p>
        <p className="mt-2 text-lg font-bold">
          ${(product.price / 100).toFixed(2)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={() => addToCart.mutate({ productId: product.id, quantity: 1 })}
          disabled={addToCart.isPending || product.stock === 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}