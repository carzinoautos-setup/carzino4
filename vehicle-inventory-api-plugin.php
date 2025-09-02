<?php
/**
 * Plugin Name: Vehicle Inventory API with Conditional Filtering
 * Description: WordPress REST API endpoints for vehicle inventory with proper conditional filtering logic
 * Version: 1.0.0
 * Author: Carzino Autos
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Clear filter cache function
 */
function via_clear_filter_cache() {
    global $wpdb;

    // Delete all transients with our prefix
    $wpdb->query($wpdb->prepare("
        DELETE FROM {$wpdb->options}
        WHERE option_name LIKE %s
    ", '_transient_via_filters_%'));

    $wpdb->query($wpdb->prepare("
        DELETE FROM {$wpdb->options}
        WHERE option_name LIKE %s
    ", '_transient_timeout_via_filters_%'));

    error_log('VIA: Cleared all filter cache transients');
}

/**
 * Clear cache immediately on plugin load
 */
via_clear_filter_cache();
error_log('VIA: Plugin loaded, cache cleared');

/**
 * CORS Headers for cross-origin requests
 */
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

/**
 * Register REST API endpoints
 */
add_action('rest_api_init', function() {
    // Vehicles endpoint
    register_rest_route('custom/v1', '/vehicles', array(
        'methods' => 'GET',
        'callback' => 'via_get_vehicles',
        'permission_callback' => '__return_true'
    ));

    // Conditional Filters endpoint - THE KEY FIX
    register_rest_route('custom/v1', '/filters', array(
        'methods' => 'GET',
        'callback' => 'via_get_conditional_filters',
        'permission_callback' => '__return_true'
    ));

    // Cache rebuild endpoint
    register_rest_route('custom/v1', '/rebuild-filters', array(
        'methods' => 'GET',
        'callback' => 'via_rebuild_filter_cache',
        'permission_callback' => '__return_true'
    ));

    // Debug endpoint to test filtering directly
    register_rest_route('custom/v1', '/debug-filters', array(
        'methods' => 'GET',
        'callback' => 'via_debug_filters',
        'permission_callback' => '__return_true'
    ));
});

/**
 * Handle cache rebuild via URL parameter
 */
add_action('init', function() {
    if (isset($_GET['via_build_filters']) && $_GET['via_build_filters'] == '1') {
        via_clear_filter_cache();
        wp_redirect(remove_query_arg('via_build_filters'));
        exit;
    }
});

/**
 * VEHICLES ENDPOINT
 */
function via_get_vehicles(WP_REST_Request $request) {
    $page = $request->get_param('page') ? intval($request->get_param('page')) : 1;
    $per_page = $request->get_param('per_page') ? intval($request->get_param('per_page')) : 20;
    
    // Extract ALL possible filters
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
    
    // Build WP_Query args
    $args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array('relation' => 'AND')
    );
    
    // Apply all filters to query
    $args = via_apply_filters_to_query($args, $filters);
    
    $query = new WP_Query($args);
    $vehicles = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            // Get WooCommerce price
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
                'stock_status' => get_post_meta($post_id, '_stock_status', true),
                'featured_image' => get_the_post_thumbnail_url($post_id, 'full'),
                'acf' => array(
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
                    'account_name_seller' => get_post_meta($post_id, 'account_name_seller', true),
                    'business_name_seller' => get_post_meta($post_id, 'business_name_seller', true),
                    'city_seller' => get_post_meta($post_id, 'city_seller', true),
                    'state_seller' => get_post_meta($post_id, 'state_seller', true),
                    'zip_seller' => get_post_meta($post_id, 'zip_seller', true),
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
 * CONDITIONAL FILTERS ENDPOINT - THIS IS THE KEY FIX
 * Implements exactly what the user requested: narrow vehicle pool first, then calculate counts
 */
function via_get_conditional_filters(WP_REST_Request $request) {
    // Extract applied filters from request FIRST
    $applied_filters = array();
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

    // Create cache key from actual applied filters
    $cache_key = 'via_filters_' . md5(serialize($applied_filters));
    $cached_filters = get_transient($cache_key);

    // DISABLE CACHE FOR DEBUGGING - Remove this line once working
    $cached_filters = false;

    if ($cached_filters !== false) {
        error_log('VIA: Returning cached filters for key: ' . $cache_key);
        return new WP_REST_Response($cached_filters, 200);
    }
    
    error_log('VIA: Applied filters: ' . print_r($applied_filters, true));

    // STEP 1: Get narrowed vehicle IDs based on applied filters (YOUR REQUESTED LOGIC)
    $vehicle_ids = via_get_filtered_vehicle_ids($applied_filters);
    error_log('VIA: Found ' . count($vehicle_ids) . ' vehicle IDs after filtering');
    
    // STEP 2: Build filter counts ONLY from the narrowed pool (YOUR REQUESTED LOGIC)
    $filters = array(
        'make' => via_get_filter_values_from_ids($vehicle_ids, 'make'),
        'model' => via_get_filter_values_from_ids($vehicle_ids, 'model'),
        'trim' => via_get_filter_values_from_ids($vehicle_ids, 'trim'),
        'year' => via_get_filter_values_from_ids($vehicle_ids, 'year'),
        'condition' => via_get_filter_values_from_ids($vehicle_ids, 'condition'),
        'transmission' => via_get_filter_values_from_ids($vehicle_ids, 'transmission'),
        'body_style' => via_get_filter_values_from_ids($vehicle_ids, 'body_style'),
        'drivetrain' => via_get_filter_values_from_ids($vehicle_ids, 'drivetrain'),
        'fuel_type' => via_get_filter_values_from_ids($vehicle_ids, 'fuel_type'),
        'exterior_color' => via_get_filter_values_from_ids($vehicle_ids, 'exterior_color'),
        'interior_color' => via_get_filter_values_from_ids($vehicle_ids, 'interior_color'),
        'account_name_seller' => via_get_filter_values_from_ids($vehicle_ids, 'account_name_seller'),
        'city_seller' => via_get_filter_values_from_ids($vehicle_ids, 'city_seller'),
        'state_seller' => via_get_filter_values_from_ids($vehicle_ids, 'state_seller'),
        'certified' => via_get_filter_values_from_ids($vehicle_ids, 'certified')
    );
    
    $response = array(
        'success' => true,
        'filters' => $filters,
        'applied_filters' => $applied_filters,
        'debug' => array(
            'total_vehicle_ids' => count($vehicle_ids),
            'applied_filters_count' => count($applied_filters),
            'cache_key' => $cache_key
        )
    );
    
    // Cache for 5 minutes
    set_transient($cache_key, $response, 300);
    
    return new WP_REST_Response($response, 200);
}

/**
 * Get vehicle IDs that match applied filters
 * This implements the WP_Query logic you requested
 */
function via_get_filtered_vehicle_ids($applied_filters) {
    $base_args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'fields' => 'ids', // Only get IDs for performance (YOUR REQUEST)
        'posts_per_page' => -1, // Get all matching IDs
        'meta_query' => array('relation' => 'AND')
    );

    error_log('VIA: Base args before filtering: ' . print_r($base_args, true));
    error_log('VIA: Applied filters to process: ' . print_r($applied_filters, true));

    // Apply filters to narrow the pool (YOUR REQUESTED LOGIC)
    $base_args = via_apply_filters_to_query($base_args, $applied_filters);

    error_log('VIA: Final query args: ' . print_r($base_args, true));

    $query = new WP_Query($base_args);

    error_log('VIA: WP_Query found ' . $query->found_posts . ' total posts, returning ' . count($query->posts) . ' IDs');

    return $query->posts; // Returns array of post IDs
}

/**
 * Get filter values and counts from specific vehicle IDs
 * This implements the SQL query logic you requested
 */
function via_get_filter_values_from_ids($vehicle_ids, $meta_key) {
    if (empty($vehicle_ids)) {
        return array();
    }
    
    global $wpdb;
    
    // Convert IDs to safe comma-separated string
    $ids_string = implode(',', array_map('intval', $vehicle_ids));
    
    // Use the exact SQL pattern you provided
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
    
    // Format results for frontend
    $filter_values = array();
    foreach ($results as $result) {
        $filter_values[] = array(
            'name' => $result->meta_value,
            'count' => intval($result->count)
        );
    }
    
    return $filter_values;
}

/**
 * Apply filters to WP_Query args (shared logic)
 */
function via_apply_filters_to_query($args, $filters) {
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
                    // Handle comma-separated values (multi-select)
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
    
    return $args;
}

/**
 * Cache rebuild endpoint
 */
function via_rebuild_filter_cache(WP_REST_Request $request) {
    via_clear_filter_cache();

    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Filter cache cleared successfully'
    ), 200);
}

/**
 * Debug endpoint to diagnose filtering issues
 */
function via_debug_filters(WP_REST_Request $request) {
    $make = $request->get_param('make') ?: 'Toyota';

    // Test 1: Get all vehicles
    $all_args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'fields' => 'ids',
        'posts_per_page' => -1
    );
    $all_query = new WP_Query($all_args);
    $all_ids = $all_query->posts;

    // Test 2: Get vehicles filtered by make
    $filtered_args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'fields' => 'ids',
        'posts_per_page' => -1,
        'meta_query' => array(
            array(
                'key' => 'make',
                'value' => $make,
                'compare' => '='
            )
        )
    );
    $filtered_query = new WP_Query($filtered_args);
    $filtered_ids = $filtered_query->posts;

    // Test 3: Get models for all vehicles
    global $wpdb;
    $all_models = $wpdb->get_results("
        SELECT pm.meta_value, COUNT(*) as count
        FROM {$wpdb->postmeta} pm
        WHERE pm.meta_key = 'model'
        AND pm.meta_value != ''
        GROUP BY pm.meta_value
        ORDER BY pm.meta_value ASC
    ");

    // Test 4: Get models for filtered vehicles only
    if (!empty($filtered_ids)) {
        $ids_string = implode(',', array_map('intval', $filtered_ids));
        $filtered_models = $wpdb->get_results("
            SELECT pm.meta_value, COUNT(*) as count
            FROM {$wpdb->postmeta} pm
            WHERE pm.post_id IN ($ids_string)
            AND pm.meta_key = 'model'
            AND pm.meta_value != ''
            GROUP BY pm.meta_value
            ORDER BY pm.meta_value ASC
        ");
    } else {
        $filtered_models = array();
    }

    return new WP_REST_Response(array(
        'success' => true,
        'debug' => array(
            'filter_used' => $make,
            'all_vehicles_count' => count($all_ids),
            'filtered_vehicles_count' => count($filtered_ids),
            'all_models_count' => count($all_models),
            'filtered_models_count' => count($filtered_models),
            'sample_all_models' => array_slice($all_models, 0, 10),
            'sample_filtered_models' => array_slice($filtered_models, 0, 10),
            'has_non_matching_models' => false
        )
    ), 200);
}


/**
 * Plugin activation
 */
register_activation_hook(__FILE__, function() {
    // Flush rewrite rules to register our endpoints
    flush_rewrite_rules();
});

/**
 * Plugin deactivation
 */
register_deactivation_hook(__FILE__, function() {
    // Clear cache
    via_clear_filter_cache();
    
    // Flush rewrite rules
    flush_rewrite_rules();
});

?>
