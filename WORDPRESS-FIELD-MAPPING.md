# WordPress Field Mapping & Badge Logic

This document explains how your WordPress/WooCommerce custom fields map to the optimized vehicle search system.

## Featured Badge Logic ✅

**Your WordPress Field**: `is_featured`  
**Values**: `"yes"` or `"no"` (or blank)  
**Display Logic**:

- If `is_featured = "yes"` → Shows red **"Featured!"** badge overlay on vehicle image
- If `is_featured = "no"` or blank → No red badge displayed

**Badge Position**: Top-left corner of vehicle image, red background with white text

## Complete Field Mapping

| System Field               | Your WooCommerce Meta Key    | Filter Type | Example          | Description                                     |
| -------------------------- | ---------------------------- | ----------- | ---------------- | ----------------------------------------------- |
| **Badge System**           |
| `featured`                 | `is_featured`                | none        | "yes"/"no"       | Red "Featured!" badge display                   |
| `badges`                   | `_vehicle_badges`            | none        | Array            | Grey badges (condition, drivetrain)             |
| **Vehicle Identity**       |
| `seller_account_number`    | `_vehicle_seller_account`    | none        | "ACCT1234"       | Links vehicle to seller (**HIDDEN FROM USERS**) |
| `id`                       | `[sku]`                      | none        | "VEH001"         | Product SKU                                     |
| `title`                    | `[post_title]`               | none        | "2023 BMW X5"    | Vehicle title                                   |
| **Core Vehicle Data**      |
| `year`                     | `year`                       | dropdown    | "2023"           | Model year                                      |
| `make`                     | `make`                       | checkbox    | "BMW"            | Vehicle manufacturer                            |
| `model`                    | `model`                      | checkbox    | "X5"             | Vehicle model                                   |
| `trim`                     | `trim`                       | checkbox    | "xDrive40i"      | Trim level                                      |
| `mileage`                  | `mileage`                    | range       | "25000"          | Odometer reading                                |
| `condition`                | `condition`                  | checkbox    | "Used"           | New/Used/Certified                              |
| `price`                    | `_price`                     | range       | "45000"          | Sale price                                      |
| **Technical Specs**        |
| `transmission`             | `transmission`               | checkbox    | "Automatic"      | Transmission type                               |
| `transmission_speed`       | `transmission_speed`         | none        | "8-Speed"        | Speed count                                     |
| `doors`                    | `doors`                      | none        | "4 doors"        | Door count                                      |
| `engine_cylinders`         | `engine_cylinders`           | checkbox    | "6"              | Engine size                                     |
| `fuel_type`                | `fuel_type`                  | checkbox    | "Gasoline"       | Fuel type                                       |
| `drivetrain`               | `drivetrain`                 | checkbox    | "AWD"            | Drive system                                    |
| `body_style`               | `body_style`                 | checkbox    | "SUV"            | Body type                                       |
| `highway_mpg`              | `highway_mpg`                | none        | "28"             | Highway efficiency                              |
| **Appearance**             |
| `exterior_color_generic`   | `exterior_color_generic`     | checkbox    | "Black"          | Exterior color                                  |
| `interior_color_generic`   | `interior_color_generic`     | checkbox    | "Leather"        | Interior color                                  |
| `images`                   | `_product_image_gallery`     | none        | Image IDs        | Vehicle photos                                  |
| `featured_image`           | `featured_image`             | none        | Image URL        | Main photo                                      |
| **Icons**                  |
| `mileageIcon`              | `_vehicle_mileage_icon`      | none        | URL              | Custom mileage icon                             |
| `transmissionIcon`         | `_vehicle_transmission_icon` | none        | URL              | Custom transmission icon                        |
| `doorIcon`                 | `_vehicle_door_icon`         | none        | URL              | Custom door icon                                |
| **Status & Certification** |
| `certified`                | `certified`                  | checkbox    | "yes"/"no"       | Certified pre-owned                             |
| `title_status`             | `title_status`               | checkbox    | "Clean"          | Title condition                                 |
| `viewed`                   |                              | none        | Auto-generated   | User viewing history                            |
| **Seller Information**     |
| `seller_type`              | `account_type_seller`        | checkbox    | "Dealer"         | Dealer/Private                                  |
| `dealer`                   | `account_type_seller`        | none        | "Smith Motors"   | Dealer name                                     |
| `location`                 | `city_seller`                | none        | "Seattle, WA"    | Seller location                                 |
| `phone`                    | `phone_number_seller`        | none        | "(555) 123-4567" | Contact phone                                   |
| **Location Data**          |
| `car_location_latitude`    | `car_location_latitude`      |             | "47.6062"        | Seller latitude                                 |
| `car_location_longitude`   | `car_location_longitude`     |             | "-122.3321"      | Seller longitude                                |

