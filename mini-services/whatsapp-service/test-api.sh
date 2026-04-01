#!/bin/bash

# WhatsApp Notification Service - API Test Script
# This script tests all the API endpoints

BASE_URL="http://localhost:3006"

echo "========================================="
echo "WhatsApp Notification Service API Tests"
echo "========================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "GET /"
curl -s "$BASE_URL/" | jq '.'
echo ""
echo ""

# Test 2: Send Custom Message (with queue)
echo "Test 2: Send Custom Message (with queue)"
echo "POST /api/whatsapp/send"
curl -s -X POST "$BASE_URL/api/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+6281234567890",
    "message": "Test message from WhatsApp Service",
    "useQueue": false
  }' | jq '.'
echo ""
echo ""

# Test 3: Send Order Confirmation
echo "Test 3: Send Order Confirmation"
echo "POST /api/whatsapp/order-confirm"
curl -s -X POST "$BASE_URL/api/whatsapp/order-confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "customerName": "Test Customer",
    "customerPhone": "+6281234567890",
    "items": [
      {
        "name": "Ayam Geprek Original",
        "quantity": 2,
        "price": 15000
      },
      {
        "name": "Es Teh Manis",
        "quantity": 2,
        "price": 5000
      }
    ],
    "totalAmount": 40000,
    "paymentMethod": "QRIS",
    "orderType": "dine_in",
    "estimatedTime": 15
  }' | jq '.'
echo ""
echo ""

# Test 4: Send Order Status Update
echo "Test 4: Send Order Status Update"
echo "POST /api/whatsapp/order-update"
curl -s -X POST "$BASE_URL/api/whatsapp/order-update" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "status": "processing",
    "customerPhone": "+6281234567890",
    "estimatedTime": 10,
    "useQueue": false
  }' | jq '.'
echo ""
echo ""

# Test 5: Send Payment Confirmation
echo "Test 5: Send Payment Confirmation"
echo "POST /api/whatsapp/payment-confirm"
curl -s -X POST "$BASE_URL/api/whatsapp/payment-confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "amount": 40000,
    "paymentMethod": "QRIS",
    "transactionId": "TXN-123456789",
    "customerName": "Test Customer",
    "customerPhone": "+6281234567890"
  }' | jq '.'
echo ""
echo ""

# Test 6: Send Promotional Message
echo "Test 6: Send Promotional Message"
echo "POST /api/whatsapp/promotional"
curl -s -X POST "$BASE_URL/api/whatsapp/promotional" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+6281234567890",
    "title": "Special Weekend Offer!",
    "content": "Get 20% off on all Ayam Geprek menu items this weekend only!",
    "promoCode": "WEEKEND20",
    "validUntil": "2024-12-31",
    "useQueue": true
  }' | jq '.'
echo ""
echo ""

# Test 7: Check Message Status
echo "Test 7: Check Message Status"
echo "GET /api/whatsapp/status/test_message_id"
curl -s "$BASE_URL/api/whatsapp/status/test_message_id" | jq '.'
echo ""
echo ""

# Test 8: Get Queue Status
echo "Test 8: Get Queue Status"
echo "GET /api/whatsapp/queue/status"
curl -s "$BASE_URL/api/whatsapp/queue/status" | jq '.'
echo ""
echo ""

echo "========================================="
echo "All tests completed!"
echo "========================================="
