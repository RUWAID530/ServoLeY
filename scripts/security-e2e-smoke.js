#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config();

const baseUrl = String(process.env.E2E_BASE_URL || `http://127.0.0.1:${process.env.PORT || 8084}`).replace(/\/$/, '');
const now = Date.now();

const randomDigits = (count) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');

const customerEmail = `qa.customer.${now}@example.com`;
const providerEmail = `qa.provider.${now}@example.com`;
const customerPhone = `9${randomDigits(9)}`;
const providerPhone = `8${randomDigits(9)}`;
const password = 'SecureQa!12345';

const request = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  return { res, payload };
};

const assertStatus = (label, actual, accepted) => {
  if (!accepted.includes(actual)) {
    throw new Error(`${label} failed with status ${actual}. Expected one of [${accepted.join(', ')}]`);
  }
};

const assertNo5xxInBatch = (label, statuses) => {
  const has5xx = statuses.some((status) => status >= 500);
  if (has5xx) {
    throw new Error(`${label} contains 5xx responses: ${statuses.join(',')}`);
  }
};

const run = async () => {
  console.log(`Running security smoke/load test against ${baseUrl}`);

  const registerCustomer = await request('/api/auth/register', {
    method: 'POST',
    body: {
      userType: 'CUSTOMER',
      email: customerEmail,
      phone: customerPhone,
      password,
      firstName: 'QA',
      lastName: 'Customer'
    }
  });
  assertStatus('Customer registration', registerCustomer.res.status, [201]);

  const loginCustomer = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: customerEmail,
      password,
      userType: 'CUSTOMER'
    }
  });
  assertStatus('Customer login', loginCustomer.res.status, [200]);
  const customerToken = loginCustomer.payload?.data?.accessToken;
  if (!customerToken) throw new Error('Customer login did not return access token');

  const walletBalance = await request('/api/wallet/balance', { token: customerToken });
  assertStatus('Wallet balance', walletBalance.res.status, [200]);

  const addCustomerMethod = await request('/api/wallet/payment-methods', {
    method: 'POST',
    token: customerToken,
    body: {
      type: 'UPI',
      upiId: `qa${now}@okicici`,
      provider: 'UPI',
      isDefault: true
    }
  });
  assertStatus('Add customer payment method', addCustomerMethod.res.status, [201]);

  const listCustomerMethods = await request('/api/wallet/payment-methods', { token: customerToken });
  assertStatus('List customer payment methods', listCustomerMethods.res.status, [200]);

  const registerProvider = await request('/api/auth/register', {
    method: 'POST',
    body: {
      userType: 'PROVIDER',
      email: providerEmail,
      phone: providerPhone,
      password,
      firstName: 'QA',
      lastName: 'Provider',
      businessName: 'QA Provider Services',
      businessAddress: 'QA Street 1',
      area: 'QA Area'
    }
  });
  assertStatus('Provider registration', registerProvider.res.status, [201]);

  const loginProvider = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: providerEmail,
      password,
      userType: 'PROVIDER'
    }
  });
  assertStatus('Provider login', loginProvider.res.status, [200]);
  const providerToken = loginProvider.payload?.data?.accessToken;
  if (!providerToken) throw new Error('Provider login did not return access token');

  const addProviderMethod = await request('/api/provider/payment-methods', {
    method: 'POST',
    token: providerToken,
    body: {
      type: 'upi',
      name: 'QA UPI',
      upiId: `provider${now}@okhdfc`,
      isDefault: true
    }
  });
  assertStatus('Add provider payout method', addProviderMethod.res.status, [201]);
  const providerMethodId = addProviderMethod.payload?.data?.id;

  const listProviderMethods = await request('/api/provider/payment-methods', { token: providerToken });
  assertStatus('List provider payout methods', listProviderMethods.res.status, [200]);

  const providerWithdraw = await request('/api/provider/withdraw', {
    method: 'POST',
    token: providerToken,
    body: {
      amount: 1,
      ...(providerMethodId ? { paymentMethodId: providerMethodId } : {})
    }
  });
  // 400 for insufficient balance is valid business behavior.
  assertStatus('Provider withdraw', providerWithdraw.res.status, [200, 400]);

  const notifPrefs = await request('/api/communication/notifications/preferences', {
    method: 'PUT',
    token: customerToken,
    body: {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      orderUpdates: true,
      messages: true,
      promotions: false,
      systemAlerts: true
    }
  });
  assertStatus('Communication notification preferences update', notifPrefs.res.status, [200]);

  const notifTest = await request('/api/communication/notifications/test', {
    method: 'POST',
    token: customerToken,
    body: {
      type: 'PUSH',
      title: 'QA Security Test',
      body: 'This is a smoke test notification'
    }
  });
  assertStatus('Communication test notification', notifTest.res.status, [200]);

  const walletBurstStatuses = await Promise.all(
    Array.from({ length: 20 }).map(async () => {
      const { res } = await request('/api/wallet/balance', { token: customerToken });
      return res.status;
    })
  );
  assertNo5xxInBatch('Wallet burst', walletBurstStatuses);

  const commBurstStatuses = await Promise.all(
    Array.from({ length: 20 }).map(async () => {
      const { res } = await request('/api/communication/notifications/unread-count', { token: customerToken });
      return res.status;
    })
  );
  assertNo5xxInBatch('Communication burst', commBurstStatuses);

  const loginBurstStatuses = await Promise.all(
    Array.from({ length: 8 }).map(async () => {
      const { res } = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: customerEmail,
          password: 'WrongPassword!123',
          userType: 'CUSTOMER'
        }
      });
      return res.status;
    })
  );

  if (!loginBurstStatuses.includes(429)) {
    throw new Error(`Expected at least one 429 from login limiter; got [${loginBurstStatuses.join(', ')}]`);
  }

  console.log('Security smoke/load test completed successfully.');
  console.log(`Login burst statuses: ${loginBurstStatuses.join(', ')}`);
  console.log(`Wallet burst statuses sample: ${walletBurstStatuses.slice(0, 10).join(', ')}`);
  console.log(`Communication burst statuses sample: ${commBurstStatuses.slice(0, 10).join(', ')}`);
};

run().catch((error) => {
  console.error('Security smoke/load test failed:', error.message);
  process.exit(1);
});
