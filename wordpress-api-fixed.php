<?php

// COMPLETE CORRECTED WORDPRESS API CODE WITH CONDITIONAL FILTERING

// CORS Headers
add_action('init', function() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        exit(0);
    }
});

// Register Custom API Endpoint - CORRECTED WITH FILTERING
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/vehicles', array(
        'methods' => 'GET',
        'callback' => 'get_custom_vehicles',
        'permission_callback' => '__return_true'
    ));
});

// FIXED: Complete Vehicle API Function with Conditional Filtering
function get_custom_vehicles(WP_REST_Request $request) {
    $page = $request->get_param('page') ? intval($request->get_param('page')) : 1;
    $per_page = $request->get_param('per_page') ? intval($request->get_param('per_page')) : 20;
    
    // CRITICAL FIX: Process ALL filter parameters
    $filters = array(
        'make' => $request->get_param('make'),
        'model' => $request->get_param('model'),
        'trim' => $request->get_param('trim'),
        'condition' => $request->get_param('condition'),
        'transmission' => $request->get_param('transmission'),
        'body_style' => $request->get_param('body_style'),
        'drivetrain' => $request->get_param('drivetrain'),
        'fuel_type' => $request->get_param('fuel_type'),
        'exterior_color' => $request->get_param('exterior_color'),
        'interior_color' => $request->get_param('interior_color'),
        'seller_type' => $request->get_param('account_type_seller'),
        'city_seller' => $request->get_param('city_seller'),
        'state_seller' => $request->get_param('state_seller'),
        'min_price' => $request->get_param('min_price'),
        'max_price' => $request->get_param('max_price'),
        'min_payment' => $request->get_param('min_payment'),
        'max_payment' => $request->get_param('max_payment'),
        'min_year' => $request->get_param('min_year'),
        'max_year' => $request->get_param('max_year'),
        'max_mileage' => $request->get_param('max_mileage'),
        'certified' => $request->get_param('certified'),
        'featured' => $request->get_param('featured')
    );
    
    // Build WP_Query args with meta_query for filtering
    $args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array('relation' => 'AND')
    );
    
    // CRITICAL FIX: Add conditional filtering logic
    foreach ($filters as $key => $value) {
        if (!empty($value)) {
            switch ($key) {
                case 'make':
                case 'model':
                case 'trim':
                case 'condition':
                case 'transmission':
                case 'body_style':
                case 'drivetrain':
                case 'fuel_type':
                case 'exterior_color':
                case 'interior_color':
                case 'city_seller':
                case 'state_seller':
                    // Handle multiple values (comma-separated)
                    $values = explode(',', $value);
                    if (count($values) > 1) {
                        $args['meta_query'][] = array(
                            'key' => $key,
                            'value' => $values,
                            'compare' => 'IN'
                        );
                    } else {
                        $args['meta_query'][] = array(
                            'key' => $key,
                            'value' => trim($value),
                            'compare' => '='
                        );
                    }
                    break;
                    
                case 'seller_type':
                    $args['meta_query'][] = array(
                        'key' => 'account_type_seller',
                        'value' => $value,
                        'compare' => '='
                    );
                    break;
                    
                case 'min_price':
                    $args['meta_query'][] = array(
                        'key' => '_price',
                        'value' => intval($value),
                        'type' => 'NUMERIC',
                        'compare' => '>='
                    );
                    break;
                    
                case 'max_price':
                    $args['meta_query'][] = array(
                        'key' => '_price',
                        'value' => intval($value),
                        'type' => 'NUMERIC',
                        'compare' => '<='
                    );
                    break;
                    
                case 'min_payment':
                    $args['meta_query'][] = array(
                        'key' => 'payment',
                        'value' => intval($value),
                        'type' => 'NUMERIC',
                        'compare' => '>='
                    );
                    break;
                    
                case 'max_payment':
                    $args['meta_query'][] = array(
                        'key' => 'payment',
                        'value' => intval($value),
                        'type' => 'NUMERIC',
                        'compare' => '<='
                    );
                    break;
                    
                case 'min_year':
                    $args['meta_query'][] = array(
                        'key' => 'year',
                        'value' => intval($value),
                        'type' => 'NUMERIC',
                        'compare' => '>='
                    );
                    break;
                    
                case 'max_year':
                    $args['meta_query'][] = array(
                        'key' => 'year',
                        'value' => intval($value),
                        'type' => 'NUMERIC',
                        'compare' => '<='
                    );
                    break;
                    
                case 'max_mileage':
                    $args['meta_query'][] = array(
                        'key' => 'mileage',
                        'value' => intval($value),
                        'type' => 'NUMERIC',
                        'compare' => '<='
                    );
                    break;
                    
                case 'certified':
                    if ($value === 'true' || $value === '1') {
                        $args['meta_query'][] = array(
                            'key' => 'certified',
                            'value' => '1',
                            'compare' => '='
                        );
                    }
                    break;
                    
                case 'featured':
                    if ($value === 'true' || $value === '1') {
                        $args['meta_query'][] = array(
                            'key' => 'is_featured',
                            'value' => '1',
                            'compare' => '='
                        );
                    }
                    break;
            }
        }
    }
    
    // Remove empty meta_query if no filters applied
    if (count($args['meta_query']) <= 1) {
        unset($args['meta_query']);
    }
    
    $query = new WP_Query($args);
    $vehicles = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            // Get WooCommerce price properly
            $product = wc_get_product($post_id);
            $price = 0;
            if ($product) {
                $price = $product->get_price();
                if (!$price) $price = $product->get_regular_price();
                if (!$price) $price = get_post_meta($post_id, '_price', true);
            }
            
            $vehicles[] = array(
                'id' => $post_id,
                'name' => get_the_title($post_id),
                'slug' => get_post_field('post_name', $post_id),
                'permalink' => get_permalink($post_id),
                'price' => floatval($price),
                'regular_price' => $product ? $product->get_regular_price() : '',
                'sale_price' => $product ? $product->get_sale_price() : '',
                'stock_status' => get_post_meta($post_id, '_stock_status', true),
                'featured_image' => get_the_post_thumbnail_url($post_id, 'medium'),
                'images' => get_product_images($post_id), // Helper function below
                'acf' => array(
                    // Vehicle specs
                    'make' => get_post_meta($post_id, 'make', true),
                    'model' => get_post_meta($post_id, 'model', true),
                    'year' => intval(get_post_meta($post_id, 'year', true)),
                    'trim' => get_post_meta($post_id, 'trim', true),
                    'mileage' => intval(get_post_meta($post_id, 'mileage', true)),
                    'condition' => get_post_meta($post_id, 'condition', true) ?: 'Used',
                    'transmission' => get_post_meta($post_id, 'transmission', true),
                    'doors' => intval(get_post_meta($post_id, 'doors', true)) ?: 4,
                    'drivetrain' => get_post_meta($post_id, 'drivetrain', true),
                    'drive_type' => get_post_meta($post_id, 'drivetrain', true), // Alias
                    'fuel_type' => get_post_meta($post_id, 'fuel_type', true),
                    'body_style' => get_post_meta($post_id, 'body_style', true),
                    'body_type' => get_post_meta($post_id, 'body_style', true), // Alias
                    'highway_mpg' => intval(get_post_meta($post_id, 'highway_mpg', true)) ?: 25,
                    'exterior_color' => get_post_meta($post_id, 'exterior_color', true),
                    'interior_color' => get_post_meta($post_id, 'interior_color', true),
                    'vin' => get_post_meta($post_id, 'vin', true),
                    'engine_cylinders' => intval(get_post_meta($post_id, 'engine_cylinders', true)) ?: 4,
                    'engine' => get_post_meta($post_id, 'engine', true),
                    
                    // Status flags
                    'certified' => get_post_meta($post_id, 'certified', true) === '1',
                    'title_status' => get_post_meta($post_id, 'title_status', true) ?: 'Clean',
                    'is_featured' => get_post_meta($post_id, 'is_featured', true) === '1',
                    'is_certified' => get_post_meta($post_id, 'is_certified', true) === '1',
                    'has_warranty' => get_post_meta($post_id, 'has_warranty', true) === '1',
                    
                    // Seller info
                    'account_name_seller' => get_post_meta($post_id, 'account_name_seller', true),
                    'account_type_seller' => get_post_meta($post_id, 'account_type_seller', true) ?: 'Dealer',
                    'city_seller' => get_post_meta($post_id, 'city_seller', true) ?: 'Seattle',
                    'state_seller' => get_post_meta($post_id, 'state_seller', true) ?: 'WA',
                    'zip_seller' => get_post_meta($post_id, 'zip_seller', true) ?: '98101',
                    'phone_number_seller' => get_post_meta($post_id, 'phone_number_seller', true),
                    'email_seller' => get_post_meta($post_id, 'email_seller', true),
                    'address_seller' => get_post_meta($post_id, 'address_seller', true),
                    
                    // Location
                    'car_location_latitude' => floatval(get_post_meta($post_id, 'car_location_latitude', true)),
                    'car_location_longitude' => floatval(get_post_meta($post_id, 'car_location_longitude', true)),
                    
                    // Financial - CRITICAL for filtering
                    'price' => floatval($price),
                    'sale_price' => floatval($product ? $product->get_sale_price() : $price),
                    'interest_rate' => floatval(get_post_meta($post_id, 'interest_rate', true)) ?: 5.0,
                    'down_payment' => intval(get_post_meta($post_id, 'down_payment', true)) ?: 2000,
                    'loan_term' => intval(get_post_meta($post_id, 'loan_term', true)) ?: 60,
                    'payment' => floatval(get_post_meta($post_id, 'payment', true)),
                    
                    // Images
                    'featured_image' => get_the_post_thumbnail_url($post_id, 'medium')
                )
            );
        }
        wp_reset_postdata();
    }
    
    // CRITICAL FIX: Return conditional filter options based on current results
    $conditional_filters = get_conditional_filters($args, $filters);
    
    // Return in correct format for React app with conditional filters
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $vehicles,
        'pagination' => array(
            'total' => $query->found_posts,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => $query->max_num_pages
        ),
        'filters' => $conditional_filters, // NEW: Conditional filter options
        'applied_filters' => $filters // NEW: Echo back applied filters
    ), 200);
}

