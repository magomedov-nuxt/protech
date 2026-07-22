export type MoneyLike = number | string | null | undefined;

export type ShopUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
};

export type Category = {
  id: number;
  name: string;
};

export type ProductCardItem = {
  id: number;
  name: string;
  currentPrice: MoneyLike;
  oldPrice: MoneyLike;
  mainImage: string;
  category?: Pick<Category, "name">;
  stockQuantity?: number;
  reviewsCount?: number;
  averageRating?: number | null;
  productAttributes?: Array<{
    value: string;
    attribute: {
      name: string;
      unit: string;
    };
  }>;
};

export type ProductPriceRange = {
  minPrice: number;
  maxPrice: number;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type ProductCatalogResponse = {
  items: ProductCardItem[];
  pagination: Pagination;
};

export type ProductDetails = {
  id: number;
  name: string;
  description: string;
  currentPrice: MoneyLike;
  oldPrice: MoneyLike;
  article: string;
  mainImage: string;
  ozonLink: string | null;
  category: Category;
  productImages: Array<{
    id: number;
    url: string;
  }>;
  productAttributes: Array<{
    id: number;
    value: string;
    attributeId: number;
    attribute: {
      id: number;
      name: string;
      unit: string;
    };
  }>;
  productPrices: Array<{
    id: number;
    value: MoneyLike;
    createdAt: string;
  }>;
  productStocks: Array<{
    quantity: number;
  }>;
  reviews: ReviewItem[];
};

export type ReviewItem = {
  id: number;
  rating: number;
  advantages: string | null;
  disadvantages: string | null;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
  reviewPhotos: Array<{
    id: number;
    url: string;
  }>;
  reviewAnswers: Array<{
    text: string;
  }>;
};

export type CartItem = {
  id: number;
  quantity: number;
  product: ProductCardItem & {
    isActive: boolean;
    stockQuantity: number;
  };
};

export type FavoriteItem = {
  id: number;
  product: ProductCardItem;
};

export type AttributeFilter = {
  id: number;
  name: string;
  unit: string;
  values: Array<{
    value: string;
    count: number;
  }>;
};

export type ObtainingMethod = "DELIVERY" | "PICKUP";
export type PaymentMethod = "OFFLINE" | "ONLINE";
export type OrderStatus = "NEW" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "UPON_RECEIPT" | "PAID" | "CANCELLED";
export type MessageSenderRole = "USER" | "ADMIN" | "SYSTEM";

export type ShopMessage = {
  id: number;
  senderRole: MessageSenderRole;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type MessagesResponse = {
  messages: ShopMessage[];
  pagination?: {
    limit: number;
    hasMore: boolean;
  };
};

export type OrderStatusHistoryItem = {
  id: string;
  type: "order" | "payment";
  status: OrderStatus | PaymentStatus;
  changedAt: string;
};

export type ShopOrder = {
  id: number;
  obtainingMethod: ObtainingMethod;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  customerPhone: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: OrderStatusHistoryItem[];
  paymentExpiresAt: string | null;
  paymentRemainingSeconds: number | null;
  delivery: {
    address: string;
    apartment: string | null;
    entrance: string | null;
    floor: string | null;
    intercom: string | null;
    comment: string | null;
    deliveryMethod: "OZON";
  } | null;
  payment: {
    amount: MoneyLike;
    paymentStatus: PaymentStatus;
    paidAt: string | null;
  } | null;
  orderItems: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: MoneyLike;
    lineTotal: MoneyLike;
    productName: string;
    productArticle: string;
    productMainImage: string | null;
    product?: {
      mainImage: string;
    };
  }>;
};
