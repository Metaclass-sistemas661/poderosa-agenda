const http = require('http');

const payload = JSON.stringify({
  "id": "evt_15e444ff9b9ab9ec29294aa1abe68025&19507996",
  "event": "PAYMENT_CONFIRMED",
  "dateCreated": "2026-09-10 19:29:05",
  "account": {
    "id": "649a19e9-bdfd-49cd-994b-f9f19b63870c",
    "ownerId": null
  },
  "payment": {
    "object": "payment",
    "id": "pay_8fqolhtefg5kl933",
    "dateCreated": "2026-09-10",
    "customer": "cus_000009071872",
    "checkoutSession": null,
    "paymentLink": "dptuyna9oiruril3",
    "value": 5.0,
    "netValue": 4.42,
    "originalValue": null,
    "interestValue": null,
    "description": "Assinatura Poderosa Agenda (Mensal)",
    "billingType": "CREDIT_CARD",
    "confirmedDate": "2026-09-10",
    "creditCard": {
      "creditCardNumber": "0001",
      "creditCardBrand": "UNKNOWN",
      "creditCardToken": "4436b8ba-150a-4869-9ff4-8b9f0c4ac6c7"
    },
    "pixTransaction": null,
    "status": "CONFIRMED",
    "dueDate": "2026-09-15",
    "originalDueDate": "2026-09-15",
    "paymentDate": null,
    "clientPaymentDate": "2026-09-10",
    "installmentNumber": null,
    "invoiceUrl": "https://sandbox.asaas.com/i/8fqolhtefg5kl933",
    "invoiceNumber": "17758767",
    "externalReference": "7aa72c18-abad-4cc4-92fb-331765d15076",
    "deleted": false,
    "anticipated": false,
    "anticipable": false,
    "creditDate": "2026-10-12",
    "estimatedCreditDate": "2026-10-12",
    "transactionReceiptUrl": "https://sandbox.asaas.com/comprovantes/5524830569741074",
    "nossoNumero": null,
    "bankSlipUrl": null,
    "lastInvoiceViewedDate": null,
    "lastBankSlipViewedDate": null,
    "discount": {
      "value": 0.0,
      "limitDate": null,
      "dueDateLimitDays": 0.0,
      "type": "FIXED"
    },
    "fine": {
      "value": 0.0,
      "type": "FIXED"
    },
    "interest": {
      "value": 0.0,
      "type": "PERCENTAGE"
    },
    "postalService": false,
    "escrow": null,
    "refunds": null
  }
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/webhooks/asaas',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'asaas-access-token': 'whsec_0y_oufMWtdwlj9OUmIJXuKU9TV4kj1fVrmKpg1D0fpY'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