// CRITICAL FIX: Helper function for conditional filter options
function get_conditional_filters($base_args, $applied_filters) {
    // Get ALL vehicles first for base filter options
    $all_args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => -1, // Get all
        'fields' => 'ids' // Only get IDs for performance
    );
    
    $all_query = new WP_Query($all_args);
    $all_vehicle_ids = $all_query->posts;
    
    // Build conditional filter options
    $filter_options = array(
        'makes' => get_filter_values($all_vehicle_ids, 'make', array()),
        'models' => array(),
        'trims' => array(),
        'conditions' => get_filter_values($all_vehicle_ids, 'condition', array()),
        'transmissions' => get_filter_values($all_vehicle_ids, 'transmission', array()),
        'body_styles' => get_filter_values($all_vehicle_ids, 'body_style', array()),
        'drivetrains' => get_filter_values($all_vehicle_ids, 'drivetrain', array()),
        'fuel_types' => get_filter_values($all_vehicle_ids, 'fuel_type', array()),
        'exterior_colors' => get_filter_values($all_vehicle_ids, 'exterior_color', array()),
        'interior_colors' => get_filter_values($all_vehicle_ids, 'interior_color', array()),
        'seller_types' => get_filter_values($all_vehicle_ids, 'account_type_seller', array()),
        'cities' => get_filter_values($all_vehicle_ids, 'city_seller', array()),
        'states' => get_filter_values($all_vehicle_ids, 'state_seller', array())
    );
    
    // CONDITIONAL LOGIC: Filter models based on selected makes
    if (!empty($applied_filters['make'])) {
        $selected_makes = explode(',', $applied_filters['make']);
        $filtered_ids = get_vehicles_by_makes($all_vehicle_ids, $selected_makes);
        $filter_options['models'] = get_filter_values($filtered_ids, 'model', array());
        
        // CONDITIONAL LOGIC: Filter trims based on selected makes AND models
        if (!empty($applied_filters['model'])) {
            $selected_models = explode(',', $applied_filters['model']);
            $model_filtered_ids = get_vehicles_by_models($filtered_ids, $selected_models);
            $filter_options['trims'] = get_filter_values($model_filtered_ids, 'trim', array());
        } else {
            $filter_options['trims'] = get_filter_values($filtered_ids, 'trim', array());
        }
    } else {
        // No makes selected - show all models and trims
        $filter_options['models'] = get_filter_values($all_vehicle_ids, 'model', array());
        $filter_options['trims'] = get_filter_values($all_vehicle_ids, 'trim', array());
    }
    
    return $filter_options;
}

