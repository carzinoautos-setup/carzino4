<?php
/**
 * Simple WordPress/WooCommerce to React Data Bridge
 * This replaces ALL your existing PHP calculator code
 * Just provides data - React handles all calculations
 */

// Add to your theme's functions.php or as a plugin

// REST API endpoint for vehicle data
add_action('rest_api_init', function () {
    // Get vehicle products with all needed fields
    register_rest_route('carzino/v1', '/vehicles', array(
        'methods' => 'GET',
        'callback' => 'carzino_get_vehicles_for_react',
        'permission_callback' => '__return_true'
    ));
    
    // Get global settings (ACF options)
    register_rest_route('carzino/v1', '/settings', array(
        'methods' => 'GET',
        'callback' => 'carzino_get_global_settings',
        'permission_callback' => '__return_true'
    ));
    
    // Get single vehicle
    register_rest_route('carzino/v1', '/vehicles/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'carzino_get_single_vehicle',
        'permission_callback' => '__return_true'
    ));
});

/**
 * Get vehicles for React (replaces your shortcode logic)
 */
function carzino_get_vehicles_for_react($request) {
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 20;
    $filters = $request->get_param('filters') ?: array();
    
    $args = array(
        'post_type' => 'product', // Your vehicle post type
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array()
    );
    
    // Add your existing filter logic here
    if (!empty($filters['make'])) {
        $args['meta_query'][] = array(
            'key' => 'vehicle_make', // Your meta key
            'value' => $filters['make'],
            'compare' => '='
        );
    }
    
    if (!empty($filters['max_price'])) {
        $args['meta_query'][] = array(
            'key' => 'price', // Your price meta key
            'value' => $filters['max_price'],
            'type' => 'NUMERIC',
            'compare' => '<='
        );
    }
    
    $vehicles = get_posts($args);
    $formatted_vehicles = array();
    
    foreach ($vehicles as $vehicle) {
        $formatted_vehicles[] = array(
            'id' => $vehicle->ID,
            'title' => get_the_title($vehicle->ID),
            'price' => (float) get_field('price', $vehicle->ID),
            'make' => get_field('vehicle_make', $vehicle->ID),
            'model' => get_field('vehicle_model', $vehicle->ID),
            'year' => get_field('vehicle_year', $vehicle->ID),
            'mileage' => get_field('vehicle_mileage', $vehicle->ID),
            'transmission' => get_field('vehicle_transmission', $vehicle->ID),
            'doors' => get_field('vehicle_doors', $vehicle->ID),
            'images' => get_field('vehicle_gallery', $vehicle->ID),
            'dealer' => get_field('vehicle_dealer', $vehicle->ID),
            'location' => get_field('vehicle_location', $vehicle->ID),
            'condition' => get_field('vehicle_condition', $vehicle->ID),
            // Add all your other meta fields here
        );
    }
    
    $total_vehicles = wp_count_posts('product')->publish;
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $formatted_vehicles,
        'meta' => array(
            'total' => $total_vehicles,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total_vehicles / $per_page)
        )
    ));
}

/**
 * Get global settings (replaces ACF option calls)
 */
function carzino_get_global_settings($request) {
    return new WP_REST_Response(array(
        'success' => true,
        'data' => array(
            'default_apr' => (float) get_field('interest_rate', 'option') ?: 10.0,
            'default_sales_tax' => (float) get_field('default_sales_tax', 'option') ?: 0.0,
            'default_term' => (int) get_field('default_term', 'option') ?: 72,
            'default_down_pct' => (float) get_field('default_down_pct', 'option') ?: 0.0,
        )
    ));
}

/**
 * Get single vehicle
 */
function carzino_get_single_vehicle($request) {
    $vehicle_id = $request['id'];
    
    if (!$vehicle_id || get_post_type($vehicle_id) !== 'product') {
        return new WP_Error('not_found', 'Vehicle not found', array('status' => 404));
    }
    
    $vehicle_data = array(
        'id' => $vehicle_id,
        'title' => get_the_title($vehicle_id),
        'price' => (float) get_field('price', $vehicle_id),
        'make' => get_field('vehicle_make', $vehicle_id),
        'model' => get_field('vehicle_model', $vehicle_id),
        'year' => get_field('vehicle_year', $vehicle_id),
        'mileage' => get_field('vehicle_mileage', $vehicle_id),
        'transmission' => get_field('vehicle_transmission', $vehicle_id),
        'doors' => get_field('vehicle_doors', $vehicle_id),
        'images' => get_field('vehicle_gallery', $vehicle_id),
        'dealer' => get_field('vehicle_dealer', $vehicle_id),
        'location' => get_field('vehicle_location', $vehicle_id),
        'condition' => get_field('vehicle_condition', $vehicle_id),
        // Add detailed fields for single vehicle view
        'engine' => get_field('vehicle_engine', $vehicle_id),
        'fuel_type' => get_field('vehicle_fuel_type', $vehicle_id),
        'drivetrain' => get_field('vehicle_drivetrain', $vehicle_id),
        'exterior_color' => get_field('vehicle_exterior_color', $vehicle_id),
        'interior_color' => get_field('vehicle_interior_color', $vehicle_id),
        'vin' => get_field('vehicle_vin', $vehicle_id),
        'features' => get_field('vehicle_features', $vehicle_id),
        // Add any other fields you need
    );
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $vehicle_data
    ));
}

/**
 * Optional: Filter products by affordability (server-side)
 * This can replace your search-by-payment PHP logic
 */
add_action('rest_api_init', function () {
    register_rest_route('carzino/v1', '/vehicles/affordable', array(
        'methods' => 'POST',
        'callback' => 'carzino_get_affordable_vehicles',
        'permission_callback' => '__return_true'
    ));
});

function carzino_get_affordable_vehicles($request) {
    $payment_params = $request->get_json_params();
    
    $max_payment = $payment_params['max_payment'] ?: 1000;
    $down_payment = $payment_params['down_payment'] ?: 0;
    $trade_in = $payment_params['trade_in'] ?: 0;
    $apr = $payment_params['apr'] ?: 10;
    $term = $payment_params['term'] ?: 72;
    $tax_rate = $payment_params['tax_rate'] ?: 0;
    
    // Use your inverse calculation to find max affordable price
    $max_price = calculate_max_affordable_price($max_payment, $down_payment, $trade_in, $apr, $term, $tax_rate);
    
    // Query vehicles within budget
    $args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'meta_query' => array(
            array(
                'key' => 'price',
                'value' => $max_price,
                'type' => 'NUMERIC',
                'compare' => '<='
            )
        )
    );
    
    $vehicles = get_posts($args);
    // Format and return...
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $formatted_vehicles,
        'max_affordable_price' => $max_price
    ));
}

function calculate_max_affordable_price($monthly_payment, $down, $trade_in, $apr_percent, $term_months, $tax_rate) {
    $r = ($apr_percent / 100) / 12;
    
    if ($r > 0) {
        $a = pow(1 + $r, $term_months);
        $financed_amount = $monthly_payment * ($a - 1) / ($r * $a);
    } else {
        $financed_amount = $monthly_payment * $term_months;
    }
    
    $taxable_base = $financed_amount / (1 + $tax_rate / 100);
    $max_price = $taxable_base + $down + $trade_in;
    
    return $max_price;
}
?>
