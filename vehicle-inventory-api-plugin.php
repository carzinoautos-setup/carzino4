<?php
/**
 * Plugin Name: Vehicle Inventory API
 * Description: Scalable REST API for WooCommerce + ACF vehicles. Supports full filtering and sorting, with cached filters for performance.
 * Version: 5.0
 * Author: Tony's Dev Build
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * VEHICLES ENDPOINT
 */
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/vehicles', [
        'methods'  => 'GET',
        'callback' => 'via_get_vehicles',
        'permission_callback' => '__return_true',
    ]);
});

function via_get_vehicles($request) {
    $page     = max(1, intval($request->get_param('page') ?: 1));
    $per_page = max(1, intval($request->get_param('per_page') ?: 20));
    $sort     = sanitize_text_field($request->get_param('sort'));

    $args = [
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => $per_page,
        'paged'          => $page,
    ];

    // Sorting options
    if ($sort) {
        switch ($sort) {
            case 'price_asc':
                $args['meta_key'] = 'price';
                $args['orderby']  = 'meta_value_num';
                $args['order']    = 'ASC';
                break;
            case 'price_desc':
                $args['meta_key'] = 'price';
                $args['orderby']  = 'meta_value_num';
                $args['order']    = 'DESC';
                break;
            case 'year_asc':
                $args['meta_key'] = 'year';
                $args['orderby']  = 'meta_value_num';
                $args['order']    = 'ASC';
                break;
            case 'year_desc':
                $args['meta_key'] = 'year';
                $args['orderby']  = 'meta_value_num';
                $args['order']    = 'DESC';
                break;
            case 'mileage_asc':
                $args['meta_key'] = 'mileage';
                $args['orderby']  = 'meta_value_num';
                $args['order']    = 'ASC';
                break;
            case 'mileage_desc':
                $args['meta_key'] = 'mileage';
                $args['orderby']  = 'meta_value_num';
                $args['order']    = 'DESC';
                break;
        }
    }

    // Meta query for filters
    $meta_query = ['relation' => 'AND'];
    foreach ($request->get_params() as $key => $val) {
        if (in_array($key, [
            'page','per_page','sort',
            'min_price','max_price',
            'min_mileage','max_mileage',
            'min_year','max_year'
        ])) continue;

        if ($val === '' || $val === null) continue;

        $values = explode(',', $val);
        if (count($values) > 1) {
            $meta_query[] = [
                'key' => $key,
                'value' => array_map('sanitize_text_field', $values),
                'compare' => 'IN'
            ];
        } else {
            $meta_query[] = [
                'key' => $key,
                'value' => sanitize_text_field($val),
                'compare' => '='
            ];
        }
    }

    // Numeric filters
    if ($request->get_param('min_price')) {
        $meta_query[] = ['key'=>'price','value'=>intval($request->get_param('min_price')),'type'=>'NUMERIC','compare'=>'>='];
    }
    if ($request->get_param('max_price')) {
        $meta_query[] = ['key'=>'price','value'=>intval($request->get_param('max_price')),'type'=>'NUMERIC','compare'=>'<='];
    }
    if ($request->get_param('min_mileage')) {
        $meta_query[] = ['key'=>'mileage','value'=>intval($request->get_param('min_mileage')),'type'=>'NUMERIC','compare'=>'>='];
    }
    if ($request->get_param('max_mileage')) {
        $meta_query[] = ['key'=>'mileage','value'=>intval($request->get_param('max_mileage')),'type'=>'NUMERIC','compare'=>'<='];
    }
    if ($request->get_param('min_year')) {
        $meta_query[] = ['key'=>'year','value'=>intval($request->get_param('min_year')),'type'=>'NUMERIC','compare'=>'>='];
    }
    if ($request->get_param('max_year')) {
        $meta_query[] = ['key'=>'year','value'=>intval($request->get_param('max_year')),'type'=>'NUMERIC','compare'=>'<='];
    }

    if (count($meta_query) > 1) {
        $args['meta_query'] = $meta_query;
    }

    $query = new WP_Query($args);
    $vehicles = [];

    $acf_fields = [
        'year','make','model','trim','mileage','condition','price',
        'transmission','doors','drivetrain','fuel_type','body_style',
        'highway_mpg','exterior_color','interior_color','certified',
        'title_status','is_featured','account_name_seller','account_type_seller',
        'business_name_seller','city_seller','state_seller','zip_seller',
        'phone_number_seller','email_seller','address_seller','account_number_seller',
        'car_location_latitude','car_location_longitude','engine_cylinders',
        'transmission_speed','engine','vin','interest_rate','down_payment',
        'loan_term','payment','is_certified','has_warranty','body_class','status'
    ];

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();

            $acf = [];
            foreach ($acf_fields as $field) {
                $acf[$field] = get_post_meta($post_id, $field, true);
            }

            $vehicles[] = [
                'id'            => $post_id,
                'name'          => get_the_title(),
                'permalink'     => get_permalink($post_id),
                'stock_status'  => get_post_meta($post_id, '_stock_status', true),
                'featured_image'=> get_the_post_thumbnail_url($post_id, 'medium'),
                'acf'           => $acf
            ];
        }
        wp_reset_postdata();
    }

    return new WP_REST_Response([
        'success'    => true,
        'data'       => $vehicles,
        'pagination' => [
            'total'       => $query->found_posts,
            'page'        => $page,
            'per_page'    => $per_page,
            'total_pages' => $query->max_num_pages
        ]
    ], 200);
}

