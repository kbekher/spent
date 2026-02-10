// MongoDB initialization script
// This runs when the container is first created

db = db.getSiblingDB('spent');

// Create collections
db.createCollection('users');
db.createCollection('categories');
db.createCollection('expenses');
db.createCollection('recurringpayments');

// Create indexes for better performance
db.users.createIndex({ "auth0Id": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.categories.createIndex({ "userId": 1 });
db.expenses.createIndex({ "userId": 1, "date": -1 });
db.expenses.createIndex({ "categoryId": 1 });
db.recurringpayments.createIndex({ "userId": 1 });

print('✅ Database initialized successfully');
