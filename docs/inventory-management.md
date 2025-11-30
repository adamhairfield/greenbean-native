# Automatic Inventory Management

## Overview
The Greenbean app now automatically updates product inventory when orders are placed. This ensures that sellers always have accurate stock counts.

## How It Works

### Database Trigger
A PostgreSQL trigger automatically updates the `stock_quantity` field in the `products` table when order items are created:

1. **When an order is placed**: The trigger decrements the stock quantity by the ordered amount
2. **When an order is cancelled**: The trigger restores the stock quantity
3. **When order quantity changes**: The trigger adjusts the stock accordingly

### Implementation Details

**Trigger Function**: `update_product_inventory()`
- Located in: `/supabase/schema.sql` and `/supabase/migrations/add_inventory_trigger.sql`
- Triggered on: `INSERT`, `UPDATE`, `DELETE` operations on the `order_items` table
- Actions:
  - `INSERT`: Decreases `stock_quantity` by order quantity
  - `DELETE`: Increases `stock_quantity` by order quantity (restores inventory)
  - `UPDATE`: Adjusts `stock_quantity` based on quantity difference

**Safety Features**:
- Prevents negative inventory with an exception
- Pre-checkout validation ensures sufficient stock before payment
- Atomic operations ensure data consistency

### Checkout Validation
Before processing payment, the checkout screen validates that:
1. All products in the cart have sufficient stock
2. If any product is out of stock, the user is notified and checkout is prevented
3. This prevents race conditions where inventory runs out between cart and checkout

## Migration

To apply this feature to your database, run the migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute the migration file
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/add_inventory_trigger.sql
```

## Testing

To test the inventory updates:

1. **Create a product** with a specific stock quantity (e.g., 20 units)
2. **Place an order** for some quantity (e.g., 5 units)
3. **Verify** the product's stock_quantity decreased by 5
4. **Check the product detail page** shows updated "In Stock" count

## Seller Dashboard

Sellers can view and manage their inventory in the Admin/Seller dashboard:
- View current stock levels
- Update stock quantities manually
- See low stock warnings
- Track inventory changes over time

## Future Enhancements

Potential improvements:
- Inventory history/audit log
- Low stock notifications
- Automatic reorder points
- Bulk inventory updates
- Inventory reservations (hold stock during checkout)