/**
 * FILTERS ENDPOINT (CONDITIONAL + CACHED)
 */
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/filters', [
        'methods'  => 'GET',
        'callback' => 'via_get_filters',
        'permission_callback' => '__return_true',
    ]);
});

function via_build_filter_cache() {
    global $wpdb;

    $acf_filter_fields = [
        'make','model','trim','year','body_style','drivetrain','fuel_type',
        'transmission','condition','certified','exterior_color','interior_color',
        'account_name_seller','account_type_seller','city_seller','state_seller',
        'body_class','status'
    ];

    $results = [];

    foreach ($acf_filter_fields as $field) {
        $sql = $wpdb->prepare("
            SELECT pm.meta_value, COUNT(*) as count
            FROM {$wpdb->postmeta} pm
            INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
            WHERE pm.meta_key = %s
            AND p.post_type='product' AND p.post_status='publish'
            GROUP BY pm.meta_value
            HAVING pm.meta_value != ''
            ORDER BY pm.meta_value ASC
        ", $field);
        $rows = $wpdb->get_results($sql);
        $values = [];
        foreach ($rows as $row) {
            $values[] = ['name'=>$row->meta_value, 'count'=>intval($row->count)];
        }
        $results[$field] = $values;
    }

    // Ranges
    $results['price_range'] = [
        'min' => intval($wpdb->get_var("SELECT MIN(CAST(meta_value AS UNSIGNED)) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON pm.post_id=p.ID WHERE pm.meta_key='price' AND p.post_type='product' AND p.post_status='publish'")),
        'max' => intval($wpdb->get_var("SELECT MAX(CAST(meta_value AS UNSIGNED)) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON pm.post_id=p.ID WHERE pm.meta_key='price' AND p.post_type='product' AND p.post_status='publish'"))
    ];
    $results['mileage_range'] = [
        'min' => intval($wpdb->get_var("SELECT MIN(CAST(meta_value AS UNSIGNED)) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON pm.post_id=p.ID WHERE pm.meta_key='mileage' AND p.post_type='product' AND p.post_status='publish'")),
        'max' => intval($wpdb->get_var("SELECT MAX(CAST(meta_value AS UNSIGNED)) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON pm.post_id=p.ID WHERE pm.meta_key='mileage' AND p.post_type='product' AND p.post_status='publish'"))
    ];
    $results['year_range'] = [
        'min' => intval($wpdb->get_var("SELECT MIN(CAST(meta_value AS UNSIGNED)) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON pm.post_id=p.ID WHERE pm.meta_key='year' AND p.post_type='product' AND p.post_status='publish'")),
        'max' => intval($wpdb->get_var("SELECT MAX(CAST(meta_value AS UNSIGNED)) FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON pm.post_id=p.ID WHERE pm.meta_key='year' AND p.post_type='product' AND p.post_status='publish'"))
    ];

    update_option('via_filters_cache', $results, false);
    return $results;
}

function via_get_filters($request) {
    global $wpdb;

    // Collect applied filters
    $applied = [];
    foreach ($request->get_params() as $key => $val) {
        if ($val === '' || $val === null) continue;
        $applied[$key] = explode(',', sanitize_text_field($val));
    }

    // If no filters → return cached global values
    if (empty($applied)) {
        $filters = get_option('via_filters_cache');
        if (!$filters) {
            $filters = via_build_filter_cache();
        }
        return new WP_REST_Response([
            'success' => true,
            'filters' => $filters,
            'applied_filters' => [],
            'cached' => true
        ], 200);
    }

    // Step 1: Narrow pool with WP_Query
    $args = [
        'post_type'   => 'product',
        'post_status' => 'publish',
        'fields'      => 'ids',
        'posts_per_page' => -1,
        'meta_query'  => ['relation' => 'AND']
    ];

    foreach ($applied as $field => $values) {
        $args['meta_query'][] = [
            'key'     => $field,
            'value'   => $values,
            'compare' => 'IN'
        ];
    }

    $query = new WP_Query($args);
    $vehicle_ids = $query->posts;

    if (empty($vehicle_ids)) {
        return new WP_REST_Response([
            'success' => true,
            'filters' => [],
            'applied_filters' => $applied
        ], 200);
    }

    $id_list = implode(',', array_map('intval', $vehicle_ids));

    // Step 2: Build narrowed counts
    $acf_filter_fields = [
        'make','model','trim','year','body_style','drivetrain','fuel_type',
        'transmission','condition','certified','exterior_color','interior_color',
        'account_name_seller','account_type_seller','city_seller','state_seller',
        'body_class','status'
    ];

    $results = [];
    foreach ($acf_filter_fields as $field) {
        $sql = $wpdb->prepare("
            SELECT pm.meta_value, COUNT(*) as count
            FROM {$wpdb->postmeta} pm
            WHERE pm.post_id IN ($id_list)
            AND pm.meta_key = %s
            AND pm.meta_value != ''
            GROUP BY pm.meta_value
            ORDER BY pm.meta_value ASC
        ", $field);

        $rows = $wpdb->get_results($sql);
        $values = [];
        foreach ($rows as $row) {
            $values[] = ['name' => $row->meta_value, 'count' => intval($row->count)];
        }
        $results[$field] = $values;
    }

    return new WP_REST_Response([
        'success' => true,
        'filters' => $results,
        'applied_filters' => $applied
    ], 200);
}

/**
 * CRON + MANUAL CACHE REBUILD
 */
if ( ! wp_next_scheduled( 'via_cron_event' ) ) {
    wp_schedule_event( time(), 'ten_minutes', 'via_cron_event' );
}
add_filter('cron_schedules', function($schedules){
    $schedules['ten_minutes'] = [
        'interval' => 600,
        'display'  => __('Every 10 Minutes')
    ];
    return $schedules;
});
add_action('via_cron_event', 'via_build_filter_cache');

// Manual rebuild: ?via_build_filters=1
add_action('init', function () {
    if (isset($_GET['via_build_filters']) && current_user_can('manage_options')) {
        $filters = via_build_filter_cache();
        wp_send_json(['status'=>'rebuilt','filters'=>$filters]);
        exit;
    }
});
