// ============================================================
//  FIREBASE CONFIGURATION — Honda Inventory System
// ============================================================
//  SETUP STEPS:
//  1. Go to https://console.firebase.google.com/
//  2. Create project → Add Web App → Copy config below
//  3. Enable Authentication → Email/Password
//  4. Enable Firestore Database (start in test mode)
//  5. Create first admin user under Authentication → Users
// ============================================================

export const firebaseConfig = {
    apiKey: "AIzaSyCdsuCMrDCo6BnV7rNO0zzukjQTLfXVcX8",
    authDomain: "honda-inventory-ff834.firebaseapp.com",
    projectId: "honda-inventory-ff834",
    storageBucket: "honda-inventory-ff834.firebasestorage.app",
    messagingSenderId: "716137630901",
    appId: "1:716137630901:web:baf184c29ce56f7e75c2fc",
    measurementId: "G-GXDE96D50B"
  };

// ============================================================
//  FIRESTORE COLLECTIONS STRUCTURE
// ============================================================
//
//  /vehicles/{id}
//    - name: string          e.g. "Honda Click 125"
//    - category: string      categoryId
//    - categoryName: string
//    - price: number
//    - stock: number
//    - lowStockThreshold: number (default 5)
//    - description: string
//    - model: string
//    - year: string
//    - createdAt: timestamp
//    - updatedAt: timestamp
//
//  /parts/{id}
//    - name: string          e.g. "Brake Pad"
//    - category: string      categoryId
//    - categoryName: string
//    - price: number
//    - stock: number
//    - lowStockThreshold: number (default 10)
//    - partNumber: string
//    - description: string
//    - createdAt: timestamp
//    - updatedAt: timestamp
//
//  /categories/{id}
//    - name: string
//    - type: "vehicle" | "part" | "accessory" | "service" | "other"
//    - description: string
//    - createdAt: timestamp
//
//  /inventory_logs/{id}
//    - type: "stock_in" | "stock_out" | "adjustment"
//    - itemId: string
//    - itemName: string
//    - itemType: "vehicle" | "part"
//    - quantity: number
//    - previousStock: number
//    - newStock: number
//    - notes: string
//    - createdAt: timestamp
//    - createdBy: string (uid)
//
//  /sales/{id}
//    - orderNumber: string
//    - items: array of { itemId, itemName, itemType, quantity, price, subtotal }
//    - totalAmount: number
//    - totalQuantity: number
//    - customerName: string
//    - notes: string
//    - createdAt: timestamp
//    - createdBy: string (uid)
//
//  /users/{uid}
//    - displayName: string
//    - email: string
//    - role: "admin" | "staff"
//    - createdAt: timestamp
// ============================================================