// Helper function to get filter values with counts
function get_filter_values($vehicle_ids, $meta_key, $applied_filters) {
    if (empty($vehicle_ids)) return array();
    
    global $wpdb;
    
    $ids_string = implode(',', array_map('intval', $vehicle_ids));
    
    $results = $wpdb->get_results($wpdb->prepare("
        SELECT pm.meta_value, COUNT(*) as count
        FROM {$wpdb->postmeta} pm
        WHERE pm.post_id IN ($ids_string)
        AND pm.meta_key = %s
        AND pm.meta_value != ''
        AND pm.meta_value IS NOT NULL
        GROUP BY pm.meta_value
        ORDER BY pm.meta_value ASC
    ", $meta_key));
    
    $filter_values = array();
    foreach ($results as $result) {
        $filter_values[] = array(
            'name' => $result->meta_value,
            'count' => intval($result->count)
        );
    }
    
    return $filter_values;
}

// Helper function to filter vehicles by makes
function get_vehicles_by_makes($vehicle_ids, $makes) {
    if (empty($vehicle_ids) || empty($makes)) return $vehicle_ids;
    
    global $wpdb;
    
    $ids_string = implode(',', array_map('intval', $vehicle_ids));
    $makes_placeholders = implode(',', array_fill(0, count($makes), '%s'));
    
    $query = $wpdb->prepare("
        SELECT DISTINCT post_id
        FROM {$wpdb->postmeta}
        WHERE post_id IN ($ids_string)
        AND meta_key = 'make'
        AND meta_value IN ($makes_placeholders)
    ", $makes);
    
    $results = $wpdb->get_col($query);
    return array_map('intval', $results);
}

// Helper function to filter vehicles by models
function get_vehicles_by_models($vehicle_ids, $models) {
    if (empty($vehicle_ids) || empty($models)) return $vehicle_ids;
    
    global $wpdb;
    
    $ids_string = implode(',', array_map('intval', $vehicle_ids));
    $models_placeholders = implode(',', array_fill(0, count($models), '%s'));
    
    $query = $wpdb->prepare("
        SELECT DISTINCT post_id
        FROM {$wpdb->postmeta}
        WHERE post_id IN ($ids_string)
        AND meta_key = 'model'
        AND meta_value IN ($models_placeholders)
    ", $models);
    
    $results = $wpdb->get_col($query);
    return array_map('intval', $results);
}

// Helper function to get product images
function get_product_images($post_id) {
    $product = wc_get_product($post_id);
    $images = array();
    
    if ($product) {
        $image_ids = $product->get_gallery_image_ids();
        
        // Add featured image first (using medium size for 450x300 display)
        $featured_id = $product->get_image_id();
        if ($featured_id) {
            $images[] = array(
                'id' => $featured_id,
                'src' => wp_get_attachment_image_url($featured_id, 'medium'),
                'src_full' => wp_get_attachment_image_url($featured_id, 'full'),
                'alt' => get_post_meta($featured_id, '_wp_attachment_image_alt', true)
            );
        }

        // Add gallery images (using medium size for 450x300 display)
        foreach ($image_ids as $image_id) {
            $images[] = array(
                'id' => $image_id,
                'src' => wp_get_attachment_image_url($image_id, 'medium'),
                'src_full' => wp_get_attachment_image_url($image_id, 'full'),
                'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true)
            );
        }
    }
    
    return $images;
}

// INSTRUCTIONS:
// 1. REPLACE ALL PREVIOUS API CODE in functions.php with this
// 2. SAVE THE FILE
// 3. WordPress Admin → Settings → Permalinks → Save Changes
// 4. TEST IMMEDIATELY

?>
