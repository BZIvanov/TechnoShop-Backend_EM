const orderModel = 'order';

const orderItemModel = 'orderItem';

const orderDeliveryStatuses = {
  PENDING: 'pending',
  PARTIALLY_DELIVERED: 'partiallyDelivered', // before all sellers ship their products
  DELIVERED: 'delivered',
  PARTIALLY_CANCELED: 'partiallyCanceled',
  CANCELED: 'canceled',
};

const orderItemDeliveryStatuses = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  CANCELED: 'canceled',
};

const orderPaymentStatuses = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
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
