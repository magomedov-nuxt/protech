export type MoneyLike = number | string | null | undefined;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: Pagination;
};

export type UserRole = "USER" | "ADMIN";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
};

export type AdminUserListItem = AdminUser & {
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    message: number;
    reviews: number;
  };
};

export type Category = {
  id: number;
  name: string;
};

export type Attribute = {
  id: number;
  name: string;
  unit: string;
  _count?: {
    productAttributes: number;
  };
};

export type ProductImage = {
  id?: number;
  url: string;
};

export type ProductAttributeValue = {
  attributeId: number;
  value: string;
};

export type ProductStock = {
  quantity: number;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    article: string;
  };
};

export type ProductListItem = {
  id: number;
  name: string;
  currentPrice: MoneyLike;
  oldPrice: MoneyLike;
  article: string;
  mainImage: string;
  isActive: boolean;
  productStocks: Array<{ quantity: number }>;
};

export type ProductDetails = {
  id: number;
  name: string;
  description: string;
  currentPrice: MoneyLike;
  costPrice: MoneyLike;
  oldPrice: MoneyLike;
  article: string;
  mainImage: string;
  ozonLink: string | null;
  isActive: boolean;
  categoryId: number;
  productImages: ProductImage[];
  productAttributes: ProductAttributeValue[];
};

export type ProductFormState = {
  name: string;
  description: string;
  currentPrice: number | null;
  costPrice: number | null;
  oldPrice: number | null;
  article: string;
  mainImage: string;
  ozonLink: string;
  categoryId: number | undefined;
  isActive: boolean;
  productImages: Array<{ url: string }>;
  productAttributes: Array<{
    attributeId: number | undefined;
    value: string;
  }>;
};

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "UPON_RECEIPT" | "PAID" | "CANCELLED";
export type PaymentMethod = "OFFLINE" | "ONLINE";
export type ObtainingMethod = "DELIVERY" | "PICKUP";
export type MessageSenderRole = "USER" | "ADMIN" | "SYSTEM";

export type AdminMessage = {
  id: number;
  userId: string;
  senderRole: MessageSenderRole;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type MessageConversation = {
  user: Pick<AdminUser, "id" | "email" | "name" | "image" | "role">;
  lastMessage: AdminMessage | null;
  unreadCount: number;
  totalMessages: number;
};

export type MessageConversationListResponse = {
  conversations: MessageConversation[];
  pagination?: {
    limit: number;
    hasMore: boolean;
  };
};

export type MessageThreadResponse = {
  messages: AdminMessage[];
  user: Pick<AdminUser, "id" | "email" | "name" | "image" | "role">;
  pagination?: {
    limit: number;
    hasMore: boolean;
  };
};

export type OrderListItem = {
  id: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  obtainingMethod: ObtainingMethod;
  customerPhone: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<AdminUser, "id" | "email" | "name"> | null;
  payment: {
    amount: MoneyLike;
    paymentStatus: PaymentStatus;
  } | null;
  delivery: {
    address: string;
    apartment: string | null;
    entrance: string | null;
    floor: string | null;
    intercom: string | null;
    comment: string | null;
    deliveryMethod?: "OZON";
  } | null;
  orderItems: Array<{
    quantity: number;
    price: MoneyLike;
    product: {
      id: number;
      name: string;
      mainImage: string;
    };
  }>;
};

export type ReviewListItem = {
  id: number;
  rating: number;
  advantages: string | null;
  disadvantages: string | null;
  comment: string | null;
  isAnswered: boolean | null;
  createdAt: string;
  user: Pick<AdminUser, "email" | "name">;
  product: {
    name: string;
    mainImage: string;
  };
  reviewPhotos: ProductImage[];
  reviewAnswers: Array<{
    id: number;
    text: string;
    createdAt: string;
    user: {
      name: string | null;
    } | null;
  }>;
};

export type DashboardStats = {
  reviewsPending: number;
  lowStock: number;
};

export type SalesAnalyticsResponse = {
  totals: {
    orders: number;
    quantity: number;
    revenue: number;
    grossProfit: number;
    averageOrderValue: number;
    grossMargin: number;
  };
  breakdowns: {
    paymentMethod: Array<{ paymentMethod: PaymentMethod; orders: number; revenue: number }>;
    obtainingMethod: Array<{ obtainingMethod: ObtainingMethod; orders: number }>;
  };
  categoryOptions: Category[];
};

export type ProductAnalyticsItem = {
  name: string;
  quantity: number;
  revenue: number;
};

export type ProductAnalyticsResponse = {
  items: ProductAnalyticsItem[];
};

export type CategoryAnalyticsResponse = {
  items: Array<{
    categoryName: string;
    revenue: number;
  }>;
};

export type DashboardStatsResponse = {
  stats: DashboardStats;
};
