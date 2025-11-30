import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Shop: NavigatorScreenParams<ShopStackParamList>;
  Cart: NavigatorScreenParams<CartStackParamList>;
  Orders: NavigatorScreenParams<OrdersStackParamList>;
  Account: NavigatorScreenParams<AccountStackParamList>;
  Seller: NavigatorScreenParams<SellerStackParamList> | undefined;
  Driver: NavigatorScreenParams<DriverStackParamList> | undefined;
  Admin: NavigatorScreenParams<AdminStackParamList> | undefined;
  Analytics: NavigatorScreenParams<AnalyticsStackParamList> | undefined;
};

export type ShopStackParamList = {
  Home: undefined;
  Category: { categoryId: string; categoryName: string };
  ProductDetail: { productId: string };
};

export type CartStackParamList = {
  CartMain: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  ProductDetail: { productId: string };
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
};

export type AccountStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  AddAddress: undefined;
  EditAddress: { addressId: string };
  Favorites: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  Settings: undefined;
  BecomeSeller: undefined;
  SellerOnboardingStatus: undefined;
  OrderDetail: { orderId: string };
};

export type SellerStackParamList = {
  SellerDashboard: undefined;
  SellerProducts: undefined;
  AddSellerProduct: undefined;
  EditSellerProduct: { productId: string };
};

export type DriverStackParamList = {
  DeliveryList: undefined;
  DeliveryDetail: { orderId: string };
  DeliveryMap: undefined;
};

export type AdminStackParamList = {
  Dashboard: undefined;
  ProductManagement: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  OrderManagement: undefined;
  DriverManagement: undefined;
  ManageSellers: undefined;
  DeliverySchedules: undefined;
  PromoCodes: undefined;
  Analytics: undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsDashboard: undefined;
};