## Badge Display Hierarchy

### 1. Red Featured Badge (Overlay)

- **Condition**: `is_featured = "yes"`
- **Position**: Top-left corner of vehicle image
- **Style**: Red background, white text, rounded
- **Content**: "Featured!"

### 2. Grey Status Badges (Below Image)

- **Condition Badge**: Always shown (`condition` field)
- **Drivetrain Badge**: Shown if not "FWD" (`drivetrain` field)
- **Custom Badges**: From `_vehicle_badges` field (if any)

### 3. Certification Badge

- **Condition**: `certified = "yes"`
- **Position**: Bottom-left of vehicle image
- **Style**: Blue background, white text
- **Content**: "Certified"

## Migration Process

### Step 1: Extract WordPress Data

```sql
SELECT
  (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = 'is_featured') as is_featured,
  (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_vehicle_seller_account') as seller_account_number,
  -- ... all other fields
FROM wp_posts p
WHERE p.post_type = 'product'
```

### Step 2: Apply Badge Logic

```javascript
const featured = vehicle.is_featured === "yes" ? 1 : 0;
```

### Step 3: Display in Frontend

```jsx
{
  vehicle.featured && (
    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full">
      Featured!
    </div>
  );
}
```

## Seller Account Privacy & Sync

### Privacy Protection 🔒

- **Seller account numbers are COMPLETELY HIDDEN from users**
- Numbers like "ACCT1234" do not appear anywhere in the frontend
- Users only see seller type ("Dealer" or "Private Seller")
- Account numbers exist only in the database for internal operations

### Sync Functionality 🔄

- **WordPress vehicles** use `_vehicle_seller_account` field (e.g., "ACCT1234")
- **WordPress sellers** use `account_number_seller` field (e.g., "ACCT1234")
- **System matches** these fields to link vehicles to sellers
- **Location data** syncs from seller to vehicle automatically
- **Database queries** use these relationships for fast location searches

### Data Flow

```
WordPress Vehicle → _vehicle_seller_account: "ACCT1234"
WordPress Seller  → account_number_seller: "ACCT1234"
                           ↓
System links vehicle location to seller location
                           ↓
User sees: "Dealer" (no account number visible)
```

## Sync Behavior

**Ongoing Sync**: Every hour, the system checks for:

- New WordPress products with `_vehicle_seller_account` field
- Updated `is_featured` values
- Changes to any mapped fields

**Featured Badge Updates**: If you change `is_featured` from "no" to "yes" in WordPress, the red badge will appear within 1 hour (or immediately with manual sync).

## Testing Your Mapping

1. **Run Migration**: `npm run migrate:wordpress`
2. **Check Featured Badges**: Vehicles with `is_featured = "yes"` should show red badges
3. **Verify Seller Links**: Vehicle cards should show seller account IDs
4. **Test Filters**: Make sure your WooCommerce data populates the filter options

## Troubleshooting

**No Featured Badges Showing**:

- Check if `is_featured` field exists in WordPress
- Verify values are exactly "yes" (not "1" or "true")
- Confirm migration completed successfully

**Missing Vehicle Data**:

- Ensure `_vehicle_seller_account` field is populated
- Check that products are published status
- Verify meta key names match exactly

**Seller Relationships Broken**:

- Confirm `account_number_seller` matches `_vehicle_seller_account` values
- Check SellersAccount posts exist and are published
- Verify seller location data exists
