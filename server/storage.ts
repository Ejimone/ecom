import { 
  User, InsertUser, 
  Product, InsertProduct,
  Order, InsertOrder,
  CartItem, InsertCartItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Product management
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  
  // Order management
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Cart management
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(userId: number, productId: number): Promise<boolean>;
  getCartItems(userId: number): Promise<CartItem[]>;
  updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | undefined>;
  clearCart(userId: number): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private cartItems: Map<string, CartItem>;
  private currentIds: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.cartItems = new Map();
    this.currentIds = {
      users: 1,
      products: 1,
      orders: 1,
      cartItems: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    // Make the first user an admin
    const isAdmin = (await this.getAllUsers()).length === 0;
    const user: User = { ...insertUser, id, isAdmin };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentIds.products++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...product };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.currentIds.orders++;
    const newOrder: Order = { 
      ...order, 
      id, 
      createdAt: new Date() 
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  // Cart methods
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const id = this.currentIds.cartItems++;
    const cartKey = `${item.userId}-${item.productId}`;
    const newItem: CartItem = { ...item, id };
    this.cartItems.set(cartKey, newItem);
    return newItem;
  }

  async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const cartKey = `${userId}-${productId}`;
    return this.cartItems.delete(cartKey);
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
  }

  async updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | undefined> {
    const cartKey = `${userId}-${productId}`;
    const item = this.cartItems.get(cartKey);
    if (!item) return undefined;
    const updated = { ...item, quantity };
    this.cartItems.set(cartKey, updated);
    return updated;
  }

  async clearCart(userId: number): Promise<void> {
    const userItems = await this.getCartItems(userId);
    for (const item of userItems) {
      this.cartItems.delete(`${userId}-${item.productId}`);
    }
  }
}

export const storage = new MemStorage();