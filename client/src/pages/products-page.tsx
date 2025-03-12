import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { ProductGrid } from "@/components/products/product-grid";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Products</h1>
          <Input
            className="max-w-xs"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No products found matching your search.
          </p>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </main>
    </div>
  );
}
