<?php

// CONDITIONAL FILTERING FIX FOR WORDPRESS API
// This implements the proper /filters endpoint with conditional narrowing

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

// Register Custom API Endpoints
add_action('rest_api_init', function() {
    // Vehicles endpoint
    register_rest_route('custom/v1', '/vehicles', array(
        'methods' => 'GET',
        'callback' => 'get_custom_vehicles',
        'permission_callback' => '__return_true'
    ));
    
    // FIXED: Proper filters endpoint with conditional filtering
    register_rest_route('custom/v1', '/filters', array(
        'methods' => 'GET',
        'callback' => 'get_conditional_filters',
        'permission_callback' => '__return_true'
    ));
});

// Vehicles API Function (existing)
function get_custom_vehicles(WP_REST_Request $request) {
    $page = $request->get_param('page') ? intval($request->get_param('page')) : 1;
    $per_page = $request->get_param('per_page') ? intval($request->get_param('per_page')) : 20;
    
    // Process ALL filter parameters
    $filters = array(
        'make' => $request->get_param('make'),
        'model' => $request->get_param('model'),
        'trim' => $request->get_param('trim'),
        'year' => $request->get_param('year'),
        'condition' => $request->get_param('condition'),
        'transmission' => $request->get_param('transmission'),
        'body_style' => $request->get_param('body_style'),
        'drivetrain' => $request->get_param('drivetrain'),
        'fuel_type' => $request->get_param('fuel_type'),
        'exterior_color' => $request->get_param('exterior_color'),
        'interior_color' => $request->get_param('interior_color'),
        'certified' => $request->get_param('certified'),
        'account_name_seller' => $request->get_param('account_name_seller'),
        'city_seller' => $request->get_param('city_seller'),
        'state_seller' => $request->get_param('state_seller'),
        'min_price' => $request->get_param('min_price'),
        'max_price' => $request->get_param('max_price'),
        'min_year' => $request->get_param('min_year'),
        'max_year' => $request->get_param('max_year'),
        'max_mileage' => $request->get_param('max_mileage')
    );
    
    // Build WP_Query args with meta_query for filtering
    $args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array('relation' => 'AND')
    );
    
    // Add conditional filtering logic
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
                case 'account_name_seller':
                    // Handle multiple values (comma-separated)
                    $values = explode(',', $value);
                    $clean_values = array_map('trim', $values);
                    if (count($clean_values) > 1) {
                        $args['meta_query'][] = array(
                            'key' => $key,
                            'value' => $clean_values,
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
                    
                case 'year':
                    $values = explode(',', $value);
                    $clean_values = array_map('intval', array_map('trim', $values));
                    if (count($clean_values) > 1) {
                        $args['meta_query'][] = array(
                            'key' => 'year',
                            'value' => $clean_values,
                            'type' => 'NUMERIC',
                            'compare' => 'IN'
                        );
                    } else {
                        $args['meta_query'][] = array(
                            'key' => 'year',
                            'value' => intval($value),
                            'type' => 'NUMERIC',
                            'compare' => '='
                        );
                    }
                    break;
                    
                case 'min_price':
                    $args['meta_query'][] = array(
                        'key' => 'price',
                        'value' => floatval($value),
                        'type' => 'NUMERIC',
                        'compare' => '>='
                    );
                    break;
                    
                case 'max_price':
                    $args['meta_query'][] = array(
                        'key' => 'price',
                        'value' => floatval($value),
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
                if (!$price) $price = get_post_meta($post_id, 'price', true);
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
                'acf' => array(
                    // Vehicle specs
                    'make' => get_post_meta($post_id, 'make', true),
                    'model' => get_post_meta($post_id, 'model', true),
                    'year' => intval(get_post_meta($post_id, 'year', true)),
                    'trim' => get_post_meta($post_id, 'trim', true),
                    'mileage' => intval(get_post_meta($post_id, 'mileage', true)),
                    'condition' => get_post_meta($post_id, 'condition', true) ?: 'Used',
                    'transmission' => get_post_meta($post_id, 'transmission', true),
                    'drivetrain' => get_post_meta($post_id, 'drivetrain', true),
                    'fuel_type' => get_post_meta($post_id, 'fuel_type', true),
                    'body_style' => get_post_meta($post_id, 'body_style', true),
                    'exterior_color' => get_post_meta($post_id, 'exterior_color', true),
                    'interior_color' => get_post_meta($post_id, 'interior_color', true),
                    'vin' => get_post_meta($post_id, 'vin', true),
                    'certified' => get_post_meta($post_id, 'certified', true) === '1',
                    
                    // Seller info
                    'account_name_seller' => get_post_meta($post_id, 'account_name_seller', true),
                    'business_name_seller' => get_post_meta($post_id, 'business_name_seller', true),
                    'city_seller' => get_post_meta($post_id, 'city_seller', true),
                    'state_seller' => get_post_meta($post_id, 'state_seller', true),
                    'zip_seller' => get_post_meta($post_id, 'zip_seller', true),
                    
                    // Financial
                    'price' => floatval($price)
                )
            );
        }
        wp_reset_postdata();
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $vehicles,
        'pagination' => array(
            'total' => $query->found_posts,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => $query->max_num_pages
        )
    ), 200);
}

/**
 * FIXED: Conditional Filters Endpoint
 * This implements the exact logic requested by the user
 */
