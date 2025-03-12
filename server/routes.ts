import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProductSchema, insertOrderSchema, insertCartItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Product routes
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getAllProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(parseInt(req.params.id));
    if (!product) return res.status(404).send("Product not found");
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const product = await storage.createProduct(parsed.data);
    res.status(201).json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const product = await storage.updateProduct(parseInt(req.params.id), req.body);
    if (!product) return res.status(404).send("Product not found");
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const success = await storage.deleteProduct(parseInt(req.params.id));
    if (!success) return res.status(404).send("Product not found");
    res.sendStatus(204);
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const items = await storage.getCartItems(req.user.id);
    res.json(items);
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const parsed = insertCartItemSchema.safeParse({
      ...req.body,
      userId: req.user.id
    });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const item = await storage.addToCart(parsed.data);
    res.status(201).json(item);
  });

  app.delete("/api/cart/:productId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const success = await storage.removeFromCart(
      req.user.id,
      parseInt(req.params.productId)
    );
    if (!success) return res.status(404).send("Cart item not found");
    res.sendStatus(204);
  });

  app.patch("/api/cart/:productId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const item = await storage.updateCartItemQuantity(
      req.user.id,
      parseInt(req.params.productId),
      req.body.quantity
    );
    if (!item) return res.status(404).send("Cart item not found");
    res.json(item);
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const orders = req.user.isAdmin
      ? await storage.getAllOrders()
      : await storage.getUserOrders(req.user.id);
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const parsed = insertOrderSchema.safeParse({
      ...req.body,
      userId: req.user.id
    });
    if (!parsed.success) return res.status(400).json(parsed.error);
    const order = await storage.createOrder(parsed.data);
    await storage.clearCart(req.user.id);
    res.status(201).json(order);
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const order = await storage.updateOrderStatus(
      parseInt(req.params.id),
      req.body.status
    );
    if (!order) return res.status(404).send("Order not found");
    res.json(order);
  });

  // User management (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const users = await storage.getAllUsers();
    res.json(users);
  });

  const httpServer = createServer(app);
  return httpServer;
}
