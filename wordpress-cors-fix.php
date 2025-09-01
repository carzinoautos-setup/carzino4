<?php

// IMPROVED CORS FIX - Replace your existing CORS code with this

// 1. Add CORS headers that work reliably
add_action('init', function() {
    // Handle preflight OPTIONS requests
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
        exit(0);
    }
});

// 2. Add CORS headers to all REST API responses
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages');
        return $value;
    });
});

// 3. Ensure headers are sent even for custom endpoints
add_filter('rest_post_dispatch', function($response, $server, $request) {
    $response->header('Access-Control-Allow-Origin', '*');
    $response->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return $response;
}, 10, 3);

// 4. Your custom API endpoint (keep this the same)
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/vehicles', array(
        'methods' => 'GET',
        'callback' => 'get_vehicles_api',
        'permission_callback' => '__return_true'
    ));
});

function get_vehicles_api($request) {
    // Get pagination parameters
    $page = $request->get_param('page') ? intval($request->get_param('page')) : 1;
    $per_page = $request->get_param('per_page') ? intval($request->get_param('per_page')) : 20;
    
    // Query vehicles (assuming they're custom posts or WooCommerce products)
    $args = array(
        'post_type' => 'product', // Change to your vehicle post type if needed
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => array()
    );
    
    $query = new WP_Query($args);
    $vehicles = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            // Get ACF fields
            $acf_fields = get_fields($post_id);
            
            $vehicles[] = array(
                'id' => $post_id,
                'name' => get_the_title(),
                'slug' => get_post_field('post_name', $post_id),
                'price' => get_post_meta($post_id, '_price', true),
                'stock_status' => get_post_meta($post_id, '_stock_status', true),
                'acf' => $acf_fields ?: array()
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
