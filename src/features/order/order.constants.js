const orderModel = 'order';

const orderItemModel = 'orderItem';

const orderDeliveryStatuses = {
  PENDING: 'pending',
  PARTIALLY_SHIPPED: 'partiallyShipped', // before all sellers ship their products
  SHIPPED: 'shipped',
  CANCELED: 'canceled',
};

const orderPaymentStatuses = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const orderItemDeliveryStatuses = {
  PENDING: 'pending',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELED: 'canceled',
};

const orderItemPaymentStatuses = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
};

module.exports = {
  orderModel,
  orderItemModel,
  orderDeliveryStatuses,
  orderPaymentStatuses,
  orderItemDeliveryStatuses,
  orderItemPaymentStatuses,
};