function get_conditional_filters(WP_REST_Request $request) {
    // Parse applied filters from request parameters
    $applied_filters = array();
    
    // Extract all possible filter parameters
    $filter_keys = array('make', 'model', 'trim', 'year', 'condition', 'transmission', 
                         'body_style', 'drivetrain', 'fuel_type', 'exterior_color', 
                         'interior_color', 'certified', 'account_name_seller', 
                         'city_seller', 'state_seller');
    
    foreach ($filter_keys as $key) {
        $value = $request->get_param($key);
        if (!empty($value)) {
            $applied_filters[$key] = $value;
        }
    }
    
    // STEP 1: Get narrowed vehicle IDs based on applied filters
    $vehicle_ids = get_filtered_vehicle_ids($applied_filters);
    
    // STEP 2: Build filter counts ONLY from the narrowed pool
    $filters = array(
        'make' => get_filter_values_from_ids($vehicle_ids, 'make'),
        'model' => get_filter_values_from_ids($vehicle_ids, 'model'),
        'trim' => get_filter_values_from_ids($vehicle_ids, 'trim'),
        'year' => get_filter_values_from_ids($vehicle_ids, 'year'),
        'condition' => get_filter_values_from_ids($vehicle_ids, 'condition'),
        'transmission' => get_filter_values_from_ids($vehicle_ids, 'transmission'),
        'body_style' => get_filter_values_from_ids($vehicle_ids, 'body_style'),
        'drivetrain' => get_filter_values_from_ids($vehicle_ids, 'drivetrain'),
        'fuel_type' => get_filter_values_from_ids($vehicle_ids, 'fuel_type'),
        'exterior_color' => get_filter_values_from_ids($vehicle_ids, 'exterior_color'),
        'interior_color' => get_filter_values_from_ids($vehicle_ids, 'interior_color'),
        'account_name_seller' => get_filter_values_from_ids($vehicle_ids, 'account_name_seller'),
        'city_seller' => get_filter_values_from_ids($vehicle_ids, 'city_seller'),
        'state_seller' => get_filter_values_from_ids($vehicle_ids, 'state_seller'),
        'certified' => get_filter_values_from_ids($vehicle_ids, 'certified')
    );
    
    return new WP_REST_Response(array(
        'success' => true,
        'filters' => $filters,
        'applied_filters' => $applied_filters,
        'debug' => array(
            'total_vehicle_ids' => count($vehicle_ids),
            'applied_filters_count' => count($applied_filters)
        )
    ), 200);
}

/**
 * Get vehicle IDs that match the applied filters
 * This implements the WP_Query logic the user requested
 */
function get_filtered_vehicle_ids($applied_filters) {
    // Base query arguments
    $base_args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'fields' => 'ids', // Only get IDs for performance
        'posts_per_page' => -1, // Get all matching IDs
        'meta_query' => array('relation' => 'AND')
    );
    
    // Add filters to narrow down the vehicle pool
    foreach ($applied_filters as $key => $value) {
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
                case 'account_name_seller':
                    // Handle comma-separated values (multi-select)
                    $values = explode(',', $value);
                    $clean_values = array_map('trim', $values);
                    
                    if (count($clean_values) > 1) {
                        $base_args['meta_query'][] = array(
                            'key' => $key,
                            'value' => $clean_values,
                            'compare' => 'IN'
                        );
                    } else {
                        $base_args['meta_query'][] = array(
                            'key' => $key,
                            'value' => trim($value),
                            'compare' => '='
                        );
                    }
                    break;
                    
                case 'year':
                    $values = explode(',', $value);
                    $clean_values = array_map('intval', array_map('trim', $values));
                    
                    if (count($clean_values) > 1) {
                        $base_args['meta_query'][] = array(
                            'key' => 'year',
                            'value' => $clean_values,
                            'type' => 'NUMERIC',
                            'compare' => 'IN'
                        );
                    } else {
                        $base_args['meta_query'][] = array(
                            'key' => 'year',
                            'value' => intval($value),
                            'type' => 'NUMERIC',
                            'compare' => '='
                        );
                    }
                    break;
                    
                case 'certified':
                    if ($value === 'true' || $value === '1') {
                        $base_args['meta_query'][] = array(
                            'key' => 'certified',
                            'value' => '1',
                            'compare' => '='
                        );
                    }
                    break;
            }
        }
    }
    
    // Remove empty meta_query if no filters applied
    if (count($base_args['meta_query']) <= 1) {
        unset($base_args['meta_query']);
    }
    
    // Execute query to get filtered vehicle IDs
    $query = new WP_Query($base_args);
    return $query->posts; // Returns array of post IDs
}

/**
 * Get filter values and counts from a specific set of vehicle IDs
 * This implements the SQL query logic the user requested
 */
function get_filter_values_from_ids($vehicle_ids, $meta_key) {
    if (empty($vehicle_ids)) {
        return array();
    }
    
    global $wpdb;
    
    // Convert IDs to safe comma-separated string
    $ids_string = implode(',', array_map('intval', $vehicle_ids));
    
    // Use the exact SQL pattern the user provided
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
    
    // Format results to match frontend expectations
    $filter_values = array();
    foreach ($results as $result) {
        $filter_values[] = array(
            'name' => $result->meta_value,
            'count' => intval($result->count)
        );
    }
    
    return $filter_values;
}

// INSTRUCTIONS:
// 1. Replace your existing WordPress API code with this file content
// 2. Save to your WordPress theme's functions.php or as a plugin
// 3. Go to WordPress Admin → Settings → Permalinks → Save Changes
// 4. Test the conditional filtering:
//    - /wp-json/custom/v1/filters (all filters)
//    - /wp-json/custom/v1/filters?make=Toyota (Toyota models only)
//    - /wp-json/custom/v1/filters?make=Toyota,Ford (Toyota + Ford models)

?>
